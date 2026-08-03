from PIL import Image, ImageFilter

photo_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media_1785769905947.jpg"
wm_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"
out_demo_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\demo_watermarked_property.jpg"

base = Image.open(photo_path).convert("RGBA")
wm = Image.open(wm_path).convert("RGBA")

w_base, h_base = base.size
wm_size = int(min(w_base, h_base) * 0.38) # 38% stamp size

wm_resized = wm.resize((wm_size, wm_size), Image.Resampling.LANCZOS)

# Create drop shadow for contrast
r, g, b, alpha = wm_resized.split()
shadow_alpha = alpha.point(lambda p: int(p * 0.7))
shadow = Image.new("RGBA", (wm_size, wm_size), (0, 0, 0, 0))
shadow_patch = Image.new("RGBA", (wm_size, wm_size), (0, 0, 0, 255))
shadow = Image.composite(shadow_patch, shadow, shadow_alpha)
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=2))

# 85% opacity white stamp
stamp_alpha = alpha.point(lambda p: int(p * 0.85))
wm_resized.putalpha(stamp_alpha)

margin = int(min(w_base, h_base) * 0.04)
x = w_base - wm_size - margin
y = h_base - wm_size - margin

composite = Image.new("RGBA", base.size)
composite.paste(base, (0, 0))
# Shadow
composite.paste(shadow, (x + 2, y + 2), shadow)
# White stamp
composite.paste(wm_resized, (x, y), wm_resized)

composite.convert("RGB").save(out_demo_path, "JPEG", quality=95)
print(f"Demo photo saved to {out_demo_path}")
