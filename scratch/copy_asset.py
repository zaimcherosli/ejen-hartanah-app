import os, shutil

src = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"
dst = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\assets\watermark.png"

os.makedirs(os.path.dirname(dst), exist_ok=True)
shutil.copyfile(src, dst)
print(f"Successfully copied {src} to {dst}")
