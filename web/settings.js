const APPEARANCE_CONFIG = 'APPEARANCE';
const ANKI_CONFIG = 'ANKICONFIG';
const OCR_CONFIG = 'OCRCONFIG';
const TRANSLATION_CONFIG = 'TRANSLATIONCONFIG';
const LOG_CONFIG = 'LOGCONFIG';
const TEXTHOOKER_CONFIG = 'TEXTHOOKERCONFIG';
const HOTKEY_CONFIG = '$OS_HOTKEYS';

const OEM_CONFIG = {
    'Tesseract Default': '3',
    'Tesseract LSTM': '1', 
    'Tesseract Legacy': '0',
}
let currentConfig = {}
let logImageType = 'jpg';
let logImageQuality = 1.0;
let audioDevices = {};

const outputToClipboardSwitch = document.getElementById("output-to-clipboard-mode-switch");
const clipboardModeSwitch = document.getElementById("clipboard-mode-switch");

// OCR Control Elements
const OCREngineSelect = document.getElementById("ocr_engine_select");
const OCREngineSelectContainer = document.getElementById("ocr_engine_select_container");
const textOrientationSwitch = document.getElementById("text-orientation-switch");

// Translation Control Elements
const translationSelect = document.getElementById("translation_select");
const translationSelectContainer = document.getElementById("translation_select_container");
const sourceLanguageInput = document.getElementById('source_language_input');
const targetLanguageInput = document.getElementById('target_language_input');

// Audio Control Elements
const audioHostSelector = document.getElementById("audio_host_selector");
const audioHostSelect = document.getElementById("audio_host_select");
const audioDeviceSelector = document.getElementById("audio_device_selector");
const audioDeviceSelect = document.getElementById("audio_device_select");
const audioDurationInput = document.getElementById("audio_duration_input");

// Picture Control Elements
const imageTypeInput = document.getElementById('image_type_input');

// Anki Control Elements
const ankiTagsInput = document.getElementById('anki_tags_input');
const deckSelect = document.getElementById('deckSelect');
const cardModelSelect = document.getElementById('cardModelSelect');
const dictionarySelect = document.getElementById('dictionarySelect');
const screenshotMaxWidthInput = document.getElementById('screenshotMaxWidthInput');
const screenshotMaxHeightInput = document.getElementById('screenshotMaxHeightInput');
const resizeScreenshotSwitch = document.getElementById('resizeScreenshotSwitch');

// Texthooker Settings Elements
const removeRepeatSentencesSwitch = document.getElementById('removeRepeatSentencesSwitch');
const textractorPathInput = document.getElementById('textractorPathInput');
const removeRepeatSelect = document.getElementById('removeRepeatSelect');

// Hotkeys
const refreshHotkeyInput = document.getElementById('refreshHotkeyInput');
const addToAnkiHotkeyInput = document.getElementById('addToAnkiHotkeyInput');
const recordAudioHotkeyInput = document.getElementById('recordAudioHotkeyInput');

initConfig();

