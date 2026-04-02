class TutorialComponent {
    onInit() {
        $('#demo-css-font-size-input').on('change input', (event) => {
            const fontSizeValue = Number(event.target.value);
            $('#demo-css-font-size-value').text(fontSizeValue);
            $('#demo-css-text').css('font-size', `${fontSizeValue}px`);
        });
        $('#demo-css-text-align-input').on('change', (event) => {
            const textAlignValue = event.target.value;
            $('#demo-css-text').css('text-align', textAlignValue);
        });
        $('#demo-css-bold').on('change', (event) => {
            const checked = event.target.checked;
            $('#demo-css-text').css('font-weight', checked ? 'bolder' : 'normal');
        });

        $('#demo-css-italic').on('change', (event) => {
            const checked = event.target.checked;
            $('#demo-css-text').css('font-style', checked ? 'italic' : 'normal');
        });

        $('#demo-css-underline').on('change', (event) => {
            const checked = event.target.checked;
            $('#demo-css-text').css('text-decoration', checked ? 'underline' : 'normal');
        });

        $('.box-model').on('mouseover', (event) => {
            const hoveredBox = event.currentTarget;
            $('.box-model').each((_, element) => {
                $(element).toggleClass('box-white', element !== hoveredBox);
            });
        }).on('mouseout', () => {
            $('.box-model').removeClass('box-white');
        });

        $("button[app-module-tab-name]").on('click', (event) => {
            const moduleName = $(event.currentTarget).attr('app-module-tab-name');
            $(`button[app-module-tab-name="${moduleName}"]`).addClass('active').siblings('button').removeClass('active');
            $(`.lesson[app-module-name="${moduleName}"]`).addClass('active').siblings('.lesson').removeClass('active');
            const pageHeader = $('.page-header');
            $("#scrolling-div")[0].scrollTo({
                top: pageHeader[0].offsetTop + pageHeader[0].offsetHeight,
                behavior: 'smooth'
            });
        });
    }
}
export const component = new TutorialComponent();
