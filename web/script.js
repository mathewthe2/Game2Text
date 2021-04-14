// Default Settings
const autoModeSpeed = 500;
let autoMode = false;
let logMode = false;
let logImages = false;
let selectionMode = 'ocr';
let selectionLineWidth = 1;
let selectionColor = 'red';
let OCRrequests = 0;
let showSelection = true;
let preprocess = false;
let clipboardMode = false;
let outputToClipboard = false;
let verticalText = false;
let OCREngine = "Tesseract";
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
let dialogWindow;
let autoModeTimer;
let croppedVideoTimer;
let currentText;
let audioSources;
let audioDeviceIndex;

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

function selectApplication() {
  startCapture();
}

async function startCapture(){
  try {
    videoElement.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    if (settingsDialog.open) {
      settingsDialog.close();
    }
  }catch(err) {
    console.error("Error" + err)
  }
}

function videoOnLoad(element) {
  videoLoaded = true;
  resizeCanvas(element);
  startMessage.hidden = true;
  minimizeButton.disabled = false;
  updateText(output, 'Drag and encircle the text portion of the game.');
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
  toggleCollapse(videoElement);
  toggleCollapse(cv1);
  toggleCollapse(previewCanvas);
  toggleCollapse(croppedVideoCanvas);
  minimizeButton.hidden = !minimizeButton.hidden;
  maximizeButton.hidden = !maximizeButton.hidden;
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
function updateOutput(text) {
  updateText(output, text);
  if (showTranslation) {
    translate(text)
  }
}

/*
 *
 Canvas Region Selection
 *
*/

cv1.addEventListener("mouseup", function (e) {
  mousedown = false;
  if (rect.width > 0 && !clipboardMode) {
    switch(selectionMode) {
      case 'crop':
        cropVideo();
        break;
      case 'ocr':
        refreshOCR();
    }
  }
}, false);

cv1.addEventListener("mousedown", function (e) {
  // find correct position if scrolled down
  // there is no need for scrollXoffset because the video is always resized to 100% the width of the window
  const scrollYOffset  = window.pageYOffset || document.documentElement.scrollTop;

  last_mousex = parseInt(e.clientX-canvasx);
	last_mousey = parseInt(e.clientY-canvasy+scrollYOffset);
  mousedown = true;
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

eel.expose(refreshOCR);
function refreshOCR() {
  if (rect.width > 0) {
    showStuff(rect);
    if (!showSelection) {
      ctx.clearRect(0,0,cv1.width,cv1.height); // clear canvas
    }
  }
}

function toggleAutoMode() {
  autoMode = !autoMode;
  if (autoMode) {
    refreshButton.disabled = true;
    autoModeTimer = setInterval(()=>{
      if (rect.width > 0 && OCRrequests === 0) {
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
  settingsDialog.showModal();
}

function closeSettings() {
  settingsDialog.close();
}

function showStuff({width, height, x, y}) {
  aspectRatioY = videoElement.videoHeight / cv1.height;
  aspectRatioX = videoElement.videoWidth / cv1.width;

  const offsetY = 1.0 * aspectRatioY;

  var cv2 = document.createElement('canvas');
  cv2.width = width*aspectRatioX;
  cv2.height = height*aspectRatioY;
  var ctx2 = cv2.getContext('2d');
  ctx2.drawImage(videoElement, x*aspectRatioX, (y+offsetY)*aspectRatioY, width*aspectRatioX, (height-offsetY)*aspectRatioY, 0, 0, cv2.width, cv2.height);
    
    // check if is same as current image
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
        if (preprocess && OCREngine === 'Tesseract') {
          ctx2.putImageData(preprocessImage(cv2), 0, 0);
        }
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
  ctx3.drawImage(videoElement, 0, 0, cv3.width, cv3.height);
  fullImageDataURL = cv3.toDataURL(`image/${logImageType === 'jpg' ? 'jpeg' : logImageType}`, logImageQuality);
  fullImageb64 = fullImageDataURL.slice(fullImageDataURL.indexOf(',') + 1)
  return fullImageb64
}

function recognize_image(image) {
  OCRrequests += 1;
  (async() => {
    const textOrientation = verticalText && (OCREngine === 'Tesseract') ? 'vertical' : 'horizontal';
    let text = await eel.recognize_image(OCREngine, image, textOrientation)();
    OCRrequests -= 1;
    if (logMode) {
      const logs = await eel.show_logs()();
      updateText(output, logs);
    } else {
      updateText(output, text);
    }
    if (outputToClipboard) {
      eel.copy_text_to_clipboard(text)();
    }
    if (showTranslation) {
      translate(text)
    }
  })()
}

function preprocessImage(canvas) {
  const processedImageData = canvas.getContext('2d').getImageData(0,0,canvas.width, canvas.height);
  blurARGB(processedImageData.data, canvas, radius=0.5);
  dilate(processedImageData.data, canvas);
  invertColors(processedImageData.data);
  thresholdFilter(processedImageData.data, level=0.4);
  return processedImageData;
}

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

openSettings();