import os
from PIL import Image

def process_red_chamber():
    img = Image.open("logos/red-chamber.jpg").convert("RGBA")
    w, h = img.size
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # If it's the dark red / black background
        if r < 190 and g < 60 and b < 60:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            # It's white text / light red emblem. Turn white text into crisp dark corporate red (#990000)
            # preserve brightness gradient
            factor = max(r, g, b) / 255.0
            new_r = int(160 * factor)
            new_g = int(10 * factor)
            new_b = int(20 * factor)
            new_data.append((new_r, new_g, new_b, 255))
            
    img.putdata(new_data)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save("logos/red-chamber.png", "PNG")
    print("Red Chamber processed cleanly")

def process_flash_express():
    img = Image.open("logos/flash-express.jpg").convert("RGBA")
    w, h = img.size
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # Remove white outer background OR yellow box background
        is_white = (r > 230 and g > 230 and b > 230)
        is_yellow = (r > 190 and g > 190 and b < 100)
        
        if is_white or is_yellow:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            # Keep black text and lightning outline
            new_data.append((r, g, b, 255))
            
    img.putdata(new_data)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save("logos/flash-express.png", "PNG")
    print("Flash Express processed cleanly")

process_red_chamber()
process_flash_express()
