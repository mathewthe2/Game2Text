let pids = []
let pidNames = []
let processPIDs = []
let currentHook = '';
let hookOutputMap = {} 
const pidNameSelect = document.getElementById('pidNameSelect');
const hookSelect = document.getElementById('hookSelect');
const textractorLogLabel = document.getElementById('textractorLogLabel');


initSetPIDs();

async function initSetPIDs() {
    pids = await eel.get_PIDs()();
    if (pids) {
        mapProcessesToOptions(pids)
    }
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
        processPIDs = getProcessPIDsFromName(input.value)
        const result = eel.attach_process(processPIDs)();
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
            console.log(textractorOutputObject.text)
            textractorLogLabel.innerText = textractorOutputObject.text
        }
            // if (textractorOutputObject.text) {
            //     const notification = document.querySelector('.mdl-js-snackbar');
            //     notification.MaterialSnackbar.showSnackbar(
            //     {
            //         message: textractorOutputObject.text
            //     }
            //     );
            // }
        if (currentHook == hook) {
            const output = parseText(textractorOutputObject.text)
            updateOutput(output)
        }
    }
}
function updateHooksSelectOptions(hookOutputMap) {
    hookSelect.innerHTML = '';
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
    console.log('changed!')
    currentHook = hookSelect.value;
    currentHookLabel.innerText = hookSelect.value;
    const output = parseText(hookOutputMap[currentHook].text);
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

function parseText(text) {
    // TODO: add custom regex
    text = text.replace(/[\x00-\x20]/g, '')
    text = text.replace(/_t.*?\//g, '')
    return text
}