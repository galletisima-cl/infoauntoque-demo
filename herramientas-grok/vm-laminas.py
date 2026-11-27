from PIL import Image, ImageDraw, ImageFont
from motor import render, hx
from criaturas import LINEAS
import random

F = '/usr/share/fonts/truetype/dejavu/'
fb = lambda s: ImageFont.truetype(F + 'DejaVuSans-Bold.ttf', s)
fr = lambda s: ImageFont.truetype(F + 'DejaVuSans.ttf', s)
fm = lambda s: ImageFont.truetype(F + 'DejaVuSansMono-Bold.ttf', s)

def ventana_ff(d, x0, y0, x1, y1):
    """Ventana de menú estilo RPG de 16 bits: degradado azul y borde blanco redondeado."""
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        c = tuple(int(a + (b - a) * t) for a, b in zip((52, 72, 190), (12, 16, 70)))
        d.line([(x0, y), (x1, y)], fill=c)
    d.rounded_rectangle([x0, y0, x1, y1], radius=10, outline=(236, 236, 250), width=4)
    d.rounded_rectangle([x0 + 5, y0 + 5, x1 - 5, y1 - 5], radius=7, outline=(120, 130, 190), width=1)

def texto_sombra(d, xy, t, f, c=(255, 255, 255)):
    d.text((xy[0] + 2, xy[1] + 2), t, font=f, fill=(10, 10, 30)); d.text(xy, t, font=f, fill=c)