function initConfig () {
    (async() => {
        const config = await eel.read_config_all()();
        if (config) {
            currentConfig = Object.assign(config);
            // Appearance
            const appearanceConfig = config[APPEARANCE_CONFIG];
            initFontSize(appearanceConfig['fontsize']);
            initDarkTheme(appearanceConfig['darktheme']);
            selectionColor = appearanceConfig['selection_color']
            selectionLineWidth = appearanceConfig['selection_line_width'];
            // OCR
            const ocrConfig = config[OCR_CONFIG];
            initOCREngine(ocrConfig['engine']);
            // Translation
            const translationConfig = config[TRANSLATION_CONFIG];
            initTranslation(translationConfig['translation_service'])
            initSetTranslationLanguages({sourceLang: translationConfig['source_lang'], targetLang: translationConfig['target_lang']});
            // Logs
            const logConfig = config[LOG_CONFIG];
            initLaunchLogWindow(logConfig['launchlogwindow']);
            initIsLogImages(logConfig['logimages']);
            initImageType(logConfig['logimagetype']);
            initSetImageResize({isResizeScreenshot: logConfig['resize_screenshot'], screenshotMaxWidth: logConfig['resize_screenshot_max_width'], screenshotMaxHeight: logConfig['resize_screenshot_max_height']});
            logImageQuality = logConfig['logimagequality']; 
            logSessionMaxLogSize = logConfig['lastsessionmaxlogsize'];
            initIsLogAudio(logConfig['logaudio']);
            initSetAudioSources(logConfig['logaudiohost']);
            initSetAudioDuration(logConfig['logaudioduration']);
            // Anki
            const ankiConfig = config[ANKI_CONFIG];
            initSetAnkiTags(ankiConfig['cardtags']);
            initSetAnkiDictionaries(ankiConfig['anki_dictionary']);
            // Texthooker
            const texthookerConfig = config[TEXTHOOKER_CONFIG];
            // initSetRemoveRepeatedSentencesSwitch(texthookerConfig['remove_repeat_mode']);
            initSetRemoveRepeatedMode(texthookerConfig['remove_repeat_mode']);
            initSetRemoveDuplicateCharactersSwitch(texthookerConfig['remove_duplicates']);
            initSetRemoveWhiteSpacesSwitch(texthookerConfig['remove_spaces']);
            initSetTextractorPath();
            // Hotkeys
            const hotkeyConfig = config[HOTKEY_CONFIG];
            initHotkeys({
                refreshHotkey: hotkeyConfig['refresh_ocr'], 
                addToAnkiHotkey: hotkeyConfig['add_to_anki'],
                recordHotkey: hotkeyConfig['record_audio']
            });
        }
    })()
}

function initFontSize(fontSize) {
    updateFontSize(fontSize);
    const fontSizeSlider = document.getElementById("font-size-slider");
    fontSizeSlider.MaterialSlider.change(fontSize);
}

function initDarkTheme(darkTheme) {
    if (darkTheme === 'true') {
        toggleDarkTheme();
        document.getElementById("dark-theme-switch").parentElement.MaterialSwitch.on();
    }
}

function initOCREngine(engine) {
    if (engine) {
        OCREngine = engine;
        const engineOptions = OCREngineSelectContainer.querySelectorAll("li");
        const selectedOption = Array.from(engineOptions).find(child=>child.innerHTML === engine);
        if (selectedOption) {
            selectedOption.setAttribute('data-selected', true);
        } else { 
            // Fallback to default Tesseract if option not found
            const defaultOption = Array.from(engineOptions).find(child => child.innerText == "Tesseract Default") 
            defaultOption.setAttribute('data-selected', true);
        }
        getmdlSelect.init('#ocr_engine_select_container');
    }
}

/*
 *
 Translation Settings 
 *
*/

function initTranslation(service) {
    if (service) {
        translationService = service;
        const translationOptions = translationSelectContainer.querySelectorAll("li");
        const selectedOption = Array.from(translationOptions).find(child=>child.innerText === service);
        if (selectedOption) {
            selectedOption.setAttribute('data-selected', true);
        } else { 
            // Fallback to default Papago if option not found
            const defaultOption = Array.from(translationOptions).find(child => child.innerText == "Papago") 
            defaultOption.setAttribute('data-selected', true);
        }
        getmdlSelect.init('#translation_select_container');
    }
}

function initSetTranslationLanguages({sourceLang, targetLang}) {
    sourceLanguage = sourceLang;
    sourceLanguageInput.parentElement.MaterialTextfield.change(sourceLang);

    targetLanguage = targetLang;
    targetLanguageInput.parentElement.MaterialTextfield.change(targetLang);
}

function updateTranslationServiceAndPersist() {
    translationService = translationSelect.value;
    if (currentConfig[TRANSLATION_CONFIG]['translation_service'] !== translationService) {
        eel.update_config(TRANSLATION_CONFIG, {'translation_service':translationService})();
    }
}

