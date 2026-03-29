import { ObjectUtils } from '/utils/object.utils.js';
import { component as questionService } from '/services/question.service.js';
import { component as storageService } from '/services/storage.service.js';

export class QuizComponent {
    questions = [];
    submitted = false;
    questionTemplate = null;
    questionOptionTemplate = null;
    isDirty = false;

    onInit() {
        Promise.all([
            $.get('components/question.component.html').then(template => this.questionTemplate = template),
            $.get('components/question-option.component.html').then(template => this.questionOptionTemplate = template)
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
        this.questionOptionTemplate = null;
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
            $('.question:has(.feedback:has(.text-danger))')[0].scrollIntoView({
                behavior: "smooth",
                block: "end"
            });
            return;
        }

        this.submitted = true;

        const result = questionService.validateAnswers(this.questions.map(question => ({ id: question.id, selected: question.selected })));
        this.renderFeedback(result);
        this.isDirty = false;
        if (result.isPassed) {
            await this.displayRewardPopup();
        }

        this.isDirty = false;
        const results = storageService.storeResult(result);
        this.hideElement($('.control .btn'));
        this.showElement($('#btn-reset'));
        $('#results-list').html(this.renderResult(results));
        const resultsContainer = $('#results-container');
        this.showElement(resultsContainer);
        $('#results-container')[0].scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }

    async displayRewardPopup() {
        const modalElement = document.getElementById('reward-popup');
        const modal = $(modalElement);
        const previousFocus = document.activeElement;
        try {
            const reward = await $.get('https://foodish-api.com/api/');
            if (reward.image) {
                this.showElement(modal.find('#reward-popup-image-success'));
                this.hideElement(modal.find('#reward-popup-image-failed'));
                modal.find('#reward-image').attr('src', reward.image);
            } else {
                this.showElement(modal.find('#reward-popup-image-failed'));
                this.hideElement(modal.find('#reward-popup-image-success'));
            }
        } catch {
            this.showElement(modal.find('#reward-popup-image-failed'));
            this.hideElement(modal.find('#reward-popup-image-success'));
        }

        modalElement.addEventListener('hide.bs.modal', () => {
            if (modalElement.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        }, { once: true });

        modalElement.addEventListener('hidden.bs.modal', () => {
            if (previousFocus instanceof HTMLElement) {
                previousFocus.focus();
            }
        }, { once: true });

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

    renderFeedback(result) {
        $('#res-score').text(`${result.score}/${result.maxScore}`);
        $('#res-message').text(result.isPassed ? 'Congratulations! You passed the quiz!' : 'Better luck next time! You did not pass the quiz.');
        $('#res-description').text(result.isPassed ? 'You have demonstrated a good understanding of the material. Keep up the great work!' : 'Consider reviewing the material and trying again to improve your score.');

        this.questions.forEach(question => {
            $(`#question-${question.id} .question-option`).removeClass('clickable');
            $(`#question-${question.id} .question-option[app-option=${question.answer}]`).addClass('success');
            if (result.correctAnswers.includes(question.id)) {
                this.setFeedbackMessage(question, false, 'Correct!');
            } else {
                this.setFeedbackMessage(question, true, `Incorrect! The correct answer is: ${question.options[question.answer]}`);
                $(`#question-${question.id} .question-option[app-option=${question.selected}]`).addClass('error');
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
        this.submitted = false;
        this.renderQuestions();
        this.showElement($('#btn-submit'));
        this.hideElement($('#btn-reset'));
        this.hideElement($('#results-container'));
    }

    onClearResults() {
        localStorage.removeItem('results');
        $('#results-list').html(this.renderResult([]));
    }

    onUpdateAnswer(event) {
        if (this.submitted) {
            return;
        }
        const element = $(event.currentTarget);
        element.addClass('selected').siblings().removeClass('selected');
        const questionId = element.attr('app-question-id');
        const answer = parseInt(element.attr('app-option'));
        const question = this.questions.find(question => question.id === questionId)
        question.selected = answer;
        this.isDirty = true;
        this.setFeedbackMessage(question);
    }
    
    onSubmitted() {
        $('#quiz-container .question-option').removeClass('clickable');
    }

    renderQuestions() {
        const formattedQuestions = this.questions.map((question, index) => {
            return ObjectUtils.format(this.questionTemplate, {
                id: question.id,
                question: question.question,
                number: index + 1,
                questionCount: this.questions.length,
                options: question.options.map((option, optionIndex) => ObjectUtils.format(this.questionOptionTemplate, {
                    questionId: question.id,
                    index: optionIndex,
                    number: optionIndex + 1,
                    option: ObjectUtils.escapeHTML(option)
                })).join('')
            });
        });
        $('#quiz-container').html(formattedQuestions);
        $('#quiz-container .question-option').addClass('clickable').click(this.onUpdateAnswer.bind(this));
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

    hideElement(element) {
        return element.addClass('d-none');
    }

    showElement(element) {
        return element.removeClass('d-none');
    }
}
export const component = new QuizComponent();
