import eel
import threading, os, platform
from ocr import detect_and_log
from translate import deepl_translate
from hotkeys import refresh_ocr_hotkey, esc_hotkey
from util import RepeatedTimer, open_folder_by_relative_path
from audio import get_default_device_index, get_audio_objects
from recordaudio import RecordThread
from pynput import keyboard
from clipboard import clipboard_to_output, text_to_clipboard
from logger import get_time_string
from config import r_config, w_config, WINDOWS_HOTKEYS_CONFIG, APP_CONFIG, LOG_CONFIG

session_start_time = get_time_string()

# run_eel()

# Set web files folder and optionally specify which file types to check for eel.expose()
#   *Default allowed_extensions are: ['.js', '.html', '.txt', '.htm', '.xhtml']

def close(page, sockets):
    if not sockets:
      os._exit(0)

@eel.expose                         # Expose this function to Javascript
def recognize_image(engine, image, orientation):
    return detect_and_log(engine, image, orientation, session_start_time, get_time_string(), audio_recorder)

@eel.expose                         # Expose this function to Javascript
def translate(text):
    return deepl_translate(text)

@eel.expose
def monitor_clipboard():
    if clipboard_timer.is_running:
        clipboard_timer.stop()
    else:
        clipboard_timer.start()

@eel.expose
def restart_audio_recording(device_index=get_default_device_index()):
    global audio_recorder
    if not audio_recorder.bRecord:
        audio_recorder.stop_recording(None, -1)
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
def open_folder(relative_path):
    open_folder_by_relative_path(relative_path)

@eel.expose 
def get_audio_sources():
    return get_audio_objects()

@eel.expose
def open_new_window(html_file, height=800, width=600):
    eel.start(html_file, 
    close_callback=close, 
    mode=r_config(APP_CONFIG, "browser"),
    host=r_config(APP_CONFIG, "host"),
    size=(width, height), 
    port = 0)
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

# Thread to export clipboard text continuously
clipboard_timer = RepeatedTimer(1, clipboard_to_output)
clipboard_timer.stop() # stop the initial timer

# Thread to record audio continuously
audio_recorder = RecordThread(get_default_device_index(), int(r_config(LOG_CONFIG, "logaudioframes")))
audio_recorder.start()

refresh_hotkey_string = {
    "Linux" : "<ctrl>+q",
    "Darwin": "<cmd>+b",
    "Windows": r_config(WINDOWS_HOTKEYS_CONFIG, "refresh")
}

with keyboard.GlobalHotKeys({
    refresh_hotkey_string[platform.system()]: refresh_ocr_hotkey,
    '<esc>': esc_hotkey}) as h:
    h.join()