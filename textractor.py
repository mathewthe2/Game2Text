from parse import parse
from pathlib import Path
import time
import re
import os, sys
import threading
from tools import path_to_wexpect
from util import RepeatedTimer
import platform

is_windows = (platform.system() == 'Windows')
if is_windows:
    import wexpect

os.environ['WEXPECT_LOGGER_LEVEL']='INFO'

class Textractor(object):
    def __init__(self, executable_path, callback, lines='', encoding='utf-8', codec_errors='ignore'):
        self.spawn(executable_path=executable_path, encoding=encoding, codec_errors=codec_errors)
        self.lines = ''
        self.callback = callback
        self.format_string = '[{handle}:{pid}:{addr}:{ctx}:{ctx2}:{name}:{code}]{text}'
        self.format_grouped_string = '{prev_text}[{handle}:{pid}:{addr}:{ctx}:{ctx2}:{name}:{code}]{text}'
        self.pids_to_attach = []
        self.attached_pids = []
        self.flush_delay = 1
        self.flush_thread = RepeatedTimer(self.flush_delay, self.handle_output)
        self.flush_thread.stop()

    def get_attached_pids(self):
        return self.attached_pids

    def spawn(self, executable_path, encoding, codec_errors):
        real_executable = sys.executable
        try:
            is_compiled_with_pyinstaller = (sys._MEIPASS is not None)
            if is_compiled_with_pyinstaller:
                sys.executable = path_to_wexpect()
        except AttributeError:
            pass
        self.process = wexpect.spawn(executable_path, encoding=encoding, codec_errors=codec_errors)
        sys.executable = real_executable

    def handle_output(self):
        if self.lines:
            output_objects = self.format_output(self.lines)
            self.lines = ''
            if output_objects:
                self.emit_lines(output_objects)
                self.check_if_attached(output_objects)
                
    def check_if_attached(self, output_objects):
        for output_object in output_objects:
            if output_object['code'] == 'Console':
                if 'pipe connected' in output_object['text']:
                    self.attached_pids = self.pids_to_attach

    def emit_lines(self, output_objects):
        self.callback(output_objects)
    
    def read(self):
        while 1:
            try:
                new_line = self.process.read_nonblocking(size=9999)
                if new_line:
                    self.lines += new_line
                    self.flush_thread.reset()
            except wexpect.wexpect_util.TIMEOUT:
                print('timeout')
                if (self.flush_thread.is_running):
                    self.flush_thread.stop()
                output_objects = self.format_output(self.lines)
                if output_objects:
                    callback(output_objects)
                time.sleep(1)
                self.read_callback(callback)

    def attach_multiple(self, pids):
        if len(self.attached_pids) > 0:
            for pid in attached_pids:
                print('detaching...')
                self.detach(pid)
        self.pids_to_attach = []
        for pid in pids:
            self.attach(pid)
            self.pids_to_attach.append(pid)

    def attach(self, pid):
        self.process.sendline('attach -P' + pid)

    def detach(self, pid):
        self.process.sendline('detach -P' + pid)

    def hook(self, code, pid):
        self.process.sendline(code + ' -P' + pid)

    def group_text_by_key(self, raw_list, key):
        hookMap = {}
        for item in raw_list:
            if item[key]:
                if item[key] not in hookMap:
                    hookMap[item[key]] = item
                else:
                    hookMap[item[key]]['text'] += item['text']
        return list(hookMap.values())

    def remove_repeat(self, raw_list, key):
        new_list = []
        for index in range(len(raw_list)):
            if index == 0:
                new_list.append(raw_list[index])
            else:
                is_repeat = raw_list[index][key] == raw_list[index-1][key]
                is_same_hook = raw_list[index]['code'] == raw_list[index-1]['code']
                if (not is_repeat) or (not is_same_hook):
                    new_list.append(raw_list[index])
        return new_list

    # def remove_non_ascii(self, text):
    #     return text.replace('/[\x00-\xFF]+/g,', '')

    def format_output(self, line):
        print('newline', line)
        if 'Usage:' in line:
            # First line of Textractor output can include Textractor console information
            if '[' in line:
                lines = line.split('[')
                output_objects = []
                for i in range(1, len(lines)):
                    result = parse(self.format_string, '[' + lines[i])
                    if (result):
                        output_objects.append(result.named)
                return output_objects
            else:
                return ''
        if '[' in line:
            line = ''.join(line.splitlines())
            result = parse(self.format_string, line)
            previous_result = result
            output_objects = []
            if (result):
                line = result.named['text']
                while (parse(self.format_grouped_string, line)):
                    result = parse(self.format_grouped_string, line)
                    line = ''.join(line.splitlines())
                    line = result.named['text']
                    previous_object = previous_result.named
                    previous_object['text'] = result.named['prev_text']
                    output_objects.append(previous_object)
                    previous_result = result
                output_objects.append(result.named)

                print('what i got')
                for o in output_objects:
                    print(o['code'] + ' --> ' + o['text'])

                output_objects = self.group_text_by_key(output_objects, 'code')
                output_objects = self.remove_repeat(output_objects, 'text')

                return output_objects
            else:
                return None