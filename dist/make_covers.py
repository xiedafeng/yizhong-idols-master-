from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random, os

os.makedirs('store-assets/cover', exist_ok=True)
BRUSH = 'store-assets/icon/hero-brush.ttf'
SANS = 'C:/Windows/Fonts/msyhbd.ttc'
CHAR = 'background/1781538248015-cutout.webp'

def gradient(w, h, top, bot):
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img

def petals(img, n=40, seed=3):
    w, h = img.size
    d = ImageDraw.Draw(img, 'RGBA')
    rng = random.Random(seed)
    for _ in range(n):
        x = rng.uniform(0, w); y = rng.uniform(0, h)
        r = rng.uniform(w*0.006, w*0.016); a = rng.uniform(0, math.tau)
        col = rng.choice([(255,255,255,80),(255,170,210,95),(255,255,255,50)])
        pts = [(x + r*math.cos(a + k*math.tau/5), y + r*math.sin(a + k*math.tau/5)) for k in range(5)]
        d.polygon(pts, fill=col)
    return img

def add_glow(img, cx, cy, rx, ry):
    w, h = img.size
    g = Image.new('L', (w, h), 0)
    ImageDraw.Draw(g).ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=115)
    g = g.filter(ImageFilter.GaussianBlur(max(w, h)//9))
    white = Image.new('RGB', (w, h), 'white')
    return Image.composite(white, img, g.point(lambda v: int(v*0.62)))

def place_char(img, path, target_h, right_pad, bottom_pad):
    ch = Image.open(path).convert('RGBA')
    r = target_h / ch.height
    ch = ch.resize((max(1, int(ch.width*r)), target_h), Image.LANCZOS)
    x = img.width - ch.width + right_pad
    y = img.height - ch.height + bottom_pad
    # shadow
    alpha = ch.split()[-1].point(lambda a: int(a*0.55))
    sh = Image.new('RGBA', img.size, (0,0,0,0))
    sh.paste((60, 10, 45, 160), (x+18, y+26), alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    out = Image.alpha_composite(img.convert('RGBA'), sh)
    out.alpha_composite(ch, (x, y))
    return out

def text_shadow(base, items):
    sh = Image.new('RGBA', base.size, (0,0,0,0))
    d = ImageDraw.Draw(sh)
    for text, font, xy, sw in items:
        d.text((xy[0]+5, xy[1]+10), text, font=font, anchor='la', fill=(80,10,60,130), stroke_width=sw, stroke_fill=(80,10,60,130))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    return Image.alpha_composite(base, sh)

def draw_title(img, x, y, big, mid, sub=None):
    f1 = ImageFont.truetype(BRUSH, big)
    f2 = ImageFont.truetype(BRUSH, mid)
    items = [('一中', f1, (x, y), max(4, big//38)), ('偶像大师', f2, (x, y+int(big*0.92)), max(3, mid//26))]
    base = text_shadow(img.convert('RGBA'), items)
    d = ImageDraw.Draw(base)
    d.text((x, y), '一中', font=f1, anchor='la', fill='white', stroke_width=max(4, big//38), stroke_fill=(224,69,138,255))
    d.text((x, y+int(big*0.92)), '偶像大师', font=f2, anchor='la', fill='white', stroke_width=max(3, mid//26), stroke_fill=(224,69,138,255))
    if sub:
        f3 = ImageFont.truetype(SANS, max(28, mid//3))
        sy = y + int(big*0.92) + int(mid*1.18)
        bb = d.textbbox((0, 0), sub, font=f3)
        tw, th = bb[2]-bb[0], bb[3]-bb[1]
        pad_x, pad_y = max(18, mid//6), max(10, mid//10)
        d.rounded_rectangle([x, sy-pad_y, x+tw+pad_x*2, sy+th+pad_y*2], radius=999,
                            fill=(255,255,255,228))
        d.text((x+pad_x, sy-bb[1]+pad_y), sub, font=f3, anchor='la', fill=(203,42,120,255))
    return base

def make(w, h, name, char_h, char_right, char_bottom, title_xy, big, mid, sub=None, seed=3):
    img = gradient(w, h, (255, 218, 238), (173, 157, 255))
    img = add_glow(img, int(w*0.72), int(h*0.42), int(w*0.46), int(h*0.34))
    img = petals(img, 46, seed)
    img = place_char(img, CHAR, char_h, char_right, char_bottom)
    img = draw_title(img, title_xy[0], title_xy[1], big, mid, sub)
    # bottom fade for text legibility
    fade_h = int(h*0.16)
    fade = Image.new('RGBA', (w, fade_h), (0,0,0,0))
    fd = ImageDraw.Draw(fade)
    for i in range(fade_h):
        fd.line([(0,i),(w,i)], fill=(48, 18, 62, int(90*(i/fade_h)**1.4)))
    img.alpha_composite(fade, (0, h-fade_h))
    # frame
    ImageDraw.Draw(img).rounded_rectangle([12,12,w-13,h-13], radius=max(16, w//38), outline=(255,255,255,110), width=max(3, w//300))
    out = f'store-assets/cover/{name}'
    img.convert('RGB').save(out, quality=92)
    print(out, img.size)

# 2:3 vertical cover (required, min 600x900)
make(1200, 1800, 'cover-vertical-1200x1800.png', 1280, 40, 30, (80, 190), 270, 124,
     '12 周养成 · 三选一出牌', seed=3)
# 16:9 banner (min 1920x1080)
make(1920, 1080, 'banner-1920x1080.png', 1040, 30, 20, (120, 175), 300, 138,
     None, seed=5)
# 1:1 square promo (min 1440x1440)
make(1440, 1440, 'square-1440x1440.png', 1080, 10, 10, (80, 150), 300, 138,
     None, seed=9)
