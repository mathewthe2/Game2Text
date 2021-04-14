import threading
import pyaudio
import wave
from config import r_config, LOG_CONFIG

class RecordThread(threading.Thread):
    def __init__(self, deviceIndex=-1, frames=512):
        threading.Thread.__init__(self)
        self.bRecord = True
        self.deviceIndex = deviceIndex
        self.recorded_frames = []
        self.audiofile = "out.wav"
        self.duration = 10
        self.frames = frames

    def run(self):
        # print("index?", self.deviceIndex)
        p = pyaudio.PyAudio()
        device_info = p.get_device_info_by_index(self.deviceIndex)
        is_input = device_info["maxInputChannels"] > 0
        is_wasapi = (p.get_host_api_info_by_index(device_info["hostApi"])["name"]).find("WASAPI") != -1
        useloopback = is_wasapi and not is_input
        # Open stream
        channelcount = device_info["maxInputChannels"] if (device_info["maxOutputChannels"] < device_info["maxInputChannels"]) else device_info["maxOutputChannels"]
        stream = p.open(format = pyaudio.paInt16,   
                    channels = channelcount,
                    rate = int(device_info["defaultSampleRate"]),
                    input = True,
                    frames_per_buffer = self.frames,
                    input_device_index = device_info["index"],
                    as_loopback = useloopback)
        
        # Start recording
        while self.bRecord:
            self.recorded_frames.append(stream.read(self.frames))
        
        stream.stop_stream()
        stream.close()

        # Don't save file if duration is 0
        if (self.duration <= 0):
            p.terminate()
            return

        filename = self.audiofile
        waveFile = wave.open(filename, 'wb')
        waveFile.setnchannels(channelcount)
        waveFile.setsampwidth(p.get_sample_size(pyaudio.paInt16))
        waveFile.setframerate(int(device_info["defaultSampleRate"]))
        start_frame = len(self.recorded_frames) - int(int(device_info["defaultSampleRate"]) / self.frames * self.duration)
        waveFile.writeframes(b''.join(self.recorded_frames[start_frame:]))
        waveFile.close()
        p.terminate()

    def stop_recording(self, audiofile='out.wav', duration = 10):
        self.audiofile = audiofile
        self.duration = duration
        self.bRecord = False

    def restart_recording(self):
        self.bRecord = False