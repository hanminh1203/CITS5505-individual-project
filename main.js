const ROUTES = {
    'tutorial': { css: 'pages/tutorial.page.css', component: 'pages/tutorial.page.html' },
    'quiz': { css: 'pages/quiz.page.css', component: 'pages/quiz.page.html', js: '/pages/quiz.page.js' },
    'ai-reflection-log': { component: 'pages/ai-reflection-log.page.html' },
    'personalised-cv': { css: 'pages/personalised-cv.page.css', component: 'pages/personalised-cv.page.html' }
};

$(document).ready(() => {
    function route() {
        const hash = $(location).attr('hash').substring(1) || 'tutorial';
        const routes = ROUTES[hash];
        $('link[app-style-sheet]').remove();
        $('script[app-script]').remove();
        if (routes) {
            $('main').load(routes.component, () => {
                if (routes.js) {
                    import(routes.js).then((module) => {
                        module.component.onInit();
                    });
                }
            });
            if (routes.css) {
                $('head').append($('<link rel="stylesheet">').attr('href', routes.css).attr('app-style-sheet', true));
            }
        } else {
            $('main').load(hash);
        }
        $('main').removeClass().addClass(hash);
        $('.navbar .nav-link').removeClass('active');
        $('.navbar .nav-link-' + hash).addClass('active');
    }

    $("header").load("components/header.component.html");
    $("footer").load("components/footer.component.html");

    $(window).on('hashchange load', route);

});