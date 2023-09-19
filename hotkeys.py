import eel
from config import r_config, HOTKEYS_CONFIG

def refresh_ocr_hotkey():
    eel.refreshOCR()

def add_to_anki_hotkey():
    eel.addActiveCardToAnki()

hotkey_map = {
    r_config(HOTKEYS_CONFIG, "refresh_ocr"): refresh_ocr_hotkey,
    r_config(HOTKEYS_CONFIG, "add_to_anki"): add_to_anki_hotkey
}