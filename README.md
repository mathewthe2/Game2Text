# Game2Text

[![made-with-python](https://img.shields.io/badge/Made%20with-Python-1f425f.svg)](https://www.python.org/) 

![Game2Text Preview](https://game2text.com/images/header-software-app.png)

[Game2Text](https://www.game2text.com) is an all-in-one application that helps you learn language from games.


## Features
- Dictionary lookup with browser dictionaries like Yomichan
- Translation - DeepL, Papago, and Google
- Create image and audio flashcards via Anki and AnkiConnect

## Download 
You can find downloads on [Releases](https://github.com/mathewthe2/Game2Text/releases).

## Prerequisite: Tesseract

Windows/Mac: Tesseract is bundled with the application.

Linux: Follow installation instructions [here](https://tesseract-ocr.github.io/tessdoc/Home.html).

## Custom Config 

Update *config.ini* file for the following configurations:

- **browser**: Browser to launch Game2Text
- **logimagetype**: file type to save logged images
- **refresh**: hotkey to execute OCR

## Image Filter Profiles 

You can import and export image filter profiles to improve the accuracy of the OCR result. Image filtering controls can be accessed by right clicking on the game/video stream.    


## Getting Started

Create a venv, then once activated install requirements:
```
pip install -r requirements.txt
python game2text.py
```

## Distribution

Unzip *sudachidict_small.zip*

Windows: 

```
python -m eel game2text.py web --windowed --icon "icon.ico" --hidden-import sudachidict_small --hidden-import sudachipy.lattice --hidden-import sudachipy.morphemelist --add-data "logs;logs/" --add-data "profiles;profiles/" --add-data "dictionaries;dictionaries/" --add-data "gamescripts;gamescripts/" --add-data "sudachidict_small;sudachidict_small/" --add-data "sudachipy/resources;sudachipy/resources/" --add-data "anki;anki/" --add-data "win;win/" --add-data "config.ini;."
```

Mac:

```sh build.sh```

Temporary fix for all read/write operations using *os.path* on Mac builds with pyinstaller: create a wrapper file that runs the Game2Text executable inside the package

## FAQ

Q. Why is my application not showing in screen share?
- 
On MacOS, make sure you have allowed screen recording for your browser in **Security & Privacy** settings.

<img src="https://user-images.githubusercontent.com/13146030/113811992-d7243280-979f-11eb-8bdf-bcea6bd4e9bd.png" width="500" height="439">


Q. How do I use Game2Text without Chrome?
- 
Modify *config.ini* and update the value of browser to edge, chromium, or firefox. 

<img src="https://user-images.githubusercontent.com/13146030/113812636-02f3e800-97a1-11eb-8435-5f2c0e7b0339.png" width="400" height="504">

