#! /bin/sh
rm -rf build, dist
python -m eel game2text.py web \
--windowed \
--hidden-import sudachidict_small \
--hidden-import sudachipy.lattice \
--hidden-import sudachipy.morphemelist \
--icon "public/icon.icns" \
--add-data "logs/images/temp.png:logs/images" \
--add-data "logs/text:logs/text" \
--add-data "resources/sudachidict_small:sudachidict_small/" \
--add-data "resources/sudachipy/resources:sudachipy/resources/" \
--add-data "anki:anki/" \
--add-data "resources/bin/mac:resources/bin/mac/" \
--add-data "resources/dictionaries:resources/dictionaries/" \
--add-data "config.ini:."
# temporary fix for using os.path in MacOS
touch dist/game2text.app/Contents/MacOS/wrapper
echo '#!/bin/bash' >> dist/game2text.app/Contents/MacOS/wrapper
echo 'dir=$(dirname $0)' >> dist/game2text.app/Contents/MacOS/wrapper
echo 'open -a Terminal file://${dir}/game2text' >> dist/game2text.app/Contents/MacOS/wrapper
chmod +x dist/game2text.app/Contents/MacOS/wrapper
sed -i '' 's+MacOS/game2text+MacOS/wrapper+' dist/game2text.app/Contents/Info.plist