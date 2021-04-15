import time
import os
import re
import sys
import eel
import glob
import base64
import threading
from pathlib import Path
from datetime import datetime
from config import r_config, LOG_CONFIG
from util import create_directory_if_not_exists, base64_to_image_path
from audio import play_audio_from_file

SCRIPT_DIR = Path(__file__).parent 
TEXT_LOG_PATH = Path(SCRIPT_DIR, 'logs', 'text')
IMAGE_LOG_PATH = Path(SCRIPT_DIR, 'logs', 'images')
AUDIO_LOG_PATH = Path(SCRIPT_DIR, 'logs', 'audio')

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

def get_base64_image_with_log(log_id, folder_name):
    imagePath = str(Path(SCRIPT_DIR,'logs', 'images', folder_name, log_id + '.png')) 
    path = Path(SCRIPT_DIR, 'logs', 'images', folder_name)
    if not path.is_dir():
        return None
    file_name = next((f for f in os.listdir(path) if re.match('{}.(?:jpg|jpeg|png|tiff|webp)$'.format(log_id), f)), None)
    if not file_name:
        return None
    image_type = Path(file_name).suffix.split('.')[1]
    with open('{}/{}'.format(path, file_name), 'rb') as image_file:
        base64_bytes  = base64.b64encode(image_file.read())
    base64_image_string = base64_bytes.decode('utf-8')
    return 'data:image/{};base64, {}'.format(image_type, base64_image_string)

@eel.expose
def show_logs():
    saved_logs = get_logs()
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
                        log['image'] =  'data:image/{};base64, {}'.format(image_data['imageType'], image_data['base64ImageString'])
        eel.addLogs(saved_logs)()
    
def get_logs():
    output = []
    if not os.path.exists(TEXT_LOG_PATH):
        return []
    list_of_files = glob.glob(str(TEXT_LOG_PATH) + '/*.txt')
    if len(list_of_files) < 1:
        return []
    latest_file = max(list_of_files, key=os.path.getctime)
    with open(latest_file, 'r', encoding='utf-8') as f:
        for index, line in enumerate(f):
            log_id = line[:15]
            date = parse_time_string(log_id)
            image = get_base64_image_with_log(log_id=log_id, folder_name=Path(latest_file).stem)
            log = {
                'id': log_id,
                'file': Path(latest_file).name,
                'image': image,
                'audio': get_audio_file_name(log_id, Path(latest_file).stem),
                'hours': get_hours_string(date),
                'text': line[16:]
            }
            output.append(log)
        f.close()
    return output

def insert_newest_log_with_image(base64_image_string, image_type):
    saved_logs = get_logs()
    saved_logs[-1]['image'] = 'data:image/{};base64, {}'.format(image_type, base64_image_string)
    eel.addLogs([saved_logs[-1]])()

def insert_newest_log_without_image():
    saved_logs = get_logs()
    eel.addLogs([saved_logs[-1]])()

@eel.expose
def play_log_audio(file_name, folder_name):
    play_audio_from_file(str(Path(AUDIO_LOG_PATH, folder_name, file_name)))

def get_audio_file_name(log_id, folder_name):
    path = Path(AUDIO_LOG_PATH, folder_name)
    if not path.is_dir():
        return None
    file_name = next((f for f in os.listdir(path) if re.match('{}.(?:wav|mp3|mp4|ogg|wma|aac|aiff|flv|m4a|flac)$'.format(log_id), f)), None)
    return file_name