// Default Settings
const autoModeSpeed = 500;
let autoMode = false;
let logMode = false, logImages = false, logAudio = false;
let selectionMode = 'ocr';
let selectionLineWidth = 1, selectionColor = 'red';
let showStartMessage = true;
let OCRrequests = 0;
let showSelection = true;
let clipboardMode = false;
let outputToClipboard = false;
let OCREngine = "Tesseract Default", verticalText = false;
let translationService;
let translation = {
  sourceText : '',
  translatedText: ''
};
let showTranslation = false;
let videoLoaded = false;
const displayMediaOptions = {
  video: {
    cursor: 'always'
  },
  audio: false
}


let dialogWindow, autoModeTimer, croppedVideoTimer, currentText;
let audioSources, audioDeviceIndex;

let previousText = '';
let currentTextLogId = ''; 

// Temporary screenshot cache before log window is launched
let cachedScreenshots = {}, isCacheScreenshots = true;
let cachedScreenshotNumber = 0;
let logSessionMaxLogSize = 20;

// Preprocessing Filters
let imageProfiles = []
let previousCanvas = '';
let isInvertColor = false, isDilate = false, isBinarize = false;
let binarizeThreshold = 50;
let blurImageRadius = 0;

// Anki
let ankiModelFieldMap = {}, fieldValueMap = {};
let savedAnkiCardModels = [];
let ankiDecks, ankiModels, ankitags, selectedDeck, selectedModel;
let modelFieldsNeedLoad = false;
let isResizeScreenshot = false;
let resizeScreenshotMaxWidth = 1280;
let resizeScreenshotMaxHeight = 720;

// Texthooker
let isRemoveRepeatedSentences = false
let isRemoveDuplicateCharacters = false
let isRemoveWhiteSpaces = false

const videoElement = document.getElementById("video");
// const myImg = document.getElementById("my_img");
const cv1 = document.getElementById("cv1");
const startMessage = document.getElementById("startMessage");
const showSelectionButton = document.getElementById("showSelectionButton");
const showSelectionTooltip = document.getElementById("showSelectionTooltip");
const cropVideoButton = document.getElementById("cropVideoButton");
const cropVideoTooltip = document.getElementById("cropVideoTooltip");
const showTranslationButton = document.getElementById("showTranslationButton");
const showTranslationTooltip = document.getElementById("showTranslationTooltip");
const translatedOutput = document.getElementById("translatedOutput");
const ctx = cv1.getContext("2d");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const croppedVideoCanvas = document.getElementById("croppedVideoCanvas");
const croppedVideoCtx = croppedVideoCanvas.getContext("2d");
const settingsDialog = document.getElementById("settingsDialog");
const dialogCloseButton = document.getElementById("dialogCloseButton");
const captureSelect = document.getElementById("captureSource");

init();

function init() {
  (async() => {
    loadProfiles();
    loadAnki();
    getCaptureDevices();
  })();
}

function selectApplication() {
  startCapture();
}

async function getCaptureDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }

  captureSelect.options.length = 0;
  navigator.mediaDevices.enumerateDevices().then(function(devices) {
    devices.forEach(function(device) {
      if (device.kind == "videoinput") {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `source ${captureSelect.length +1}`;
        captureSelect.appendChild(option)
      }
    })
  });

}

function selectCaptureDevice() {
    startDeviceCapture();
}

async function startCapture(){
  try {
    videoElement.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    if (settingsDialog.open) {
      closeSettings();
    }
  }catch(err) {
    console.error("Error" + err)
  }
}

async function startDeviceCapture(){
  const videoSource = captureSelect.value;
  const userMediaOptions = {
    video: {width: 1920, height: 1080, deviceId: videoSource ? {exact: videoSource} : undefined},
    audio: false
  }
  try {
    videoElement.srcObject = await navigator.mediaDevices.getUserMedia(userMediaOptions);
    getCaptureDevices();
    if (settingsDialog.open) {
      closeSettings();
    }
  }catch(err) {
    console.error("Error" + err)
  }
}

