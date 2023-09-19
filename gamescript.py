import glob
from pathlib import Path
from shutil import copyfile
from tkinter import *
from tkinter.filedialog import askopenfile

from fuzzywuzzy import process

from config import LOG_CONFIG, SCRIPT_MATCH_CONFIG, r_config, w_config
from tools import bundle_dir

GAME_SCRIPT_PATH = Path(bundle_dir, "gamescripts")
MATCH_LIMIT = int(r_config(SCRIPT_MATCH_CONFIG, "match_limit"))
CONFIDENCE_THRESHOLD = int(r_config(SCRIPT_MATCH_CONFIG, "confidence_threshold"))
REGIONAL_SCAN_AREA = 100

current_gamescript = ""
gamescript_dict = {}
last_match_line = None


def open_game_script():
    root = Tk()
    root.withdraw()
    file = askopenfile(
        initialdir=str(GAME_SCRIPT_PATH),
        filetypes=(("TXT files", "*.txt"), ("all files", "*.*")),
        defaultextension=".txt",
    )
    if not file:
        return
    try:
        new_file = str(Path(GAME_SCRIPT_PATH, Path(file.name).stem + ".txt"))
        copyfile(file.name, new_file)
        w_config(LOG_CONFIG, {"gamescriptfile": file.name})
    except:
        print("File not selected")
    file.close()
    root.destroy()
    return Path(file.name).stem


def load_game_scripts():
    files = glob.glob(str(Path(GAME_SCRIPT_PATH, "*.txt")))
    return [{"name": Path(file).stem, "path": str(Path(file))} for file in files]


def get_regional_scan_lines():
    if last_match_line is None:
        return gamescript_dict
    else:
        lower = last_match_line - REGIONAL_SCAN_AREA
        upper = 0
        if lower < 0:
            upper = lower * -1
            lower = 0
        upper += last_match_line + REGIONAL_SCAN_AREA
        if upper > len(gamescript_dict):
            upper = len(gamescript_dict)
        lines = {}
        print("lower", lower)
        print("upper", upper)
        for index in range(lower, upper):
            lines[index] = gamescript_dict[index]
        return lines


def init_gamescript(gamescript):
    if Path(gamescript).is_file():
        global current_gamescript
        current_gamescript = gamescript
        with open(gamescript, "r", encoding="utf-8") as f:
            global gamescript_dict
            gamescript_dict = {index: line.strip() for index, line in enumerate(f)}
            f.close()


def add_matching_script_to_logs(gamescript, logs):
    if gamescript != current_gamescript:
        init_gamescript(gamescript)

    if gamescript_dict is None:
        init_gamescript(gamescript)

    lines = get_regional_scan_lines()

    for log in logs:
        matches = process.extract(log["text"], lines, limit=MATCH_LIMIT)
        log["matches"] = matches
        if matches:
            if matches[0][1] > CONFIDENCE_THRESHOLD:
                global last_match_line
                last_match_line = matches[0][2]
            else:
                if last_match_line:  # Regional scan failed
                    last_match_line = None
                    add_matching_script_to_logs(gamescript, logs)
                last_match_line = None
    return logs
