import { ObjectUtils } from '/utils/object.utils.js';
import { component as questionService } from '/services/question.service.js';

export class QuizComponent {
    selectedQuestions = [];
    answers = {};
    submitted = false;
    questionTemplate = null;
    questionChoiceTemplate = null;

    onInit() {
        Promise.all([
            $.get('components/question.component.html').then(template => this.questionTemplate = template),
            $.get('components/question-choice.component.html').then(template => this.questionChoiceTemplate = template)
        ]).then(() => $.get('assets/questions.json').then(data => {
            questionService.storeQuestion(data);
            this.selectedQuestions = questionService.randomize();
            this.renderQuestions();
        }));
        $('#btn-submit').click(this.onSubmit.bind(this));
        $('#btn-reset').click(this.onResetQuiz.bind(this));
        $('#btn-clear-results').click(this.onClearResults.bind(this));
    }

    onSubmit() {
        let result = questionService.validateAnswers(this.answers);
        this.renderFeedback(result);

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

    storeResult(result) {
        const results = JSON.parse(localStorage.getItem('results')) || [];
        results.unshift({ score: result.score, percentage: result.percentage, date: new Date().toISOString() });
        localStorage.setItem('results', JSON.stringify(results));
        return results;
    }

    renderFeedback(result) {
        this.selectedQuestions.forEach(question => {
            const feedbackElement = $(`#question-${question.id} .feedback`);
            if (result.correctAnswers.includes(question.id)) {
                feedbackElement.append($('<div></div>').text('Correct!').addClass('text-success'));
            } else {
                feedbackElement.append($('<div></div>').text(`Incorrect! The correct answer is: ${question.choices[question.answer]}`).addClass('text-danger'));
            }
        });
    }

    onResetQuiz() {
        this.selectedQuestions = questionService.randomize();
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
        this.answers[questionId] = answer;
    }

    renderQuestions() {
        const formattedQuestions = this.selectedQuestions.map((question, index) => {
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
            return results.map(line => `<tr><td>${new Date(line.date).toLocaleString()}</td><td>${line.score}</td><td>${line.percentage}%</td></tr>`).join('');
        }
        return `<tr><td colspan="3" class="text-center">No results yet.</td></tr>`;
    }
}
export const component = new QuizComponent();