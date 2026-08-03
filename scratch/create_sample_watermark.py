from PIL import Image, ImageEnhance, ImageFilter

base_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.user_uploaded\media__1785687643623.jpg"
wm_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"
out_sample_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\sample_watermark.jpg"

base = Image.open(base_path).convert("RGBA")
wm = Image.open(wm_path).convert("RGBA")

w_base, h_base = base.size
wm_size = int(min(w_base, h_base) * 0.40) # 40% size

wm_resized = wm.resize((wm_size, wm_size), Image.Resampling.LANCZOS)

# Create a subtle black drop-shadow behind the white stamp so it pops on light & dark photos
r, g, b, alpha = wm_resized.split()
shadow_alpha = alpha.point(lambda p: int(p * 0.6))
shadow = Image.new("RGBA", (wm_size, wm_size), (0, 0, 0, 0))
shadow_patch = Image.new("RGBA", (wm_size, wm_size), (0, 0, 0, 255))
shadow = Image.composite(shadow_patch, shadow, shadow_alpha)
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=3))

# Make white stamp 85% opacity (crisp & highly visible)
stamp_alpha = alpha.point(lambda p: int(p * 0.85))
wm_resized.putalpha(stamp_alpha)

margin = int(min(w_base, h_base) * 0.04)
x = w_base - wm_size - margin
y = h_base - wm_size - margin

composite = Image.new("RGBA", base.size)
composite.paste(base, (0, 0))
# Paste shadow first (offset 2px)
composite.paste(shadow, (x + 2, y + 2), shadow)
# Paste crisp white stamp
composite.paste(wm_resized, (x, y), wm_resized)

# Save high quality JPEG
composite.convert("RGB").save(out_sample_path, "JPEG", quality=95)
print(f"Sample watermarked photo created at {out_sample_path}")