function videoOnLoad(element) {
  videoLoaded = true;
  resizeCanvas(element);
  startMessage.hidden = true;
  showStartMessage = false;
  minimizeButton.disabled = false;
  // updateText(output, 'Drag and encircle the text portion of the game.');
  showSelectionButton.disabled = false;
  settingsButton.disabled = false;
  autoModeButton.disabled = false;
  refreshButton.disabled = false;
  showTranslationButton.disabled = false;
  toggleLogsButton.disabled = false;
}

let canvasx = cv1.offsetLeft;
let canvasy = cv1.offsetTop;

function browserOnResize() {
  var videoIsCollapsed = videoElement.getAttribute('data-collapsed') === 'true';
  if (!videoIsCollapsed) {
    resizeCanvas(videoElement);
    canvasx = cv1.offsetLeft;
    canvasy = cv1.offsetTop;
  }
}

function resizeCanvas(element) {
  cv1.width = element.offsetWidth;
  cv1.height = element.offsetHeight;
}

var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var mousedown = false;
var rect = {};
var imageDataURL;
var imageData;

function collapseSection(element) {
  // get the height of the element's inner content, regardless of its actual size
  var sectionHeight = element.scrollHeight;
  
  // temporarily disable all css transitions
  var elementTransition = element.style.transition;
  element.style.transition = '';
  
  // on the next frame (as soon as the previous style change has taken effect),
  // explicitly set the element's height to its current pixel height, so we 
  // aren't transitioning out of 'auto'
  requestAnimationFrame(function() {
    element.style.height = sectionHeight + 'px';
    element.style.transition = elementTransition;
    
    // on the next frame (as soon as the previous style change has taken effect),
    // have the element transition to height: 0
    requestAnimationFrame(function() {
      element.style.height = 0 + 'px';
    });
  });
  
  // mark the section as "currently collapsed"
  element.setAttribute('data-collapsed', 'true');
}

function expandSection(element) {
  // get the height of the element's inner content, regardless of its actual size
  var sectionHeight = cv1.height;
  
  // have the element transition to the height of its inner content
  element.style.height = sectionHeight + 'px';

  // when the next css transition finishes (which should be the one we just triggered)
  element.addEventListener('transitionend', function(e) {
    // remove this event listener so it only gets triggered once
    element.removeEventListener('transitionend', arguments.callee);
    
    // remove "height" from the element's inline styles, so it can return to its initial value
    element.style.height = null;
  });
  
  // mark the section as "currently not collapsed"
  element.setAttribute('data-collapsed', 'false');
}

function toggleCollapse(element) {
  const isCollapsed = element.getAttribute('data-collapsed') === 'true';
  if(isCollapsed) {
    expandSection(element)
    element.setAttribute('data-collapsed', 'false')
  } else {
    collapseSection(element)
  }
}

function toggleCollapseVideo() {
  [videoElement, cv1, previewCanvas, croppedVideoCanvas].forEach(element=>toggleCollapse(element));
  minimizeButton.hidden = !minimizeButton.hidden;
  maximizeButton.hidden = !maximizeButton.hidden;
  if (showStartMessage) {
    startMessage.hidden = !startMessage.hidden;
  }
}

function toggleShowSelection() {
  showSelection = !showSelection;
  if (showSelection) {
    ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
    ctx.beginPath();
    ctx.rect(rect.x,rect.y, rect.width, rect.height);
    ctx.strokeStyle = selectionColor;
    ctx.lineWidth = selectionLineWidth;
    ctx.stroke();
    showSelectionButton.classList.add("mdl-button--colored");
    showSelectionTooltip.innerText = "Hide Selection";
  } else if (rect.width > 0) {
    ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
    showSelectionButton.classList.remove("mdl-button--colored");
    showSelectionTooltip.innerText = "Show Selection";
  }
}

