import requests
import hmac
import base64
import time
import uuid
import asyncio
import json

from typing import Dict

class Papago:
    def __init__(self, source: str, target: str):
        self.source = source
        self.target = target

    def __getHash(self, message: bytearray, key: bytearray) -> str:
        md5 = hmac.digest(key, message, 'MD5')
        return base64.b64encode(md5).decode()

    def __generateHeaders(self, url: str, filter: list) -> Dict[str, str]:
        auth_key = b'v1.5.6_97f6918302'
        timestamp = str(int(time.time() * 1000))
        deviceId = str(uuid.uuid4())
        hashstr = self.__getHash(f'{deviceId}\n{url}\n{timestamp}'.encode(), auth_key)
        data = {
            'authorization': f'PPG {deviceId}:{hashstr}',
            'deviceId': deviceId,
            'timestamp': timestamp,
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'device-type': 'pc',
            'referer': 'https://papago.naver.com/',
            'x-apigw-partnerid': 'papago',
            'user-agent': 'Mozilla/5.0'
        }
        return {k: v for k, v in data.items() if k in filter}

    def __check_status(self, response: requests.Response) -> bool:
        status = response.status_code
        if status == 500:
            raise Exception('500: Invalid parameter')
        if 400 <= status < 500:
            raise Exception(f'{status}: request aborted')
        if status == 200:
            return True

    async def __detect(self, query: str) -> str:
        url = 'https://papago.naver.com/apis/langs/dect'
        headers = self.__generateHeaders(url, [
            'content-type',
            'authorization',
            'timestamp',
            'user-agent',
            'device-type',
            'referer'
        ])
        response = requests.post(url, headers=headers, data=dict(query=query))
        if self.__check_status(response):
            content = response.json()
            lang = content['langCode']
            if lang != 'unk':
                return lang

    async def translate(self, text: str, honorific: bool = False, verbose: bool = False) -> Dict[str, str]:
        url = 'https://papago.naver.com/apis/n2mt/translate'
        if self.source == 'detect':
            self.source = await self.__detect(text)
            if not self.source:
                raise Exception('cannot detect text')
        headers = self.__generateHeaders(url, [
            'content-type',
            'authorization',
            'timestamp',
            'user-agent',
            'device-type',
            'referer',
            'x-apigw-partnerid',
            'deviceId'
        ])
        data = {k: v for k, v in headers.items() if k in ['authorization', 'timestamp', 'deviceId']}
        data = {'authroization' if k == 'authorization' else k: v for k, v in data.items()}
        response = requests.post(url, headers=headers, data={
            **data,
            'locale': 'ko',
            'dict': 'true',
            'dictDisplay': '30',
            'honorific': 'true' if honorific else 'false',
            'instant': 'false',
            'paging': 'true',
            'source': self.source,
            'target': self.target,
            'text': text
        })
        if self.__check_status(response):
            content = response.json()
            if verbose: return json.dumps(content, indent=4)
            sound: str = None
            srcSound: str = None
            if 'tlit' in content:
                sound = ' '.join(list(map(lambda x: x['phoneme'], content['tlit']['message']['tlitResult'])))
            if 'tlitSrc' in content:
                srcSound = ' '.join(list(map(lambda x: x['phoneme'], content['tlitSrc']['message']['tlitResult'])))
            return {
                'source': self.source,
                'target': self.target,
                'text': text,
                'translatedText': content['translatedText'],
                'sound': sound,
                'srcSound': srcSound
            }
