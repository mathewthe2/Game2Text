function toggleLogs() {
    if (!logMode) {
        toggleLogsButton.disabled = true;
        (async() => {
            const logs = await eel.show_logs()();
            if (logs) {
                logMode = !logMode;
                toggleLogsButton.disabled = false;
                toggleLogsButton.classList.add("mdl-button--colored");
                currentText = output.innerText;
                output.innerText = '';
                addLogs(logs);
            }
        })()
    } else {
        cv1.hidden = false;
        previewCanvas.hidden = true;
        removeLogs(document.getElementById("logsContainer"));
        logMode = !logMode;
        toggleLogsButton.classList.remove("mdl-button--colored");
        updateOutput(currentText);
    }
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
   const logsContainer = document.createElement('div');
   logsContainer.setAttribute("id", "logsContainer");
   logsContainer.setAttribute("style",`width:calc(100vw - 8px - 8px);`);
   logs.forEach(log=>{
     const div = document.createElement('div');
     div.setAttribute("id", log.id);
     div.setAttribute("image", log.image);
     //  div.setAttribute("contenteditable", true);
     div.onmouseover = function() {
        showImageForLog(log);
      }
     div.onclick = function () {
       showImageForLog(log);
     } 
     div.onmouseup = showSimilarKanji;
     div.onkeyup = showSimilarKanji;
     div.input = updateLog;
     div.addEventListener('input', function(e) {
       updateLog()
     })
     div.innerText = log.text;
     div.classList.add('logText');
     div.classList.add('hide');
     logsContainer.append(div);
   })
   results.prepend(logsContainer);
   setTimeout(function(){ 
    NodeList.prototype.forEach = Array.prototype.forEach
    const logs = logsContainer.childNodes;
    logs.forEach(function(log){
      log.classList.remove('hide');
    });
   }, 300);
}

function showImageForLog(log) {
  if (!log.image) {
    return;
  }
  cv1.hidden = true;
  previewCanvas.hidden = false;
  previewCtx.clearRect(0,0,cv1.width,cv1.height); 
  const img = new Image();
  img.src = log.image;
  img.onload = function() {
    previewCanvas.width = videoElement.videoWidth;
    previewCanvas.height = videoElement.videoHeight;
    previewCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
  };
}

function updateLog() {
   // TODO: update logs
}