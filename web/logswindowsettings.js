const APPEARANCE_CONFIG = 'APPEARANCE';
const SCRIPT_MATCH_CONFIG = 'SCRIPTMATCHCONFIG';
const LOG_CONFIG = 'LOGCONFIG';

let confidenceThreshold = 0.7;
let currentSessionMaxLogSize = 30;

initConfig();

function initConfig () {
    (async() => {
        const config = await eel.read_config_all()();
        if (config) {
            currentConfig = Object.assign(config);
            // Appearance
            // const appearanceConfig = config[APPEARANCE_CONFIG];
            // Logs
            const logConfig = config[LOG_CONFIG];
            currentSessionMaxLogSize = logConfig['currentsessionmaxlogsize'];
            // Script Match
            const scriptMatchConfig = config[SCRIPT_MATCH_CONFIG];
            confidenceThreshold = scriptMatchConfig['confidence_threshold'];
        }
    })()
}