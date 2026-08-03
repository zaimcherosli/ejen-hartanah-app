from PIL import Image

img = Image.open(r"C:\Users\Zaim\.gemini\antigravity\scratch\ejen-hartanah-app\watermark.png")
print("Mode:", img.mode)
print("Size:", img.size)

# Check corner pixels alpha
alpha = img.split()[-1]
corners = [
    alpha.getpixel((0, 0)),
    alpha.getpixel((img.width - 1, 0)),
    alpha.getpixel((0, img.height - 1)),
    alpha.getpixel((img.width - 1, img.height - 1))
]
print("Corner alphas (should be 0):", corners)
