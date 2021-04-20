const APPEARANCE_CONFIG = 'APPEARANCE';
const ANKI_CONFIG = 'ANKICONFIG';
const OCR_CONFIG = 'OCRCONFIG';
const TRANSLATION_CONFIG = 'TRANSLATIONCONFIG';
const LOG_CONFIG = 'LOGCONFIG';

const OEM_CONFIG = {
    'Tesseract Default': '3',
    'Tesseract LSTM': '1', 
    'Tesseract Legacy': '0',
}

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

// Anki Control Elements
const ankiTagsInput = document.getElementById('anki_tags_input');
const deckSelect = document.getElementById('deck_select');
const deckSelectContainer = document.getElementById('deck_select_container');
const cardModelSelect = document.getElementById('card_model_select');
const cardModelSelectContainer = document.getElementById('card_model_select_container');

initConfig();

function initConfig () {
    (async() => {
        // Appearance
        initFontSize();
        initDarkTheme();
        initSelection();
        // OCR
        initOCREngine();
        // Translation
        initTranslation();  
        initSetTranslationLanguages();
        // Logs
        initIsLogImages();
        initSetLogImageTypeAndQuality();
        initIsLogAudio();
        initSetAudioSources();
        initSetAudioDuration();
        //Anki
        initSetAnkiTags();
    })()
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

async function initSelection() {
    selectionColor = await eel.read_config(APPEARANCE_CONFIG, 'selection_color')(); 
    selectionLineWidth = await eel.read_config(APPEARANCE_CONFIG, 'selection_line_width')(); 
}

async function initOCREngine() {
    const engine = await eel.read_config(OCR_CONFIG, 'engine')();
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

async function initTranslation() {
    const service = await eel.read_config(TRANSLATION_CONFIG, 'translation_service')();
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

async function initSetTranslationLanguages() {
    sourceLanguage = await eel.read_config(TRANSLATION_CONFIG, 'source_lang')(); 
    sourceLanguageInput.parentElement.MaterialTextfield.change(sourceLanguage);

    targetLanguage = await eel.read_config(TRANSLATION_CONFIG, 'target_lang')(); 
    targetLanguageInput.parentElement.MaterialTextfield.change(targetLanguage);
}

async function changeSourceLanguage() {
    if (sourceLanguageInput.value){
        eel.update_config(TRANSLATION_CONFIG, {'source_lang':sourceLanguageInput.value })();
    }
}

async function changeTargetLanguage() {
    if (sourceLanguageInput.value){
        eel.update_config(TRANSLATION_CONFIG, {'target_lang':targetLanguageInput.value })();
    }
}

/*
 *
 Media Settings 
 *
*/

async function initIsLogImages() {
    const isLogImages = await eel.read_config(LOG_CONFIG, 'logimages')();
    if (isLogImages === 'true') {
        toggleLogImages();
        document.getElementById("log-images-switch").parentElement.MaterialSwitch.on();
    }
}

async function initSetLogImageTypeAndQuality() {
    logImageType = await eel.read_config(LOG_CONFIG, 'logimagetype')(); 
    logImageQuality = await eel.read_config(LOG_CONFIG, 'logimagequality')(); 
}

async function initIsLogAudio() {
    const isLogAudio = await eel.read_config(LOG_CONFIG, 'logaudio')();
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
    if (OCREngine.includes('Tesseract')) {
        // Enable Tesseract Features
        textOrientationSwitch.disabled = false;
        textOrientationSwitch.parentNode.classList.remove("is-disabled");
    } else {
        // Incompatible Tesseract text recognition features
        textOrientationSwitch.disabled = true;
        textOrientationSwitch.parentNode.classList.add("is-disabled");
    }
    return OCREngine;
}

function updateOCREngineAndPersist() {
    const OCREngine = updateOCREngine();
    eel.update_config(OCR_CONFIG, {'engine':OCREngine})();
    if (OCREngine.includes('Tesseract')) {
        eel.update_config(OCR_CONFIG, {'oem': OEM_CONFIG[OCREngine]})();
    }
}

function updateTranslationServiceAndPersist() {
    translationService = translationSelect.value;
    eel.update_config(TRANSLATION_CONFIG, {'translation_service':translationService})();
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
async function initSetAudioDuration() {
    audioDuration = await eel.read_config(LOG_CONFIG, 'logaudioduration')(); 
    audioDurationInput.parentElement.MaterialTextfield.change(parseInt(audioDuration, 10));
}
async function initSetAudioSources() {
    const default_audio_host = await eel.read_config(LOG_CONFIG, 'logaudiohost')();
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
            alert('Unable to find audio recording device. Please select audio device in settings.')
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
    setAudioDevices(audioHostSelect.value);
}
eel.expose(restartAudioRecording)
function restartAudioRecording() {
    deviceIndex = parseInt(audioDevices[audioDeviceSelect.value], 10)
    eel.restart_audio_recording(deviceIndex); 
}
function changeAudioDevice() {
    eel.update_config(LOG_CONFIG, {'logaudiodevice':audioDeviceSelect.value})();
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
async function initSetAnkiTags() {
    ankitags = await eel.read_config(ANKI_CONFIG, 'cardtags')(); 
    ankiTagsInput.parentElement.MaterialTextfield.change(ankitags);
}
async function setDeck() {
    defaultDeck = await eel.read_config(ANKI_CONFIG, 'deck')(); 
    const deckOptions = deckSelectContainer.querySelectorAll("li");
    const selectedOption = Array.from(deckOptions).find(child=>child.innerHTML === defaultDeck);
    if (selectedOption) {
        deck = defaultDeck;
        selectedOption.setAttribute('data-selected', true);
        getmdlSelect.init('#deck_select_container');
    } 
}
async function setCardModel() {
    defaultCardModel = await eel.read_config(ANKI_CONFIG, 'model')(); 
    const cardModelOptions = cardModelSelectContainer.querySelectorAll("li");
    const selectedOption = Array.from(cardModelOptions).find(child=>child.innerHTML === defaultCardModel);
    if (selectedOption) {
        selectedOption.setAttribute('data-selected', true);
        getmdlSelect.init('#card_model_select_container');
        return defaultCardModel
    } 
    return ''
}
function changeDeck() {
    selectedDeck = deckSelect.value;
    eel.update_config(ANKI_CONFIG, {'deck': selectedDeck})();
}
function changeCardModel() {
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