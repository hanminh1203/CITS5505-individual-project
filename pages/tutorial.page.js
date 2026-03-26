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
    }
}
export const component = new TutorialComponent();