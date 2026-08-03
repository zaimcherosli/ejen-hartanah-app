import math
from PIL import Image

src_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media__1785737408944.png"
out_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"

img = Image.open(src_path).convert("RGBA")
width, height = img.size
gray = img.convert("L")
pixels = gray.load()

# Create pure transparent RGBA canvas
clean_wm = Image.new("RGBA", (width, height), (0, 0, 0, 0))
clean_pixels = clean_wm.load()

# Threshold: stamp stroke/text is bright (lum > 95)
# Dark background (inside & outside circle) is lum < 95 -> Alpha 0!
for y in range(height):
    for x in range(width):
        lum = pixels[x, y]
        if lum > 90:
            # White stamp lines with alpha proportional to brightness
            alpha = min(255, int((lum - 90) * (255 / 100)))
            clean_pixels[x, y] = (255, 255, 255, alpha)

# Crop tightly around stamp lines
bbox = clean_wm.getbbox()
if bbox:
    clean_wm = clean_wm.crop(bbox)

# Make square
w, h = clean_wm.size
max_dim = max(w, h) + 10
final_wm = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
final_wm.paste(clean_wm, ((max_dim - w) // 2, (max_dim - h) // 2))

final_wm.save(out_path, "PNG")
print(f"Perfect transparent circular text stamp saved to {out_path}, size: {final_wm.size}")
