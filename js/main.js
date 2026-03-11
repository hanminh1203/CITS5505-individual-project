$(function () {
    $("header").load("components/header.component.html");
    $("footer").load("components/footer.component.html");
    
    const hash = $(location).attr('hash').substring(1) || 'tutorial';
    selectPage(hash);

    $(window).on('hashchange', function () {
        const hash = $(location).attr('hash').substring(1) || 'tutorial';
        selectPage(hash);
    });
})

function selectPage(page) {
    $('main').load('components/' + page + '.component.html');
    $('.navbar .nav-item').removeClass('active');
    $('.navbar .link-nav-' + page).parent().addClass('active');
}