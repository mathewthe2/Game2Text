import glob
from pathlib import Path
from tkinter import *
from tkinter.filedialog import askopenfile
from shutil import copyfile
from fuzzywuzzy import process
from config import r_config, w_config, LOG_CONFIG, SCRIPT_MATCH_CONFIG
from tools import bundle_dir

GAME_SCRIPT_PATH = Path(bundle_dir, 'gamescripts')
MATCH_LIMIT= int(r_config(SCRIPT_MATCH_CONFIG, 'match_limit'))

class GameScriptMatcher(object):
    def __init__(self, gamescript):
        self.gamescript = ''
        self.gamescript_dict = {}
        self.init_game_script_dict(gamescript)

    def init_game_script_dict(self, gamescript):
         if (Path(gamescript).is_file()):
            self.gamescript = gamescript
            with open(gamescript, 'r', encoding='utf-8') as f:
                self.gamescript_dict = {index: line for index, line in enumerate(f)}
                f.close()

    def add_matching_script_to_logs(self, gamescript, logs):
        if (gamescript != self.gamescript):
            self.init_game_script_dict(gamescript)
        for log in logs:
            matches = process.extract(log['text'], self.gamescript_dict, limit=MATCH_LIMIT)
            log['matches'] = matches
            print('matches', matches)
            return logs
    

def open_game_script():
    root = Tk()
    root.withdraw()
    file = askopenfile(initialdir=str(GAME_SCRIPT_PATH), filetypes = (("TXT files","*.txt"),("all files","*.*")), defaultextension=".txt")
    if not file:
        return
    try:
        new_file = str(Path(GAME_SCRIPT_PATH, Path(file.name).stem + '.txt'))
        copyfile(file.name, new_file)
        w_config(LOG_CONFIG, {'gamescriptfile': file.name})
    except:
        print('File not selected')
    file.close()
    root.destroy()
    return Path(file.name).stem

def load_game_scripts():
    files = glob.glob(str(Path(GAME_SCRIPT_PATH, '*.txt')))
    return [{
        'name': Path(file).stem,
        'path': str(Path(file))
    } for file in files]

# def add_matching_script_to_logs(gamescript, logs):
#     # TODO: do vicinity scan based on previous line number of highest confidence match
#     for log in logs:
#         matches = process.extract(log['text'], gamescript, limit=MATCH_LIMIT)
#         log['matches'] = matches
#     return logs