import zipfile 
import json

dictionary_map = {}

def load_dictionary(dictionary):
    archive = zipfile.ZipFile(dictionary, 'r')

    result = list()
    for file in archive.namelist():
        if file.startswith('term_bank'):
            with archive.open(file) as f:
                data = f.read()  
                d = json.loads(data.decode("utf-8"))
                result.extend(d)

    for entry in result:
        dictionary_map[entry[0]] = entry # Using headword as key for finding the dictionary entry

def look_up(word):
    if word in dictionary_map:
        entry = dictionary_map[word]
        return {
            'headword': entry[0],
            'reading': entry[1],
            'tags': entry[2],
            'glossary_list': entry[5],
            'sequence': entry[6]
        }
    else:
        return None
