import os
from PIL import Image, ImageEnhance, ImageOps

src_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media__1785737408944.png"
out_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"

# Load image
img = Image.open(src_path).convert("RGBA")

# Extract brightness to create alpha mask
# Black background (0) becomes transparent (0), bright stamp pixels become visible alpha (up to 255)
r, g, b, a = img.split()

# Convert RGB to grayscale brightness mask
gray = img.convert("L")

# Invert or threshold to clean background noise
# Any near-black pixel (<25) becomes alpha 0
def make_alpha(val):
    if val < 25:
        return 0
    elif val > 200:
        return 230
    else:
        return int((val - 25) * (230 / 175))

alpha_data = [make_alpha(p) for p in gray.getdata()]
alpha_img = Image.new("L", gray.size)
alpha_img.putdata(alpha_data)

# Create a clean white/light-gray watermark image with alpha_img mask
# White stamp with the extracted alpha mask
stamp_color = (255, 255, 255)
watermark = Image.new("RGBA", img.size, (255, 255, 255, 0))
white_patch = Image.new("RGBA", img.size, (255, 255, 255, 255))

watermark = Image.composite(white_patch, Image.new("RGBA", img.size, (0,0,0,0)), alpha_img)

# Save watermark.png
watermark.save(out_path, "PNG")
print(f"Saved watermark to {out_path}, size: {watermark.size}")
