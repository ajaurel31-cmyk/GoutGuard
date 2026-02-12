#!/usr/bin/env python3
"""Generate GoutGuard app icon: shield with 'G' and water drop, blue gradient, no alpha."""
from PIL import Image, ImageDraw, ImageFont
import math

SIZE = 1024
img = Image.new('RGB', (SIZE, SIZE), (0, 0, 0))
draw = ImageDraw.Draw(img)

cx = SIZE // 2

# Background gradient
for y in range(SIZE):
    t = y / SIZE
    r = int(15 + (35 - 15) * t)
    g = int(50 + (95 - 50) * t)
    b = int(180 + (225 - 180) * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

# Shield dimensions
s_left, s_right = 190, 834
s_top = 120
s_rect_bot = 580
s_point_y = 900
border = 26

def draw_shield(d, left, right, top, rect_bot, point_y, fill):
    d.rounded_rectangle([left, top, right, rect_bot + 40], radius=55, fill=fill)
    d.polygon([(left, rect_bot), (right, rect_bot), (cx, point_y)], fill=fill)
    d.rectangle([left, rect_bot - 1, right, rect_bot + 40], fill=fill)

# Outer white shield
draw_shield(draw, s_left, s_right, s_top, s_rect_bot, s_point_y, (255, 255, 255))

# Inner shield mask
il, ir = s_left + border, s_right - border
it = s_top + border
ipy = s_point_y - border - 15
mask = Image.new('L', (SIZE, SIZE), 0)
draw_shield(ImageDraw.Draw(mask), il, ir, it, s_rect_bot, ipy, 255)

# Fill inner shield with gradient
for y in range(SIZE):
    for x in range(SIZE):
        if mask.getpixel((x, y)) > 0:
            t = max(0.0, min(1.0, (y - it) / (ipy - it)))
            draw.point((x, y), fill=(
                int(22 + (12 - 22) * t),
                int(75 + (45 - 75) * t),
                int(210 + (170 - 210) * t),
            ))

# Font
try:
    font_g = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 280)
except:
    font_g = ImageFont.load_default()

# "G" letter - center it vertically in the shield rectangle area
bbox = draw.textbbox((0, 0), "G", font=font_g)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
gx = cx - tw // 2
gy = 195

draw.text((gx + 3, gy + 3), "G", fill=(10, 40, 140), font=font_g)
draw.text((gx, gy), "G", fill=(255, 255, 255), font=font_g)

# Water drop - large teardrop in the lower triangle portion
drop_cx = cx
drop_top = 630       # top point of drop
drop_bottom = 810    # bottom of circle
drop_radius = 55     # radius of the round part

# Build teardrop: circle at bottom + triangle pointing up
# Bottom circle
draw.ellipse(
    [drop_cx - drop_radius, drop_bottom - drop_radius * 2,
     drop_cx + drop_radius, drop_bottom],
    fill=(96, 180, 255)
)
# Triangle from top point to edges of circle
circle_cy = drop_bottom - drop_radius
# Points where triangle meets circle tangentially
draw.polygon([
    (drop_cx, drop_top),
    (drop_cx - drop_radius + 5, circle_cy),
    (drop_cx + drop_radius - 5, circle_cy),
], fill=(96, 180, 255))
# Fill any gap
draw.rectangle([drop_cx - drop_radius + 5, circle_cy - 2, drop_cx + drop_radius - 5, circle_cy + 10], fill=(96, 180, 255))

# Highlight shine
draw.ellipse([drop_cx - 32, circle_cy - 22, drop_cx - 10, circle_cy + 8], fill=(170, 215, 255))
# Tiny bright dot
draw.ellipse([drop_cx - 28, circle_cy - 16, drop_cx - 18, circle_cy - 6], fill=(220, 240, 255))

# Save
img.save('/home/user/GoutGuard/app-icon-1024.png', 'PNG')
img.resize((512, 512), Image.LANCZOS).save('/home/user/GoutGuard/public/icon-512.png', 'PNG')
img.resize((192, 192), Image.LANCZOS).save('/home/user/GoutGuard/public/icon-192.png', 'PNG')
img.save('/home/user/GoutGuard/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 'PNG')

print("Icons generated successfully")
