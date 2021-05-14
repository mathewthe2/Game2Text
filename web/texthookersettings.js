let pids = []
let pidNames = []
let processPIDs = []
let currentHook = '';
let hookOutputMap = {} 
const pidNameSelect = document.getElementById('pidNameSelect');
const hookSelect = document.getElementById('hookSelect');
const textractorLogLabel = document.getElementById('textractorLogLabel');
let refreshApplicationListTimeout;


initSetPIDs();

async function initSetPIDs() {
    pids = await eel.get_PIDs()();
    if (pids) {
        mapProcessesToOptions(pids)
    }
}

function handleInputApplication() {
    clearTimeout(refreshApplicationListTimeout);
    refreshApplicationListTimeout = setTimeout(function(){ refreshPIDs() }, 1000);
}

async function refreshPIDs() {
    pids = await eel.get_PIDs()();
    if (pids) {
        pidNameSelect.innerHTML = '';
        mapProcessesToOptions(pids);
    }
}

function mapProcessesToOptions(processes) {
    processes.forEach(process=>{
        pidNames.push(process.name)
        const option = document.createElement("option");
        option.setAttribute('value', process.name)
        pidNameSelect.appendChild(option)
    })
}

async function selectTextHookerApplication(input) {
    const isValidApplication = pidNames.includes(input.value);
    if (isValidApplication) {
        const newProcessPIDs = getProcessPIDsFromName(input.value);
        if (newProcessPIDs.length > 0 && processPIDs[0] !== newProcessPIDs) {
            hookOutputMap = {}
            processPIDs = newProcessPIDs;
            eel.attach_process(processPIDs)();
        }
    } else {
        // TODO: Show error toaster
    }
}

function getProcessPIDsFromName(name) {
    pid = pids.find(pid=>pid.name === name);
    if (pid) {
        return pid.pids
    } else {
        return []
    }
}

eel.expose(textractorPipe)
function textractorPipe(textractorOutput) {
    for(const textractorOutputObject of textractorOutput) {
        const hook = textractorOutputObject.code;
        console.log('obj', textractorOutputObject)
        hookOutputMap[hook] = textractorOutputObject
        updateHooksSelectOptions(hookOutputMap)
        if (textractorOutputObject.name === 'Console') {
            textractorLogLabel.innerText = textractorOutputObject.text
            if (textractorOutputObject.text.includes('pipe connected')) {
                const notification = document.querySelector('.mdl-js-snackbar');
                notification.MaterialSnackbar.showSnackbar(
                {
                    message: textractorOutputObject.text
                }
                );
            }
        }
        if (currentHook == hook) {
            const output = textractorOutputObject.text;
            updateOutput(output)
        }
    }
}
function updateHooksSelectOptions(hookOutputMap) {
    while (hookSelect.length > 0) {
        hookSelect.remove(hookSelect.length-1);
    }
    for (const [hookCode, outputObject] of Object.entries(hookOutputMap)) {
        if (outputObject.name === 'Console' || outputObject.name === 'Clipboard') { 
            continue; 
        }
        const option = document.createElement("option");
        option.setAttribute('value', hookCode);
        option.classList.add('hookOption');
        const label = `${outputObject.text}`;
        option.innerHTML = label;
        if (hookCode === currentHook) {
            option.selected = true;
        }
        hookSelect.add(option);
    }
}


function selectHook(hookSelect) {
    // currentHook = hookSelect.value;
    currentHook = hookSelect.value;
    currentHookLabel.innerText = hookSelect.value;
    const output = hookOutputMap[currentHook].text;
    updateOutput(output)
}

async function addCustomHook() {
    // TODO: validate hook code 
    if (hasSelectedPID()) {
        customHookCode = customHookCodeInput.value;
        eel.hook_code(customHookCode, processPIDs)();
    }
    // TODO: success and error messages
}

function hasSelectedPID() {
    return processPIDs.length > 0;
}

// function parseText(text) {
//     // TODO: add custom regex
//     text = text.replace(/[\x00-\x20]/g, '')
//     text = text.replace(/_t.*?\//g, '')
//     return text
// }