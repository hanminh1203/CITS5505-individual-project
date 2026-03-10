$(function () {
    $('#btn-submit').click(function() {
        // Calculate score
        let score = 0;
        let isPass = false;
        // is pass
        //  Retest | Back to Tutorial | AI Reflection Log | Personalised CV
        // if not pass
        //  retry | Back to Tutorial
        alert('Quiz submitted! Your score is: ' + score + '%. You ' + (isPass ? 'passed' : 'failed') + '.');
    })
});