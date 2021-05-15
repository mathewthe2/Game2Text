const tooltip = document.getElementById("similarKanjiTooltip");
const outputText = document.getElementById("output");
let rangeOfSelectedText; // html node of selected text

function getSelectedText() {
   var text = "";
   if (typeof window.getSelection != "undefined") {
      text = window.getSelection().toString();
      sel = window.getSelection();
      rangeOfSelectedText = sel.getRangeAt(0);
   }
   return text;
}

function showSimilarKanji() {
   var selectedText = getSelectedText();
   if (selectedText) {
      if (selectedText in similarKanji) {
         const numberOfSuggestions = similarKanji[selectedText].length;
         let sampleOutput = '';
         similarKanji[selectedText].forEach(kanji=>sampleOutput += `
         <span style="margin: 0.5px;" onclick="replaceSelectedText('${kanji}')" onmouseover="this.style.color='orange';" onmouseout="this.style.color='';">
         ${kanji}
         </span>`);
         tooltip.innerHTML = sampleOutput;
         const fontSize = parseInt(results.style.fontSize, 10);
         tooltip.style.width = (numberOfSuggestions*fontSize*1.4) + 'px';
         const textRangeRect = rangeOfSelectedText.getBoundingClientRect();
         tooltip.style.left = textRangeRect.left + 'px';
         tooltip.style.top = textRangeRect.top - fontSize*2.1 + 'px';
         tooltip.style.visibility = "visible";
         tooltip.style.fontSize = fontSize + 'px';
         tooltip.style.lineHeight = results.style.lineHeight;
      } else {
         tooltip.style.visibility = "hidden";
      }
   }
}

function replaceSelectedText(replacementText) {
   rangeOfSelectedText.deleteContents();
   rangeOfSelectedText.insertNode(document.createTextNode(replacementText));
   tooltip.style.visibility = "hidden";
   changeOutputText(outputText);
}

function clearTooltips(e) {
   if (!tooltip.contains(e.target)){
      tooltip.style.visibility = "hidden";
   }
}

if (outputText) {
   outputText.onmouseup = showSimilarKanji;
   outputText.onkeyup = showSimilarKanji;
}
// TODO: add mouse events for log text
document.onmousedown = clearTooltips;