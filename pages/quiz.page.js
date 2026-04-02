import { ObjectUtils } from '../utils/object.utils.js';
import { component as questionService } from '../services/question.service.js';
import { component as storageService } from '../services/storage.service.js';

const QUIZ_MESSAGE = {
    incomplete: 'You haven\'t answered this question yet',
    correct: 'Correct!',
    passedTitle: 'Congratulations! You passed the quiz!',
    passedDescription: 'You have demonstrated a good understanding of the material. Keep up the great work!',
    failedTitle: 'Better luck next time! You did not pass the quiz.',
    failedDescription: 'Consider reviewing the material and trying again to improve your score.'
};

export class QuizComponent {
    state = {
        questions: [],
        submitted: false,
        isDirty: false
    };

    templates = {
        question: null,
        option: null
    };

    elements = {};

    get questions() {
        return this.state.questions;
    }

    get submitted() {
        return this.state.submitted;
    }

    get isDirty() {
        return this.state.isDirty;
    }

    onInit() {
        this.cacheElements();
        this.bindEvents();
        this.loadQuiz();
    }

    onDestroy() {
        this.unbindEvents();
        this.resetState();
        this.templates.question = null;
        this.templates.option = null;
        this.elements = {};
    }

    onBeforeHashChange() {
        if (this.isDirty) {
            return confirm('You have unfinished quiz !!! Do you want to continue ?');
        }
        return true;
    }

    cacheElements() {
        this.elements = {
            quizContainer: $('#quiz-container'),
            submitButton: $('#btn-submit'),
            resetButton: $('#btn-reset'),
            clearResultsButton: $('#btn-clear-results'),
            controlButtons: $('.control .btn'),
            resultsContainer: $('#results-container'),
            resultsList: $('#results-list'),
            resultScore: $('#res-score'),
            resultMessage: $('#res-message'),
            resultDescription: $('#res-description'),
            rewardModal: document.getElementById('reward-popup')
        };
    }

    bindEvents() {
        this.elements.submitButton.on('click.quiz', this.onSubmit.bind(this));
        this.elements.resetButton.on('click.quiz', this.onResetQuiz.bind(this));
        this.elements.clearResultsButton.on('click.quiz', this.onClearResults.bind(this));
    }

    unbindEvents() {
        this.elements.submitButton?.off('.quiz');
        this.elements.resetButton?.off('.quiz');
        this.elements.clearResultsButton?.off('.quiz');
        this.elements.quizContainer?.off('.quiz');
    }

    async loadQuiz() {
        await this.loadTemplates();
        await this.loadQuestions();
        this.renderQuestions();
    }

    async loadTemplates() {
        const [questionTemplate, optionTemplate] = await Promise.all([
            $.get('components/question.component.html'),
            $.get('components/question-option.component.html')
        ]);

        this.templates.question = questionTemplate;
        this.templates.option = optionTemplate;
    }

    async loadQuestions() {
        const data = await $.get('assets/questions.json');
        questionService.storeQuestion(data);
        this.state.questions = questionService.randomize();
    }

    async onSubmit() {
        if (!this.validateForm()) {
            this.scrollToFirstError();
            return;
        }

        this.state.submitted = true;

        const result = questionService.validateAnswers(this.buildSubmittedAnswers());
        this.renderFeedback(result);
        this.state.isDirty = false;

        if (result.isPassed) {
            await this.displayRewardPopup();
        }

        const results = storageService.storeResult(result);
        this.renderResultsPanel(result, results);
    }

    buildSubmittedAnswers() {
        return this.questions.map((question) => ({
            id: question.id,
            selected: question.selected
        }));
    }

    validateForm() {
        let validForm = true;

        for (const question of this.questions) {
            if (typeof question.selected === 'undefined') {
                this.setFeedbackMessage(question, true, QUIZ_MESSAGE.incomplete);
                validForm = false;
            }
        }

        return validForm;
    }

