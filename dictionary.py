import zipfile
import json
import requests
import base64
from sudachipy import tokenizer
from sudachipy import dictionary
from tools import bundle_dir
from pathlib import Path
from config import r_config, ANKI_CONFIG
import glob

dictionary_map = {}
pitch_dictionary_map = {}

# Sudachi Parser
tokenizer_obj = dictionary.Dictionary(dict_type="small").create()
mode = tokenizer.Tokenizer.SplitMode.A

DICTIONARY_PATH = Path(bundle_dir, "resources", "dictionaries")


def get_local_dictionaries():
    files = glob.glob(str(DICTIONARY_PATH) + "/*.zip")
    return [Path(file).stem for file in files]


def load_dictionary_by_path(dictionary_path):
    output_map = {}
    archive = zipfile.ZipFile(dictionary_path, "r")

    result = list()
    for file in archive.namelist():
        if file.startswith("term"):
            with archive.open(file) as f:
                data = f.read()
                d = json.loads(data.decode("utf-8"))
                result.extend(d)

    for entry in result:
        if entry[0] in output_map:
            output_map[entry[0]].append(entry)
        else:
            output_map[entry[0]] = [entry]  # Using headword as key for finding the dictionary entry
    return output_map


def load_all_dictionaries():
    default_dictionary = r_config(ANKI_CONFIG, "anki_dictionary")
    load_dictionary(default_dictionary)
    # pitch_dictionary_map = load_sdictionary(str(Path(bundle_dir, 'dictionaries', 'kanjium_pitch_accents.zip')))


def load_dictionary(dictionary_name):
    global dictionary_map
    dictionary_path = Path(DICTIONARY_PATH, dictionary_name + ".zip")
    if dictionary_path:
        dictionary_map = load_dictionary_by_path(str(dictionary_path))
    else:
        print("failed to find path for dictionary")


def look_up(word):
    word = word.replace(" ", "")
    if word not in dictionary_map:
        m = tokenizer_obj.tokenize(word, mode)[0]
        word = m.dictionary_form()
        if word not in dictionary_map:
            return None
    result = [
        {"headword": entry[0], "reading": entry[1], "tags": entry[2], "glossary_list": entry[5], "sequence": entry[6]}
        for entry in dictionary_map[word]
    ]
    return result


def get_jpod_audio(url):
    try:
        requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)
        r = requests.get(url, verify=False, timeout=5)
        return r
    except:
        return None


def validate_jpod_audio_url(url):
    jpod_audio = get_jpod_audio(url)
    if jpod_audio:
        return len(jpod_audio.content) != 52288  # invalid audio
    else:
        return False


def get_jpod_audio_url(kanji, kana):
    url = "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji={}&kana={}".format(kanji, kana)
    return url if (validate_jpod_audio_url(url)) else ""


def get_jpod_audio_base64(url):
    jpod_audio = get_jpod_audio(url)
    if jpod_audio:
        return "data:audio/mp3;base64," + str(base64.b64encode(jpod_audio.content))
    else:
        return None


# load_all_dictionaries()
# a = look_up('好')
# print(a)

# def look_up_pitch(word):
#     word = word.strip()
#     if word in pitch_dictionary_map:
#         entry = pitch_dictionary_map[word]
#         print(entry)
#         pitch = entry[2]
#         return {
#             'headword': entry[0],
#             'reading': pitch['reading'],
#             'pitches': pitch['pitches']
#         }
#     else:
#         return None