function changeSourceLanguage() {
    if (sourceLanguageInput.value){
        eel.update_config(TRANSLATION_CONFIG, {'source_lang':sourceLanguageInput.value })();
    }
}

function changeTargetLanguage() {
    if (sourceLanguageInput.value){
        eel.update_config(TRANSLATION_CONFIG, {'target_lang':targetLanguageInput.value })();
    }
}

/*
 *
 Media Settings 
 *
*/

function initLaunchLogWindow(isLaunchLogWindow) {
    if (isLaunchLogWindow === 'true') {
        eel.open_new_window('logs.html');
    }
}

function initIsLogImages(isLogImages) {
    if (isLogImages === 'true') {
        toggleLogImages();
        document.getElementById("log-images-switch").parentElement.MaterialSwitch.on();
    }
}

function initImageType(imageType) {
    logImageType = imageType;
    imageTypeInput.parentElement.MaterialTextfield.change(imageType);
}

function changeImageType() {
    if (imageTypeInput.value){
        logImageType = imageTypeInput.value;
        eel.update_config(LOG_CONFIG, {'logimagetype':imageTypeInput.value })();
    }
}


function initIsLogAudio(isLogAudio) {
    if (isLogAudio === 'true') {
        toggleLogAudio();
        document.getElementById("log-audio-switch").parentElement.MaterialSwitch.on();
    }
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
    if (OCREngine.includes('Tesseract')) {
        // Enable Tesseract Features
        textOrientationSwitch.disabled = false;
        textOrientationSwitch.parentNode.classList.remove("is-disabled");
    } else {
        // Incompatible Tesseract text recognition features
        textOrientationSwitch.disabled = true;
        textOrientationSwitch.parentNode.classList.add("is-disabled");
    }
    refreshOCR();
    return OCREngine;
}

function updateOCREngineAndPersist() {
    const OCREngine = updateOCREngine();
    if (currentConfig[OCR_CONFIG]['engine'] !== OCREngine) {
        eel.update_config(OCR_CONFIG, {'engine':OCREngine})();
        if (OCREngine.includes('Tesseract')) {
            eel.update_config(OCR_CONFIG, {'oem': OEM_CONFIG[OCREngine]})();
        }
    }
}
  
