## Game2Text ##

Game2Text helps you learn and retain Japanese words.

## Features ##

- Kanji Finder with browser dictionaries like Yomichan
- Deepl Translate
- Anki Integration with AnkiConnect via Yomichan

## Installation ##
```pip install -r requirements.txt```

## Tesseract ##

Windows: Prepare static binary in /win/tesseract

Mac OS: Install with ```brew install tesseract```

## Custom Config ##

Update config.ini file for the following configurations:
logimagetype: file type to save logged images
refresh: hotkey to execute OCR

## Develop ##
```python game2text.py```

## Distribution ##

Windows: 
```python -m eel game2text.py web --windowed --icon "icon.ico" --add-data "logs;logs/" --add-data "win;win/" --add-data "config.ini;."```

Mac:
```sh build.sh```