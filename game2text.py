import eel
import threading, os, platform, time
from pathlib import Path
from ocr import detect_and_log
from translate import multi_translate
from hotkeys import hotkey_map
from util import RepeatedTimer, create_directory_if_not_exists, get_default_browser_name, get_PID_list, remove_repeat_phrases, remove_spaces
from textractor import Textractor
from tools import path_to_textractor, open_folder_textractor_path
from audio import get_recommended_device_index
from recordaudio import RecordThread
from pynput import keyboard
from clipboard import clipboard_to_output, text_to_clipboard
from logger import get_time_string, log_text, log_media, update_log_text, AUDIO_LOG_PATH
from ankiconnect import invoke, get_anki_models, update_anki_models, create_anki_note, fetch_anki_fields
from imageprofile import export_image_profile, load_image_profiles, open_image_profile
from gamescript import load_game_scripts, open_game_script
from dictionary import load_all_dictionaries, look_up, get_local_dictionaries, load_dictionary, get_jpod_audio_url
from config import r_config, r_config_all, r_config_section, w_config, APP_CONFIG, LOG_CONFIG, TEXTHOOKER_CONFIG

session_start_time = get_time_string()
textractor = None

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
def log_output(text):
    log_id = get_time_string()
    log_text(session_start_time, log_id, text)
    log_media(session_start_time, log_id, audio_recorder)
    return log_id

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
def update_main_window_text(text):
    is_log_text = False
    eel.updateOutput(text, is_log_text)()

@eel.expose
def update_log_window_text(log_id, text):
    update_log_text(log_id, session_start_time, text)
    eel.updateLogDataById(log_id, {'text': text})()

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
        audio_exists = manual_audio_recorder.has_audio()
        manual_audio_recorder.stop_recording(manual_audio_file_path, -1)
        if audio_exists:
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
def read_config_all():
    return r_config_all()

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
def set_dictionary(dictionary):
    load_dictionary(dictionary)

@eel.expose
def get_jpod_url(kanji, kana):
    return get_jpod_audio_url(kanji=kanji, kana=kana)

@eel.expose
def get_dictionaries():
    return get_local_dictionaries()

@eel.expose
def look_up_dictionary(word):
    return look_up(word)

@eel.expose
def get_path_to_textractor():
    return path_to_textractor()

@eel.expose
def open_folder_for_textractor():
    return open_folder_textractor_path()

@eel.expose
def get_PIDs():
    return get_PID_list()

@eel.expose
def attach_process(pids):
    textractor_thread = threading.Thread(target=start_textractor, args=[pids,])
    textractor_thread.start()

@eel.expose
def detach_process(pids):
    try:
        global textractor
        for pid in pids:
            textractor.detach(pid)
    except Exception as e:
        print('error', str(e))
        return 'Error: failed to detach processes' + str(e)

def start_textractor(pids):
    try:
        global textractor
        textractor = Textractor(executable_path=path_to_textractor(), callback=monitor_textractor)
        time.sleep(1)
        textractor.attach_multiple(pids)
        textractor.read()
    except Exception as e:
        print('error', str(e))
        return 'Error: failed to attach processes' + str(e)

@eel.expose
def hook_code(code, pids):
    try:
        global textractor
        for pid in pids:
            textractor.hook(code, pid)
    except Exception as e:
        print(e)
        return 'Error: failed to hook code'

def monitor_textractor(output_objects):
    texthooker_config = r_config_section(TEXTHOOKER_CONFIG)
    is_remove_repeat = texthooker_config['remove_repeat'] == 'true'
    is_remove_spaces = texthooker_config['remove_spaces'] == 'true'

    if is_remove_repeat or is_remove_spaces:
        for output in output_objects:
            output['text'] = output['text'].strip()
            output['text'] = remove_repeat_phrases(output['text']) if is_remove_repeat else output['text']
            output['text'] = remove_spaces(output['text']) if is_remove_spaces else output['text']

    eel.textractorPipe(output_objects)

@eel.expose
def open_new_window(html_file, height=900, width=600):
    eel.start(html_file, 
    close_callback=close, 
    mode=get_default_browser_name() if r_config(APP_CONFIG, "browser") == 'default' else r_config(APP_CONFIG, "browser"), 
    host=r_config(APP_CONFIG, "host"),
    size=(width, height), 
    port = int(r_config(APP_CONFIG, "port")))
    return

def run_eel():
    eel.init('web', allowed_extensions=['.js', '.html', '.map'])
    eel.start('index.html',
    close_callback=close, 
    mode=get_default_browser_name() if r_config(APP_CONFIG, "browser") == 'default' else r_config(APP_CONFIG, "browser"), 
    host=r_config(APP_CONFIG, "host"), 
    port=int(r_config(APP_CONFIG, "port"))
    )

main_thread = threading.Thread(target=run_eel, args=())
main_thread.start()

# Thread to load dictionaries
dictionary_thread = threading.Thread(target=load_all_dictionaries, args=()) 
dictionary_thread.start()

# Thread to record audio continuously
logaudiohost = r_config(LOG_CONFIG, 'logaudiohost')
recommended_audio_device_index = get_recommended_device_index(logaudiohost)
logaudioframes = int(r_config(LOG_CONFIG, "logaudioframes"))
audio_recorder = RecordThread(recommended_audio_device_index, logaudioframes)
is_log_audio = r_config(LOG_CONFIG, "logaudio").lower() == "true"
# TODO: Fix input overflowed error if start logging audio on Mac automatically at launch
is_mac = (platform.system() == 'Darwin')
if is_mac:
    is_log_audio  = False
    w_config(LOG_CONFIG, {"logaudio": 'false'})
if is_log_audio and recommended_audio_device_index != -1:
    audio_recorder.start()

# Thread to manually record audio
manual_audio_recorder = RecordThread(recommended_audio_device_index, int(r_config(LOG_CONFIG, "logaudioframes")))
manual_audio_file_path = ''

# Thread to export clipboard text continuously
clipboard_timer = RepeatedTimer(1, clipboard_to_output)
clipboard_timer.stop() # stop the initial timer

with keyboard.GlobalHotKeys(hotkey_map) as listener:
    listener.join()