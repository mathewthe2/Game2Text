const ANKI_CONFIG = 'ANKICONFIG';

let currentLogs = [];
window.tippyInstances = [];
let activeCardLogId = '';
const loadingScreenDelay = setTimeout("showLoadingScreen()", 400);

// Audio
let recordingLogId;
let isRecording = false;
let currentlyPlayingAudio = '';

// Game Scripts
let gameScripts = []

const translations = {}

init();

function init() {
  (async() => {
    await loadGameScripts();
    await showLogs();
  })();
}

function toggleDarkTheme() {
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");
  const darkThemeToggleIcon = toggleDarkThemeButton.firstElementChild;
  if (document.body.classList.contains('dark-theme')) {
    darkThemeToggleIcon.innerHTML = 'brightness_low';
    toggleDarkThemeTooltip.innerHTML = 'Light Mode';
  } else {
    darkThemeToggleIcon.innerHTML = 'brightness_medium'
    toggleDarkThemeTooltip.innerHTML = 'Dark Mode';
  }
}

async function loadGameScripts() {
  gameScripts = await eel.load_game_text_scripts()();
  const gameScriptSelect = document.getElementById('gameScriptSelect');
  gameScriptSelect.innerHTML = '<option>None</option>';
  gameScripts
  .forEach(gameScript=>{
    const scriptOption = document.createElement('option');
    scriptOption.innerHTML = gameScript.name;
    gameScriptSelect.append(scriptOption);
  })
  const savedGameScript = await eel.read_config(LOG_CONFIG, 'gamescriptfile')();
  // Use saved game script. If not in script folder remove from config file
  if (savedGameScript) {
    const gameScript = gameScripts.find(script => script.path === savedGameScript);
    if (gameScript) {
      gameScriptSelect.value = gameScript.name;
    } else {
      await eel.update_config(LOG_CONFIG, {'gamescriptfile': ''})();
    }
  }
  return
}

function selectGameScript(gameScriptSelect) {
  const gameScript = gameScripts.find(gameScript=>gameScript.name === gameScriptSelect.value);
  if (gameScript) {
    eel.update_config(LOG_CONFIG, {'gamescriptfile':gameScript.path })();
  } else if (gameScriptSelect.value === 'None') {
    eel.update_config(LOG_CONFIG, {'gamescriptfile': '' })();
  }
}

async function loadGameScriptFromFile() {
  const fileName = await eel.open_game_text_script()();
  if (fileName) {
    loadGameScripts();
  }
}

eel.expose(updateLogDataById)
function updateLogDataById(logId, data) {
  const log = getLogById(logId);
  if (log) {
    for (const property in data) {
      currentLogs.find(log=>log.id === logId)[property] = data[property]
    };
    refreshLogElement(logId);
    // persist text logs and update main window if game script matches
    if (getLogById(logId).isMatched) {
        updateLogFileById(logId);
        const latestLog = currentLogs[currentLogs.length-1];
        if (logId === latestLog.id) {
          eel.update_main_window_text(latestLog.text)();
        }
    }
  }
}

function refreshLogElement(logId, refreshToolTips = true){
  const logElement = getLogElementById(logId);
  const newLogElement = logToHtml(getLogById(logId));
  logElement.innerHTML = newLogElement.innerHTML;
  if (refreshToolTips) {
    addToolTips();
  }
}

