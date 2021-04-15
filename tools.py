import os 
import platform
from pathlib import Path
from config import r_config, OCR_CONFIG

SCRIPT_DIR = Path(__file__).parent 
OSX_TESSERACT_VERSION = "4.1.1"

def path_to_ffmpeg():
    platform_name = platform.system()
    if platform_name == 'Windows':
        return str(Path(SCRIPT_DIR, "win", "ffmpeg", "ffmpeg.exe"))
    elif platform_name == 'Darwin':
        return ''
    return ''

def path_to_ffmpeg_folder():
    return str(Path(path_to_ffmpeg()).parent)

def path_to_tesseract():
    exec_data = {"Windows": str(Path(SCRIPT_DIR, "win", "tesseract", "tesseract.exe")),
                    "Darwin": str(Path(SCRIPT_DIR, "mac", "tesseract", OSX_TESSERACT_VERSION, "bin", "tesseract")),
                    "Linux": "/usr/local/bin/tesseract"}
    platform_name = platform.system()  # E.g. 'Windows'
    return exec_data[platform_name], platform_name

def get_tessdata_dir():
    platform_name = platform.system() 
    if platform_name == 'Darwin':
        if r_config(OCR_CONFIG, "oem") == '0': 
            # legacy tesseract
            return '--tessdata-dir {}'.format(str(Path(SCRIPT_DIR, "mac", "tesseract", OSX_TESSERACT_VERSION, "share", "legacy", "tessdata")))
        else:
            return '--tessdata-dir {}'.format(str(Path(SCRIPT_DIR, "mac", "tesseract", OSX_TESSERACT_VERSION, "share", "tessdata")))
    elif platform_name == 'Windows':
        if (r_config(OCR_CONFIG, "oem") == '0' and Path(SCRIPT_DIR, "win", "tesseract", "tessdata-legacy").exists()): 
            # legacy tesseract by renaming tessdata folders
            os.rename(Path(SCRIPT_DIR, "win", "tesseract", "tessdata"), Path(SCRIPT_DIR, "win", "tesseract", "tessdata-new"))
            os.rename(Path(SCRIPT_DIR, "win", "tesseract", "tessdata-legacy"), Path(SCRIPT_DIR, "win", "tesseract", "tessdata"))
        elif (r_config(OCR_CONFIG, "oem") != '0' and Path(SCRIPT_DIR, "win", "tesseract", "tessdata-new").exists()):  
            # revert to default tessdata folder
            os.rename(Path(SCRIPT_DIR, "win", "tesseract", "tessdata"), Path(SCRIPT_DIR, "win", "tesseract", "tessdata-legacy"))
            os.rename(Path(SCRIPT_DIR, "win", "tesseract", "tessdata-new"), Path(SCRIPT_DIR, "win", "tesseract", "tessdata"))
    return ''