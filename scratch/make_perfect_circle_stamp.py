import math
from PIL import Image, ImageDraw

src_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media__1785737408944.png"
out_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"

img = Image.open(src_path).convert("RGBA")
width, height = img.size
gray = img.convert("L")
gray_pixels = gray.load()

# Center of image is roughly center of stamp circle
cx, cy = width / 2.0, height / 2.0

# 1. Find outer radius of the stamp circle
max_r = 0
for y in range(height):
    for x in range(width):
        if gray_pixels[x, y] > 40:
            dist = math.hypot(x - cx, y - cy)
            if dist > max_r:
                max_r = dist

outer_radius = max_r + 2  # slight margin

# 2. Build crisp white RGBA stamp image with circular alpha mask
stamp_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
stamp_pixels = stamp_img.load()

for y in range(height):
    for x in range(width):
        dist = math.hypot(x - cx, y - cy)
        # If outside the outer circle, stay 100% transparent
        if dist > outer_radius:
            continue
        
        lum = gray_pixels[x, y]
        # Only keep stamp lines & text characters (lum > 40)
        if lum > 35:
            # Map luminance to alpha (smooth anti-aliasing)
            alpha = min(255, int((lum - 35) * (255 / 120)))
            stamp_pixels[x, y] = (255, 255, 255, alpha)

# 3. Crop tightly to outer_radius
box_margin = 2
crop_left = max(0, int(cx - outer_radius - box_margin))
crop_top = max(0, int(cy - outer_radius - box_margin))
crop_right = min(width, int(cx + outer_radius + box_margin))
crop_bottom = min(height, int(cy + outer_radius + box_margin))

cropped_stamp = stamp_img.crop((crop_left, crop_top, crop_right, crop_bottom))

# Make square
cw, ch = cropped_stamp.size
side = max(cw, ch)
final_wm = Image.new("RGBA", (side, side), (0, 0, 0, 0))
final_wm.paste(cropped_stamp, ((side - cw) // 2, (side - ch) // 2))

final_wm.save(out_path, "PNG")
print(f"Perfect pure circular stamp watermark saved to {out_path}, size: {final_wm.size}")
