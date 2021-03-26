import time
import os
import re
import sys
import eel
import glob
import base64
from pathlib import Path
from datetime import datetime
from util import create_directory_if_not_exists

SCRIPT_DIR = Path(__file__).parent 
TEXT_LOG_PATH = Path(SCRIPT_DIR, "logs", "text")

def get_time_string():
    return time.strftime("%Y%m%d-%H%M%S")

def parse_time_string(time_string):
    return datetime.strptime(time_string, "%Y%m%d-%H%M%S")

def get_hours_string(datetime_object):
    return datetime.strftime(datetime_object, "%I:%M%p")

def log_text(start_time,request_time, text):
    parsed_text =  text.replace("\n", "")
    if (len(parsed_text) < 1):
        return
    filename = "{}/{}.txt".format(TEXT_LOG_PATH, start_time)
    create_directory_if_not_exists(filename)
    with open(filename, "a", encoding="utf-8", newline='') as f:
        if(os.path.getsize(filename) > 0):
            f.write("{}{}, {}".format("\n", request_time, parsed_text))
        else:
            f.write("{}, {}".format(request_time, parsed_text))
        f.close()

def get_base64_image_with_log(log_id, folder_name):
    # imagePath = str(Path(SCRIPT_DIR,"logs", "images", folder_name, log_id + ".png")) 
    path = Path(SCRIPT_DIR, "logs", "images", folder_name)
    if not path.is_dir():
        return None
    file_name = next((f for f in os.listdir(path) if re.match('{}.(?:jpg|jpeg|png)$'.format(log_id), f)), None)
    if not file_name:
        return None
    image_type = Path(file_name).suffix.split('.')[1]
    with open('{}/{}'.format(path, file_name), "rb") as image_file:
        base64_bytes  = base64.b64encode(image_file.read())
    base64_image_string = base64_bytes.decode('utf-8')
    return 'data:image/{};base64, {}'.format(image_type, base64_image_string)

@eel.expose
def show_logs():
    output = []
    if not os.path.exists(TEXT_LOG_PATH):
        return []
    list_of_files = glob.glob(str(TEXT_LOG_PATH) + '/*.txt')
    if len(list_of_files) < 1:
        return []
    latest_file = max(list_of_files, key=os.path.getctime)
    with open(latest_file, "r", encoding="utf-8") as f:
        for index, line in enumerate(f):
            log_id = line[:15]
            date = parse_time_string(log_id)
            image = get_base64_image_with_log(log_id=log_id, folder_name=Path(latest_file).stem)
            log = {
                'id': log_id,
                'file': Path(latest_file).name,
                'image': image,
                'hours': get_hours_string(date),
                'text': line[16:]
            }
            output.append(log)
        f.close()
    return output