showLogs();
let currentLogs = [];
window.tippyInstances = [];
let isRecording = false;
let isPlayingAudio = false;
const loadingScreenDelay = setTimeout("showLoadingScreen()", 400);
let selectedText = '';

function showLogs() {
  (async() => {
      const newlogs = await eel.show_logs()();
      if (newlogs) {
          addLogs(newlogs);
      }
      hideLoadingScreen();
  })()
}

function showLoadingScreen() {
  const loadingLogsScreen = document.getElementById('loadingLogsScreen');
  loadingLogsScreen.hidden = false;
}

function hideLoadingScreen() {
  clearTimeout(loadingScreenDelay);
  const loadingLogsScreen = document.getElementById('loadingLogsScreen');
  loadingLogsScreen.hidden = true;
}

eel.expose(getLogsShown);
function getLogsShown() {
  return currentLogs;
}
  
eel.expose(addLogs);
function addLogs(newLogs) {
  const logsContainer = document.getElementById('logsContainer');
  newLogs.forEach(newLog=>{
    const logItem = logToHtml(newLog);
    logsContainer.append(logItem);
    currentLogs.push(newLog);
   })
   // Add Tooltips
  tippy(document.querySelectorAll('.recordAudioButton'), {
    content: 'Record Audio',
    delay: [300, null]
  });
  tippy(document.querySelectorAll('.playAudioButton'), {
    content: 'Play Audio',
    delay: [300, null]
  });
  createLogMenu();
  createAnkiFormCard();
  window.scrollTo(0,document.body.scrollHeight);
}

function createLogMenu() {
  tippy(document.querySelectorAll('.logMenuButton'), {
    delay: [100, null],
    theme: 'material-light',
    placement: 'bottom',
    arrow: false,
    animation: 'shift-away',
    trigger:'click',
    interactive: true,
    content(reference) {
      const template = document.getElementById('logMenu');
      const logMenuContent = template.cloneNode(true);
      const logId = reference.getAttribute('log_id');
      return logId ? formatLogMenu(logId, logMenuContent).innerHTML : ''
    },
    allowHTML: true,
  });
}

function createAnkiFormCard() {
  tippy(document.querySelectorAll('.showAnkiFormButton'), {
    delay: [100, null],
    theme: 'material-light',
    arrow: false,
    trigger:'mouseenter',
    interactive: true,
    onShow(instance) {
      // Remove all other add to anki tippy instances
      tippyInstances.forEach(inst => {
        inst.hide();
      });
      tippyInstances.length = 0; // clear it
      window.tippyInstances = tippyInstances.concat(instance);
      instance.setProps({trigger: 'click'});
    },
    onHide(instance) {
      instance.setProps({trigger: 'mouseenter'});
    },
    content(reference) {
      const logId = reference.getAttribute('log_id');
      const template = document.getElementById('addCardForm');
      const cardContent = template.cloneNode(true);
      return logId ? formatCard(logId, cardContent).innerHTML : ''
    },
    allowHTML: true,
  });
}

function formatCard(logId, cardElement) {
  const log = getLogById(logId);
  if (log.image) {
    const cardImage = cardElement.getElementsByClassName('addCardScreenshot')[0];
    cardImage.setAttribute('src', `data:image/${log.image_type};base64,${log.image}`);
    cardImage.setAttribute('alt', `add-card-screenshot-${log.id}`);
    cardImage.style.width = '100%';
  }
  const cardBodyList = cardElement.getElementsByClassName('addCardBodyList')[0];
  cardBodyList.setAttribute("log_id", logId);

  const addCardToAnkiButton = cardElement.getElementsByClassName('addCardToAnkiButton')[0];
  addCardToAnkiButton.id = `add_card_to_anki_button_${logId}`
  addCardToAnkiButton.setAttribute("log_id", logId);

  if (selectedText) {
    let selectedTextPreview = selectedText;
    if (log.dictionary) {
      if (log.dictionary[0].reading) {
        selectedTextPreview += ` (${log.dictionary[0].reading})`;
      }
    }
    const cardSelectedText = createCardSectionElement(
      iconName = 'title', 
      field = 'card_selected_text',
      value = selectedTextPreview
    );
    cardBodyList.append(cardSelectedText);
  }
  if (log.dictionary) {
    const cardGlossary = createCardSectionElement(
      iconName = 'book', 
      field = 'card_glossary',
      value = log.dictionary[0].glossary_list.join(', ')
    );
    cardBodyList.append(cardGlossary);
  }
  if (log.text) {
    const cardSentence = createCardSectionElement(
      iconName='short_text', 
      field ='card_sentence', 
      value = log.text, 
      contentEditable = true,
      footerIcon = log.audio ? 'mic' : ''
    );
    cardBodyList.append(cardSentence);
  }
  return cardElement
}