def lamina(estilo, N, K, nombre):
    celda = N * K; W = 3 * celda + 2 * 110 + 160; H = 190 + 3 * (celda + 120)
    bg = (24, 20, 38) if estilo == 'ff' else (250, 244, 236)
    im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
    tinta = (245, 245, 255) if estilo == 'ff' else (40, 24, 40)
    suave = (170, 170, 210) if estilo == 'ff' else (120, 100, 110)
    d.text((60, 40), 'Virtual Monster', font=fb(46), fill=tinta)
    d.text((60, 100), ('Estilo Final Fantasy · 16 bits (80×80, 5 tonos con dithering)' if estilo == 'ff'
                       else 'Pixel art estilo bolsillo (48×48, 3 tonos y contorno negro)'), font=fr(24), fill=suave)
    d.text((60, 132), 'Una rama de evolución por tipo: la que más coma define en qué se convierte', font=fr(20), fill=suave)
    for r, (tipo, color, etapas) in enumerate(LINEAS):
        y = 190 + r * (celda + 120)
        d.rounded_rectangle([60, y + celda // 2 - 22, 60 + 30, y + celda // 2 + 22], radius=8, fill=hx(color))
        d.text((44, y + celda // 2 + 34), tipo, font=fb(20), fill=tinta, anchor='lt') if False else None
        for k, (n, niv, fn) in enumerate(etapas):
            x = 130 + k * (celda + 110)
            if estilo == 'ff':
                ventana_ff(d, x - 14, y - 14, x + celda + 14, y + celda + 14)
            else:
                d.rounded_rectangle([x - 10, y - 10, x + celda + 10, y + celda + 10], radius=18, fill=(255, 255, 255), outline=(232, 220, 210), width=2)
                d.ellipse([x + celda * .2, y + celda * .86, x + celda * .8, y + celda * .97], fill=(236, 226, 216))
            spr = render(fn(), N, estilo).resize((celda, celda), Image.NEAREST)
            im.paste(spr, (x, y), spr)
            d.text((x + celda // 2, y + celda + 26), n, font=fb(28), fill=tinta, anchor='mm')
            d.text((x + celda // 2, y + celda + 58), f'{niv} · {tipo}', font=fr(19), fill=suave, anchor='mm')
            if k < 2:
                ax = x + celda + 55; ay = y + celda // 2
                d.polygon([(ax - 22, ay - 14), (ax + 18, ay), (ax - 22, ay + 14)], fill=hx(color))
    im.save(nombre)

def batalla(nombre):
    W, H, K, N = 1280, 860, 3, 80
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    # cielo de atardecer en bandas con dithering (como los fondos de batalla de 16 bits)
    cielo = [(40, 24, 80), (84, 40, 110), (150, 60, 120), (220, 100, 110), (250, 160, 110), (255, 210, 140)]
    hz = 470
    for y in range(hz):
        t = y / hz * (len(cielo) - 1); i = int(t); fr_ = t - i
        for x in range(0, W, 4):
            c = cielo[min(i + (1 if fr_ * 4 > ((x // 4 + y // 4) % 4) else 0), len(cielo) - 1)]
            d.rectangle([x, y, x + 3, y + 3], fill=c) if y % 4 == 0 else None
    random.seed(7)
    for _ in range(70):
        x, y = random.randrange(W), random.randrange(160); d.rectangle([x, y, x + 3, y + 3], fill=(255, 240, 220))
    # cordillera en dos planos, con nieve
    def monte(base, alto, col, nieve, sem):
        random.seed(sem); pts = [(0, H)]; x = 0
        while x <= W:
            pts.append((x, base - random.randint(alto // 3, alto))); x += random.randint(60, 140)
        pts += [(W, base), (W, H)]
        d.polygon(pts, fill=col)
        for (x1, y1), (x2, y2) in zip(pts[1:-2], pts[2:-1]):
            top = (x1, y1) if y1 < y2 else (x2, y2)
            if top[1] < base - alto * .55:
                d.polygon([top, (top[0] - 22, top[1] + 30), (top[0] + 22, top[1] + 30)], fill=nieve)
    monte(hz, 230, (86, 70, 130), (236, 226, 246), 3)
    monte(hz + 10, 140, (60, 54, 100), (200, 196, 230), 9)
    # suelo con franjas en perspectiva
    for y in range(hz, H):
        t = (y - hz) / (H - hz)
        c = (int(70 - 40 * t), int(120 - 60 * t), int(70 - 30 * t))
        d.line([(0, y), (W, y)], fill=c)
    for i in range(14):
        y = hz + int((i / 14) ** 1.8 * (H - hz)); d.line([(0, y), (W, y)], fill=(54, 96, 58), width=2)
    # los tres Definitivos
    defs = [l[2][2] for l in LINEAS]
    pos = [(150, 300), (500, 250), (850, 300)]
    for (n, niv, fn), (x, y) in zip(defs, pos):
        d.ellipse([x + 50, y + N * K - 34, x + N * K - 50, y + N * K + 6], fill=(30, 56, 36))
        spr = render(fn(), N, 'ff').resize((N * K, N * K), Image.NEAREST); im.paste(spr, (x, y), spr)
    # ventana de batalla
    ventana_ff(d, 30, 640, W - 30, H - 24)
    datos = [('Manjarón', 'Dulce', 412, 436), ('Araucano', 'Verdura', 455, 455), ('Toruno', 'Proteína', 377, 498)]
    texto_sombra(d, (70, 664), 'NOMBRE', fm(22), (180, 200, 255)); texto_sombra(d, (420, 664), 'TIPO', fm(22), (180, 200, 255))
    texto_sombra(d, (650, 664), 'VIDA', fm(22), (180, 200, 255)); texto_sombra(d, (960, 664), 'TURNO', fm(22), (180, 200, 255))
    for i, (n, t, v, vm) in enumerate(datos):
        y = 706 + i * 44
        if i == 1: d.polygon([(44, y + 4), (60, y + 13), (44, y + 22)], fill=(255, 255, 255))
        texto_sombra(d, (70, y), n, fm(28)); texto_sombra(d, (420, y), t, fm(26))
        texto_sombra(d, (650, y), f'{v:>3}/{vm}', fm(28), (255, 255, 255) if v > vm * .5 else (255, 230, 120))
        d.rectangle([960, y + 6, 1220, y + 24], fill=(16, 20, 60), outline=(200, 210, 255), width=2)
        d.rectangle([963, y + 9, 963 + int(254 * (.95, .6, .35)[i]), y + 21], fill=(255, 220, 90) if i == 0 else (120, 200, 255))
    texto_sombra(d, (40, 24), 'Virtual Monster · escena de batalla estilo Final Fantasy (16 bits)', fb(30))
    im.save(nombre)

lamina('bolsillo', 48, 5, 'vm-pixelart-bolsillo.png')
lamina('ff', 80, 3, 'vm-estilo-ff.png')
batalla('vm-batalla-ff.png')
