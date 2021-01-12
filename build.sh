#! /bin/sh
rm -rf build, dist
python -m eel game2text.py web --windowed --icon "icon.ico" --add-data "ImageLogs/temp.png:ImageLogs"