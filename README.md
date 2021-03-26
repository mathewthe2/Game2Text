## Game2Text ##

Game2Text helps you learn and retain Japanese words from games.

![Game2Text Preview](https://game2text.com/images/header-software-app.png)

## Features ##

- Kanji Finder with browser dictionaries like Yomichan
- Deepl Translate
- Anki Integration with AnkiConnect via Yomichan

## Download ##
You can find downloads on [Releases](https://github.com/mathewthe2/Game2Text/releases).

## Prerequisite: Tesseract ##

Windows: Tesseract is bundled with the application.

Mac OS: Install with ```brew install tesseract```

Linux: Follow installation instructions [here](https://tesseract-ocr.github.io/tessdoc/Home.html).

## Custom Config ##

Update *config.ini* file for the following configurations:

- **browser**: Browser to launch Game2Text
- **logimagetype**: file type to save logged images
- **refresh**: hotkey to execute OCR

## Getting Started ##
```
pip install -r requirements.txt
python game2text.py
```

## Distribution ##

Windows: 

```python -m eel game2text.py web --windowed --icon "icon.ico" --add-data "logs;logs/" --add-data "win;win/" --add-data "config.ini;."```

Mac:

```sh build.sh```

Temporary fix for all read/write operations using *os.path* on Mac builds with pyinstaller: create a wrapper file that runs the Game2Text executable inside the package 