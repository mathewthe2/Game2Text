import time
import os
import re
import eel
import glob
import base64
import codecs
import threading
import platform
from pathlib import Path
from datetime import datetime
from config import r_config, LOG_CONFIG
from util import create_directory_if_not_exists, base64_to_image_path
from audio import play_audio_from_file
from gamescript import add_matching_script_to_logs
from tools import bundle_dir

TEXT_LOG_PATH = Path(bundle_dir, 'logs', 'text')
IMAGE_LOG_PATH = Path(bundle_dir, 'logs', 'images')
AUDIO_LOG_PATH = Path(bundle_dir, 'logs', 'audio')

def get_time_string():
    return time.strftime('%Y%m%d-%H%M%S')

def parse_time_string(time_string):
    return datetime.strptime(time_string, '%Y%m%d-%H%M%S')

def get_hours_string(datetime_object):
    return datetime.strftime(datetime_object, '%I:%M%p')

def log_text(start_time,request_time, text):
    parsed_text =  text.replace('\n', '')
    if (len(parsed_text) < 1):
        return
    filename = '{}/{}.txt'.format(TEXT_LOG_PATH, start_time)
    create_directory_if_not_exists(filename)
    with open(filename, 'a', encoding='utf-8', newline='') as f:
        if(os.path.getsize(filename) > 0):
            f.write('{}{}, {}'.format('\n', request_time, parsed_text))
        else:
            f.write('{}, {}'.format(request_time, parsed_text))
        f.close()
        
def log_media(session_start_time, request_time, audio_recorder):
    is_log_images = r_config(LOG_CONFIG, 'logimages').lower() == 'true'
    is_log_audio = r_config(LOG_CONFIG, 'logaudio').lower() == 'true'
    audio_duration = float(r_config(LOG_CONFIG, 'logaudioduration'))
    if is_log_audio:
        file_name = request_time + '.' + r_config(LOG_CONFIG, 'logaudiotype')
        audio_file_path = str(Path(AUDIO_LOG_PATH, session_start_time, file_name))
        create_directory_if_not_exists(audio_file_path)
        audio_recorder.stop_recording(audio_file_path, audio_duration)
        eel.restartAudioRecording()()
    if is_log_images:
        image_extension = r_config(LOG_CONFIG, 'logimagetype')
        file_name = request_time + '.' + image_extension
        full_image_path = str(Path(IMAGE_LOG_PATH, session_start_time, file_name))
        thread = threading.Thread(target = log_video_image,  args=[full_image_path])
        thread.start()
    else:
        insert_newest_log_without_image()

def log_video_image(image_path):
    create_directory_if_not_exists(image_path)
    base64_image = eel.getVideoImage()()
    # Manually add image data to log data because image is yet to be saved to file
    insert_newest_log_with_image(base64_image, os.path.splitext(image_path)[1])
    # Save image
    base64_to_image_path(base64_image, image_path)


def get_image_type(log_id, folder_name):
    path = Path(IMAGE_LOG_PATH, folder_name)
    if not path.is_dir():
        return None
    file_name = next((f for f in os.listdir(path) if re.match('{}.(?:jpg|jpeg|png|tiff|webp)$'.format(log_id), f)), None)
    if not file_name:
        return None
    return Path(file_name).suffix.split('.')[1]

def get_base64_image_with_log(log_id, folder_name):
    imagePath = str(Path(IMAGE_LOG_PATH, folder_name, log_id + '.png')) 
    path = Path(IMAGE_LOG_PATH, folder_name)
    if not path.is_dir():
        return None
    file_name = next((f for f in os.listdir(path) if re.match('{}.(?:jpg|jpeg|png|tiff|webp)$'.format(log_id), f)), None)
    if not file_name:
        return None
    with open('{}/{}'.format(path, file_name), 'rb') as image_file:
        base64_bytes  = base64.b64encode(image_file.read())
    base64_image_string = base64_bytes.decode('utf-8')
    return base64_image_string

@eel.expose
def show_logs():
    last_session_max_log_size = int(r_config(LOG_CONFIG, 'lastsessionmaxlogsize'))
    saved_logs = get_logs(limit=last_session_max_log_size)
    if len(saved_logs) > 0:
        # Workaround to fix the problem first image data is not transferred to log window
        image_data_list = eel.getCachedScreenshots()() 
        if image_data_list:
            for log in saved_logs:
                if log['id'] in image_data_list.keys():
                    # Remove cache if file is saved
                    if log['image']:
                        eel.removeCachedScreenshot(log['id'])()
                    # Get image from cache
                    else:
                        image_data = image_data_list[log['id']]
                        log['image'] =  image_data['base64ImageString']
                        log['image_type'] = image_data['imageType']
        return saved_logs


def text_to_log(text, file_path):
    log_id = text[:15]
    date = parse_time_string(log_id)
    image = get_base64_image_with_log(log_id=log_id, folder_name=Path(file_path).stem)
    image_type = get_image_type(log_id=log_id, folder_name=Path(file_path).stem)
    log = {
        'id': log_id,
        'file': Path(file_path).name,
        'folder': Path(file_path).stem,
        'image': image,
        'image_type': image_type,
        'audio': get_audio_file_name(log_id, Path(file_path).stem),
        'hours': get_hours_string(date),
        'text': text[16:]
    }
    return log