function toggleTextOrientation() {
    verticalText = !verticalText;
    refreshOCR();
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
        ctx.clearRect(0,0,cv1.width,cv1.height); // clear canvas
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

function toggleResizeScreenshotSwitch() {
    isResizeScreenshot = !isResizeScreenshot;
    screenshotMaxWidthInput.disabled = !isResizeScreenshot;
    screenshotMaxHeightInput.disabled = !isResizeScreenshot;
}
async function toggleResizeScreenshotSwitchAndPersist() {
    toggleResizeScreenshotSwitch();
    eel.update_config(LOG_CONFIG, {'resize_screenshot': isResizeScreenshot ? 'true' : 'false'})();
}
function initSetImageResize({isResizeScreenshot, screenshotMaxWidth, screenshotMaxHeight}) {
    if (isResizeScreenshot === 'true') {
        toggleResizeScreenshotSwitch();
        resizeScreenshotSwitch.parentElement.MaterialSwitch.on();
    }
    resizeScreenshotMaxWidth = parseInt(screenshotMaxWidth, 10);
    resizeScreenshotMaxHeight = parseInt(screenshotMaxHeight, 10);
    screenshotMaxWidthInput.value = screenshotMaxWidth;
    screenshotMaxHeightInput.value = screenshotMaxHeight;
}
function changeScreenshotMaxWidth(input) {
    resizeScreenshotMaxWidth = parseInt(input.value, 10);
    eel.update_config(LOG_CONFIG, {'resize_screenshot_max_width': input.value})();
}
function changeScreenshotMaxHeight(input) {
    resizeScreenshotMaxHeight = parseInt(input.value, 10);
    eel.update_config(LOG_CONFIG, {'resize_screenshot_max_height': input.value})();
}
function openFolder(relative_path) {
    eel.open_folder_by_relative_path(relative_path);
}
function toggleLogAudio() {
    logAudio = !logAudio;
    return logAudio;
}
function toggleLogAudioAndPersist() {
    isLogAudio = toggleLogAudio();
    eel.update_config(LOG_CONFIG, {'logaudio': isLogAudio ? 'true' : 'false'})();
}
function initSetAudioDuration(audioDuration) {
    audioDurationInput.parentElement.MaterialTextfield.change(parseInt(audioDuration, 10));
}
async function initSetAudioSources(default_audio_host) {
    audio_sources = await eel.get_audio_objects()();
    for (const source in audio_sources) {
        const audioHostItem = document.createElement("li");
        audioHostItem.classList.add("mdl-menu__item")
        audioHostItem.data_val = source.replace(' ', '_');
        audioHostItem.innerHTML = source;
        if (source === default_audio_host) {
            audioHostItem.setAttribute("data-selected", "true");
            // setAudioDevices(source);
        }
        audioHostSelector.append(audioHostItem);
    }
    getmdlSelect.init('#audio_host_select_container'); // Refresh mdl-select after dynamically inserting options
}
async function setAudioDevices(audio_host) {
    const recommended_audio_device = await eel.get_recommended_device_index(audio_host)();
    if (recommended_audio_device == -1) {
        if (logAudio) {
            const notification = document.querySelector('.mdl-js-snackbar');
            notification.MaterialSnackbar.showSnackbar(
              {
                message: 'Unable to find audio recording device. Please select audio device in settings.'
              }
            );
        }
        audioDeviceSelect.value = '';
    }
    const deviceList = audio_sources[audio_host]
    if (deviceList) {
        // Remove previous options
        audioDeviceSelector.innerHTML = '';
        audioDevices = {};

        // Add new options
        deviceList.forEach(deviceObject => {
            deviceIndex = Object.entries(deviceObject).flat()[0];
            deviceName = Object.entries(deviceObject).flat()[1];
            audioDevices[deviceName.trim()] = deviceIndex;
            const audioDeviceItem = document.createElement("li");
            audioDeviceItem.classList.add("mdl-menu__item")
            audioDeviceItem.data_val = deviceIndex;
            audioDeviceItem.innerHTML = deviceName;
            if (recommended_audio_device === parseInt(deviceIndex, 10)) {
                audioDeviceItem.setAttribute("data-selected", "true");
                audioDeviceIndex = deviceIndex;
            }
            audioDeviceSelector.append(audioDeviceItem);
        })
        getmdlSelect.init('#audio_device_select_container'); // Refresh mdl-select after dynamically inserting options
    }
}
function changeAudioHost () {
    if (audioHostSelect.value !== currentConfig[LOG_CONFIG]['logaudiohost']) {
        currentConfig[LOG_CONFIG]['logaudiohost'] = audioHostSelect.value
        eel.update_config(LOG_CONFIG, {'logaudiohost': audioHostSelect.value})();
    }
    setAudioDevices(audioHostSelect.value);
}
eel.expose(restartAudioRecording)
function restartAudioRecording() {
    deviceIndex = parseInt(audioDevices[audioDeviceSelect.value], 10)
    eel.restart_audio_recording(deviceIndex); 
}
function changeAudioDevice() {
    if (audioDeviceSelect.value !== currentConfig[LOG_CONFIG]['logaudiodevice']) {
        currentConfig[LOG_CONFIG]['logaudiodevice'] = audioDeviceSelect.value
        eel.update_config(LOG_CONFIG, {'logaudiodevice': audioDeviceSelect.value})();
    }
    restartAudioRecording();
}
function changeAudioDuration() {
    const duration = parseFloat(audioDurationInput.value, 10)
    if (typeof duration === 'number') {
        if (duration > 0) {
            eel.update_config(LOG_CONFIG, {'logaudioduration':duration.toString()})();
        }
    }
}

/*
 *
 Anki Settings 
 *
*/
function initSetAnkiTags(tags) {
    ankitags = tags;
    ankiTagsInput.parentElement.MaterialTextfield.change(tags);
}
async function setDeck() {
    const defaultDeck = await eel.read_config(ANKI_CONFIG, 'deck')(); 
    const deckOptions = deckSelector.querySelectorAll("option");
    const selectedOption = Array.from(deckOptions).find(child=>child.value === defaultDeck);
    if (selectedOption) {
        deck = defaultDeck;
        deckSelect.value = defaultDeck;
    } 
}
async function setCardModel() {
    const defaultCardModel = await eel.read_config(ANKI_CONFIG, 'model')(); 
    const cardModelOptions = cardModelSelector.querySelectorAll("option");
    const selectedOption = Array.from(cardModelOptions).find(child=>child.value === defaultCardModel);
    if (selectedOption) {
        selectedOption.setAttribute('data-selected', true);
        cardModelSelect.value = defaultCardModel;
        return defaultCardModel
    } 
    return ''
}
function changeDeck() {
    selectedDeck = deckSelect.value;
    eel.update_config(ANKI_CONFIG, {'deck': selectedDeck})();
}
function changeCardModel() {
    if (ankiModelFieldMap[cardModelSelect.value]) {
        selectedModel = cardModelSelect.value;
        updateFieldValuesTable(ankiModelFieldMap[selectedModel]);
        if (savedAnkiCardModels) {
            const existingModelIndex = savedAnkiCardModels.findIndex(obj=>obj['model'] === selectedModel);
            if (existingModelIndex !== -1) {
                // update table to saved settings
                fieldValueMap =  {...savedAnkiCardModels[existingModelIndex]} // get obj
                delete fieldValueMap['model']; //remove model name from object
                applyFieldAndValuesToTable(fieldValueMap);
            }
        }
        eel.update_config(ANKI_CONFIG, {'model': selectedModel})();
    } else {
        updateFieldValuesTable({})
    }
}
function changeAnkiTags() {
    const tagList = ankiTagsInput.value.split(/[ ,]+/);
    let tags = '';
    if (tagList) {
        tags = tagList.join(' ');
        ankiTagsInput.value = tags;
    }
    eel.update_config(ANKI_CONFIG, {'cardtags': tags})();
}
async function updateFieldValue() {
    const defaultAnkiModels = await eel.get_anki_card_models()();
    savedAnkiCardModels = defaultAnkiModels ? defaultAnkiModels : [];
    const modelName = cardModelSelect.value;
    const fields = ankiModelFieldMap[modelName];
    const table = document.getElementById('field_values_table');
    const selectElementList = table.getElementsByClassName('field_value_select');
    const values = [].map.call(selectElementList, selectElement=>selectElement.value);
    fieldValueMap = {};
    fields.forEach((field, index)=>fieldValueMap[field] = values[1+index]);
    if (savedAnkiCardModels.length === 0) {
        savedAnkiCardModels.push({model: modelName, ...fieldValueMap});
    } else {
        // if exists update else insert
        const existingModelIndex = savedAnkiCardModels.findIndex(obj=>obj['model'] === modelName);
        if (existingModelIndex !== -1) {
            savedAnkiCardModels[existingModelIndex] = {model: modelName, ...fieldValueMap};
        } else {
            savedAnkiCardModels.push({model: modelName, ...fieldValueMap});  
        }
    }
    eel.update_anki_card_models(savedAnkiCardModels)();
}

async function initSetAnkiDictionaries(defaultDictionary) {
    const dictionaries = await eel.get_dictionaries()();
    dictionaries.forEach(dictionary=>{
        const dictionaryOption = document.createElement('option');
        dictionaryOption.value = dictionary;
        dictionaryOption.innerHTML = dictionary;
        if (dictionary === defaultDictionary) {
            dictionaryOption.selected = true;
        }
        dictionarySelect.add(dictionaryOption);
    })
}

async function selectDictionary() {
    if (dictionarySelect.value) {
        eel.set_dictionary(dictionarySelect.value)();
        eel.update_config(ANKI_CONFIG, {'anki_dictionary': dictionarySelect.value});
    }
}

/**
 * 
 * Texthooker
 */
function initSetRemoveRepeatedMode(removeRepeatedMode) {
    if (removeRepeatedMode) {
        const removeRepeatOptions = removeRepeatSelect.querySelectorAll("option");
        const removeRepeatOption = Array.from(removeRepeatOptions).find(child=>child.innerText.toLowerCase() === removeRepeatedMode.toLowerCase());
        if (removeRepeatOption) {
            removeRepeatOption.setAttribute('selected', true);
        } else { 
            // Fallback to quick
            const defaultOption = Array.from(removeRepeatOptions).find(child => child.innerText.toLowerCase() == "quick") 
            defaultOption.setAttribute('selected', true);
        }
    }
}
function updateRemoveRepeatedModeAndPersist() {
    const removeRepeatedMode = removeRepeatSelect.value.toLowerCase();
    if (currentConfig[TEXTHOOKER_CONFIG]['remove_repeat_mode'] !== removeRepeatedMode) {
        eel.update_config(TEXTHOOKER_CONFIG, {'remove_repeat_mode':removeRepeatedMode})();
    }
}
function toggleRemoveDuplicateCharacters() {
    isRemoveDuplicateCharacters = !isRemoveDuplicateCharacters;
}
function toggleRemoveDuplicateCharactersAndPersist() {
    toggleRemoveDuplicateCharacters();
    eel.update_config(TEXTHOOKER_CONFIG, {'remove_duplicates': isRemoveDuplicateCharacters ? 'true' : 'false'})();

}
function initSetRemoveDuplicateCharactersSwitch(isRemoveDuplicateCharacters) {
    if (isRemoveDuplicateCharacters === 'true') {
        toggleRemoveDuplicateCharacters();
        document.getElementById("removeDuplicateCharactersSwitch").parentElement.MaterialSwitch.on();
    }
}
function toggleRemoveWhiteSpaces() {
    isRemoveWhiteSpaces = !isRemoveWhiteSpaces;
}
async function toggleRemoveWhiteSpacesAndPersist() {
    toggleRemoveWhiteSpaces();
    eel.update_config(TEXTHOOKER_CONFIG, {'remove_spaces': isRemoveWhiteSpaces ? 'true' : 'false'})();
}
function initSetRemoveWhiteSpacesSwitch(isRemoveWhiteSpaces) {
    if (isRemoveWhiteSpaces === 'true') {
        toggleRemoveWhiteSpaces();
        document.getElementById("removeWhiteSpacesSwitch").parentElement.MaterialSwitch.on();
    }
}

async function initSetTextractorPath() {
    const textractorPath = await eel.get_path_to_textractor()();
    textractorPathInput.value = textractorPath;
}

async function changeTextractorExecutablePath() {
    const path = await eel.open_folder_for_textractor()();
    if (path) {
        textractorPathInput.value = path;
    }
  }

/**
 * 
 * Hotkeys
 */
function initHotkeys({refreshHotkey, addToAnkiHotkey, recordHotkey}) {
    refreshHotkeyInput.value = refreshHotkey;
    addToAnkiHotkeyInput.value = addToAnkiHotkey;
    recordAudioHotkeyInput.value = recordHotkey;
}

function changeRefreshHotkey(input) {
    eel.update_config(HOTKEY_CONFIG, {'refresh_ocr': input.value})();
}

function changeAddToAnkiHotkey(input) {
    eel.update_config(HOTKEY_CONFIG, {'add_to_anki': input.value})();
}
