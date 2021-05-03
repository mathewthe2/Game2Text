from parse import parse
from pathlib import Path
import time
import re
import os, sys
import wexpect
import threading
from tools import path_to_wexpect
from util import RepeatedTimer

os.environ['WEXPECT_LOGGER_LEVEL']='INFO'

class Textractor(object):
    def __init__(self, exectuable, callback, lines='', encoding='utf-8', codec_errors='ignore'):
        self.spawn(exectuable=exectuable, encoding=encoding, codec_errors=codec_errors)
        self.lines = ''
        self.flush_delay = 1
        self.callback = callback
        self.flush_thread = RepeatedTimer(self.flush_delay, self.handle_output)
        self.flush_thread.stop()

    def spawn(self, exectuable, encoding, codec_errors):
        real_executable = sys.executable
        try:
            is_compiled_with_pyinstaller = (sys._MEIPASS is not None)
            if is_compiled_with_pyinstaller:
                sys.executable = path_to_wexpect()
        except AttributeError:
            pass
        self.process = wexpect.spawn(exectuable, encoding=encoding, codec_errors=codec_errors)
        sys.executable = real_executable

    def handle_output(self):
        if self.lines:
            output_objects = self.format_output(self.lines)
            print(self.lines)
            self.lines = ''
            print(output_objects)
            if output_objects:
                self.emit_lines(output_objects)

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

    def attach(self, pid):
        self.process.sendline('attach -P' + pid)

    def detach(self, pid):
        self.process.sendline('detach -P' + pid)

    def hook(self, code, pid):
        self.process.sendline(code + ' -P' + pid)

    def group_text_of_same_handles(self, raw_list):
        handleMap = {}
        for item in raw_list:
            if item['code']:
                if item['code'] not in handleMap:
                    handleMap[item['code']] = item
                else:
                    handleMap[item['code']]['text'] += item['text']
        return list(handleMap.values())

    def remove_repeat(self, raw_list, key):
        new_list = []
        for index in range(len(raw_list)):
            if index == 0:
                new_list.append(raw_list[index])
            else:
                is_repeat = raw_list[index][key] == raw_list[index-1][key]
                if not is_repeat:
                    new_list.append(raw_list[index])
        return new_list

    def remove_non_ascii(self, text):
        return text.replace('/[\x00-\xFF]+/g,', '')

    def format_output(self, line):
        if 'Usage' in line:
            return ''
        if '[' in line:
            format_string = '[{handle}:{pid}:{addr}:{ctx}:{ctx2}:{name}:{code}]{text}'
            result = parse(format_string, line)
            output_objects = []
            if (result):
                format_grouped_string = '{raw_text}[{handle}:{pid}:{addr}:{ctx}:{ctx2}:{name}:{code}]{text}'
                while (parse(format_grouped_string, result.named['text'])):
                    output_object = result.named
                    result = parse(format_grouped_string, result.named['text'])

                    parsed_text = self.remove_non_ascii(result.named['raw_text'])
                    if parsed_text:
                        output_object['text'] = parsed_text
                        output_objects.append(output_object)

                parsed_text = self.remove_non_ascii(result.named['text'])
                if parsed_text:
                    result.named['text'] = parsed_text
                    output_objects.append(result.named)
                output_objects = self.group_text_of_same_handles(output_objects)
                output_objects = self.remove_repeat(output_objects, 'text')
                return output_objects
            else:
                return None