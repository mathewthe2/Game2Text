import yaml
import glob
from pathlib import Path
from tkinter import *
from tkinter.filedialog import asksaveasfile, askopenfile
from tools import bundle_dir

IMAGE_PROFILE_PATH = Path(bundle_dir, 'profiles')

def open_image_profile():
    root = Tk()
    root.withdraw()
    yam_file = ''
    file = askopenfile(initialdir=str(IMAGE_PROFILE_PATH), filetypes = (("YAML files","*.yaml"),("all files","*.*")), defaultextension=".yaml")
    try:
        yam_file = yaml.safe_load(file)
    except yaml.YAMLError as exc:
        print(exc)
    file.close()
    root.destroy()
    return yam_file


def export_image_profile(profile):
    root = Tk()
    root.withdraw()
    file = asksaveasfile(initialdir=str(IMAGE_PROFILE_PATH), mode='w', filetypes = (("YAML files","*.yaml"),("all files","*.*")), defaultextension=".yaml")
    if file is None: # asksaveasfile return `None` if dialog closed with "cancel".
        return
    with open(file.name, 'w') as outfile:
        yaml.dump(profile, outfile, sort_keys=False, default_flow_style=False)
    file.close()
    root.destroy()
    return file.name

def load_image_profiles():
    files = glob.glob(str(Path(IMAGE_PROFILE_PATH, '*.yaml')))

    profiles = []

    for file in files:
        with open(file, 'r') as stream:
            try:
                yam_file = yaml.safe_load(stream)
                yam_file['name'] =  Path(file).stem
                profiles.append(yam_file)
            except yaml.YAMLError as exc:
                print(exc)

    return profiles