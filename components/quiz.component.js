const PASSING_SCORE = 5;
const NUMBER_OF_QUESTIONS = 10;
$(function () {
    const questionTemplate = (question, questionIndex) => `
    <div id="question-${questionIndex}" class="question">
        <p>${question.question}</p>
        <ul>
            ${question.choices.map((option, index) => `<li><input type="radio" name="question-${questionIndex}" value="${index}"> ${option}</li>`).join('')}
        </ul>
        <div class="feedback"></div>
    </div>
    `;
    let questions = [];
    let selectedQuestions = [];
    $.ajax({
        url: 'assets/questions.json',
        dataType: 'json',
        success: function (data) {
            questions = data;
            selectedQuestions = randomizeQuestions(data);
            // TODO Random select 10 questions
            loadQuestions(selectedQuestions, questionTemplate);
            $('#btn-submit').click(function () {
                const selectedAnswers = extractSelectedAnswers();
                let score = calculateScore(selectedQuestions, selectedAnswers);
                let isPass = score >= PASSING_SCORE;
                $('.control .btn').addClass('d-none');
                $('#btn-reset').removeClass('d-none');
                // Display feedback
                // is pass
                //  Retest | Back to Tutorial | AI Reflection Log | Personalised CV
                // if not pass
                //  retry | Back to Tutorial
                // TODO: Create a model or new message, depends on the design
                const results = JSON.parse(localStorage.getItem('results')) || [];
                results.push({ score, percentage: (score / NUMBER_OF_QUESTIONS * 100).toFixed(2), date: new Date().toISOString() });
                localStorage.setItem('results', JSON.stringify(results));
                $('#results-list').html(results.map(result => `<li>Score: ${result.score}, Percentage: ${result.percentage}%, Date: ${new Date(result.date).toLocaleString()}</li>`).join(''));
                $('#results-container').removeClass('d-none');
            });
        }
    });

    $('#btn-reset').click(function () {
        selectedQuestions = randomizeQuestions(questions);
        loadQuestions(selectedQuestions, questionTemplate);
        $('#btn-submit').removeClass('d-none');
        $('#btn-reset').addClass('d-none');
        $('#results-container').addClass('d-none');
    });
    $('#btn-clear-results').click(function () {
        localStorage.removeItem('results');
        $('#results-list').html('');
    });
});

function loadQuestions(selectedQuestions, questionTemplate) {
    $('#quiz-container').html(selectedQuestions.map(questionTemplate).join(''));
}

function calculateScore(selectedQuestions, selectedAnswers) {
    let score = 0;
    for (let i = 0; i < selectedQuestions.length; i++) {
        const correctAnswer = selectedQuestions[i].answer;
        const selectedAnswer = selectedAnswers[i];
        const feedbackElement = $(`#question-${i} .feedback`);
        if (selectedAnswer === correctAnswer) {
            score++;
            // TODO: clear class instead of removeClass
            feedbackElement.removeClass('text-danger').text('Correct!').addClass('text-success');
        } else {
            feedbackElement.removeClass('text-success').text(`Incorrect! The correct answer is: ${selectedQuestions[i].choices[correctAnswer]}`).addClass('text-danger');
        }
    }
    return score;
}

function randomizeQuestions(questions) {
    return questions.sort(() => 0.5 - Math.random()).slice(0, NUMBER_OF_QUESTIONS);
}

function extractSelectedAnswers() {
    return $('#quiz-container').serializeArray()
        .reduce((values, x) => {
            const [_, questionIndex] = x.name.match(/question-(\d+)/);
            values[questionIndex] = parseInt(x.value);
            return values;
        }, {})
}

function resetQuiz() {
    $('#quiz-container').html('');
    $('#btn-submit').removeClass('invisible');
    $('#btn-reset').addClass('invisible');
}