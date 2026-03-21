import { ObjectUtils } from '/utils/object.utils.js';
import { component as questionService } from '/services/question.service.js';

export class QuizComponent {
    questions = [];
    submitted = false;
    questionTemplate = null;
    questionChoiceTemplate = null;
    isDirty = false;

    onInit() {
        Promise.all([
            $.get('components/question.component.html').then(template => this.questionTemplate = template),
            $.get('components/question-choice.component.html').then(template => this.questionChoiceTemplate = template)
        ]).then(() => $.get('assets/questions.json').then(data => {
            questionService.storeQuestion(data);
            this.questions = questionService.randomize();
            this.renderQuestions();
        }));
        $('#btn-submit').click(this.onSubmit.bind(this));
        $('#btn-reset').click(this.onResetQuiz.bind(this));
        $('#btn-clear-results').click(this.onClearResults.bind(this));
    }
    onDestroy() {
        this.questions = [];
        this.submitted = false;
        this.questionTemplate = null;
        this.questionChoiceTemplate = null;
        this.isDirty = false;
    }

    onBeforeHashChange() {
        if (this.isDirty) {
            return confirm('You have unfinished quiz !!! Do you want to continue ?');
        }
        return true;
    }

    async onSubmit() {
        if (!this.validateForm()) {
            return;
        }

        const result = questionService.validateAnswers(this.questions.map(question => ({ id: question.id, selected: question.selected })));
        this.renderFeedback(result);
        this.isDirty = false;
        if (result.isPassed) {
            await this.displayRewardPopup();
        }

        // TODO Call Public API, validate response and Display reward (see Rubrics)
        // TODO use one of Public API: https://github.com/surhud004/Foodish?tab=readme-ov-file#readme
        this.isDirty = false;
        const results = this.storeResult(result);
        $('.control .btn').addClass('d-none');
        $('#btn-reset').removeClass('d-none');
        $('#results-list').html(this.renderResult(results));
        $('#results-container').removeClass('d-none');
        $('#results-container')[0].scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }

    async displayRewardPopup() {
        const modal = await $.get('/components/reward.component.html');
        const modalElement = $(modal);
        try {
            const reward = await $.get('https://foodish-api.com/api/');
            if (reward.image) {
                modalElement.find('#reward-popup-image-success').addClass('d-block')
                    .removeClass('d-none');
                modalElement.find('#reward-popup-image-failed').addClass('d-none')
                    .removeClass('d-block');
                modalElement.find('#reward-image').attr('src', reward.image);
            } else {
                modalElement.find('#reward-popup-image-success').addClass('d-none')
                    .removeClass('d-block');
                modalElement.find('#reward-popup-image-failed').addClass('d-block')
                    .removeClass('d-none');
            }
        } catch {
            modalElement.find('#reward-popup-image-success').addClass('d-none')
                    .removeClass('d-block');
            modalElement.find('#reward-popup-image-failed').addClass('d-block')
                .removeClass('d-none');
        }
        const bootstrapModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
        bootstrapModal.show();
    }

    validateForm() {
        let validForm = true;
        for (let question of this.questions) {
            if (typeof (question.selected) === typeof (undefined)) {
                this.setFeedbackMessage(question, true, `You haven\'t answered this question yet`);
                validForm = false;
            }
        }
        return validForm;

    }

    storeResult(result) {
        // TODO  Storage reads/writes wrapped in try/catch for private browsing.
        // TODO Malformed/missing data handled gracefully.
        const results = JSON.parse(localStorage.getItem('results')) || [];
        results.unshift({ score: result.score, percentage: result.percentage, date: new Date().toISOString(), isPassed: result.isPassed });
        localStorage.setItem('results', JSON.stringify(results));
        return results;
    }

    renderFeedback(result) {
        this.questions.forEach(question => {
            if (result.correctAnswers.includes(question.id)) {
                this.setFeedbackMessage(question, false, 'Correct!');
            } else {
                this.setFeedbackMessage(question, true, `Incorrect! The correct answer is: ${question.choices[question.answer]}`);
            }
        });
    }

    getFeedbackElement(question) {
        return $(`#question-${question.id} .feedback`);
    }

    setFeedbackMessage(question, isError, message) {
        if (!message) {
            this.getFeedbackElement(question).html('');
        }
        const messageElement = $('<div></div>').text(message).addClass(isError ? 'text-danger' : 'text-success');
        this.getFeedbackElement(question).html(messageElement);
    }

    onResetQuiz() {
        this.questions = questionService.randomize();
        this.renderQuestions();
        $('#btn-submit').removeClass('d-none');
        $('#btn-reset').addClass('d-none');
        $('#results-container').addClass('d-none');
    }

    onClearResults() {
        localStorage.removeItem('results');
        $('#results-list').html(this.renderResult([]));
    }

    onUpdateAnswer(event) {
        const element = $(event.target);
        const questionId = element.attr('app-question-id');
        const answer = parseInt(element.attr('app-answer'));
        const question = this.questions.find(question => question.id === questionId)
        question.selected = answer;
        this.isDirty = true;
        this.setFeedbackMessage(question);
    }

    renderQuestions() {
        const formattedQuestions = this.questions.map((question, index) => {
            return ObjectUtils.format(this.questionTemplate, {
                ...question,
                number: index + 1,
                choices: question.choices.map((choice, choiceIndex) => ObjectUtils.format(this.questionChoiceTemplate, {
                    questionId: question.id,
                    index: choiceIndex,
                    option: ObjectUtils.escapeHTML(choice)
                })).join('')
            });
        });
        $('#quiz-container').html(formattedQuestions);
        $('#quiz-container input').change(this.onUpdateAnswer.bind(this));
    }

    renderResult(results) {
        if (results.length) {
            return results.map(line => $('<tr></tr>')
                .append($('<td></td>').text(new Date(line.date).toLocaleString()))
                .append($('<td></td>').text(line.score))
                .append($('<td></td>').text(line.percentage))
                .append($('<td></td>').addClass(line.isPassed ? 'text-success' : 'text-danger').text(line.isPassed ? 'Passed' : 'Failed')));
        }
        return `<tr><td colspan="4" class="text-center">No results yet.</td></tr>`;
    }
}
export const component = new QuizComponent();