def add_gamescript_to_logs(logs):
    gamescript = r_config(LOG_CONFIG, 'gamescriptfile',)
    if (gamescript):
        if (Path(gamescript).is_file()):
            with open(gamescript, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                f.close()
            logs = add_matching_script_to_logs(lines, logs)
            for log in logs:
                eel.updateLogDataById(log['id'], {'matches': log['matches'],})()    
    return
    
def get_logs(limit=0):
    output = []
    if not os.path.exists(TEXT_LOG_PATH):
        return []
    list_of_files = glob.glob(str(TEXT_LOG_PATH) + '/*.txt')
    if len(list_of_files) < 1:
        return []
    latest_file = max(list_of_files, key=os.path.getctime)
    with open(latest_file, 'r', encoding='utf-8') as f:
        for line in f:
            log = text_to_log(line, latest_file)
            output.append(log)
        f.close()
    if limit > 0 and len(output) > limit:
        output = output[-limit:]
    # Start another thread to match logs to game script
    thread = threading.Thread(target = add_gamescript_to_logs,  args=[output])
    thread.start()
    return output

def get_latest_log():
    log = {}
    if not os.path.exists(TEXT_LOG_PATH):
        return {}
    list_of_files = glob.glob(str(TEXT_LOG_PATH) + '/*.txt')
    if len(list_of_files) < 1:
        return {}
    latest_file = max(list_of_files, key=os.path.getctime)
    if not latest_file:
        return None
    with open(latest_file, 'r', encoding='utf-8') as f:
        for line in f:
            pass
        last_line = line
        log = text_to_log(last_line, latest_file)
    f.close()
    # Start another thread to match log to game script
    thread = threading.Thread(target = add_gamescript_to_logs,  args=[[log],]) 
    thread.start()
    return log

@eel.expose
def delete_log(log_id, folder_name):
    filename = '{}/{}.txt'.format(TEXT_LOG_PATH, folder_name)
    if (Path(filename).is_file()):
        temp_filename = '{}/temp.txt'.format(TEXT_LOG_PATH)
        # lines = []
        with open(filename, "r", encoding='utf-8') as file:
            lines = file.readlines()
        with open(temp_filename, "w", encoding='utf-8') as new_file:
            newLines = [line.rstrip('\r\n') for line in lines if line[:15] != log_id]
            for line in newLines:
                if line != newLines[0]:
                    new_file.write('\n')
                new_file.write(line)

        # Remove original file and rename the temporary as the original one
        os.remove(filename)
        os.rename(temp_filename, filename)
        return
    return 

@eel.expose
def update_log_text(log_id, folder_name, text):
    parsed_text =  text.replace('\n', '')
    if (len(parsed_text) < 1):
        return
    filename = '{}/{}.txt'.format(TEXT_LOG_PATH, folder_name)
    if (Path(filename).is_file()):
        temp_filename = '{}/temp.txt'.format(TEXT_LOG_PATH)
        with codecs.open(filename, 'r', encoding='utf-8') as fi, \
            codecs.open(temp_filename, 'w', encoding='utf-8') as fo:

            for line in fi:
                line_id = line[:15]
                if (line_id == log_id):
                    fo.write('{}, {}'.format(log_id, parsed_text))
                else:
                    fo.write(line)

        # Remove original file and rename the temporary as the original one
        os.remove(filename)
        os.rename(temp_filename, filename)
        return
    return
        
def insert_newest_log_with_image(base64_image_string, image_type):
    log = get_latest_log()
    log['image'] = base64_image_string
    log['image_type'] = image_type
    eel.addLogs([log])()

def insert_newest_log_without_image():
    eel.addLogs([get_latest_log()])()

@eel.expose
def play_log_audio(file_name, folder_name):
    file = Path(AUDIO_LOG_PATH, folder_name, file_name)
    if file:
        return play_audio_from_file(str(file))

@eel.expose
def delete_audio_file(log_id, folder_name):
    file = get_audio_file_name(log_id, folder_name)
    if (file):
        full_path = Path(AUDIO_LOG_PATH, folder_name, file)
        os.remove(full_path)
        return True
    else:
        return False

def get_audio_file_name(log_id, folder_name):
    path = Path(AUDIO_LOG_PATH, folder_name)
    if not path.is_dir():
        return None
    file_name = next((f for f in os.listdir(path) if re.match('{}.(?:wav|mp3|mp4|ogg|wma|aac|aiff|flv|m4a|flac)$'.format(log_id), f)), None)
    # Temporary fix for Mac OS: change file type since mp3 hasn't finished converting
    if platform.system() == 'Darwin':
        file_name = log_id + '.' + r_config(LOG_CONFIG, 'logaudiotype')
    return file_name

# Middleman for selected main window to launch add card in log window
@eel.expose
def highlight_text_in_logs(text):
    eel.showCardWithSelectedText(text)()