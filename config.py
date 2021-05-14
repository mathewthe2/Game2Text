from configparser import ConfigParser
import eel
import os
import platform
import json

OCR_CONFIG = 'OCRCONFIG'
TRANSLATION_CONFIG = 'TRANSLATIONCONFIG'
APPERANCE_CONFIG = 'APPEARANCE'
APP_CONFIG = 'APPCONFIG'
ANKI_CONFIG = 'ANKICONFIG'
LOG_CONFIG = 'LOGCONFIG'
TEXTHOOKER_CONFIG = 'TEXTHOOKERCONFIG'
HOTKEYS_CONFIG = '$OS_HOTKEYS'
PATHS_CONFIG = 'PATHS'

OS_STRING = '$OS'

#Get the configparser object
# config_object = ConfigParser()

#Path for config file
config_file = os.path.join(os.path.dirname(__file__), 'config.ini')

def get_platform_for_section(section):
    platform_names_to_config_os_name = {
        'Windows': 'WINDOWS',
        'Darwin': 'MAC',
        'Linux': 'LINUX'
    }
    platform_name = platform.system()
    return section.replace(OS_STRING, platform_names_to_config_os_name[platform_name])

def r_config(section, key):
    if OS_STRING in section:
        section = get_platform_for_section(section)
    #Read config.ini file
    config_object = ConfigParser()
    config_object.read(config_file, encoding='utf-8')

    #Get the password
    section = config_object[section]
    return section[key]

def r_config_section(section):
    if OS_STRING in section:
        section = get_platform_for_section(section)
    config_object = ConfigParser()
    config_object.read(config_file, encoding='utf-8')
    section = dict(config_object[section])
    return section

def r_config_all():
    config_object = ConfigParser()
    config_object.read(config_file, encoding='utf-8')
    section_dict = {}
    for section in config_object:
        if 'WINDOWS' in section or 'MAC' in section or 'LINUX' in section:
            continue
        section_dict[section] = dict(config_object[section])
    # Platform specific config
    section_dict[HOTKEYS_CONFIG] = dict(config_object[get_platform_for_section(HOTKEYS_CONFIG)])
    return section_dict

def w_config(section, to_update_dict):
    if OS_STRING in section:
        section = get_platform_for_section(section)
    #Read config.ini file
    config_object = ConfigParser()
    config_object.read("config.ini", encoding='utf-8')

    #Get the USERINFO section
    section = config_object[section]

    #Update the key value
    for key, value in to_update_dict.items():
        section[key] = value

    #Write changes back to file
    with open('config.ini', 'w', encoding='utf-8') as conf:
        config_object.write(conf)