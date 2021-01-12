import pyperclip
import eel

previous_text = ""

def clipboard_to_output():
    global previous_text
    if not previous_text:
        previous_text = eel.getOutputText()()
    if previous_text != pyperclip.paste():
        eel.updateOutput(pyperclip.paste())
        previous_text = pyperclip.paste()

def text_to_clipboard(text):
    pyperclip.copy(text)
