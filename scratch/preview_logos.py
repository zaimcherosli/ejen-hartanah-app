import os
from PIL import Image

def check_png(name):
    path = os.path.join("logos", name)
    img = Image.open(path).convert("RGBA")
    
    # Composite over a light gray/white background to test appearance
    bg = Image.new("RGBA", img.size, (248, 250, 252, 255)) # var(--bg-subtle) color
    comp = Image.alpha_composite(bg, img)
    
    preview_path = os.path.join("logos", "preview_" + name)
    comp.save(preview_path)
    print(f"Generated preview for {name}: {img.size}")

pngs = [f for f in os.listdir("logos") if f.endswith(".png") and not f.startswith("preview_")]
for p in pngs:
    check_png(p)