function toggleTranslation() {
  showTranslation = !showTranslation;
  if (showTranslation) {
    if (output.innerText.length > 0) {
      if (translation.sourceText !== output.innerText) { // only translate if new output text
        translate(output.innerText); 
      } else {
        translatedOutput.classList.remove('hide');
      }
      showTranslationButton.classList.add("mdl-button--colored");
      showTranslationTooltip.innerText = "Hide Translation";
    }
  } else {
    translatedOutput.classList.add('hide');
    showTranslationButton.classList.remove("mdl-button--colored");
    showTranslationTooltip.innerText = "Show Translation";
  }
}

function openLogWindow() {
  (async() => {
  eel.open_new_window('logs.html')();
  })();
}

eel.expose(getOutputText);
function getOutputText() {
  return output.innerText;
}

function translate(text) {
  (async() => {
    let translatedText = await eel.translate(text)();
    translation = {sourceText: text,translatedText};
    updateText(translatedOutput, translatedText);
    translatedOutput.hidden = false;
    return translatedText;
  })()
}

function updateText(element, text) {
  element.classList.add('hide');
  setTimeout(function(){ 
    element.innerText = text;
    element.classList.remove('hide');
    window.scrollTo(0,document.body.scrollHeight);
    results.scrollTop = results.scrollHeight;
  }, 300);
}

/* Update result with possible translation */
eel.expose(updateOutput)
function updateOutput(text, logging=true) {
  // prevent duplicate output
  if (text.trim() === previousText.trim()) {
    return
  } 
  previousText = text;
  updateText(output, text);
  if (logging) {
    eel.log_output(text)((logId) => {
      currentTextLogId = logId;
      if (isCacheScreenshots) {
        const imageData = getVideoImage();
        cacheScreenshot(imageData, logId);
      }
    })
  }
  if (outputToClipboard && !clipboardMode) {
    eel.copy_text_to_clipboard(text)();
  }
  if (showTranslation) {
    translate(text)
  }
}

function changeOutputText(outputElement) {
  const newText = outputElement.innerText;
  if (currentTextLogId) {
    eel.update_log_window_text(currentTextLogId, newText)();
  }
}

/*
 *
 Canvas Region Selection
 *
*/

cv1.addEventListener("mouseup", function (e) {
  mousedown = false;
  const isLeftClick = e.button === 0;
  if (hasSelection() && !clipboardMode && isLeftClick) {
    // Invert selection if selection is from  top left
    if (rect.height < 0) {
      rect.y += rect.height;
      rect.height *= -1;
    }
    // invert selection if selection is from bottom right
    if (rect.width < 0) {
       rect.x += rect.width;
       rect.width *= -1;
    }
    refreshOCR();

    // switch(selectionMode) {
    //   case 'crop':
    //     cropVideo();
    //     break;
    //   case 'ocr':
    //     refreshOCR();
    // }
  }
}, false);

cv1.addEventListener("mousedown", function (e) {
  // find correct position if scrolled down
  // there is no need for scrollXoffset because the video is always resized to 100% the width of the window
  const isLeftClick = e.button === 0;

  if (isLeftClick) {
      const scrollYOffset = window.pageYOffset || document.documentElement.scrollTop;
      last_mousex = parseInt(e.clientX-canvasx);
      last_mousey = parseInt(e.clientY-canvasy+scrollYOffset);
      mousedown = true;
  }
}, false);

cv1.addEventListener("mousemove", function (e) {
  if (clipboardMode) {
    ctx.clearRect(0,0,cv1.width,cv1.height); // clear canvas
    return
  }
  // find correct position if scrolled down
  // there is no need for scrollXoffset because the video is always resized to 100% the width of the window
  const scrollYOffset  = window.pageYOffset || document.documentElement.scrollTop;

  mousex = parseInt(e.clientX-canvasx);
	mousey = parseInt(e.clientY-canvasy+scrollYOffset);
    if(mousedown) {
        ctx.clearRect(0,0,cv1.width,cv1.height); // clear canvas
        ctx.beginPath();
        const width = mousex-last_mousex;
        const height = mousey-last_mousey;
        ctx.rect(last_mousex,last_mousey,width,height);
        rect = {x: last_mousex, y: last_mousey, width, height}
        ctx.strokeStyle = selectionColor;
        ctx.lineWidth = selectionLineWidth;
        ctx.stroke();
    }
}, false);

