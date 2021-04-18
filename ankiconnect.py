import json
import urllib.request
import eel
import yaml
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ANKI_MODELS_FILENAME = 'ankimodels.yaml'

def request(action, params):
    return {'action': action, 'params': params, 'version': 6}

@eel.expose
def invoke(action, params):
    print('invoking params?', params)
    requestJson = json.dumps(request(action, params)).encode('utf-8')
    response = json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:8765', requestJson)))
    if len(response) != 2:
       return None
    if 'error' not in response:
      return None
    if 'result' not in response:
       return None
    if response['error'] is not None:
       return None
    return response['result']


def getAnkiModels():
    filename = str(Path(SCRIPT_DIR, 'anki', ANKI_MODELS_FILENAME))
    ankiModels = []
    with open(filename, 'r') as stream:
        try:
            ankiModels = yaml.safe_load(stream)
            return ankiModels
        except yaml.YAMLError as exc:
            print(exc)

    return ankiModels

def updateAnkiModels(ankiModels):
    # save ankimodels
    with open(str(Path(SCRIPT_DIR, 'anki', ANKI_MODELS_FILENAME)), 'w') as outfile:
        yaml.dump(ankiModels, outfile, default_flow_style=False)
        return outfile.name

# print(getAnkiModels())
# invoke('createDeck', deck='test1')
# deck_names = invoke('deckNames')
# model_names = invoke('modelNames')
# field_names = invoke('modelFieldNames', modelName='Basic')
# print('got list of field names: {}'.format(field_names))
# print('got list of decks: {}'.format(model_names))