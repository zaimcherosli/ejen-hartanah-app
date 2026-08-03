from PIL import Image

wm_path = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png"
test_img_path = r"C:\Users\Zaim\.gemini\antigravity\brain\4636d917-e7c3-419d-9eda-008fe91decde\.tempmediaStorage\media_4636d917-e7c3-419d-9eda-008fe91decde_1785687927525.jpg"

base = Image.open(test_img_path).convert("RGBA")
wm = Image.open(wm_path).convert("RGBA")

w_base, h_base = base.size
wm_size = int(min(w_base, h_base) * 0.38)

wm_resized = wm.resize((wm_size, wm_size), Image.Resampling.LANCZOS)

# Adjust opacity to ~45% (matching user sample intensity)
r, g, b, alpha = wm_resized.split()
alpha = alpha.point(lambda p: int(p * 0.45))
wm_resized.putalpha(alpha)

margin = int(min(w_base, h_base) * 0.04)
x = w_base - wm_size - margin
y = h_base - wm_size - margin

composite = Image.new("RGBA", base.size)
composite.paste(base, (0, 0))
composite.paste(wm_resized, (x, y), wm_resized)

out_test = r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\scratch\test_watermarked_factory_3.jpg"
composite.convert("RGB").save(out_test, "JPEG", quality=92)
print(f"Test image saved to {out_test}")
