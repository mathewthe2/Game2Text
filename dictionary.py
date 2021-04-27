import zipfile 
import json
from sudachipy import tokenizer
from sudachipy import dictionary
from logger import SCRIPT_DIR
from pathlib import Path

dictionary_map = {}
pitch_dictionary_map = {}

# Sudachi Parser
tokenizer_obj = dictionary.Dictionary(dict_type='small').create()
mode = tokenizer.Tokenizer.SplitMode.A

def load_dictionary(dictionary):
    output_map = {}
    archive = zipfile.ZipFile(dictionary, 'r')

    result = list()
    for file in archive.namelist():
        if file.startswith('term'):
            with archive.open(file) as f:
                data = f.read()  
                d = json.loads(data.decode("utf-8"))
                result.extend(d)

    for entry in result:
        if (entry[0] in output_map):
            output_map[entry[0]].append(entry) 
        else:
            output_map[entry[0]] = [entry] # Using headword as key for finding the dictionary entry
    return output_map

def load_all_dictionaries():
    global dictionary_map
    dictionary_map = load_dictionary(str(Path(SCRIPT_DIR, 'dictionaries', 'jmdict_english.zip')))
    # pitch_dictionary_map = load_sdictionary(str(Path(SCRIPT_DIR, 'dictionaries', 'kanjium_pitch_accents.zip')))

def look_up(word):
    word = word.replace(" ", "")
    if word not in dictionary_map:
        m = tokenizer_obj.tokenize(word, mode)[0]
        word = m.dictionary_form()
        if word not in dictionary_map:
            return None
    result = [{
        'headword': entry[0],
        'reading': entry[1],
        'tags': entry[2],
        'glossary_list': entry[5],
        'sequence': entry[6]
    } for entry in dictionary_map[word]]
    return result

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