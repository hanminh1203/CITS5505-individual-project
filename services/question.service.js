export class QuestionService {
    NUMBER_OF_QUESTIONS = 5;
    PASSING_SCORE = 70;
    questions = {};
    correctAnswerMap = {}
    storeQuestion(questions) {
        this.questions = questions;
        this.correctAnswerMap = this.questions.reduce((questionMap, question) => {
            questionMap[question.id] = question.answer;
            return questionMap;
        }, {});
    }

    randomize() {
        return this.questions.sort(() => 0.5 - Math.random()).slice(0, this.NUMBER_OF_QUESTIONS);
    }

    validateAnswers(answers) {
        const correctedAnswers = answers.filter(question => this.correctAnswerMap[question.id] === question.selected)
                        .map(question => question.id);
        const percentage = (correctedAnswers.length * 100 / this.NUMBER_OF_QUESTIONS).toFixed(2);
        return {
            score: correctedAnswers.length,
            maxScore: this.NUMBER_OF_QUESTIONS,
            percentage,
            isPassed: percentage >= this.PASSING_SCORE,
            correctAnswers: correctedAnswers
        }
    }
}

export const component = new QuestionService();