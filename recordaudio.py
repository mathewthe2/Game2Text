import threading
import pyaudio
import wave
import os
import platform
from audio import valid_output_device, convert_audio


class RecordThread(threading.Thread):
    def __init__(self, deviceIndex=-1, frames=512):
        threading.Thread.__init__(self)
        self.isRecording = False
        self.bRecord = True
        self.deviceIndex = deviceIndex
        self.recorded_frames = []
        self.audiofile = "out.wav"
        self.duration = 10
        self.frames = frames
        self.hasAudio = False

    def run(self):
        if self.deviceIndex == -1:
            print("recorder called but device index not specified")
            return
        if not valid_output_device(self.deviceIndex):
            print("recorder called but device invalid")
            return
        p = pyaudio.PyAudio()
        device_info = p.get_device_info_by_index(self.deviceIndex)
        is_input = device_info["maxInputChannels"] > 0
        is_wasapi = (p.get_host_api_info_by_index(device_info["hostApi"])["name"]).find("WASAPI") != -1
        useloopback = is_wasapi and not is_input
        # Open stream
        channelcount = (
            device_info["maxInputChannels"]
            if (device_info["maxOutputChannels"] < device_info["maxInputChannels"])
            else device_info["maxOutputChannels"]
        )
        try:
            stream_parameters = {
                "format": pyaudio.paInt16,
                "channels": channelcount,
                "rate": int(device_info["defaultSampleRate"]),
                "input": True,
                "frames_per_buffer": self.frames,
                "input_device_index": device_info["index"],
            }

            is_windows = platform.system() == "Windows"
            if is_windows:
                stream_parameters["as_loopback"] = useloopback

            stream = p.open(**stream_parameters)

            # Start recording
            self.isRecording = True
            self.hasAudio = False
            while self.bRecord:
                self.recorded_frames.append(stream.read(self.frames, exception_on_overflow=True))
                self.hasAudio = True

            stream.stop_stream()
            stream.close()

            # Don't save file if duration is 0
            if self.duration == 0:
                p.terminate()
                return

            file = self.audiofile
            filename, file_extension = os.path.splitext(file)
            file_needs_conversion = file_extension != ".wav"
            if file_needs_conversion:
                file = filename + ".wav"
            waveFile = wave.open(file, "wb")
            waveFile.setnchannels(channelcount)
            waveFile.setsampwidth(p.get_sample_size(pyaudio.paInt16))
            waveFile.setframerate(int(device_info["defaultSampleRate"]))
            start_frame = 0
            trim_audio = self.duration != -1
            if trim_audio:
                start_frame = len(self.recorded_frames) - int(
                    int(device_info["defaultSampleRate"]) / self.frames * self.duration
                )
            waveFile.writeframes(b"".join(self.recorded_frames[start_frame:]))
            waveFile.close()
            p.terminate()

            # Convert to mp3 or other formats
            if file_needs_conversion:
                convert_audio(file, self.audiofile)
                os.remove(file)

        except Exception as e:
            print("Error: cannot record audio with selected device", e)

    def stop_recording(self, audiofile="out.wav", duration=10):
        self.audiofile = audiofile
        self.duration = duration
        self.bRecord = False

    def restart_recording(self):
        self.bRecord = False

    def is_recording(self):
        return self.isRecording

    def has_audio(self):
        return self.hasAudio
