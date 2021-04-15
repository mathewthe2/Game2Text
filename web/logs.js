showLogs();
let currentLogs = [];
window.tippyInstances = [];
let isRecording = false;

function showLogs() {
  (async() => {
      const newlogs = await eel.show_logs()();
      if (newlogs) {
          addLogs(newlogs);
      }
  })()
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
  tippy(document.querySelectorAll('.showAnkiFormButton'), {
    // content: 'Add to Anki',
    delay: [100, null],
    theme: 'material-light',
    arrow: false,
    // hideOnClick: false,
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
      const log_id = reference.getAttribute('log_id');
      if (log_id) {
        const log = getLogById(log_id);
        const template = document.getElementById('addCardForm');
        let cardContent = template.cloneNode(true);
        cardContent = formatCard(log, cardContent);
        return cardContent.innerHTML;
      } else {
        return '';
      }
    },
    allowHTML: true,
  });
  window.scrollTo(0,document.body.scrollHeight);
}

function formatCard(log, cardElement) {
  // cardElement.id = `add-card-form-${log.id}`;
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

function logToHtml(log) {
  const logItem = document.getElementById('logItemTemplate');
  const logItemClone = logItem.cloneNode(true);
  logItemClone.id = `logItem-${log.id}`;
  const logText = logItemClone.getElementsByClassName('logText')[0];
  const playAudioButton = logItemClone.getElementsByClassName('playAudioButton')[0];
  if (log.audio) {
    playAudioButton.id = `play_audio_button_${log.id}`;
    playAudioButton.onclick = function() {
      const folder_name = fileBaseName(log.file)
      eel.play_log_audio(log.audio, folder_name)();
    }
  } else {
    playAudioButton.hidden = true;
    const recordAudioButton = logItemClone.getElementsByClassName('recordAudioButton')[0];
    recordAudioButton.id = `record_audio_button_${log.id}`;
    recordAudioButton.onclick = function() {
      const recordAudioIcon = recordAudioButton.getElementsByClassName('material-icons')[0];
      // Manual Recording: first click to record, second click to stop recording
      if (!isRecording) {
        recordAudioIcon.style.color = '#E21549';
        const folder_name = fileBaseName(log.file)
        eel.start_manual_recording(log.id, folder_name)();
        isRecording = true;
      } else {
        recordAudioIcon.style.color = '#3F51B5';
        (async ()=> {
          const audioFileName = await eel.stop_manual_recording()();
          if (audioFileName) {
            const logId = fileBaseName(audioFileName)
            const log = getLogById(logId);
            const recordAudioButton = document.getElementById(`record_audio_button_${logId}`);
            recordAudioButton.hidden = true;
            const playAudioButton = recordAudioButton.parentNode.getElementsByClassName('playAudioButton')[0];
            playAudioButton.id = `play_audio_button_${logId}`;
              playAudioButton.onclick = function() {
                const folder_name = fileBaseName(log.file)
                eel.play_log_audio(audioFileName, folder_name)();
              }
            playAudioButton.hidden = false;

            // Update current logs
            updateLogAudioById(logId, audioFileName);

            // Refresh add anki card
            refreshCardContent(logId);
          }
        })();
        isRecording = false;
      }
    }
    recordAudioButton.hidden = false;
  }
  const showAnkiFormButton = logItemClone.getElementsByClassName('showAnkiFormButton')[0];
  showAnkiFormButton.id = `show_anki_form_button_${log.id}`
  showAnkiFormButton.setAttribute("log_id", log.id);

  logText.innerText = log.text;
  logItemClone.hidden = false;
  return logItemClone
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

function updateLogAudioById(logId, audioFileName) {
  const logs = currentLogs;
  logs.forEach(log=>{
    if (log.id === logId) {
      log.audio = audioFileName
    }
  })
  currentLogs = logs;
}

function refreshCardContent(logId) {
    // Get Instance
    const showAnkiFormButton = document.getElementById(`show_anki_form_button_${logId}`)
    const instance = showAnkiFormButton._tippy;
    // Get Card HTML
    const log = getLogById(logId);
    const template = document.getElementById('addCardForm');
    let cardContent = template.cloneNode(true);
    cardContent = formatCard(log, cardContent);
    // Refresh Content
    instance.setContent(cardContent.innerHTML);
}