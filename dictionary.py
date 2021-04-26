import zipfile 
import json
# import tinysegmenter
from logger import SCRIPT_DIR
from pathlib import Path

dictionary_map = {}
pitch_dictionary_map = {}

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
    if word in dictionary_map:
        result = [{
            'headword': entry[0],
            'reading': entry[1],
            'tags': entry[2],
            'glossary_list': entry[5],
            'sequence': entry[6]
        } for entry in dictionary_map[word]]
        return result
    else:
        return None

# load_all_dictionaries()
# a = look_up('画面')
# print(a)

# def look_up_pitch(word):
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

# def look_up_with_parse(word, word_start_index, sentence):
#     dictionary_entry = look_up(word)
#     if (dictionary_entry):
#         return dictionary_entry
#     else:
#         segmenter = tinysegmenter.TinySegmenter()
#         words = segmenter.tokenize(sentence[word_start_index:])
        
#     print(' | '.join(segmenter.tokenize(sentence)))

# def parse_text(sentence):
#     segmenter = tinysegmenter.TinySegmenter()
#     print(' | '.join(segmenter.tokenize(sentence)))

# parse_text(u"私の名前は中野です")