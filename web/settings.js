const APPEARANCE_CONFIG = 'APPEARANCE';
const OCR_CONFIG = 'OCRCONFIG';
const LOG_CONFIG = 'LOGCONFIG';

let logImageType = 'jpg';

initConfig();

function initConfig () {
    // Appearance
    initFontSize();
    initDarkTheme();
    // OCR
    initOCREngine();
    // Logs
    initIsLogImages();
    initSetLogImageType();
}

async function initFontSize() {
    const fontSize = await eel.read_config(APPEARANCE_CONFIG, 'fontsize')();
    updateFontSize(fontSize);
    const fontSizeSlider = document.getElementById("font-size-slider");
    fontSizeSlider.MaterialSlider.change(fontSize);
}

async function initDarkTheme() {
    const darkTheme = await eel.read_config(APPEARANCE_CONFIG, 'darktheme')();
    if (darkTheme === 'true') {
        toggleDarkTheme();
        document.getElementById("dark-theme-switch").parentElement.MaterialSwitch.on();
    }
}

async function initOCREngine() {
    const engine = await eel.read_config(OCR_CONFIG, 'engine')();
    if (engine) {
        OCREngine = engine;
        const engineOptions = OCREngineSelectContainer.querySelectorAll("li");
        const selectedOption = Array.from(engineOptions).find(child=>child.innerText === engine);
        if (selectedOption) {
            selectedOption.setAttribute('data-selected', true);
        } else { 
            // Fallback to default Tesseract if option not found
            const defaultOption = Array.from(engineOptions).find(child => child.innerText == "Tesseract") 
            defaultOption.setAttribute('data-selected', true);
        }
        getmdlSelect.init('#ocr_engine_select_container');
    }
}

async function initIsLogImages() {
    const isLogImages = await eel.read_config(LOG_CONFIG, 'logimages')();
    if (isLogImages === 'true') {
        toggleLogImages();
        document.getElementById("log-images-switch").parentElement.MaterialSwitch.on();
    }
}

async function initSetLogImageType() {
    logImageType = await eel.read_config(LOG_CONFIG, 'logimagetype')(); 
}

/*
 *
 Appearance Settings 
 *
*/
function updateFontSize(slideAmount) {
    results.style.fontSize = slideAmount + 'px';
    results.style.lineHeight = (slideAmount * 1.5) + 'px';
}
function updateFontSizeAndPersist(slideAmount) {
    updateFontSize(slideAmount);
    eel.update_config(APPEARANCE_CONFIG, {'fontsize': slideAmount})();
}
function toggleDarkTheme() {
    document.body.classList.toggle("dark-theme");
    results.classList.toggle("dark-theme");
}
function toggleDarkThemeAndPersist() {
    toggleDarkTheme();
    darkTheme = document.body.classList.contains('dark-theme');
    eel.update_config(APPEARANCE_CONFIG, {'darktheme': darkTheme ? 'true' : 'false'})();
}

/*
 *
 OCR Settings 
 *
*/
function updateOCREngine() {
    OCREngine = OCREngineSelect.value;
    return OCREngine;
}

function updateOCREngineAndPersist() {
    const OCREngine = updateOCREngine();
    eel.update_config(OCR_CONFIG, {'engine':OCREngine})();
}

function togglePreprocess() {
    preprocess = !preprocess;
}
  
function toggleTextOrientation() {
    verticalText = !verticalText;
}

/*
 *
 Clipboard Settings 
 *
*/
function toggleClipboardMode() {
    eel.monitor_clipboard();
    clipboardMode  = !clipboardMode;
    if (clipboardMode) {
        // Incompatible modes
        outputToClipboardSwitch.disabled = true;
        outputToClipboardSwitch.parentNode.classList.add("is-disabled");
        // Disable OCR
        refreshButton.disabled = true;
        autoModeButton.disabled = true;
        ctx.clearRect(0,0,canvas.width,canvas.height); // clear canvas
    } else {
        outputToClipboardSwitch.disabled = false;
        outputToClipboardSwitch.parentNode.classList.remove("is-disabled");
        refreshButton.disabled = false;
        autoModeButton.disabled = false;
    }
}
  
function toggleOutputToClipboard() {
    outputToClipboard  = !outputToClipboard;
    // Incompatiable Modes
    if (outputToClipboard) { 
        clipboardModeSwitch.disabled = true;
        clipboardModeSwitch.parentNode.classList.add("is-disabled");
    } else {
        clipboardModeSwitch.disabled = false;
        clipboardModeSwitch.parentNode.classList.remove("is-disabled");
    }
}
  
/*
 *
 Logs Settings 
 *
*/
function toggleLogImages() {
    logImages = !logImages;
    return logImages;
}
function toggleLogImagesAndPersist() {
    isLogImages = toggleLogImages();
    eel.update_config(LOG_CONFIG, {'logimages': isLogImages ? 'true' : 'false'})();
}