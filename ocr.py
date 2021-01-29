import cv2
import pytesseract
import numpy as np
from pathlib import Path
import platform
import threading
import base64
from logger import log_text, get_time_string
from config import r_config, LOG_CONFIG, OCR_CONFIG
from util import create_directory_if_not_exists
import requests
import eel
from ocr_space import ocr_space_file, OCRSPACE_API_URL_USA, OCRSPACE_API_URL_EU

HORIZONTAL_TEXT_DETECTION = 6
VERTICAL_TEXT_DETECTON = 5

def get_temp_image_path():
    return str(Path(SCRIPT_DIR,"logs", "images", "temp.png"))

def base64_to_image(base64string, path):
    image_path = base64_to_image_path(base64string, path)
    img = cv2.imread(image_path)
    return img

# Saves base64 image string and returns path
def base64_to_image_path(base64string, path):
    with open(path, "wb") as fh:
        fh.write(base64.b64decode(base64string))
    return path

def detect_and_log(engine, cropped_image,  text_orientation, session_start_time, request_time, log_images=True):
    result = recognize_japanese(engine, cropped_image, text_orientation)
    if result is not None:
        log_text(session_start_time, request_time, result)
        if log_images:
            image_extension = r_config(LOG_CONFIG, "logimagetype")
            file_name = request_time + "." + image_extension
            full_image_path = str(Path(SCRIPT_DIR,"logs", "images", session_start_time, file_name))
            thread = threading.Thread(target = log_video_image,  args=[full_image_path])
            thread.start()
        return result
    else:
        return "Error: OCR Failed"

def log_video_image(image_path):
    create_directory_if_not_exists(image_path)
    base64_image = eel.getVideoImage()()
    base64_to_image_path(base64_image, image_path)

def recognize_japanese(engine, base64img, text_orientation):
    if engine == "OCR Space USA" or engine == "OCR Space EU":
        api_url = OCRSPACE_API_URL_USA if engine == "OCR Space USA" else OCRSPACE_API_URL_EU
        image_path = base64_to_image_path(base64img, get_temp_image_path())
        language = r_config(OCR_CONFIG, "ocr_space_language")
        return ocr_space_file(filename=image_path, language=language, url=api_url)
    else: 
        #default tesseract
        image = base64_to_image(base64img, get_temp_image_path())
        return tesseract_ocr(image, text_orientation)

def tesseract_ocr(image, text_orientation):
    language = r_config(OCR_CONFIG, "tesseract_language")
    psm = HORIZONTAL_TEXT_DETECTION
    if (text_orientation == 'vertical'):
        psm = VERTICAL_TEXT_DETECTON
        language += "_vert"
    custom_config = r'--oem 3 --psm {} -c preserve_interword_spaces=1'.format(psm)
    result = pytesseract.image_to_string(image, config=custom_config, lang=language)
    return result

def path_to_tesseract():
    exec_data = {"Windows": str(Path(SCRIPT_DIR, "win", "tesseract", "tesseract.exe")),
                    "Darwin": "/usr/local/bin/tesseract",
                    "Linux": "/usr/local/bin/tesseract"}

    platform_name = platform.system()  # E.g. 'Windows'
    return exec_data[platform_name], platform_name

SCRIPT_DIR = Path(__file__).parent 
tesseract_cmd, platform_name = path_to_tesseract()
pytesseract.pytesseract.tesseract_cmd = tesseract_cmd