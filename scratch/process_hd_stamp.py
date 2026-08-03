import math
from PIL import Image

src_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media__1785767182917.png"
out_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"

# Load HD source image
img = Image.open(src_path).convert("RGBA")
width, height = img.size
gray = img.convert("L")
gray_pixels = gray.load()

# Center of image
cx, cy = width / 2.0, height / 2.0

# Create new RGBA canvas
clean_stamp = Image.new("RGBA", (width, height), (0, 0, 0, 0))
clean_pixels = clean_stamp.load()

# Find exact outer radius of the stamp circle
max_r = 0
for y in range(height):
    for x in range(width):
        lum = gray_pixels[x, y]
        # In this HD image, stamp lines are BLACK (lum < 100), background is WHITE (lum > 200)
        if lum < 150:
            dist = math.hypot(x - cx, y - cy)
            if dist > max_r:
                max_r = dist

outer_radius = max_r + 3

for y in range(height):
    for x in range(width):
        dist = math.hypot(x - cx, y - cy)
        # Outside outer circle -> 100% transparent
        if dist > outer_radius:
            continue
        
        lum = gray_pixels[x, y]
        # Stamp lines are black (lum < 180)
        if lum < 180:
            # Calculate alpha: pure black (0) -> alpha 255; lighter gray -> lower alpha
            alpha = min(255, int((180 - lum) * (255 / 160)))
            # White stamp lines with calculated alpha
            clean_pixels[x, y] = (255, 255, 255, alpha)

# Crop tightly around outer_radius
box_margin = 3
crop_left = max(0, int(cx - outer_radius - box_margin))
crop_top = max(0, int(cy - outer_radius - box_margin))
crop_right = min(width, int(cx + outer_radius + box_margin))
crop_bottom = min(height, int(cy + outer_radius + box_margin))

cropped = clean_stamp.crop((crop_left, crop_top, crop_right, crop_bottom))

# Make square
cw, ch = cropped.size
side = max(cw, ch) + 10
final_wm = Image.new("RGBA", (side, side), (0, 0, 0, 0))
final_wm.paste(cropped, ((side - cw) // 2, (side - ch) // 2))

final_wm.save(out_path, "PNG")
print(f"HD Circular Stamp Watermark saved to {out_path}, size: {final_wm.size}")
