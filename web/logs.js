showLogs();

function showLogs() {
  (async() => {
      const logs = await eel.show_logs()();
      if (logs) {
          // logMode = !logMode;
          // toggleLogsButton.disabled = false;
          // toggleLogsButton.classList.add("mdl-button--colored");
          // currentText = output.innerText;
          // output.innerText = '';
          addLogs(logs);
      }
  })()
}
  
function removeLogs(logsContainer) {
    setTimeout(function(){ 
        NodeList.prototype.forEach = Array.prototype.forEach;
        const logs = logsContainer.childNodes;
        logs.forEach(function(log){
            log.classList.add('hide');
        });
        logsContainer.remove();
    }, 300);
}
  
function addLogs(logs) {
  const logsContainer = document.getElementById('logsContainer');
  logs.forEach(log=>{
    const logItem = logToHtml(log);
    logsContainer.append(logItem);
   })
 // TODO: add fade in fade out when loading logs and when new log is added
}

function logToHtml(log) {
  const logItem = document.getElementById('logItemTemplate');
  const logItemClone = logItem.cloneNode(true);
  logItemClone.id = `logItem-${log.id}`;
  const logText = logItemClone.getElementsByClassName('logText')[0];
  const playAudioButton = logItemClone.getElementsByClassName('playAudioButton')[0];
  if (log.audio) {
    playAudioButton.onclick = function() {
      const folder_name = log.file.replace(/\.[^.]*$/,'')
      eel.play_log_audio(log.audio, folder_name)();
    }
  } else {
    playAudioButton.style.visibility = "hidden";
  }
  logText.innerText = log.text;
  logItemClone.hidden = false;
  return logItemClone
}

function showImageForLog(log) {
  // if (!log.image) {
  //   return;
  // }
  // cv1.hidden = true;
  // previewCanvas.hidden = false;
  // previewCtx.clearRect(0,0,cv1.width,cv1.height); 
  // const img = new Image();
  // img.src = log.image;
  // img.onload = function() {
  //   previewCanvas.width = videoElement.videoWidth;
  //   previewCanvas.height = videoElement.videoHeight;
  //   previewCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
  // };
}

function updateLog() {
   // TODO: update logs
}