    scrollToFirstError() {
        const firstErrorQuestion = this.elements.quizContainer.find('.question:has(.feedback .text-danger)').first()[0];
        firstErrorQuestion?.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        });
    }

    async displayRewardPopup() {
        const modalElement = this.elements.rewardModal;
        const modal = $(modalElement);
        const previousFocus = document.activeElement;

        await this.loadRewardImage(modal);

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

    async loadRewardImage(modal) {
        try {
            const reward = await $.get('https://foodish-api.com/api/');
            if (reward.image) {
                this.toggleRewardState(modal, true);
                modal.find('#reward-image').attr('src', reward.image);
                return;
            }
        } catch {
            // Do nothing, fallback to failed state
        }

        this.toggleRewardState(modal, false);
    }

    toggleRewardState(modal, hasImage) {
        this.toggleElement(modal.find('#reward-popup-image-success'), hasImage);
        this.toggleElement(modal.find('#reward-popup-image-failed'), !hasImage);
    }

    renderFeedback(result) {
        this.questions.forEach((question) => {
            const questionElement = this.getQuestionElement(question);
            questionElement.find('.question-option').removeClass('clickable');
            questionElement.find(`.question-option[app-option=${question.answer}]`).addClass('success');

            if (result.correctAnswers.includes(question.id)) {
                this.setFeedbackMessage(question, false, QUIZ_MESSAGE.correct);
            } else {
                this.setFeedbackMessage(question, true, `Incorrect! The correct answer is: ${question.options[question.answer]}`);
                questionElement.find(`.question-option[app-option=${question.selected}]`).addClass('error');
            }
        });
    }

    renderCurrentResult(result) {
        this.elements.resultScore.text(`${result.score}/${result.maxScore}`);
        this.elements.resultMessage.text(result.isPassed ? QUIZ_MESSAGE.passedTitle : QUIZ_MESSAGE.failedTitle);
        this.elements.resultDescription.text(result.isPassed ? QUIZ_MESSAGE.passedDescription : QUIZ_MESSAGE.failedDescription);
    }

    renderResultsPanel(result, results) {
        this.renderCurrentResult(result);
        this.hideElement(this.elements.controlButtons);
        this.showElement(this.elements.resetButton);
        this.elements.resultsList.html(this.renderResultRows(results));
        this.showElement(this.elements.resultsContainer);
        this.scrollToElement(this.elements.resultsContainer[0]);
    }

    getQuestionElement(question) {
        return this.elements.quizContainer.find(`#question-${question.id}`);
    }

    getFeedbackElement(question) {
        return this.getQuestionElement(question).find('.feedback');
    }

    setFeedbackMessage(question, isError, message) {
        const feedbackElement = this.getFeedbackElement(question);

        if (!message) {
            feedbackElement.empty();
            return;
        }

        const messageElement = $('<div></div>')
            .text(message)
            .addClass(isError ? 'text-danger' : 'text-success');

        feedbackElement.html(messageElement);
    }

    onResetQuiz() {
        this.state.questions = questionService.randomize();
        this.state.submitted = false;
        this.state.isDirty = false;

        this.renderQuestions();
        this.showElement(this.elements.submitButton);
        this.hideElement(this.elements.resetButton);
        this.hideElement(this.elements.resultsContainer);
        this.scrollToElement(this.elements.quizContainer.find('.question').first()[0]);
    }

    onClearResults() {
        storageService.clear();
        this.elements.resultsList.html(this.renderResultRows([]));
    }

    onUpdateAnswer(event) {
        if (this.submitted) {
            return;
        }

        const selectedOption = $(event.currentTarget);
        const questionId = selectedOption.attr('app-question-id');
        const selectedAnswer = parseInt(selectedOption.attr('app-option'));
        const question = this.questions.find((currentQuestion) => currentQuestion.id === questionId);

        selectedOption.addClass('selected').siblings().removeClass('selected');
        question.selected = selectedAnswer;
        this.state.isDirty = true;
        this.setFeedbackMessage(question);
    }

    renderQuestions() {
        const formattedQuestions = this.questions.map((question, index) => this.renderQuestion(question, index)).join('');

        this.elements.quizContainer.html(formattedQuestions);
        this.elements.quizContainer
            .find('.question-option')
            .addClass('clickable')
            .on('click.quiz', this.onUpdateAnswer.bind(this));
    }

    renderQuestion(question, index) {
        return ObjectUtils.format(this.templates.question, {
            id: question.id,
            question: question.question,
            number: index + 1,
            questionCount: this.questions.length,
            options: question.options.map((option, optionIndex) => this.renderQuestionOption(question.id, option, optionIndex)).join('')
        });
    }

    renderQuestionOption(questionId, option, optionIndex) {
        return ObjectUtils.format(this.templates.option, {
            questionId,
            index: optionIndex,
            number: optionIndex + 1,
            option: ObjectUtils.escapeHTML(option)
        });
    }

    renderResultRows(results) {
        if (results.length) {
            return results.map((line) => $('<tr></tr>')
                .append($('<td></td>').text(new Date(line.date).toLocaleString()))
                .append($('<td></td>').text(`${line.score} (${line.percentage})`))
                .append($('<td></td>')
                    .addClass(line.isPassed ? 'text-success' : 'text-danger')
                    .text(line.isPassed ? 'Passed' : 'Failed')));
        }

        return '<tr><td colspan="3" class="text-center">No results yet.</td></tr>';
    }

    resetState() {
        this.state = {
            questions: [],
            submitted: false,
            isDirty: false
        };
    }

    scrollToElement(element) {
        element?.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        });
    }

    toggleElement(element, shouldShow) {
        return shouldShow ? this.showElement(element) : this.hideElement(element);
    }

    hideElement(element) {
        return element.addClass('d-none');
    }

    showElement(element) {
        return element.removeClass('d-none');
    }
}

export const component = new QuizComponent();
