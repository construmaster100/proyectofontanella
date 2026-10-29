from pathlib import Path
import math
from PIL import Image, ImageFilter

root = Path(__file__).parent
source = Image.open(root / "secuencia 1.png").convert("RGB")
width, height = source.size
output = root / "secuencia_10_fullsize"
output.mkdir(exist_ok=True)

upper_limit = 440
lower_start = 480
wordmark = source.crop((0, lower_start, width, height))
canvas_height = upper_limit + wordmark.height
background = source.crop((0, 0, width, 1)).resize((width, canvas_height))
flower = source.crop((500, 180, 1235, 440))
flower_mask = Image.new("L", flower.size, 0)
flower_pixels = flower.load()
mask_pixels = flower_mask.load()
for y in range(flower.height):
    for x in range(flower.width):
        red, green, blue = flower_pixels[x, y]
        if min(red, green, blue) > 205:
            mask_pixels[x, y] = 255
flower_mask = flower_mask.filter(ImageFilter.GaussianBlur(0.45))

frames = []
for index in range(10):
    phase = index / 9
    scale = 0.42 + 0.58 * phase
    flower_width = round(flower.width * scale)
    flower_height = round(flower.height * scale)
    resized_flower = flower.resize((flower_width, flower_height), Image.Resampling.LANCZOS)
    resized_mask = flower_mask.resize((flower_width, flower_height), Image.Resampling.LANCZOS)

    frame = background.copy()
    left = round((width - flower_width) / 2)
    top = upper_limit - flower_height
    frame.paste(resized_flower, (left, top), resized_mask)
    frame.paste(wordmark, (0, upper_limit))
    frame.save(output / f"frame_{index + 1:02d}_{width}x{canvas_height}.png")
    frames.append(frame)

tile_width = width // 5
thumbnail_height = canvas_height // 5
sheet = Image.new("RGB", (tile_width * 5, thumbnail_height * 2), source.getpixel((0, 0)))
for index, frame in enumerate(frames):
    thumbnail = frame.resize((tile_width, thumbnail_height), Image.Resampling.LANCZOS)
    sheet.paste(thumbnail, ((index % 5) * tile_width, (index // 5) * thumbnail_height))
sheet.save(root / "secuencia_10_fullsize_contact_sheet.png")