function hasSelection() {
  return rect && rect.width && rect.width !== 0 && rect.height && rect.height !== 0 ? true : false;
}


/*
 *
 Backend OCR functions
 *
*/

eel.expose(refreshOCR);
function refreshOCR() {
  if (hasSelection()) {
    showStuff(rect);
    if (!showSelection) {
      ctx.clearRect(0,0,cv1.width,cv1.height); // clear canvas
    }
  }
}


/*
 *
 Screenshot cache
 *
*/

eel.expose(getCachedScreenshots)
function getCachedScreenshots() {
  return cachedScreenshots
}

eel.expose(removeCachedScreenshot)
function removeCachedScreenshot(key) {
  delete cachedScreenshots[key]; 
}

function cacheScreenshot(imageData, logId) {
  cachedScreenshotNumber += 1;
  cachedScreenshots[logId] = {'base64ImageString': imageData, 'imageType': logImageType, 'number': cachedScreenshotNumber};
  if (Object.keys(cachedScreenshots).length > logSessionMaxLogSize) {
    let earliestProperty = Object.keys(cachedScreenshots)[0];
    for (const property in cachedScreenshots) {
      if (cachedScreenshots[property] < cachedScreenshots[earliestProperty]) {
        earliestProperty = property;
      }
    }
    delete cachedScreenshots[earliestProperty];
  }
}

function toggleAutoMode() {
  autoMode = !autoMode;
  if (autoMode) {
    refreshButton.disabled = true;
    autoModeTimer = setInterval(()=>{
      // Updating the OCR scrolls the page down to show it, which becomes
      // very obnoxious when you're trying to position a box over the right text.
      // To fix this, we just don't update when we're dragging a selection.
      if (rect.width > 0 && OCRrequests === 0 && !mousedown) {
        showStuff(rect);
      }
    }, autoModeSpeed);
    autoModeButton.classList.add("mdl-button--colored");
  } else {
    refreshButton.disabled = false;
    clearInterval(autoModeTimer);
    autoModeButton.classList.remove("mdl-button--colored");
  }
}

function openSettings() {
  settingsDialog.hidden = false;
  if (!settingsDialog.showModal) {
    dialogPolyfill.registerDialog(settingsDialog);
  }
  setTimeout(()=>settingsDialog.showModal(), 300);
}

function closeSettings() {
  settingsDialog.close();
  setTimeout(()=>settingsDialog.hidden = true, 300);
}

function openAnkiSettingsDialog() {
  ankiSettingsDialog.hidden = false;
  if (!ankiSettingsDialog.showModal) {
    dialogPolyfill.registerDialog(ankiSettingsDialog);
  }
  setTimeout(()=>ankiSettingsDialog.showModal(), 300);
}

function closeAnkiSettingsDialog() {
  ankiSettingsDialog.close();
  setTimeout(()=>ankiSettingsDialog.hidden = true, 300);
}

function openClipboardSettings() {
  clipboardDialog.hidden = false;
  if (!clipboardDialog.showModal) {
    dialogPolyfill.registerDialog(clipboardDialog);
  }
  setTimeout(()=>clipboardDialog.showModal(), 300);
}

function closeClipboardSettingsDialog() {
  clipboardDialog.close();
  setTimeout(()=>clipboardDialog.hidden = true, 300);
}

function openTexthookerSettings() {
  texthookerSettingsDialog.hidden = false;
  if (!texthookerSettingsDialog.showModal) {
    dialogPolyfill.registerDialog(texthookerSettingsDialog);
  }
  setTimeout(()=>texthookerSettingsDialog.showModal(), 300);
}