function createCardSectionElement(iconName, field, value, contentEditable=false, footerIcon='') {
  const cardSection = document.createElement('li');
  cardSection.classList.add('mdl-list__item');
  const content = `
    <span class="card_${field}_container mdl-list__item-primary-content">
        <i class="material-icons mdl-list__item-icon">${iconName}</i>
        <span contentEditable=${contentEditable} class="card_${field}">${value}</span>
        ${footerIcon && `<i class="material-icons" style="padding-left:12px">${footerIcon}</i>`}
    </span>`;
  cardSection.innerHTML = content;
  return cardSection
}

function formatLogMenu(logId, logMenuContent) {
  const log = getLogById(logId);

  // Set logId as button attribute
  const deleteRecordingButton = logMenuContent.getElementsByClassName('deleteRecordingButton')[0];
  deleteRecordingButton.setAttribute('log_id', logId);
  if (!log.audio) {
    // Disable deleteRecordingButton if there is no audio
    deleteRecordingButton.classList.add('disabled_list__item');
  }

  // Set logId as button attribute
  const copyScreenshotButton = logMenuContent.getElementsByClassName('copyScreenshotButton')[0];
  copyScreenshotButton.setAttribute('log_id', logId);
  if (!log.image) {
    // Disable copyScreenshotButton if there is no screenshot
    copyScreenshotButton.classList.add('disabled_list__item');
  }

  return logMenuContent
}

function logToHtml(log) {
  const logItem = document.getElementById('logItemTemplate');
  const logItemClone = logItem.cloneNode(true);
  logItemClone.id = `logItem-${log.id}`;
  const logText = logItemClone.getElementsByClassName('logText')[0];

  // Init play audio button
  const playAudioButton = logItemClone.getElementsByClassName('playAudioButton')[0];
  playAudioButton.id = `play_audio_button_${log.id}`;
  playAudioButton.onclick = () => playRecording(log, playAudioButton.firstElementChild);

  
  // Init record audio button
  const recordAudioButton = logItemClone.getElementsByClassName('recordAudioButton')[0];
  recordAudioButton.id = `record_audio_button_${log.id}`;
  recordAudioButton.onclick = () => startManualRecording(log, recordAudioButton.firstElementChild);

  if (log.audio) {
    playAudioButton.hidden = false;
    recordAudioButton.hidden = true;
  } else {
    playAudioButton.hidden = true;
    recordAudioButton.hidden = false;
  }

  //Save log id to LogMenu's Attribute
  const logMenuButton = logItemClone.getElementsByClassName('logMenuButton')[0];
  logMenuButton.id = `log_menu_button_${log.id}`
  logMenuButton.setAttribute("log_id", log.id);

  // Save log id to AnkiFormButton's Attribute
  const showAnkiFormButton = logItemClone.getElementsByClassName('showAnkiFormButton')[0];
  showAnkiFormButton.id = `show_anki_form_button_${log.id}`
  showAnkiFormButton.setAttribute("log_id", log.id);
  
  logText.innerText = log.text;
  logItemClone.hidden = false;
  return logItemClone
}

async function playRecording(log, playAudioIcon) {
  // TODO: allow pause and play from another file. Currently only support playing one at a time
  if (!isPlayingAudio) {
    isPlayingAudio = true;
    playAudioIcon.innerHTML = 'pause_circle_filled';
    audioDurationSeconds = await eel.play_log_audio(log.audio, log.folder)();
    setTimeout(()=>finishPlayingAudio(log.id), audioDurationSeconds)
  }
}

function finishPlayingAudio(logId) {
  const playAudioButton = document.getElementById(`play_audio_button_${logId}`);
  playAudioButton.firstElementChild.innerHTML = 'play_circle_filled';
  isPlayingAudio = false;
}


async function startManualRecording(log, recordAudioIcon) {
  // Manual Recording: first click to record, second click to stop recording
  if (!isRecording) {
    recordAudioIcon.style.color = '#E21549';
    eel.start_manual_recording(log.id, log.folder)();
    isRecording = true;
  } else {
    recordAudioIcon.style.color = '#3F51B5';
    stopManualRecording(); 
    isRecording = false;
  }
}

async function stopManualRecording() {
  const audioFileName = await eel.stop_manual_recording()();
  if (audioFileName) {
    const logId = fileBaseName(audioFileName)
    const log = getLogById(logId);
    const recordAudioButton = document.getElementById(`record_audio_button_${logId}`);
    recordAudioButton.hidden = true;
    const playAudioButton = document.getElementById(`play_audio_button_${logId}`);
    playAudioButton.hidden = false;
    updateLogAudioById(logId, audioFileName);
    refreshLogMenuContent(logId);
    refreshCardContent(logId);
  }
}

function copyScreenshot(logId) {
  const log = getLogById(logId);
  if (log.image) {
    const img = document.createElement('img');
    img.src = `data:image/${log.image_type};base64,${log.image}`
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext("2d");     
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})]));
  }
  // Hide menu
  const logElement = getLogElementById(logId);
  const logMenuButton = logElement.getElementsByClassName('logMenuButton')[0];
  const menu = logMenuButton._tippy;
  menu.hide()
}

