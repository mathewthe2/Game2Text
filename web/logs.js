showLogs();
let currentLogs = [];
window.tippyInstances = [];
let isRecording = false;
const loadingScreenDelay = setTimeout("showLoadingScreen()", 500);

function showLogs() {
  (async() => {
      const newlogs = await eel.show_logs()();
      if (newlogs) {
          hideLoadingScreen();
          addLogs(newlogs);
      }
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
  tippy(document.querySelectorAll('.playAudioIcon'), {
    content: 'Audio',
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
    cardImage.setAttribute('src', log.image);
    cardImage.setAttribute('alt', `add-card-screenshot-${log.id}`);
    cardImage.style.width = '100%';
  }
  const cardBodyList = cardElement.getElementsByClassName('addCardBodyList')[0];
  if (log.text) {
    const cardSentence = createCardSectionElement('short_text', 'card_sentence', log.text);
    cardBodyList.append(cardSentence);
  }
  if (log.audio) {
    const cardAudio = createCardSectionElement('mic', 'card_audio_file', log.audio);
    cardBodyList.append(cardAudio);
  }
  // const cardSentence = cardElement.getElementsByClassName('card_sentence')[0];
  // cardSentence.innerHTML = log.text;
  // const cardAudioFileName = cardElement.getElementsByClassName('card_audio_file_name')[0];
  // cardAudioFileName.innerHTML = log.audio;
  return cardElement
}

function createCardSectionElement(icon_name, field, value) {
  const cardSection = document.createElement('li');
  cardSection.classList.add('mdl-list__item');
  const content = `
    <span class="card_${field}_container mdl-list__item-primary-content">
        <i class="material-icons mdl-list__item-icon">${icon_name}</i>
        <span class="card_${field}">${value}</span>
    </span>`;
  cardSection.innerHTML = content;
  return cardSection
}

function formatLogMenu(logId, logMenuContent) {
  const log = getLogById(logId);
  const deleteRecordingButtonLabel = logMenuContent.getElementsByClassName('deleteRecordingButtonLabel')[0];
  const deleteRecordingButton = deleteRecordingButtonLabel.parentNode;
  deleteRecordingButton.setAttribute('log_id', logId);
  if (!log.audio) {
    // Disable deleteRecordingButton if there is no audio
    deleteRecordingButton.classList.add('disabled_list__item');
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
  playAudioButton.onclick = () => eel.play_log_audio(log.audio, log.folder)();

  
  // Init record audio button
  const recordAudioButton = logItemClone.getElementsByClassName('recordAudioButton')[0];
  recordAudioButton.id = `record_audio_button_${log.id}`;
  const recordAudioIcon = recordAudioButton.getElementsByClassName('material-icons')[0];
  recordAudioButton.onclick = () => startManualRecording(log, recordAudioIcon);

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
    const playAudioButton = recordAudioButton.parentNode.getElementsByClassName('playAudioButton')[0];
    playAudioButton.id = `play_audio_button_${logId}`;
      playAudioButton.onclick = function() {
        eel.play_log_audio(audioFileName, log.folder)();
      }
    playAudioButton.hidden = false;
    updateLogAudioById(logId, audioFileName);
    refreshLogMenuContent(logId);
    refreshCardContent(logId);
  }
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

function updateLog() {
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

function addCardToAnki(logId) {
  // todo: add card to anki
}