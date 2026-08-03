from PIL import Image, ImageFilter

src_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media__1785737408944.png"
out_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"

img = Image.open(src_path).convert("RGBA")
gray = img.convert("L")

# Threshold: stamp stroke/text is light gray/white in source
# Make white pixels pure white with smooth alpha mask
def make_alpha(val):
    if val < 25:
        return 0
    elif val > 160:
        return 240
    else:
        return int((val - 25) * (240 / 135))

alpha_data = [make_alpha(p) for p in gray.getdata()]
alpha_img = Image.new("L", gray.size)
alpha_img.putdata(alpha_data)

# Create pure white stamp image
white_img = Image.new("RGBA", img.size, (255, 255, 255, 255))
watermark = Image.composite(white_img, Image.new("RGBA", img.size, (0,0,0,0)), alpha_img)

# Crop tightly around circle
bbox = watermark.getbbox()
if bbox:
    watermark = watermark.crop(bbox)

# Make square
w, h = watermark.size
max_dim = max(w, h)
square_wm = Image.new("RGBA", (max_dim, max_dim), (0,0,0,0))
square_wm.paste(watermark, ((max_dim - w) // 2, (max_dim - h) // 2))

square_wm.save(out_path, "PNG")
print(f"Clean pure-white circular watermark saved to {out_path}, size: {square_wm.size}")