function closeTexthookerSettingsDialog() {
  texthookerSettingsDialog.close();
  setTimeout(()=>texthookerSettingsDialog.hidden = true, 300);
}

document.addEventListener("keydown", function(event) {
  const key = event.key; // Or const {key} = event; in ES6+
  if (key === "Escape") {
    if (!settingsDialog.hidden) {
      setTimeout(()=>settingsDialog.hidden = true, 300);
    }
    if (!texthookerSettingsDialog.hidden) {
      setTimeout(()=>texthookerSettingsDialog.hidden = true, 300);
    }
    if (!ankiSettingsDialog.hidden) {
      setTimeout(()=>ankiSettingsDialog.hidden = true, 300);
    }
  }
});

function createCanvasWithSelection({width, height, x, y}) {
  aspectRatioY = videoElement.videoHeight / cv1.height;
  aspectRatioX = videoElement.videoWidth / cv1.width;
  const offsetY = 1.0 * aspectRatioY;
  var selectionCv = document.createElement('canvas');
  selectionCv.width = width*aspectRatioX;
  selectionCv.height = height*aspectRatioY;
  var selectionCtx = selectionCv.getContext('2d');
  selectionCtx.drawImage(videoElement, x*aspectRatioX, (y+offsetY)*aspectRatioY, width*aspectRatioX, (height-offsetY)*aspectRatioY, 0, 0, selectionCv.width, selectionCv.height);
  return selectionCv
}

function showStuff(rect) {
  var cv2 = createCanvasWithSelection(rect);
  var ctx2 = cv2.getContext('2d');
    // check if previous image is same as current image
    const newImageData = ctx2.getImageData(0, 0, cv2.width, cv2.height)
    let sameImage = false;
    if (imageData !== undefined) {
      if (imageData.width === newImageData.width && imageData.height === newImageData.height) {
        if (typeof pixelmatch === 'function') { 
          numDiffPixels = pixelmatch(imageData.data, newImageData.data, null, imageData.width, imageData.height, {threshold: 0.1});
          if (numDiffPixels < 10) {
            sameImage = true;
            }
          }
        }
      }
      if (!sameImage || !autoMode) {
        imageData = newImageData;
        ctx2.putImageData(preprocessImage(cv2), 0, 0);
        imageDataURL = cv2.toDataURL('image/png');
        imageb64 = imageDataURL.slice(imageDataURL.indexOf(',') + 1)
        recognize_image(imageb64, null);
        // Destroy canvas
        ctx2.clearRect(0,0,cv2.width,cv2.height);
      }
}

eel.expose(getVideoImage)
function getVideoImage() {
  var cv3 = document.createElement('canvas');
  cv3.width = videoElement.videoWidth;
  cv3.height = videoElement.videoHeight;
  var ctx3 = cv3.getContext('2d');
  if (isResizeScreenshot) {
    cv3 = resizeCanvasImage(cv3, videoElement, resizeScreenshotMaxWidth, resizeScreenshotMaxHeight)
  } else {
    ctx3.drawImage(videoElement, 0, 0, cv3.width, cv3.height);
  }
  let fullImageDataURL = cv3.toDataURL(`image/${logImageType === 'jpg' ? 'jpeg' : logImageType}`, logImageQuality);
  const fullImageb64 = fullImageDataURL.slice(fullImageDataURL.indexOf(',') + 1)
  return fullImageb64
}

function recognize_image(image) {
  OCRrequests += 1; // counter for auto-mode
  (async() => {
    const textOrientation = verticalText && (OCREngine.includes('Tesseract')) ? 'vertical' : 'horizontal';
    const imageData = isCacheScreenshots ? getVideoImage() : '';
    let response = await eel.recognize_image(OCREngine, image, textOrientation)();
    if (response.result) {
      OCRrequests -= 1; // counter for auto-mode
      currentTextLogId = response.id;

      updateText(output, response.result);

      // Temporary fix: Cache screenshots before log window is opened. To remove in the future
      if (isCacheScreenshots) {
        cacheScreenshot(imageData, currentTextLogId);
      }
  
      if (outputToClipboard) {
        eel.copy_text_to_clipboard(response.result)();
      }
      if (showTranslation) {
        translate(response.result);
      }
    }
  })()
}


