import glob
import os
from PIL import Image

dir_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded"
files = glob.glob(os.path.join(dir_path, "*"))

for f in files:
    try:
        im = Image.open(f)
        print(f"{os.path.basename(f)}: size={im.size}, mode={im.mode}")
    except Exception as e:
        pass
