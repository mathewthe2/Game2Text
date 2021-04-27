import eel
import threading, os, platform
from pathlib import Path
from ocr import detect_and_log
from translate import multi_translate
from hotkeys import refresh_ocr_hotkey, esc_hotkey
from util import RepeatedTimer, open_folder_by_relative_path, create_directory_if_not_exists
from audio import get_recommended_device_index, get_audio_objects
from recordaudio import RecordThread
from pynput import keyboard
from clipboard import clipboard_to_output, text_to_clipboard
from logger import get_time_string, AUDIO_LOG_PATH, SCRIPT_DIR
from ankiconnect import invoke, get_anki_models, update_anki_models, create_anki_note, fetch_anki_fields
from imageprofile import export_image_profile, load_image_profiles, open_image_profile
from gamescript import load_game_scripts, open_game_script
from dictionary import load_all_dictionaries, look_up
from config import r_config, w_config, WINDOWS_HOTKEYS_CONFIG, APP_CONFIG, LOG_CONFIG

session_start_time = get_time_string()

# run_eel()

# Set web files folder and optionally specify which file types to check for eel.expose()
#   *Default allowed_extensions are: ['.js', '.html', '.txt', '.htm', '.xhtml']

def close(page, sockets):
    if not sockets:
      os._exit(0)

@eel.expose     
def recognize_image(engine, image, orientation):
    return detect_and_log(engine, image, orientation, session_start_time, get_time_string(), audio_recorder)

@eel.expose
def export_image_filter_profile(profile):
    return export_image_profile(profile)

@eel.expose
def load_image_filter_profiles():
    return load_image_profiles()

@eel.expose
def open_image_filter_profile():
    return open_image_profile()

@eel.expose
def load_game_text_scripts():
    return load_game_scripts()

@eel.expose
def open_game_text_script():
    return open_game_script()

@eel.expose        
def translate(text):
    return multi_translate(text)

@eel.expose
def monitor_clipboard():
    if clipboard_timer.is_running:
        clipboard_timer.stop()
    else:
        clipboard_timer.start()

@eel.expose
def start_manual_recording(request_time, session_start_time):
    global manual_audio_recorder
    global manual_audio_file_path
    if manual_audio_recorder.is_recording():
        stop_manual_recording()
    file_name = request_time + '.' + r_config(LOG_CONFIG, 'logaudiotype')
    manual_audio_file_path = str(Path(AUDIO_LOG_PATH, session_start_time, file_name))
    device_index = get_recommended_device_index(r_config(LOG_CONFIG, 'logaudiohost'))
    manual_audio_recorder = RecordThread(device_index, int(r_config(LOG_CONFIG, "logaudioframes")))
    manual_audio_recorder.start()

@eel.expose
def stop_manual_recording():
    if manual_audio_recorder.is_recording():
        create_directory_if_not_exists(manual_audio_file_path)
        manual_audio_recorder.stop_recording(manual_audio_file_path, -1)
        file_name = os.path.basename(manual_audio_file_path)
        return file_name
    return ''

@eel.expose
def restart_audio_recording(device_index):
    global audio_recorder
    audio_recorder = RecordThread(device_index, int(r_config(LOG_CONFIG, "logaudioframes")))
    audio_recorder.start()

@eel.expose
def copy_text_to_clipboard(text):
    text_to_clipboard(text)

@eel.expose
def read_config(section, key):
    return r_config(section, key)

@eel.expose
def update_config(section, d):
    return w_config(section, d)

@eel.expose
def invoke_anki(action, params={}):
    return invoke(action, params)

@eel.expose
def get_anki_card_models():
    return get_anki_models()

@eel.expose
def fetch_anki_fields_by_modals(model_names):
    fetch_anki_fields_thread = threading.Thread(target=fetch_anki_fields, args=((model_names,)))
    fetch_anki_fields_thread.start()

@eel.expose
def update_anki_card_models(ankiModels):
    return update_anki_models(ankiModels)

@eel.expose
def create_note(note_data):
    return create_anki_note(note_data)

@eel.expose
def look_up_dictionary(word):
    return look_up(word)

@eel.expose
def open_new_window(html_file, height=900, width=600):
    eel.start(html_file, 
    close_callback=close, 
    mode=r_config(APP_CONFIG, "browser"),
    host=r_config(APP_CONFIG, "host"),
    size=(width, height), 
    port = int(r_config(APP_CONFIG, "port")))
    return

def run_eel():
    eel.init('web', allowed_extensions=['.js', '.html', '.map'])
    eel.start('index.html',
    close_callback=close, 
    mode=r_config(APP_CONFIG, "browser"), 
    host=r_config(APP_CONFIG, "host"), 
    port=int(r_config(APP_CONFIG, "port"))
    )

main_thread = threading.Thread(target=run_eel, args=())
main_thread.start()

# Thread to load dictionaries
dictionary_thread = threading.Thread(target=load_all_dictionaries, args=()) 
dictionary_thread.start()

# Thread to record audio continuously
recommended_audio_device_index = get_recommended_device_index(r_config(LOG_CONFIG, 'logaudiohost'))
audio_recorder = RecordThread(recommended_audio_device_index, int(r_config(LOG_CONFIG, "logaudioframes")))
is_log_audio = r_config(LOG_CONFIG, "logaudio").lower() == "true"
if is_log_audio and recommended_audio_device_index != -1:
    audio_recorder.start()

# Thread to manually record audio
manual_audio_recorder = RecordThread(recommended_audio_device_index, int(r_config(LOG_CONFIG, "logaudioframes")))
manual_audio_file_path = ''

# Thread to export clipboard text continuously
clipboard_timer = RepeatedTimer(1, clipboard_to_output)
clipboard_timer.stop() # stop the initial timer

refresh_hotkey_string = {
    "Linux" : "<ctrl>+q",
    "Darwin": "<cmd>+b",
    "Windows": r_config(WINDOWS_HOTKEYS_CONFIG, "refresh")
}

with keyboard.GlobalHotKeys({
    refresh_hotkey_string[platform.system()]: refresh_ocr_hotkey,
    '<esc>': esc_hotkey}) as h:
    h.join()