# Documentation

##### Table of Contents  
[Switch browser for Game2Text](#browser) <br/>
[Extract text with OCR](#ocr) <br/> 
[Lookup word with Yomichan or Rikaichan](#yomichan) <br/>
[Improve OCR by switching OCR Engine](#engine) <br/>
[Improve OCR with image filters](#filters) <br/>
[Improve OCR with Game Script Matching](#matching) <br/>
[Add cards to Anki](#anki) <br/>
[Hotkeys](#hotkeys)

<a name="browser"/>

## Switch browser for Game2Text

Change browser in the *config.ini* file. 
- *default*: finds your default browser (on Windows)
- *chrome*: Chrome
- *chromium*: Firefox, Opera, Brave, and other chromium browsers installed.
- *edge*: Microsoft Edge

<a name="ocr"/>

## Extract text with OCR

Select your game or application window in Game2Text.

<img src="https://user-images.githubusercontent.com/13146030/116772339-ecc80780-aa80-11eb-80ed-3ef66513cfb0.png" width="300">

Then, click and drag over the game screen to create a selection over a text region. Text will be extracted.

<img src="https://user-images.githubusercontent.com/13146030/116773256-0409f380-aa87-11eb-918f-0e8568306832.png" width="300">

<a name="yomichan"/>

## Lookup word with Yomichan or Rikaichan

Browser dictionaries like Yomichan are immedaitely accessible from Game2Text.

To use Yomichan, hover over words and hold shift to bring up the dictionary.

<img src="https://user-images.githubusercontent.com/13146030/116772341-f0f42500-aa80-11eb-87f3-5d254d583d3b.png" width="300">

<a name="engine"/>

## Improve OCR by switching OCR Engine

Click on the cogwheel icon for the *Settings* dialog. There you can select the following OCR modes.

OCR Mode | Engine | Provider | Framework | License
--- | --- | --- | --- | --- |
Tesseract Default | Tesseract 4.1.1 | Local | CRNN | Open Source |
Tesseract LSTM | Tesseract 4.1.1 | Local | RNN | Open Source |
Tesseract Legacy | Tesseract 3 | Local | CNN | Open Source |
OCR Space NA | Computer Vision Read API | Azure Cloud | R-CNN | Proprietary (Microsoft) |
OCR Space EU | Computer Vision Read API | Azure Cloud | R-CNN | Proprietary (Microsoft) |

<a name="filters"/>

## Improve OCR with Image Filters

OCR works better when the text is on a clean background. This is done in Game2Text by applying image filters. 

Right click on the game screen to show the image filters window.

Here you can apply different filters and tune the selected image until the text stands out sharp from its background.

<img src="https://user-images.githubusercontent.com/13146030/116772002-fbfa8580-aa7f-11eb-9ed2-c243694821cc.png" width="400">

You can also import and export image filters as profiles.

<a name="matching"/>

## Improve OCR with Game Script Matching

Game script matching is a powerful tool to find the correct sentence in a game. 

To start, install a game script file in the **logs window** in Game2Text or move it to the *game2text/gamescripts* folder.

You can find game scripts [provided by our community here](https://github.com/mathewthe2/Game2Text-GameScripts) or create your own by writing each in-game dialog to a newline in a text file.

In the **log window**, select the game script at the top of the window. 

When Game2Text finds matches, each extracted sentence log will get a dropdown icon at its right.

Click on the dropdown button and select a game text. It will replace the extracted sentence.

<img src="https://user-images.githubusercontent.com/13146030/116773540-5a2b6680-aa88-11eb-9b6b-258ec2ca39cc.png" width="400">

<a name="anki"/>

## Add cards to Anki

Game2Text can create SRS flashcards in Anki with useful information from game audio, screenshots, sentences, to dictionary definitions.

To start, add [Anki Connect](https://ankiweb.net/shared/info/2055492159) to Anki.

In Game2Text, launch the *Settings* Dialog and navigate to the *Anki* tab. 

Select your deck and card model and fill in the fields.

Name | Description |
--- | --- |
sentence | text extracted from the game |
selected word | words you highlighted |
reading | reading of the selected word if it's a dictionary entry |
glossary | definition of the selected word if it's a dictionary entry |
audio | recorded audio of the game |
screenshot | screenshot of the game when the text was extracted |

Anki settings are automatically saved in Game2Text.

In Game2Text, launch the *log window* to the right.

Each extracted sentence will be shown as a list. 

On the far right of each extracted sentence you can hover on the card icon to preview the information to add.

### Selected Word

When you highlight words in the log sentence or on the card, you add the *selected sentence* in Anki.

The words will be parsed and if it's a valid dictionary entry, its *reading* in hiragana and its *glossary* definition will be added.

### Audio

7 seconds of audio prior to the text extracted are recorded for the *audio* field. You can disable this feature in the *Settings* Dialog.

Alternatively, you can also manually record your own audio by clicking on the microphone icon to the left the extracted sentence. Click once to start recording and click again to stop. 

If you're not happy with the result, you can press on the menu icon on the left of the sentence and select *Remove Recording* to record again.

<a name="edit"/>

### Edit cards before adding to Anki

Sometimes there are unwanted characters in our extracted text. 

In the log window, click on the sentence to add or remove words. 

To remove a sentence log, click on the *More* icon on the left and select *Remove log*.

### Similar Kanji Replacement

Highlight a single kanji character and the kanji replacement menu will come up. You can replace the kanji character here.

<a name="hotkeys"/>

## Hotkeys

These are the default hotkeys for each operating system.

You can change hotkeys in the *config.ini* file

Platform | Windows | Mac OSX | Linux | 
--- | --- | --- | --- |
Refresh OCR | Ctrl-Q | Cmd-B | Ctrl-Q |
