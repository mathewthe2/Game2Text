#! /bin/sh
rm -rf build, dist
python -m eel game2text.py web --windowed --icon "icon.ico" --add-data "logs/images/temp.png:logs/images" --add-data "logs/text:logs/text" --add-data "config.ini:."
