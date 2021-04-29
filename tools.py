import os 
import platform
from pathlib import Path
from config import r_config, OCR_CONFIG

SCRIPT_DIR = Path(__file__).parent 
OSX_TESSERACT_VERSION = "4.1.1"
WIN_TESSERACT_DIR = Path(SCRIPT_DIR, "resources", "bin", "win", "tesseract")
OSX_TESSERACT_DIR = Path(SCRIPT_DIR, "resources", "bin", "mac", "tesseract", OSX_TESSERACT_VERSION)

def path_to_ffmpeg():
    platform_name = platform.system()
    if platform_name == 'Windows':
        return str(Path(SCRIPT_DIR, "resources", "bin", "win", "ffmpeg", "ffmpeg.exe"))
    elif platform_name == 'Darwin':
        return ''
    return ''

def path_to_ffmpeg_folder():
    return str(Path(path_to_ffmpeg()).parent)

def path_to_tesseract():
    exec_data = {"Windows": str(Path(WIN_TESSERACT_DIR, "tesseract.exe")),
                    "Darwin": str(Path(OSX_TESSERACT_DIR, "bin", "tesseract")),
                    "Linux": "/usr/local/bin/tesseract"}
    platform_name = platform.system()  # E.g. 'Windows'
    return exec_data[platform_name], platform_name

def get_tessdata_dir():
    platform_name = platform.system() 
    if platform_name == 'Darwin':
        if r_config(OCR_CONFIG, "oem") == '0': 
            # legacy tesseract
            return '--tessdata-dir {}'.format(str(Path(OSX_TESSERACT_DIR, "share", "legacy", "tessdata")))
        else:
            return '--tessdata-dir {}'.format(str(Path(OSX_TESSERACT_DIR, "share", "tessdata")))
    elif platform_name == 'Windows':
        if (r_config(OCR_CONFIG, "oem") == '0' and Path(WIN_TESSERACT_DIR, "tessdata-legacy").exists()): 
            # legacy tesseract by renaming tessdata folders
            os.rename(Path(WIN_TESSERACT_DIR, "tessdata"), Path(WIN_TESSERACT_DIR, "tessdata-new"))
            os.rename(Path(WIN_TESSERACT_DIR, "tessdata-legacy"), Path(WIN_TESSERACT_DIR, "tessdata"))
        elif (r_config(OCR_CONFIG, "oem") != '0' and Path(WIN_TESSERACT_DIR, "tessdata-new").exists()):  
            # revert to default tessdata folder
            os.rename(Path(WIN_TESSERACT_DIR, "tessdata"), Path(WIN_TESSERACT_DIR,  "tessdata-legacy"))
            os.rename(Path(WIN_TESSERACT_DIR, "tessdata-new"), Path(WIN_TESSERACT_DIR, "tessdata"))
    return ''