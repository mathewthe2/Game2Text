import json
import urllib.request
import eel

def request(action, params):
    return {'action': action, 'params': params, 'version': 6}

@eel.expose
def invoke(action, params):
    print('params?', params)
    requestJson = json.dumps(request(action, params)).encode('utf-8')
    response = json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:8765', requestJson)))
    if len(response) != 2:
        raise Exception('response has an unexpected number of fields')
    if 'error' not in response:
        raise Exception('response is missing required error field')
    if 'result' not in response:
        raise Exception('response is missing required result field')
    if response['error'] is not None:
        raise Exception(response['error'])
    return response['result']

# invoke('createDeck', deck='test1')
# deck_names = invoke('deckNames')
# model_names = invoke('modelNames')
# field_names = invoke('modelFieldNames', modelName='Basic')
# print('got list of field names: {}'.format(field_names))
# print('got list of decks: {}'.format(model_names))