import os
from PIL import Image

def clean_red_chamber():
    img = Image.open("logos/red-chamber.jpg").convert("RGBA")
    w, h = img.size
    datas = img.getdata()
    new_data = []
    
    # We only want the main logo and text line "Red Chamber Co."
    # Crop out the bottom artifact noise below main text line
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            # Cut off bottom noise artifacts below y > h*0.80
            if y > h * 0.75:
                new_data.append((255, 255, 255, 0))
            elif r < 190 and g < 60 and b < 60:
                new_data.append((255, 255, 255, 0)) # transparent
            else:
                # Turn white script text to crisp dark corporate red
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
    print("Cleaned Red Chamber")

clean_red_chamber()
