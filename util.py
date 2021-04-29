from threading import Timer
from pathlib import Path
import os
import platform
import base64
import cv2
import eel
from winreg import HKEY_CURRENT_USER, OpenKey, QueryValueEx

SCRIPT_DIR = Path(__file__).parent 

class RepeatedTimer(object):
    def __init__(self, interval, function, *args, **kwargs):
        self._timer     = None
        self.interval   = interval
        self.function   = function
        self.args       = args
        self.kwargs     = kwargs
        self.is_running = False
        self.start()

    def _run(self):
        self.is_running = False
        self.start()
        self.function(*self.args, **self.kwargs)

    def start(self):
        if not self.is_running:
            self._timer = Timer(self.interval, self._run)
            self._timer.start()
            self.is_running = True

    def stop(self):
        self._timer.cancel()
        self.is_running = False

def create_directory_if_not_exists(filename):
    if not os.path.exists(os.path.dirname(filename)):
        try:
            os.makedirs(os.path.dirname(filename))
        except OSError as exc: # Guard against race condition
            if exc.errno != errno.EEXIST:
                raise

@eel.expose
def open_folder_by_relative_path(relative_path):
    platform_name = platform.system() 
    if platform_name == 'Windows':
        path = os.path.realpath(str(Path(SCRIPT_DIR, relative_path)))
        os.startfile(path)

def base64_to_image(base64string, path):
    image_path = base64_to_image_path(base64string, path)
    img = cv2.imread(image_path)
    return img

# Saves base64 image string and returns path
def base64_to_image_path(base64string, path):
    with open(path, "wb") as fh:
        fh.write(base64.b64decode(base64string))
    return path

def get_default_browser_name():
    platform_name = platform.system() 
    if platform_name == 'Windows':
        with OpenKey(HKEY_CURRENT_USER, r"Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice") as key:
            browser = QueryValueEx(key, 'Progid')[0]
            browser_map = {
                'ChromeHTML': 'chrome',
                'FirefoxURL': 'chromium',
                'IE.HTTP': 'edge'
            }
            if browser in browser_map:
                return browser_map[browser]
            else:
                return 'chromium'
    return 'chrome'