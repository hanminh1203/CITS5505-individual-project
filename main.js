const ROUTES = {
    'tutorial': { css: 'pages/tutorial.page.css', component: 'pages/tutorial.page.html', js: '/pages/tutorial.page.js' },
    'quiz': { css: 'pages/quiz.page.css', component: 'pages/quiz.page.html', js: '/pages/quiz.page.js' },
    'ai-reflection-log': { css: 'pages/ai-reflection-log.page.css', component: 'pages/ai-reflection-log.page.html' },
    'personalised-cv': { css: 'pages/personalised-cv.page.css', component: 'pages/personalised-cv.page.html' }
};
let currentComponent = null;

$(document).ready(() => {
    function route() {
        const rawHash = $(location).attr('hash').substring(1) || 'tutorial';
        const hash = ROUTES[rawHash] ? rawHash : 'tutorial';
        const routes = ROUTES[hash];
        if (rawHash !== hash) {
            window.location.hash = hash;
            return;
        }
        $('link[app-style-sheet]').remove();
        if (currentComponent) {
            if (currentComponent.onDestroy) {
                currentComponent.onDestroy();
            }
            currentComponent = null;
        }
        if (routes) {
            $('main').load(routes.component, () => {
                if (routes.js) {
                    import(routes.js).then((module) => {
                        currentComponent = module.component;
                        currentComponent.onInit();
                    });
                } else {
                    currentComponent = null;
                }
            });
            if (routes.css) {
                $('head').append($('<link rel="stylesheet">').attr('href', routes.css).attr('app-style-sheet', true));
            }
            $('main').removeClass().addClass(hash);
            $('.navbar .nav-link').removeClass('active');
            $('.navbar .nav-link-' + hash).addClass('active');
            $('#footer-navigation .col').removeClass('active');
            $('#footer-navigation .col-' + hash).addClass('active');
        }
    }

    function onBeforeUnload() {
        if (currentComponent && currentComponent.isDirty) {
            return 'Dirty';
        }
    }

    $("header").load("components/header.component.html", () => {
        const hash = $(location).attr('hash').substring(1) || 'tutorial';
        $('.navbar .nav-link').removeClass('active');
        $('.navbar .nav-link-' + hash).addClass('active');
    });
    $("footer").load("components/footer.component.html", () => {
        const hash = $(location).attr('hash').substring(1) || 'tutorial';
        $('#footer-navigation .col').removeClass('active');
        $('#footer-navigation .col-' + hash).addClass('active');
    });

    $(window).on('hashchange load', route);
    $(window).on('beforeunload', onBeforeUnload);
});

$(document).click((event) => {
    const link = $(event.target).closest('a[href^="#"]');

    if (link.length
        && currentComponent
        && currentComponent.onBeforeHashChange
        && !currentComponent.onBeforeHashChange()) {
        event.preventDefault();
    }
})

