console.log('ankicard stuff')

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

// Translates the given text and caches it if already called with the same text
async function translate(text) {
  const hashed = text
  const translation = translations[hashed]
  if (translation) { return translation }

  let translatedText = await eel.translate(text)();
  translations[hashed] = translatedText
  return translatedText;
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

function updateLogAudioById(logId, audioFileName) {
  const logs = currentLogs;
  logs.forEach(log=>{
    if (log.id === logId) {
      log.audio = audioFileName
    }
  })
  currentLogs = logs;
}

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
