import os
from PIL import Image, ImageChops

def process_image(filename):
    filepath = os.path.join("logos", filename)
    if not os.path.exists(filepath):
        return
    img = Image.open(filepath).convert("RGBA")
    
    # Analyze corners to determine background color
    w, h = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((w - 1, 0)),
        img.getpixel((0, h - 1)),
        img.getpixel((w - 1, h - 1)),
        img.getpixel((5, 5)),
        img.getpixel((w - 6, 5))
    ]
    
    # Find dominant background color from corners
    r_avg = sum(c[0] for c in corners) / len(corners)
    g_avg = sum(c[1] for c in corners) / len(corners)
    b_avg = sum(c[2] for c in corners) / len(corners)
    
    bg_is_dark = (r_avg + g_avg + b_avg) / 3 < 100
    bg_is_yellow = (r_avg > 200 and g_avg > 200 and b_avg < 80)
    bg_is_white = (r_avg > 220 and g_avg > 220 and b_avg > 220)
    
    print(f"Processing {filename}: bg_avg=({r_avg:.1f},{g_avg:.1f},{b_avg:.1f}) dark={bg_is_dark} white={bg_is_white} yellow={bg_is_yellow}")

    datas = img.getdata()
    new_data = []
    
    # Specific image handling
    name_base = os.path.splitext(filename)[0]
    
    for item in datas:
        r, g, b, a = item
        
        # Pharmaniaga special case: black outer OR pure white inner box
        if name_base == "pharmaniaga":
            # If black background (outer border) or white background (inner box)
            if (r < 30 and g < 30 and b < 30) or (r > 240 and g > 240 and b > 240):
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, 255))
        elif name_base == "red-chamber":
            # Red chamber has dark red/black background, main text is pure white & red
            # Background is dark red/black (r < 180, g < 40, b < 40)
            if r < 190 and g < 50 and b < 50:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, 255))
        elif bg_is_dark:
            # Black/Dark background removal (e.g. capitaland, mtd)
            dist_from_black = (r**2 + g**2 + b**2)**0.5
            if dist_from_black < 50:
                new_data.append((255, 255, 255, 0))
            else:
                # If dark text/element on black background, boost brightness if needed, or keep color
                new_data.append((r, g, b, 255))
        elif bg_is_yellow:
            # Yellow background removal (flash-express)
            if r > 180 and g > 180 and b < 100:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, 255))
        else:
            # White background removal (tnb, jnt, pnb, midf, scania, pos-logistics, lyl-group)
            if r > 230 and g > 230 and b > 230:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, 255))
                
    img.putdata(new_data)
    
    # Auto-crop alpha bounding box
    bbox = img.getbbox()
    if bbox:
        # add padding
        pad = 5
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        img = img.crop(bbox)
        
    out_filename = os.path.splitext(filename)[0] + ".png"
    out_path = os.path.join("logos", out_filename)
    img.save(out_path, "PNG")
    print(f"Saved: {out_path} ({img.size[0]}x{img.size[1]})")

files = [f for f in os.listdir("logos") if f.endswith(".jpg")]
for f in files:
    process_image(f)
