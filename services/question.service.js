export class QuestionService {
    NUMBER_OF_QUESTIONS = 10;
    PASSING_SCORE = 70;
    questions = {};
    storeQuestion(questions) {
        this.questions = questions;
    }

    randomize() {
        return this.questions.sort(() => 0.5 - Math.random()).slice(0, this.NUMBER_OF_QUESTIONS);
    }

    validateAnswers(answers) {
        const correctAnswerMap = this.questions.reduce((questionMap, question) => {
            questionMap[question.id] = question.answer;
            return questionMap;
        });
        console.log(answers, correctAnswerMap);
        const correctedAnswers = Object.keys(answers).filter(questionId => correctAnswerMap[questionId] === answers[questionId]);
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