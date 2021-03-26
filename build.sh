#! /bin/sh
rm -rf build, dist
python -m eel game2text.py web --windowed --icon "icon.icns" --add-data "logs/images/temp.png:logs/images" --add-data "logs/text:logs/text" --add-data "config.ini:."
# temporary fix for using os.path in MacOS
touch dist/game2text.app/Contents/MacOS/wrapper
echo '#!/bin/bash' >> dist/game2text.app/Contents/MacOS/wrapper
echo 'dir=$(dirname $0)' >> dist/game2text.app/Contents/MacOS/wrapper
echo 'open -a Terminal file://${dir}/game2text' >> dist/game2text.app/Contents/MacOS/wrapper
chmod +x dist/game2text.app/Contents/MacOS/wrapper
sed -i '' 's+MacOS/game2text+MacOS/wrapper+' dist/game2text.app/Contents/Info.plist