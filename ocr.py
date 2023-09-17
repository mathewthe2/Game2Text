from pathlib import Path

import pytesseract

from config import OCR_CONFIG, r_config
from logger import log_media, log_text
from ocr_space import OCRSPACE_API_URL_EU, OCRSPACE_API_URL_USA, ocr_space_file
from tools import bundle_dir, get_tessdata_dir, path_to_tesseract
from util import base64_to_image, base64_to_image_path

HORIZONTAL_TEXT_DETECTION = 6
VERTICAL_TEXT_DETECTON = 5


def get_temp_image_path():
    return str(Path(bundle_dir, "logs", "images", "temp.png"))


def detect_and_log(engine, cropped_image, text_orientation, session_start_time, request_time, audio_recorder):
    result = image_to_text(engine, cropped_image, text_orientation)
    if result is not None:
        log_text(session_start_time, request_time, result)
        log_media(session_start_time, request_time, audio_recorder)
        return {"id": request_time, "result": result}
    else:
        return {"error": "OCR Failed"}


def image_to_text(engine, base64img, text_orientation):
    if engine == "OCR Space USA" or engine == "OCR Space EU":
        api_url = OCRSPACE_API_URL_USA if engine == "OCR Space USA" else OCRSPACE_API_URL_EU
        image_path = base64_to_image_path(base64img, get_temp_image_path())
        language = r_config(OCR_CONFIG, "ocr_space_language")
        return ocr_space_file(filename=image_path, language=language, url=api_url)
    else:
        # default to tesseract
        image = base64_to_image(base64img, get_temp_image_path())
        return tesseract_ocr(image, text_orientation)


def tesseract_ocr(image, text_orientation):
    language = r_config(OCR_CONFIG, "tesseract_language")
    psm = HORIZONTAL_TEXT_DETECTION
    # Add English Tessdata for legacy Tesseract (English is included in v4 Japanese trained data)
    is_legacy_tesseract = r_config(OCR_CONFIG, "oem") == "0"
    if is_legacy_tesseract:
        language += "+eng"
    # Manual Vertical Text Orientation
    if text_orientation == "vertical":
        psm = VERTICAL_TEXT_DETECTON
        language += "_vert"
    custom_config = r"{} --oem {} --psm {} -c preserve_interword_spaces=1 {}".format(
        get_tessdata_dir(), r_config(OCR_CONFIG, "oem"), psm, r_config(OCR_CONFIG, "extra_options").strip('"')
    )
    result = pytesseract.image_to_string(image, config=custom_config, lang=language)
    return result


tesseract_cmd = path_to_tesseract()
if tesseract_cmd is not None:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
