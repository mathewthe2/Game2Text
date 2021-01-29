from configparser import ConfigParser
import eel

OCR_CONFIG = "OCRCONFIG"
DEEPL_CONFIG = "DEEPLCONFIG"
APPERANCE_CONFIG = "APPEARANCE"
APP_CONFIG = "APPCONFIG"
WINDOWS_HOTKEYS_CONFIG = "WINDOWS_HOTKEYS"
LOG_CONFIG = "LOGCONFIG"

#Get the configparser object
config_object = ConfigParser()

def r_config(section, key):
    #Read config.ini file
    # config_object = ConfigParser()
    config_object.read("config.ini")

    #Get the password
    section = config_object[section]
    return section[key]

def w_config(section, to_update_dict):
    #Read config.ini file
    # config_object = ConfigParser()
    config_object.read("config.ini")

    #Get the USERINFO section
    section = config_object[section]

    #Update the key value
    for key, value in to_update_dict.items():
        section[key] = value

    #Write changes back to file
    with open('config.ini', 'w') as conf:
        config_object.write(conf)