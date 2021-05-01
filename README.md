# Game2Text

[![made-with-python](https://img.shields.io/badge/Made%20with-Python-1f425f.svg)](https://www.python.org/) 

![Game2Text Preview](https://game2text.com/images/header-software-app.png)

[Game2Text](https://www.game2text.com) is an all-in-one application that helps you learn languages from the games you play.

## Platforms
- Windows 10
- Mac OSX Mojave, Catalina

## Features
- Dictionary lookup with browser dictionaries like Yomichan and Rikaichan
- OCR-assisted game script matching 
- Translation tools including DeepL, Papago, and Google Translate.
- Create game flashcards with screenshot and game audio via Anki and AnkiConnect

## Download 
[Download Game2Text](https://github.com/mathewthe2/Game2Text/releases)

## FAQ
[Read FAQ](https://github.com/mathewthe2/Game2Text/blob/main/public/faq.md)

## Documentation
[Read Documentation](https://github.com/mathewthe2/Game2Text/blob/main/public/documentation.md)

## Getting Started (for developers)

Create a venv, then once activated install requirements:
```
pip install -r requirements.txt
python game2text.py
```

On Windows, install pyaudio_portaudio through wheel. This package includes "as_loopback" as an option to record system audio through Windows WASAPI. 
```
pip uninstall pyaudio
pip install https://github.com/intxcc/pyaudio_portaudio/releases/download/1.1.1/PyAudio-0.2.11-cp37-cp37m-win_amd64.whl
```

On Linux, install Tesseract by following the installation instructions [here](https://tesseract-ocr.github.io/tessdoc/Home.html).

## Distribution

Unzip *resources/sudachidict_small.zip* into the same directory.

Windows: 

```build.bat```

Mac:

```sh build.sh```

Temporary fix for all read/write operations using *os.path* on Mac builds with pyinstaller: create a wrapper file that runs the Game2Text executable inside the package

