from googletrans import Translator
import requests
import time
from config import r_config, DEEPL_CONFIG

def deepl_translate(text):
    text = text[:140] if len(text) > 140 else text
    response = requests.post(
    "https://www2.deepl.com/jsonrpc",
    json = {
        "jsonrpc":"2.0",
        "method": "LMT_handle_jobs",
        "params": {
            "jobs":[{
                "kind":"default",
                "raw_en_sentence": text,
                "raw_en_context_before":[],
                "raw_en_context_after":[],
                "preferred_num_beams":4,
                "quality":"fast"
            }],
            "lang":{
                "user_preferred_langs":["EN"],
                "source_lang_user_selected": r_config(DEEPL_CONFIG, "source_lang") or "JA",
                "target_lang": r_config(DEEPL_CONFIG, "target_lang") or "EN"
            },
            "priority":-1,
            "commonJobParams":{},
            "timestamp": int(round(time.time() * 1000))
        },
        "id": 40890008
    })
    output = response.json()
    if output is not None:
        if 'result' in output:
            return output['result']['translations'][0]['beams'][0]["postprocessed_sentence"]
        if 'error' in output:
            return 'Error: ' + output['error']['message']
    return 'Failed to Translate'

def google_translate(text):
    translator = Translator()
    result = translator.translate(text)
    return result.text