async function showLogs() {
    const newlogs = await eel.show_logs()();
    if (newlogs) {
        addLogs(newlogs);
    }
    hideLoadingScreen();
    return
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

eel.expose(isMatchingScript)
function isMatchingScript() {
  return gameScriptSelect.value !== 'None';
}

eel.expose(getLogsShown);
function getLogsShown() {
  return currentLogs;
}
  
eel.expose(addLogs);
function addLogs(newLogs) {
  const logsContainer = document.getElementById('logsContainer');
  let needScroll = true;
  newLogs.forEach(newLog=>{
    const logItem = logToHtml(newLog);
    logsContainer.append(logItem);
    currentLogs.push(newLog);
    if (currentLogs.length > currentSessionMaxLogSize) {
      window.scrollTo(0,document.body.scrollHeight);
      needScroll = false;
      logElement = getLogElementById(currentLogs[0].id);
      animateRemove(logElement);
      currentLogs.shift();
    }
   })

  addToolTips();
  tippyInstances.forEach(inst => {
    inst.hide();
  });
  if (needScroll) {
    window.scrollTo(0,document.body.scrollHeight);
  }
}

function addToolTips() {
  createAudioToolTips();
  createLogMenu();
  createAnkiFormCard();
  createMatchScriptDropdown();
}

function createAudioToolTips() {
  tippy(document.querySelectorAll('.recordAudioButton'), {
    content: 'Record Audio',
    delay: [300, null]
  });
  tippy(document.querySelectorAll('.playAudioButton'), {
    content: 'Play Audio',
    delay: [300, null]
  });
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
  createAnkiFormCardTippy(document.querySelectorAll('.showAnkiFormButton'))
}

function createAnkiFormCardTippy(target) {
  return tippy(target, {
    delay: [100, null],
    theme: 'material-light',
    arrow: false,
    trigger:'mouseenter',
    interactive: true,
    boundary: 'window',
    onShow(instance) {
      // Remove all other add to anki tippy instances
      tippyInstances.forEach(inst => {
        inst.hide();
      });
      tippyInstances.length = 0; // clear it
      window.tippyInstances = tippyInstances.concat(instance);
      instance.setProps({trigger: 'click'});
      activeCardLogId = instance.reference.getAttribute('log_id');
    },
    onHide(instance) {
      activeCardLogId = ''
      instance.setProps({trigger: 'mouseenter'});
      // Update log element if user changed the log data
      const logId = instance.reference.getAttribute('log_id');
      if (isLogDataUpdated(logId)) {
        // TODO: this may cause tippy to flicker
        refreshLogElement(logId); // refresh log element text only
        createMatchScriptDropdown();
        createAnkiFormCard();
      }
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

function launchAnkiFormByLogId(logId) {
  const logElement = getLogElementById(logId);
  const showAnkiFormButton = logElement.getElementsByClassName('showAnkiFormButton')[0];
  if (showAnkiFormButton) {
    // destroy tippy if exists
    if (showAnkiFormButton._tippy) {
      showAnkiFormButton._tippy.destroy();
    }
    const ankiFormCardTippy = createAnkiFormCardTippy(showAnkiFormButton);
    ankiFormCardTippy.show();
  }
}
 
function createMatchScriptDropdown() {
  tippy(document.querySelectorAll('.showMatchingGameScriptButton'), {
    delay: [100, null],
    offset: [-400, 0],
    theme: 'material-light-long',
    placement: 'bottom',
    arrow: false,
    animation: 'shift-away',
    trigger:'click',
    interactive: true,
    content(reference) {
      const template = document.getElementById('matchingScriptMenu');
      const matchScriptMenuContent = template.cloneNode(true);
      const logId = reference.getAttribute('log_id');
      return logId ? formatMatchScriptMenu(logId, matchScriptMenuContent).innerHTML : ''
    },
    allowHTML: true,
  });
}

function formatCard(logId, cardElement) {
  const log = getLogById(logId);
  translate(log.text)
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

  if (log.selectedText) {
    let selectedTextPreview = log.selectedText;
    if (log.dictionary) {
      selectedTextPreview = log.dictionary[0].headword;
      if (log.dictionary[0].reading) {
        if (log.dictionary[0].reading !== log.dictionary[0].headword) {
          selectedTextPreview = `<ruby>${log.dictionary[0].headword}<rt>${log.dictionary[0].reading}</rt></ruby>`;
        }
      }
      // Word Audio
      if (log.dictionary[0].audio) {
        // TODO: prevent rest of the text from moving when inserting audio icon
        selectedTextPreview += `
        <button log_id=${log.id} onclick="playWordAudio(this)" class="logMenuButton mdl-button mdl-js-button mdl-button--icon">
          <i style="line-height: 20px !important;" class="material-icons">play_circle_filled</i>
        </button>`;
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
      value = extractContent(log.dictionary[0].glossary_list).join('; ')
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

    const translation = translations[log.text]
    if (translation) {
      const cardTranslation = createCardSectionElement(
        iconName = 'short_text',
        field = 'card_sentence_translation',
        value = translation,
        contentEditable = true,
        footerIcon = log.audio ? 'mic' : ''
      );
      cardBodyList.append(cardTranslation);
    }
  }
  return cardElement
}

function createCardSectionElement(iconName, field, value, contentEditable=false, footerIcon='') {
  const cardSection = document.createElement('li');
  cardSection.classList.add('mdl-list__item');
  const content = `
    <span class="card_${field}_container mdl-list__item-primary-content">
        <i class="material-icons mdl-list__item-icon">${iconName}</i>
        <span ${contentEditable && `oninput="changeLogText(this)"`} contentEditable=${contentEditable} class="card_${field}">${value}</span>
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
  const deleteLogButton = logMenuContent.getElementsByClassName('deleteLogButton')[0];
  deleteLogButton.setAttribute('log_id', logId);

  // Set logId as button attribute
  const copyScreenshotButton = logMenuContent.getElementsByClassName('copyScreenshotButton')[0];
  copyScreenshotButton.setAttribute('log_id', logId);
  if (!log.image) {
    // Disable copyScreenshotButton if there is no screenshot
    copyScreenshotButton.classList.add('disabled_list__item');
  }

  return logMenuContent
}

function formatMatchScriptMenu(logId, matchScriptContent) {
  const log = getLogById(logId);
  matchScriptContent.innerHTML = `<div class="matchingScriptMenuCard mdl-card mdl-shadow--2dp">
    <ul class="mdl-list">
    ${(log.matches && log.originalText && log.originalText.trim() !== log.matches[0][0].trim()) ?
      `<li class="mdl-list__item" log_id="${logId}" onclick="replaceLogText(this.getAttribute('log_id'), this.innerText)">
        <span class="mdl-list__item-primary-content">${log.originalText}</span>
      </li>` : ''}
      ${log.matches.map(match=>{
        return (
        `<li class="mdl-list__item" log_id="${logId}" onclick="replaceLogText(this.getAttribute('log_id'), this.innerText)">
          <span class="mdl-list__item-primary-content">${match[0]}</span>
        </li>`
        )
      })}
    </ul>
  </div>`;
  return matchScriptContent
}

// Handle user change of log text from log or inside card
function changeLogText(element) {
  const newLogText = element.innerText;
  let logId = '';
  if (element.classList[0] === 'card_card_sentence') {
    logId = element.parentNode.parentNode.parentNode.getAttribute('log_id');
    currentLogs.find(log=>log.id===logId).text = newLogText;
  }
  if (element.classList[0] === 'logText') {
    const logItemElement = element.parentNode.parentNode;
    logId = logItemElement.id.split('logItem-')[1];
    currentLogs.find(log=>log.id===logId).text = newLogText;
    refreshCardContent(logId);
  }
  if (logId) {
    updateLogFileById(logId);
    // update main window text if updating latest log
    const latestLog = currentLogs[currentLogs.length-1];
    if (logId === latestLog.id) {
      eel.update_main_window_text(newLogText)();
    }
    // TODO: update matching card options after updating log text
  }
}

function isLogDataUpdated(logId) {
  const log = getLogById(logId);
  const logElement = getLogElementById(logId);
  const logTextElement = logElement.getElementsByClassName('logText')[0]
  const isTextChanged = log.text.trim() !== logTextElement.innerText.trim();
  return isTextChanged
}

function replaceLogText(logId, newText) {
  const log = getLogById(logId);
  const originalText = log.originalText ? log.originalText : log.text;
  updateLogDataById(logId, {
    originalText: originalText,
    text: newText,
    isMatched: true,
    autoMatch: false
  });
}

// Translates the given text and caches it if already called with the same text
async function translate(text) {
  const hashed = text
  const translation = translations[hashed]
  if (translation) { return translation }

  let translatedText = await eel.translate(text)();
  translations[hashed] = translatedText
  return translatedText;
}

function logToHtml(log) {
  const logItem = document.getElementById('logItemTemplate');
  const logItemClone = logItem.cloneNode(true);
  logItemClone.id = `logItem-${log.id}`;
  const logText = logItemClone.getElementsByClassName('logText')[0];

  // Init play audio button
  const playAudioButton = logItemClone.getElementsByClassName('playAudioButton')[0];
  playAudioButton.id = `play_audio_button_${log.id}`;
  playAudioButton.setAttribute('log_id', log.id);
  playAudioButton.setAttribute('onclick', `playRecording(this.getAttribute('log_id'), this)`)

  // Init record audio button
  const recordAudioButton = logItemClone.getElementsByClassName('recordAudioButton')[0];
  recordAudioButton.id = `record_audio_button_${log.id}`;
  recordAudioButton.setAttribute('log_id', log.id);
  recordAudioButton.setAttribute('onclick', `toggleManualRecording(this.getAttribute('log_id'), this)`)

  if (log.audio) {
    playAudioButton.hidden = false;
    recordAudioButton.hidden = true;
    if (currentlyPlayingAudio == log.id) {
      const playAudioIcon = playAudioButton.firstElementChild;
      playAudioIcon.innerHTML = 'pause_circle_filled';
    }
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


  if (log.matches) {
    const showMatchingScriptButton = logItemClone.getElementsByClassName('showMatchingGameScriptButton')[0];
    showMatchingScriptButton.id = `show_matching_script_button_${log.id}`
    showMatchingScriptButton.setAttribute("log_id", log.id);
    showMatchingScriptButton.style.visibility  = 'visible';
    if (log.autoMatch) {
      firstMatch = log.matches[0];
      firstMatchConfidence = firstMatch[1];
      if (firstMatchConfidence > confidenceThreshold && firstMatch[0].length > autoMatchMinimumCharacterLength) {
        log.originalText = log.originalText ? log.originalText : log.text;
        log.text = firstMatch[0];
        log.isMatched = true;
      }
    }
  }
  
  logText.innerText = log.text;
  logItemClone.hidden = false;
  return logItemClone
}

async function playRecording(logId, playAudioButton) {
  // TODO: allow pause and play from another file. Currently only support playing one at a time
  const log = getLogById(logId);
  if (log) {
    if (currentlyPlayingAudio === '') {
      currentlyPlayingAudio = logId;
      const playAudioIcon = playAudioButton.firstElementChild;
      playAudioIcon.innerHTML = 'pause_circle_filled';
      audioDurationSeconds = await eel.play_log_audio(log.audio, log.folder)();
      setTimeout(()=>finishPlayingAudio(log.id), audioDurationSeconds)
    }
  }
}

function finishPlayingAudio(logId) {
  const playAudioButton = document.getElementById(`play_audio_button_${logId}`);
  playAudioButton.firstElementChild.innerHTML = 'play_circle_filled';
  currentlyPlayingAudio = '';
}


async function toggleManualRecording(logId, recordAudioButton) {
  // Manual Recording: first click to record, second click to stop recording
  const log = getLogById(logId);
  if (log) {
    const recordAudioIcon = recordAudioButton.firstElementChild;
    if (!isRecording) {
      recordAudioIcon.style.color = '#E21549';
      eel.start_manual_recording(log.id, log.folder)();
      isRecording = true;
      recordingLogId = logId;
    } else {
      recordAudioIcon.style.color = '#3F51B5';
      stopManualRecording(); 
      isRecording = false;
      recordingLogId  = '';
    }
  }
}

async function stopManualRecording() {
  const audioFileName = await eel.stop_manual_recording()();
  if (audioFileName) {
    const logId = fileBaseName(audioFileName)
    const recordAudioButton = document.getElementById(`record_audio_button_${logId}`);
    recordAudioButton.hidden = true;
    const playAudioButton = document.getElementById(`play_audio_button_${logId}`);
    playAudioButton.hidden = false;
    updateLogAudioById(logId, audioFileName);
    refreshLogMenuContent(logId);
    refreshCardContent(logId);
  } else {
    notify('No audio detected. Check your audio device in settings.')
  }
}

function playWordAudio(audioButton) {
  const logId = audioButton.getAttribute('log_id');
  const log = getLogById(logId);
  if (log) {
    const kanji = log.dictionary[0].headword;
    const kana = log.dictionary[0].reading;
    const src =`https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=${kanji}&kana=${kana}`;
    const audio = new Audio(src);
    audio.play();
  } else {
    notify('Cannot find Log');
  }
}

function getRecordAudioButtonByLogId(logId) {
  const logElement = getLogElementById(logId);
  return logElement.getElementsByClassName('recordAudioButton')[0];
}

eel.expose(resetAudioRecording)
function resetAudioRecording() {
  if (isRecording) {
    const recordAudioButton = getRecordAudioButtonByLogId(recordingLogId);
    toggleManualRecording(recordingLogId, recordAudioButton);
  } else {
    const latestLog = currentLogs[currentLogs.length-1];
    if (latestLog.audio) {
        // delete recording
        deleteRecording(latestLog.id).then(()=>{
          // start recording
          const recordAudioButton = getRecordAudioButtonByLogId(latestLog.id);
          toggleManualRecording(latestLog.id, recordAudioButton);
        })
    } else {
      // start recording
      const recordAudioButton = getRecordAudioButtonByLogId(latestLog.id);
      toggleManualRecording(latestLog.id, recordAudioButton);
    }
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
      return true
    } else {
      notify('Failed to delete recording');
      return false
    }
  }
}

async function deleteLog(logId) {
  const log = getLogById(logId)
  const logElement = getLogElementById(logId);
  if (log && logElement) {
    const deleteLogEvent = await eel.delete_log(logId, log.folder)();
    currentLogs = currentLogs.filter(log=>log.id !== logId)
    animateRemove(logElement);
  }
}

function animateRemove(element) {
  element.style.opacity = 0;
  setTimeout(() => {
    element.style.paddingBottom = 0;
    element.style.paddingTop = 0;
    element.style.height = 0;
    element.style.minHeight = 0;
    setTimeout(()=>{
      element.remove()
    }, 300)
  }, 300);
}

eel.expose(showCardWithSelectedText)
function showCardWithSelectedText(selectedText) {
  if (currentLogs.length > 0) {
    const lastestLog = currentLogs[currentLogs.length - 1]
    if (lastestLog.text.includes(selectedText)) {
      if (lastestLog.selectedText !== selectedText) {
        currentSelectedText = currentLogs.find(log=>log.id === lastestLog.id)['selectedText'] = selectedText;
        refreshCardContent(lastestLog.id);
        updateCardWithDictionaryEntry(lastestLog.id, selectedText);
      }
      if (activeCardLogId !== lastestLog.id) {
        launchAnkiFormByLogId(lastestLog.id);
      }
    }
  }

}

/**
 * Add selected word when user highlights words in log or addToAnkiCard
 * 
 */
document.addEventListener('mouseup', event => {  
  if (window.getSelection) {
    if (window.getSelection().toString() === '') {
      return
    }
      if (window.getSelection().anchorNode.parentNode.className === 'logText') {
        // Selected Text in Log
        const selectedText = window.getSelection().toString();
        const logId = window.getSelection().anchorNode.parentNode.parentNode.parentNode.id.split('logItem-')[1]
        currentLogs.find(log=>log.id === logId)['selectedText'] = selectedText;
        refreshCardContent(logId);
        updateCardWithDictionaryEntry(logId, selectedText);
      } else if (window.getSelection().anchorNode.parentElement.className === 'card_card_sentence'){
        // Selected Text in addtoanki card
        const selectedText = window.getSelection().toString();
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
    addLogAudioIfExists(logId);
  } else {
    currentLogs.find(log=>log.id === logId)['dictionary'] = null;
  }
  refreshCardContent(logId);
}

async function addLogAudioIfExists(logId) {
  const log = getLogById(logId);
  if (!log) {
    return
  }
  if (log.dictionary[0].reading) {
    const kanji = log['dictionary'][0].headword;
    const kana = log['dictionary'][0].reading;
    const audioUrl = await eel.get_jpod_url(kanji, kana)();
    if (audioUrl) {
      currentLogs.find(logObject=>logObject.id === log.id)['dictionary'][0].audio = audioUrl;
      refreshCardContent(logId);
    }
  }
}

function updateLogFileById(logId) {
   const log = getLogById(logId);
   eel.update_log_text(logId, log.folder, log.text);
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


eel.expose(addActiveCardToAnki)
function addActiveCardToAnki() {
  if (window.tippyInstances.length > 0) {
    const activeTippy = window.tippyInstances[window.tippyInstances.length - 1];
    const logId = activeTippy.reference.id.split('show_anki_form_button_')[1];
    addCardToAnki(logId);
  }
}

async function addCardToAnki(logId) {
  const log = getLogById(logId);
  const translation = await translate(log.text)
  const noteData = {
    folder: log.folder,
    filename: log.id,
    sentence: log.text,
    sentencetranslation: translation,
  }
  if (log.selectedText) {
    noteData['selectedtext'] = log.selectedText;
  }
  if (log.dictionary) {
    noteData['selectedtext'] = log.dictionary[0].headword
    noteData['glossary'] = log.dictionary[0].glossary_list.join(', ');
    if (log.dictionary[0].reading) {
      noteData['reading'] = log.dictionary[0].reading;
    }
    if (log.dictionary[0].audio) {
      noteData['wordaudio'] = log.dictionary[0].audio; 
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
      notify(result);
    } else {
      notify('Added to Anki');
    }
  }
}

function notify(message) {
  const notification = document.querySelector('.mdl-js-snackbar');
  notification.MaterialSnackbar.showSnackbar(
    {
      message: message
    }
  );
}

// Allow parsing of structured-content dictionaries
function extractContent(obj) {
  const content = [];

  if (obj.data?.content === 'glossary') {
    if (Array.isArray(obj.content)) {
      obj.content.forEach(item => {
        content.push(...extractContent(item.content));
      });
    } else {
      content.push(obj.content?.content);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => {
      content.push(...extractContent(item));
    });
  } else if (obj.type === 'structured-content' && obj.content) {
    content.push(...extractContent(obj.content));
  } else if (typeof obj === 'string'){
    content.push(obj)
  }

  return content;
}
