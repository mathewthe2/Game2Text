## Game2Text ##

[Game2Text](https://www.game2text.com) helps you learn and retain Japanese words from games.

![Game2Text Preview](https://game2text.com/images/header-software-app.png)

## Features ##

- Kanji Finder with browser dictionaries like Yomichan
- Deepl Translate
- Anki Integration with AnkiConnect via Yomichan

## Download ##
You can find downloads on [Releases](https://github.com/mathewthe2/Game2Text/releases).

## Prerequisite: Tesseract ##

Windows: Tesseract is bundled with the application.
Mac OS: Tesseract is bundled with the application.

Linux: Follow installation instructions [here](https://tesseract-ocr.github.io/tessdoc/Home.html).

## Custom Config ##

Update *config.ini* file for the following configurations:

- **browser**: Browser to launch Game2Text
- **logimagetype**: file type to save logged images
- **refresh**: hotkey to execute OCR

## Getting Started ##

Create a venv, then once activated install requirements:
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

## FAQ ##

Q. Why is my application not showing in screen share?
- 
On MacOS, make sure you have allowed screen recording for your browser in **Security & Privacy** settings.

<img src="https://user-images.githubusercontent.com/13146030/113811992-d7243280-979f-11eb-8bdf-bcea6bd4e9bd.png" width="500" height="439">


Q. How do I use Game2Text without Chrome?
- 
Modify *config.ini* and modify the value of browser to firefox or edge. 

<img src="https://user-images.githubusercontent.com/13146030/113812636-02f3e800-97a1-11eb-8435-5f2c0e7b0339.png" width="400" height="504">

