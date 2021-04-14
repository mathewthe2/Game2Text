import pyaudio
import wave 
import os
from config import r_config, LOG_CONFIG
from recordaudio import RecordThread
from time import sleep

def get_default_device_index():
    p = pyaudio.PyAudio()
    #Set default to first in list or ask Windows
    try:
        default_device_index = p.get_default_input_device_info()
    except IOError:
        return -1
    info = p.get_device_info_by_index(0)
    p.terminate()
    return info["index"]

#Select Device
# print ("Available devices:\n")
def get_audio_objects():
    p = pyaudio.PyAudio()
    audio_objects = {}
    for i in range(0, p.get_device_count()):
        info = p.get_device_info_by_index(i)
        audio_host = p.get_host_api_info_by_index(info["hostApi"])["name"]
        if valid_output_device(info["index"]):
            audio_objects.setdefault(audio_host,[]).append({info["index"]: info["name"]})
    p.terminate()
    return audio_objects

def valid_output_device(deviceIndex):
    if not isinstance(deviceIndex, int):
        return False
    p = pyaudio.PyAudio()
    device_info = p.get_device_info_by_index(deviceIndex)
    is_input = device_info["maxInputChannels"] > 0
    is_wasapi = (p.get_host_api_info_by_index(device_info["hostApi"])["name"]).find("WASAPI") != -1
    p.terminate()
    if is_input:
        if is_wasapi:
            return True
        else:
            return False
    return True

def play_audio_from_file(filename):
    print("gonna play some", filename)
    # length of data to read.
    chunk = 1024
   # open the file for reading.
    wf = wave.open(filename, 'rb')

    # create an audio object
    p = pyaudio.PyAudio()

    # open stream based on the wave object which has been input.
    stream = p.open(format =
                    p.get_format_from_width(wf.getsampwidth()),
                    channels = wf.getnchannels(),
                    rate = wf.getframerate(),
                    output = True)

    # read data (based on the chunk size)
    data = wf.readframes(chunk)

    while True:
        if data != '':
            stream.write(data)
            data = wf.readframes(chunk)

        if data == b'':
            break

    # cleanup stuff.
    stream.close()    
    p.terminate()

# def record_audio_by_device_index(deviceIndex, duration):
#     frames = int(r_config(LOG_CONFIG, "logaudioframes"))
#     device_info = p.get_device_info_by_index(deviceIndex)
#     is_input = device_info["maxInputChannels"] > 0
#     is_wasapi = (p.get_host_api_info_by_index(device_info["hostApi"])["name"]).find("WASAPI") != -1
#     useloopback = is_wasapi and not is_input
#     recorded_frames = []
#     # Open stream
#     channelcount = device_info["maxInputChannels"] if (device_info["maxOutputChannels"] < device_info["maxInputChannels"]) else device_info["maxOutputChannels"]
#     stream = p.open(format = pyaudio.paInt16,   
#                 channels = channelcount,
#                 rate = int(device_info["defaultSampleRate"]),
#                 input = True,
#                 frames_per_buffer = frames,
#                 input_device_index = device_info["index"],
#                 as_loopback = useloopback)

#     # Start recording
#     print("started record")
#     for i in range(0, int(int(device_info["defaultSampleRate"]) / frames * duration)):
#         recorded_frames.append(stream.read(frames))

#     # Stop Recording
#     print("stopped record")
#     stream.stop_stream()
#     stream.close()

#     filename = "out.wav"
#     waveFile = wave.open(filename, 'wb')
#     waveFile.setnchannels(channelcount)
#     waveFile.setsampwidth(p.get_sample_size(pyaudio.paInt16))
#     waveFile.setframerate(int(device_info["defaultSampleRate"]))
#     waveFile.writeframes(b''.join(recorded_frames))
#     waveFile.close()