/*
 *
 Canvas Context Menu
 *
*/

const canvasContextMenuElement =  document.getElementById('canvasContextMenu');
canvasContextMenuElement.style.display = 'block';

const canvasContextMenu = tippy(cv1, {
  content: canvasContextMenuElement,
  // onShow(instance) {
  //   componentHandler.upgradeAllRegistered();
  // },
  allowHTML: true,
  draggable: true,
  placement: 'right-start',
  trigger: 'manual',
  interactive: true,
  arrow: false,
  offset: [0, 0],
});

cv1.addEventListener('contextmenu', (event) => {
  event.preventDefault();

  canvasContextMenu.setProps({
    getReferenceClientRect: () => ({
      width: 0,
      height: 0,
      top: event.clientY,
      bottom: event.clientY,
      left: event.clientX,
      right: event.clientX,
    }),
  });
  formatCanvasContextMenu();
  canvasContextMenu.show();
});

function formatCanvasContextMenu(){
  if (imageProfiles) {
    const profileSelect = canvasContextMenuElement.getElementsByClassName('profileSelect')[0];
    profileSelect.innerHTML = '<option>None</option>';
    imageProfiles
    .forEach(profile=>{
      const profileOption = document.createElement('option');
      profileOption.innerHTML = profile.name;
      profileSelect.append(profileOption);
    })
  }
  if (hasSelection()) {
    const selectionImage = canvasContextMenuElement.getElementsByClassName('canvasContextSelectionImage')[0];
    const selectionCanvas = createCanvasWithSelection(rect);
    const imageDataURL = selectionCanvas.toDataURL('image/png')
    selectionImage.setAttribute('src', imageDataURL);
    updatePreprocessedImage();
  } 
}

function changeBinarizeThreshold(binarizeSlider) {
  binarizeThreshold = parseInt(binarizeSlider.value, 10);
  updatePreprocessedImage();
}

function binarize(binarizeCheckbox) {
  isBinarize = binarizeCheckbox.checked;
  binarizeSlider.disabled = !binarizeCheckbox.checked;
  updatePreprocessedImage();
}

function invertColor(invertColorCheckbox) {
  isInvertColor = invertColorCheckbox.checked;
  updatePreprocessedImage();
}

function blurImage(blurSlider) {
  blurImageRadius = parseInt(blurSlider.value, 10);
  updatePreprocessedImage();
}

function dilateImage(dilateCheckbox) {
  isDilate = dilateCheckbox.checked;
  updatePreprocessedImage();
}

function updatePreprocessedImage() {
  if (!hasSelection() && previousCanvas === '') {
    return
  }
  const selectionImage = canvasContextMenuElement.getElementsByClassName('canvasContextSelectionImage')[0];
  const selectionCanvas = hasSelection() ? createCanvasWithSelection(rect) : recoverBackUpCanvas();
  const selectionCtx = selectionCanvas.getContext('2d');
  if (hasSelection()) {
    backUpCanvas(selectionCanvas);
  }
  const imageData = preprocessImage(selectionCanvas);
  selectionCtx.putImageData(imageData, 0, 0);
  const imageDataURL = selectionCanvas.toDataURL('image/png')
  selectionImage.setAttribute('src', imageDataURL);
}
function backUpCanvas(canvas) {
  previousCanvas = document.createElement('canvas');
  previousCanvas.width = canvas.width;
  previousCanvas.height = canvas.height;
  previousCanvas.getContext('2d').drawImage(canvas, 0, 0);
}
function recoverBackUpCanvas(canvas) {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = previousCanvas.width;
  newCanvas.height = previousCanvas.height;
  newCanvas.getContext('2d').drawImage(previousCanvas, 0, 0);
  return newCanvas
}
async function loadProfiles() {
  imageProfiles = await eel.load_image_filter_profiles()();
}

