import eel

from config import HOTKEYS_CONFIG, r_config


def refresh_ocr_hotkey():
    eel.refreshOCR()


def add_to_anki_hotkey():
    eel.addActiveCardToAnki()


def record_audio_hotkey():
    eel.resetAudioRecording()


hotkey_map = {
    r_config(HOTKEYS_CONFIG, "refresh_ocr"): refresh_ocr_hotkey,
    r_config(HOTKEYS_CONFIG, "add_to_anki"): add_to_anki_hotkey,
    r_config(HOTKEYS_CONFIG, "record_audio"): record_audio_hotkey,
}
