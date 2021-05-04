import eel
import platform
from config import r_config, WINDOWS_HOTKEYS_CONFIG


def refresh_ocr_hotkey():
    eel.refreshOCR()

def add_to_anki_hotkey():
    eel.addActiveCardToAnki()

refresh_hotkey_string = {
    "Linux" : "<ctrl>+q",
    "Darwin": "<cmd>+b",
    "Windows": r_config(WINDOWS_HOTKEYS_CONFIG, "refresh")
}

add_to_anki_hotkey_string = {
    "Linux" : "<ctrl>+e",
    "Darwin": "<cmd>+e",
    "Windows": r_config(WINDOWS_HOTKEYS_CONFIG, "add_to_anki")
}

hotkey_map = {
    refresh_hotkey_string[platform.system()]: refresh_ocr_hotkey,
    add_to_anki_hotkey_string[platform.system()]: add_to_anki_hotkey,
}