function selectProfile(profileSelect) {
  const profile = imageProfiles.find(profile=>profile.name === profileSelect.value);
  if (profile) {
    applyProfile(profile);
  } else if (profileSelect.value === 'None') {
    resetImageFilters();
  }
}

function applyProfile(profile) {
  blurImageRadius = profile.blurImageRadius ? profile.blurImageRadius : 0;
  binarizeThreshold = profile.binarizeThreshold ? profile.binarizeThreshold : 50;
  isBinarize = profile.binarizeThreshold ? true : false;
  isDilate = profile.dilate ? true : false;
  isInvertColor = profile.invertColor ? true : false;
  refreshProfileElements();
  updatePreprocessedImage();
}

function resetImageFilters() {
  // When binarizethreshold is not filled in it is assumed no binarization and its default is 50
  applyProfile({
    blurImageRadius: '0',
    isDilate: false,
    isInvertColor: false
  });
}

function refreshProfileElements() {
  const binarizeCheckbox = document.getElementById('binarizeCheckbox');
  binarizeCheckbox.checked = isBinarize;
  const binarizeSlider = document.getElementById('binarizeSlider');
  binarizeSlider.value = binarizeThreshold;
  binarizeSlider.disabled = !isBinarize;
  const blurSlider = document.getElementById('blurSlider');
  blurSlider.value = blurImageRadius;
  const dilateCheckbox = document.getElementById('dilateCheckbox');
  dilateCheckbox.checked = isDilate;
  const invertColorCheckbox = document.getElementById('invertColorCheckbox');
  invertColorCheckbox.checked = isInvertColor;
}

async function exportProfile() {
  const imageProfile = {
    invertColor: isInvertColor,
    dilate: isDilate,
    blurImageRadius: blurImageRadius
  }
  if (isBinarize) {
    imageProfile['binarizeThreshold'] = binarizeThreshold;
  }
  const profile = await eel.export_image_filter_profile(imageProfile)();
  // Fetch profiles again after export
  if (profile) {
    loadProfiles();
  }
}

async function loadImageFilterFromFile() {
  const profile = await eel.open_image_filter_profile()();
  if (profile) {
    applyProfile(profile);
    const profileSelect = document.getElementById('profileSelect');
    profileSelect.value = profile.name;
  }
}

/*
 *
 Preprocessing
 *
*/

function preprocessImage(canvas) {
  const processedImageData = canvas.getContext('2d').getImageData(0,0,canvas.width, canvas.height);
  if (blurImageRadius > 0) {
    blurARGB(processedImageData.data, canvas, radius=blurImageRadius/100);
  }
  if (isDilate) {
    dilate(processedImageData.data, canvas);
  }
  if (isInvertColor) {
    invertColors(processedImageData.data);
  }
  if (isBinarize) {
    thresholdFilter(processedImageData.data, binarizeThreshold/100);
  }
  return processedImageData;
}

/*
 *
 Anki Integration
 *
*/

async function loadAnki() {
  ankiDecks = await initDecks();
  ankiModels = await initCardModels();
  if (ankiDecks) {
    setDeck();
  }
  if (ankiModels) {
    cardModel = await setCardModel();
    savedAnkiCardModels = await eel.get_anki_card_models()();
    if (savedAnkiCardModels) {
      const existingModelIndex = savedAnkiCardModels.findIndex(obj=>obj['model'] === cardModel)
      if (existingModelIndex !== -1) {
        // update table to saved settings
        fieldValueMap =  {...savedAnkiCardModels[existingModelIndex]}; // get obj value
        delete fieldValueMap['model']; // remove model name from object
        applyFieldAndValuesToTable(fieldValueMap);
      } else if (cardModel) {
        modelFieldsNeedLoad = true;
      }
    } 
    // python backend will send the result to setAnkiFields()
    eel.fetch_anki_fields_by_modals(ankiModels)();
    return true
  }
  return true
}

