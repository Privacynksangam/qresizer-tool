document.addEventListener('DOMContentLoaded', () => {
    const ui = {};
    const mapUIElements = () => {
        const ids = [
            'imageUploadInputElement', 'uploadAreaElement', 'fileNameDisplay', 'originalImageInfoElement',
            'originalDimensionsSpan', 'originalTypeSpan', 'originalSizeSpan', 'controlsFormElement',
            'targetWidthInput', 'targetHeightInput', 'aspectRatioCheckboxInput', 'qualityControlGroupElement',
            'qualityRangeSliderElement', 'qualityValueSpanElement', 'outputFormatSelectElement', 'estimatedSizeSpanElement',
            'targetFileSizeInput', 'fileSizeUnitSelectElement', 'targetFileSizeGroupElement',
            'processImageButtonElement', 'resizedPreviewBoxElement', 'previewCanvasElement',
            'resizedImageInfoElement', 'appMessageElement', 'dimensionUnitSelect', 'dpiControlGroup',
            'dpiInput', 'aspectRatioPresetsContainerElement', 'togglePresetsButton', 'presetsGridContainer',
            'crop-preview-container', 'cropPreviewImage', 'openCropModalButton', 'cropModal', 'imageToCrop',
            'applyCropButton', 'closeCropModalButton', 'downloadButtonElement',
            'darkModeToggle', 'rotateLeftButton', 'rotateRightButton', 'flipHorizontalButton', 'flipVerticalButton',
            'brightnessSlider', 'contrastSlider', 'saturationSlider', 'brightnessValue', 'contrastValue',
            'saturationValue', 'grayscaleButton', 'sepiaButton', 'resetAdjustmentsButton',
            'textOverlayContainer', 'textInput', 'textColorInput', 'textColorHex',
            'textBgColorInput', 'textBgColorHex', 'fontSizeInput', 'textColorPalette', 'textBgColorPalette'
        ];
        ids.forEach(id => ui[id.replace(/-(\w)/g, (_, p1) => p1.toUpperCase())] = document.getElementById(id));
        ui.presetButtons = document.querySelectorAll('.preset-button');
        ui.tabButtons = document.querySelectorAll('.tab-button');
        ui.tabPanes = document.querySelectorAll('.tab-pane');
        return true;
    };
    if (!mapUIElements()) return;

    let loadedSourceImageObject = new Image();
    let originalRawFile = null, sourceImageWidth = 0, sourceImageHeight = 0, sourceImageType = '', sourceImageAspectRatio = 1, currentAppliedAspectRatio = 1;
    let cropper = null;
    let finalImageBlob = null, finalImageFilename = '';
    let currentUnit = 'px';
    let flipState = { h: 1, v: 1 };
    const defaultAdjustments = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0 };
    let currentAdjustments = { ...defaultAdjustments };
    let isProgrammaticChange = false;

    let editorState = { text: null };
    let editedImageWithoutText = null;

    const debounce = (func, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => { func.apply(this, args); }, delay); }; };

    const rgbToHex = (rgb) => {
        if (!rgb || typeof rgb !== 'string' || rgb.startsWith('#')) return rgb;
        if (rgb === 'transparent') return 'transparent';
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return '#000000';
        return '#' + result.slice(0, 3).map(x => {
            const hexValue = parseInt(x).toString(16);
            return hexValue.length === 1 ? '0' + hexValue : hexValue;
        }).join('');
    };

    ui.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            ui.tabButtons.forEach(btn => btn.classList.remove('active'));
            ui.tabPanes.forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    const setupDarkMode = () => {
        const darkModeIcon = ui.darkModeToggle.querySelector('i');
        const applyDarkMode = (isDark) => { document.body.classList.toggle('dark-mode', isDark); darkModeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'; localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled'); };
        ui.darkModeToggle.addEventListener('click', () => applyDarkMode(!document.body.classList.contains('dark-mode')));
        if (localStorage.getItem('darkMode') === 'enabled') applyDarkMode(true);
    };
    setupDarkMode();

    async function updateEstimatedSize() {
        const format = ui.outputFormatSelectElement
