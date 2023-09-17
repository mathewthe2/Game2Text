import sys, os
import platform
from pathlib import Path
from config import r_config, w_config, OCR_CONFIG, PATHS_CONFIG
from tkinter import *
from tkinter.filedialog import askopenfile

try:
    is_compiled_with_pyinstaller = (sys._MEIPASS is not None)
    if is_compiled_with_pyinstaller:
        bundle_dir = sys._MEIPASS
except AttributeError:
    bundle_dir = os.path.dirname(os.path.abspath(__file__))
    
OSX_TESSERACT_VERSION = "4.1.1"
WIN_TESSERACT_DIR = Path(bundle_dir, "resources", "bin", "win", "tesseract")
OSX_TESSERACT_DIR = Path(bundle_dir, "resources", "bin", "mac", "tesseract", OSX_TESSERACT_VERSION)

def path_to_ffmpeg():
    platform_name = platform.system()
    if platform_name == 'Windows':
        return str(Path(bundle_dir, "resources", "bin", "win", "ffmpeg", "ffmpeg.exe"))
    elif platform_name == 'Darwin':
        return str(Path(bundle_dir, "resources", "bin", "mac", "ffmpeg", "ffmpeg"))
    return None

def path_to_tesseract():
    exec_data = {"Windows": str(Path(WIN_TESSERACT_DIR, "tesseract.exe")),
                  "Darwin": str(Path(OSX_TESSERACT_DIR, "bin", "tesseract")),
                }
    platform_name = platform.system()  # E.g. 'Windows'
    return exec_data.get(platform_name)

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

def path_to_textractor():
    path = r_config('PATHS', 'textractor')
    return path if path != 'default' else str(Path(bundle_dir, 'resources', 'bin', 'win', 'textractor', 'TextractorCLI.exe'))

def path_to_wexpect():
    return str(Path(bundle_dir, 'resources', 'bin', 'win', 'wexpect', 'wexpect.exe'))

def open_folder_textractor_path():
    root = Tk()
    root.withdraw()
    file = askopenfile(filetypes = (("EXE files","*.exe"),("all files","*.*")), defaultextension=".exe")
    if not file:
        return
    try:
        w_config(PATHS_CONFIG, {'textractor': file.name})
    except:
        print('File not selected')
    file.close()
    root.destroy()
    return file.name