eel.expose(setAnkiFields);
function setAnkiFields(modelName, fieldNames) {
  ankiModelFieldMap[modelName] = fieldNames;
  if (modelFieldsNeedLoad && modelName === cardModel) {
    updateFieldValuesTable(ankiModelFieldMap[cardModel]);
    modelFieldsNeedLoad = false;
  }
}

async function reloadAnki() {
  const fieldValuesTable = document.getElementById('field_values_table');
  fieldValuesTable.hidden = true;
  const result = await loadAnki();
  fieldValuesTable.hidden = false;
}

eel.expose(getFieldValueMap)
function getFieldValueMap() {
  return fieldValueMap;
}

/**
 * Send selected word to log when user highlights words in result
 * 
 */
 document.addEventListener('mouseup', event => {  
  sendTextIfSelected();
})

setInterval(()=>sendTextIfSelected(), 1000)

function sendTextIfSelected() {
  if (window.getSelection) {
    if (window.getSelection().toString() === '') {
      return
    }
      if (window.getSelection().anchorNode.parentNode.id === 'output') {
        // Selected Text in Output
        const selectedText = window.getSelection().toString();
        eel.highlight_text_in_logs(selectedText)();
      } 
  }
}

/*
 *
 Not yet implemented
 *
*/

function toggleCropVideo() {
  const isCropEnabled = cropVideoButton.classList.contains("mdl-button--colored");
  if (selectionMode ==='ocr' && isCropEnabled) {
    // Stop playing cropped selection
    cropVideoButton.classList.remove("mdl-button--colored");
    cropVideoTooltip.innerText = "Crop Video";
    clearInterval(croppedVideoTimer);
    croppedVideoCtx.clearRect(0,0,croppedVideoCanvas.width,croppedVideoCanvas.height);
    croppedVideoCanvas.hidden = true;
    videoElement.hidden = false;
    ctx.clearRect(0,0,cv1.width,cv1.height);
  } else if (selectionMode === 'ocr' && !isCropEnabled) {
    // Start crop selection
    selectionMode = 'crop';
    selectionColor = 'blue';
    cropVideoButton.classList.add("mdl-button--colored");
    cropVideoTooltip.innerText = "Cancel Crop";
  } else if (selectionMode === 'crop' && isCropEnabled) {
    // Cancel before crop selection
    selectionMode = 'ocr';
    selectionColor = 'red';
    cropVideoButton.classList.remove("mdl-button--colored");
    cropVideoTooltip.innerText = "Cancel Crop";
  }
}

function cropVideo() {
  if (rect.width > 0) {
    videoElement.hidden = true;
    ctx.clearRect(0,0,cv1.width,cv1.height);
    selectionMode = 'ocr';
    selectionColor = 'red';
    const croppedRect = {...rect};
    aspectRatioY = videoElement.videoHeight / cv1.height;
    aspectRatioX = videoElement.videoWidth / cv1.width;
    croppedVideoTimer = setInterval(()=>{
      const {width, height, x, y} = croppedRect;
      const offsetY = 1.0 * aspectRatioY;
      croppedVideoCanvas.width = width*aspectRatioX;
      croppedVideoCanvas.height = height*aspectRatioY;
      previewCanvas.width = croppedVideoCanvas.width;
      previewCanvas.height = croppedVideoCanvas.height;
      cv1.width = croppedVideoCanvas.width;
      cv1.height = croppedVideoCanvas.height;
      croppedVideoCtx.drawImage(videoElement, x*aspectRatioX, (y+offsetY)*aspectRatioY, width*aspectRatioX, (height-offsetY)*aspectRatioY, 0, 0, croppedVideoCanvas.width, croppedVideoCanvas.height);
      croppedVideoCanvas.hidden = false;
    }, 20);
  }
}
