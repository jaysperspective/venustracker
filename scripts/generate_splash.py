"""Generate Venus Rose splash screen PNG (2732x2732)."""
import math

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("pip install Pillow first")
    raise SystemExit(1)

SIZE = 2732
BG = (13, 13, 8)  # #0D0D08
SAGE = (197, 201, 168, 180)  # #C5C9A8 with alpha

img = Image.new('RGBA', (SIZE, SIZE), BG + (255,))
draw = ImageDraw.Draw(img)

cx, cy = SIZE / 2, SIZE / 2
rV, rE = 0.723, 1.0
wV = (2 * math.pi) / 224.7
wE = (2 * math.pi) / 365.25
T = 8 * 365.25
N = 4000
scale = SIZE * 0.21  # ~574px radius

points = []
for i in range(N + 1):
    t = (i / N) * T
    x = cx + (rV * math.cos(wV * t) - rE * math.cos(wE * t)) * scale
    y = cy - (rV * math.sin(wV * t) - rE * math.sin(wE * t)) * scale
    points.append((x, y))

# Draw the curve
for i in range(len(points) - 1):
    draw.line([points[i], points[i + 1]], fill=SAGE, width=3)

# Flatten to RGB for PNG
out = Image.new('RGB', (SIZE, SIZE), BG)
out.paste(img, mask=img.split()[3])

out_dir = "/Users/joshuaharrington/venustracker/frontend/ios/App/App/Assets.xcassets/Splash.imageset"
for suffix in ['', '-1', '-2']:
    out.save(f"{out_dir}/splash-2732x2732{suffix}.png", "PNG")

print(f"Saved 3 splash images to {out_dir}")
