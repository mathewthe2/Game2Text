## FAQ
[Mac OS: Why is my application not showing in screen share?](#screen) <br/>
[Mac OS: How do I record sound?](#sound) <br/>
[How do I use Game2Text without Chrome?](#browser) <br/>
[How do do I perform OCR without leaving my game?](#hotkey)

<a name="screen"/>

Q. Why is my application not showing in screen share?
- 
On MacOS, make sure you have allowed screen recording for your browser in **Security & Privacy** settings.

<img width="580" alt="Screenshot" src="https://user-images.githubusercontent.com/13146030/113811992-d7243280-979f-11eb-8bdf-bcea6bd4e9bd.png">

<a name="sound"/>

Q. How do I record system sound on Mac OS? <br/>
-
First, make sure you have allowed microphone for Terminal in  **Security & Privacy** settings.

<img width="580" alt="Screenshot]¥" src="https://user-images.githubusercontent.com/13146030/116784216-a3e67200-aac5-11eb-9a16-96462cbc3b75.png">

Then, install [Blackhole](https://github.com/ExistentialAudio/BlackHole)

After you have installed Blackhole, on your desktop type *command-space* to launch **Spotlight** and type in *midi* and press enter to launch **Auto MIDI Setup**.

In Auto MIDI Setup, click on the bottom right corner **+** icon and add a new Multi-Output Device. Select Blackhole 16ch as well as your speakers/headphone. 

<img width="580" alt="Screenshot 2021-05-01 at 9 42 03 PM" src="https://user-images.githubusercontent.com/13146030/116784464-e492bb00-aac6-11eb-94a2-deb13f079dde.png">

Type *command-space* to launch **Spotlight** again and type in **sound** to launch **Sound Settings**.

On the Output tab, select **Multi-Output Device** and on the Input tab select **BlackHole 16ch**.

<img width="580" alt="Screenshot 2021-05-01 at 9 45 49 PM" src="https://user-images.githubusercontent.com/13146030/116784426-b2815900-aac6-11eb-8a32-7f3ddeb29ff4.png">

<img width="580" alt="Screenshot 2021-05-01 at 9 52 15 PM" src="https://user-images.githubusercontent.com/13146030/116784568-87e3d000-aac7-11eb-880f-95900e259e6f.png">

In Game2Text, click on the cogwheel icon to launch the **Settings Dialog**.

Click on Audio Device and select Blackhole 16ch.

<img width="580" alt="Screenshot 2021-05-01 at 9 50 10 PM" src="https://user-images.githubusercontent.com/13146030/116784528-405d4400-aac7-11eb-86a3-69d89e98e330.png">

On Mac OS, automatic recording is disabled when you launch Game2Text but can be re-enabled afterwards.

<a name="browser"/>

Q. How do I use Game2Text without Chrome?
-
Replace the browser value in *browser=[your browser]* in the *config.ini* file. 
- *chrome*: Chrome
- *chromium*: Firefox, Opera, Brave, and other chromium browsers installed.
- *edge*: Microsoft Edge
- *default*: (Windows Only) finds your default browser 

<img src="https://user-images.githubusercontent.com/13146030/113812636-02f3e800-97a1-11eb-8435-5f2c0e7b0339.png" width="300">

<a name="hotkey"/>

Q. How do do I perform OCR without leaving my game?
-
There are two ways.

1. The default hotkey for OCR refresh is "Ctrl-Q" on Windows and "Command-B" on Mac. You can change the hotkey in the *config.ini* file.

2. Enable auto-mode by pressing the auto-mode icon in the toolbar.