async function deleteRecording(logId) {
  const log = getLogById(logId);
  const logElement = getLogElementById(logId);
  if (logElement) {
    const logMenuButton = logElement.getElementsByClassName('logMenuButton')[0]
    logMenuButton._tippy.hide();
    // Delete Recording
    const didDeleteRecording = await eel.delete_audio_file(logId, log.folder)()
    if (didDeleteRecording) {
      const deleteRecordingButton = logElement.getElementsByClassName('deleteRecordingButton')[0]
      if (deleteRecordingButton) {
        deleteRecordingButton.classList.add('disabled_list__item');
      }
      updateLogAudioById(logId, '');
      refreshLogMenuContent(logId);
      refreshCardContent(logId);
      // Hide playing button and show record button
      const playAudioButton = logElement.getElementsByClassName('playAudioButton')[0];
      playAudioButton.hidden = true;
      const recordAudioButton = logElement.getElementsByClassName('recordAudioButton')[0];
      recordAudioButton.hidden = false;
    }
  }
 
}

document.addEventListener('mouseup', event => {  
  if (window.getSelection) {
    if (window.getSelection().toString() === '') {
      return
    }
      if (window.getSelection().anchorNode.parentNode.className === 'logText') {
        // Selected Text in Log
        selectedText = window.getSelection().toString();
        const logId = window.getSelection().anchorNode.parentNode.parentNode.parentNode.id.split('logItem-')[1]
        currentLogs.find(log=>log.id === logId)['selectedText'] = selectedText;
        refreshCardContent(logId);
        updateCardWithDictionaryEntry(logId, selectedText);
      } else if (window.getSelection().anchorNode.parentElement.className === 'card_card_sentence'){
        // Selected Text in addtoanki card
        selectedText = window.getSelection().toString();
        const logId = window.getSelection().anchorNode.parentNode.parentNode.parentNode.parentNode.getAttribute('log_id');
        if (logId) {
          currentLogs.find(log=>log.id === logId)['selectedText'] = selectedText;
          refreshCardContent(logId);
          updateCardWithDictionaryEntry(logId, selectedText);
        }
      }
  }
});

async function updateCardWithDictionaryEntry(logId, word) {
  const dictionaryEntry = await eel.look_up_dictionary(word)();
  if (dictionaryEntry) {
    currentLogs.find(log=>log.id === logId)['dictionary'] = dictionaryEntry;
  } else {
    currentLogs.find(log=>log.id === logId)['dictionary'] = null;
  }
  refreshCardContent(logId);
}
function updateLogById(logId) {
   // TODO: update logs
}

function fileBaseName(fileName) {
  return fileName.replace(/\.[^.]*$/,'')
}

function getLogById(logId) {
  return currentLogs.find(log => log.id === logId);
}

function getLogElementById(logId) {
  return document.getElementById(`logItem-${logId}`)
}

function updateLogAudioById(logId, audioFileName) {
  const logs = currentLogs;
  logs.forEach(log=>{
    if (log.id === logId) {
      log.audio = audioFileName
    }
  })
  currentLogs = logs;
}

function refreshLogMenuContent(logId) {
    // Get Instance
    const logElement = getLogElementById(logId);
    const logMenuButton = logElement.getElementsByClassName('logMenuButton')[0];
    const instance = logMenuButton._tippy;
    if (instance) {
      // Get logMenu HTML
      const template = document.getElementById('logMenu');
      const logMenuContent = template.cloneNode(true);
      // Refresh Content
      instance.setContent(formatLogMenu(logId, logMenuContent).innerHTML);
    }
}

function refreshCardContent(logId) {
    // Get Instance
    const showAnkiFormButton = document.getElementById(`show_anki_form_button_${logId}`)
    const instance = showAnkiFormButton._tippy;
    if (instance) {
      // Get Card HTML
      const template = document.getElementById('addCardForm');
      let cardContent = template.cloneNode(true);
      // Refresh Content
      instance.setContent(formatCard(logId, cardContent).innerHTML);
    }
}

async function addCardToAnki(logId) {
  const log = getLogById(logId);
  const noteData = {
    folder: log.folder,
    filename: log.id,
    sentence: log.text
  }
  if (log.selectedText) {
    noteData['selectedtext'] = log.selectedText;
  }
  if (log.dictionary) {
    noteData['glossary'] = log.dictionary[0].glossary_list.join(', ');
    if (log.dictionary[0].reading) {
      noteData['reading'] = log.dictionary[0].reading;
    }
  } 
  if (log.audio) {
    noteData['audio'] = log.audio;
  }
  if (log.image) {
    noteData['screenshot'] = log.image;
    noteData['imagetype'] = log.image_type;
  }
  const result = await eel.create_note(noteData)();
  if (result) {
    if (typeof result === 'string' && result.includes('Error')){
      const notification = document.querySelector('.mdl-js-snackbar');
      notification.MaterialSnackbar.showSnackbar(
        {
          message: result
        }
      );
    } else {
      const notification = document.querySelector('.mdl-js-snackbar');
      notification.MaterialSnackbar.showSnackbar(
        {
          message: 'Added to Anki'
        }
      );
    }
  }
}

