const ROUTES = {
    'tutorial': { css: 'pages/tutorial.page.css', component: 'pages/tutorial.page.html', js: 'pages/tutorial.page.js' },
    'quiz': { css: 'pages/quiz.page.css', component: 'pages/quiz.page.html', js: 'pages/quiz.page.js' },
    'ai-reflection-log': { css: 'pages/ai-reflection-log.page.css', component: 'pages/ai-reflection-log.page.html' },
    'personalised-cv': { css: 'pages/personalised-cv.page.css', component: 'pages/personalised-cv.page.html' }
};
let currentComponent = null;

$(document).ready(() => {
    function getCurrentHash() {
        return $(location).attr('hash').substring(1) || 'tutorial';
    }

    function getResolvedRoute() {
        const rawHash = getCurrentHash();
        const hash = ROUTES[rawHash] ? rawHash : 'tutorial';
        return { rawHash, hash, routeConfig: ROUTES[hash] };
    }

    function updateActiveNavigation(hash) {
        $('.navbar .nav-link').removeClass('active');
        $('.navbar .nav-link-' + hash).addClass('active');
        $('#footer-navigation .col').removeClass('active');
        $('#footer-navigation .col-' + hash).addClass('active');
    }

    function destroyCurrentComponent() {
        if (currentComponent?.onDestroy) {
            currentComponent.onDestroy();
        }
        currentComponent = null;
    }

    async function initializeRouteScript(routeConfig) {
        if (!routeConfig.js) {
            currentComponent = null;
            return;
        }

        const module = await import(routeConfig.js);
        currentComponent = module.component;
        currentComponent.onInit();
    }

    function route() {
                const { rawHash, hash, routeConfig } = getResolvedRoute();
        if (rawHash !== hash) {
            window.location.hash = hash;
            return;
        }

        $('link[app-style-sheet]').remove();

        destroyCurrentComponent();

        if (routeConfig) {
            $('main').load(routeConfig.component, () => {
                initializeRouteScript(routeConfig);
            });
            if (routeConfig.css) {
                $('head').append($('<link rel="stylesheet">').attr('href', routeConfig.css).attr('app-style-sheet', true));
            }
            $('main').removeClass().addClass(hash);
            updateActiveNavigation(hash);
        }
    }

    function onBeforeUnload() {
        if (currentComponent && currentComponent.isDirty) {
            return 'Dirty';
        }
    }

    $("header").load("components/header.component.html", () => {
        updateActiveNavigation(getResolvedRoute().hash);
    });
    $("footer").load("components/footer.component.html", () => {
        updateActiveNavigation(getResolvedRoute().hash);
    });

    $(window).on('hashchange', route);
    $(window).on('beforeunload', onBeforeUnload);
    route();
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

