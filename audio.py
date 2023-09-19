import os
import platform
from pathlib import Path

import eel
import pyaudio
from pydub import AudioSegment
from pydub.playback import play

from config import LOG_CONFIG, r_config
from tools import path_to_ffmpeg

ffmpeg_path = path_to_ffmpeg()
if ffmpeg_path is not None:
    AudioSegment.ffmpeg = ffmpeg_path
    os.environ["PATH"] += os.pathsep + str(Path(ffmpeg_path).parent)


# User config device exists? use config device, if not check if (1) valid, use (1), if not no audio
@eel.expose
def get_recommended_device_index(audio_host):
    config_device_name = r_config(LOG_CONFIG, "logaudiodevice")
    config_device_index = get_audio_device_index_by_name(audio_host, config_device_name)
    if valid_output_device(config_device_index):
        return config_device_index

    default_device_index = get_default_device_index()
    if valid_output_device(default_device_index):
        return default_device_index
    return -1


def get_default_device_index():
    p = pyaudio.PyAudio()
    # Set default to first in list or ask Windows
    try:
        default_device_index = p.get_default_input_device_info()
    except IOError:
        return -1
    info = p.get_device_info_by_index(0)
    p.terminate()
    return info["index"]


# Select Device
@eel.expose
def get_audio_objects():
    p = pyaudio.PyAudio()
    audio_objects = {}
    for i in range(0, p.get_device_count()):
        info = p.get_device_info_by_index(i)
        audio_host = p.get_host_api_info_by_index(info["hostApi"])["name"]
        if valid_output_device(info["index"]):
            audio_objects.setdefault(audio_host, []).append({info["index"]: info["name"]})
    p.terminate()
    return audio_objects


def get_audio_device_index_by_name(audio_host, device_name):
    p = pyaudio.PyAudio()
    for i in range(0, p.get_device_count()):
        info = p.get_device_info_by_index(i)
        if info["name"] == device_name and p.get_host_api_info_by_index(info["hostApi"])["name"] == audio_host:
            p.terminate()
            return info["index"]
    p.terminate()
    return -1


def valid_output_device(deviceIndex):
    if not isinstance(deviceIndex, int):
        return False
    if deviceIndex < 0:
        return False
    p = pyaudio.PyAudio()
    device_info = p.get_device_info_by_index(deviceIndex)
    is_input = device_info["maxInputChannels"] > 0
    is_windows = platform.system() == "Windows"
    is_wasapi = (p.get_host_api_info_by_index(device_info["hostApi"])["name"]).find("WASAPI") != -1
    p.terminate()
    if is_input:
        if is_windows and not is_wasapi:
            return False
        else:
            return True
    return True


def play_audio_from_file(file):
    filename, file_extension = os.path.splitext(file)
    song = AudioSegment.from_file(file, file_extension[1:])
    play(song)
    return song.duration_seconds


def convert_audio(in_file, out_file):
    filename, file_extension = os.path.splitext(out_file)
    AudioSegment.from_mp3(in_file).export(out_file, format=file_extension[1:])
