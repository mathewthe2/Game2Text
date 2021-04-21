import json
import urllib.request
import eel
import yaml
from pathlib import Path
from mimetypes import guess_extension
from logger import AUDIO_LOG_PATH, IMAGE_LOG_PATH, get_base64_image_with_log
from config import r_config, ANKI_CONFIG

SCRIPT_DIR = Path(__file__).parent
ANKI_MODELS_FILENAME = 'ankimodels.yaml'

NOTE_SCREENSHOT = 'screenshot'

def request(action, params):
    return {'action': action, 'params': params, 'version': 6}

@eel.expose
def invoke(action, params):
    try:
        requestJson = json.dumps(request(action, params)).encode('utf-8')
        response = json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:8765', requestJson)))
        if len(response) != 2:
            return 'Error: Response has an unexpected number of fields'
        if 'error' not in response:
            return 'Error: Response has an unexpected number of fields'
        if 'result' not in response:
            return 'Error: Response is missing required result field'
        if response['error'] is not None:
            return 'Error:' + response['error']
        return response['result']
    except:
        return 'Error: Failed to connect to Anki.'


def get_anki_models():
    filename = str(Path(SCRIPT_DIR, 'anki', ANKI_MODELS_FILENAME))
    ankiModels = []
    with open(filename, 'r') as stream:
        try:
            ankiModels = yaml.safe_load(stream)
            return ankiModels
        except yaml.YAMLError as exc:
            print(exc)

    return ankiModels

def update_anki_models(ankiModels):
    # save ankimodels
    with open(str(Path(SCRIPT_DIR, 'anki', ANKI_MODELS_FILENAME)), 'w') as outfile:
        yaml.dump(ankiModels, outfile, sort_keys=False, default_flow_style=False)
        return outfile.name

def fetch_anki_fields(model_names):
    for model_name in model_names:
        field_names = invoke('modelFieldNames', {'modelName': model_name})
        eel.setAnkiFields(model_name, field_names)()

def create_anki_note(note_data):
    field_value_map = eel.getFieldValueMap()()
    fields = {}
    picture_fields = []
    audio_fields = []
    for field in field_value_map:
        value = field_value_map[field].replace(' ', '').lower()
        if value in note_data:
            if (value == 'screenshot'):
                picture_fields.append(field)
            elif (value == 'audio'):
                audio_fields.append(field)
            else:
                fields[field] = note_data[value]
    note_params = {
        'note': {
            'deckName': r_config(ANKI_CONFIG, 'deck'),
            'modelName': r_config(ANKI_CONFIG, 'model'),
            'fields': fields,
            'options':  {
                "allowDuplicate": True
            },
           "tags": r_config(ANKI_CONFIG, 'cardtags').split()
        }
    }
    if (picture_fields):
        # TODO: check to see if image is already in file and add from path
        picture_params = {
            'filename': note_data['filename'] + '.' + note_data['imagetype'],
            'fields': picture_fields,
            'data':  note_data['screenshot']
        }
        note_params['note']['picture'] = [picture_params]
    if (audio_fields):
        audio_params = {
            'filename': note_data['audio'],
            'fields': audio_fields,
            'path':  str(Path(AUDIO_LOG_PATH, note_data['folder'], note_data['audio'])),
        }
        note_params['note']['audio'] = [audio_params]
    result = invoke('addNote', note_params)
    print(result)
    return result