"""Generate a clean, modern GoutGuard app icon."""
from PIL import Image, ImageDraw, ImageFont
import math

SIZES = {
    "public/icon-512.png": 512,
    "public/icon-192.png": 192,
    "app-icon-1024.png": 1024,
}


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size  # shorthand

    # ── Background: rounded rectangle with blue gradient ──
    # We'll simulate a gradient by drawing horizontal lines
    corner_r = int(s * 0.22)
    for y in range(s):
        t = y / s
        # Gradient from top (#2563EB bright blue) to bottom (#1E40AF deeper blue)
        r = int(37 + (30 - 37) * t)
        g = int(99 + (64 - 99) * t)
        b = int(235 + (175 - 235) * t)
        draw.rectangle([0, y, s - 1, y], fill=(r, g, b, 255))

    # Apply rounded corners by masking
    mask = Image.new("L", (s, s), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=corner_r, fill=255)
    img.putalpha(mask)

    # ── Water droplet shape (centered, large) ──
    cx, cy = s * 0.5, s * 0.52
    drop_h = s * 0.52  # total height of droplet
    drop_w = s * 0.36  # max width

    # Build droplet as a polygon: pointed top, round bottom
    points = []
    # Top point
    top_y = cy - drop_h * 0.48
    bot_y = cy + drop_h * 0.48
    circle_cy = cy + drop_h * 0.1  # center of the circular part
    circle_r = drop_w * 0.5

    # Upper curves (left and right) from tip down to circle
    num_pts = 40
    for i in range(num_pts + 1):
        t = i / num_pts  # 0 = top, 1 = widest
        # Bezier-like curve from tip to circle edge
        y = top_y + t * (circle_cy - top_y + circle_r * 0.3)
        # Width increases with a curve
        w = drop_w * 0.5 * (t ** 0.7)
        points.append((cx - w, y))

    # Bottom semicircle
    start_angle = math.pi  # left
    for i in range(num_pts + 1):
        angle = start_angle - i / num_pts * math.pi
        x = cx + circle_r * math.cos(angle)
        y = circle_cy + circle_r * math.sin(angle) * 1.1
        points.append((x, y))

    # Right side going back up
    for i in range(num_pts + 1):
        t = 1 - i / num_pts
        y = top_y + t * (circle_cy - top_y + circle_r * 0.3)
        w = drop_w * 0.5 * (t ** 0.7)
        points.append((cx + w, y))

    # Draw droplet with white fill, slight transparency
    draw.polygon(points, fill=(255, 255, 255, 240))

    # ── Small "G" letter inside the droplet ──
    font_size = int(s * 0.26)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except (IOError, OSError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
        except (IOError, OSError):
            font = ImageFont.load_default()

    # Measure text
    bbox = draw.textbbox((0, 0), "G", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1] + s * 0.04  # slightly lower to sit in droplet body

    # Draw "G" in the blue color
    draw.text((tx, ty), "G", fill=(37, 99, 235, 255), font=font)

    # ── Small plus/cross (health symbol) in top-right area of droplet ──
    plus_cx = cx + s * 0.08
    plus_cy = cy - s * 0.1
    plus_size = s * 0.04
    plus_thick = max(2, int(s * 0.015))
    # Horizontal bar
    draw.rounded_rectangle(
        [plus_cx - plus_size, plus_cy - plus_thick,
         plus_cx + plus_size, plus_cy + plus_thick],
        radius=plus_thick,
        fill=(37, 99, 235, 200),
    )
    # Vertical bar
    draw.rounded_rectangle(
        [plus_cx - plus_thick, plus_cy - plus_size,
         plus_cx + plus_thick, plus_cy + plus_size],
        radius=plus_thick,
        fill=(37, 99, 235, 200),
    )

    return img


for path, sz in SIZES.items():
    icon = draw_icon(sz)
    icon.save(path)
    print(f"Saved {path} ({sz}x{sz})")

print("Done!")
