import eel
import glob
from pathlib import Path
from tkinter import *
from tkinter.filedialog import askopenfile
from shutil import copyfile
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
from config import w_config, LOG_CONFIG

SCRIPT_DIR = Path(__file__).parent 
GAME_SCRIPT_PATH = Path(SCRIPT_DIR, 'gamescripts')
MATCH_LIMIT= 4

def open_game_script():
    root = Tk()
    root.withdraw()
    file = askopenfile(initialdir=str(GAME_SCRIPT_PATH), filetypes = (("TXT files","*.txt"),("all files","*.*")), defaultextension=".txt")
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

def add_matching_script_to_logs(gamescript, logs):
    # TODO: do vicinity scan based on previous line number of highest confidence match
    for log in logs:
        matches = process.extract(log['text'], gamescript, limit=MATCH_LIMIT)
        log['matches'] = matches
    return logs