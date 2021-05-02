let pids = []
let pidNames = []
let processPIDs = []
let currentHook = '';
let hookOutputMap = {} 
const pidNameSelect = document.getElementById('pidNameSelect');
const hookSelect = document.getElementById('hookSelect');


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
function textractorPipe(textractorOutputObject) {
    const hook = textractorOutputObject.code;
    hookOutputMap[hook] = textractorOutputObject
    updateHooksSelectOptions(hookOutputMap)
    if (currentHook == hook) {
        const output = parseText(textractorOutputObject.text)
        updateOutput(output)
    }
}

function updateHooksSelectOptions(hookOutputMap) {
    hookSelect.innerHTML = '';
    for (const [hookId, outputObject] of Object.entries(hookOutputMap)) {
        const option = document.createElement("option");
        option.setAttribute('value', hookId);
        const label = `${hookId}:${outputObject.text}`;
        option.innerHTML = label;
        if (hookId === currentHook) {
            option.selected = true;
        }
        hookSelect.appendChild(option);
    }
}


function selectHook(hookSelect) {
    currentHook = hookSelect.value;
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