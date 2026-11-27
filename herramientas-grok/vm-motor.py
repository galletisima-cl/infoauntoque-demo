"""Motor de pixel art por formas: cada criatura es una lista de formas (elipses y polígonos) en un
espacio de 100×100. Se rasteriza a cualquier tamaño con dos estilos:
  - 'bolsillo': 3 tonos por color en bandas duras + contorno oscuro (estilo consola portátil)
  - 'ff': 5 tonos con dithering Bayer, contorno de color (selout) y luz de borde (estilo 16 bits)
"""
import math
from PIL import Image

def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

RAMPAS = {k: [hx(c) for c in v.split()] for k, v in {
 'rosa':   '#4a1636 #8e2a5a #d4548a #f58fb4 #ffd6e6',
 'crema':  '#5a3428 #9a643e #d99e62 #f2ca8e #fff2d0',
 'manjar': '#3a1608 #763414 #b4602a #e0964a #f8cc88',
 'verde':  '#10301c #1c5a30 #378c3c #74c048 #c6ec7a',
 'musgo':  '#122a20 #1e4a34 #2e7048 #4e9a58 #8cc872',
 'corteza':'#24140c #4a2c1c #74502e #a2784a #d0a878',
 'rojo':   '#2a0a10 #64161e #a42c2a #d85e40 #f89c6c',
 'hueso':  '#463a2c #847456 #c2b286 #e8dcb4 #fffae8',
 'acero':  '#1a1e2e #36405c #64769a #a2b4cc #e6eef8',
 'oro':    '#462806 #865410 #cc961e #f0ca46 #fff09c',
 'cielo':  '#18184a #2a3a88 #4666cc #7aa0f0 #c6dcff',
 'blanco': '#5e5e80 #9a9ab8 #cacae2 #eeeef8 #ffffff',
 'fuego':  '#5a1004 #a82a06 #e8600c #ffa424 #fff07a',
}.items()}
OSC = hx('#1a1020')
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
LUZ = (-0.55, -0.65, 0.52)
_n = math.sqrt(sum(c * c for c in LUZ)); LUZ = tuple(c / _n for c in LUZ)

def E(cx, cy, rx, ry, rampa, rot=0, **k):  # elipse
    return dict(t='e', cx=cx, cy=cy, rx=rx, ry=ry, rampa=rampa, rot=math.radians(rot), **k)

def P(pts, rampa, **k):  # polígono
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return dict(t='p', pts=pts, rampa=rampa, cx=(min(xs) + max(xs)) / 2, cy=(min(ys) + max(ys)) / 2,
                rx=max(1, (max(xs) - min(xs)) / 2), ry=max(1, (max(ys) - min(ys)) / 2), rot=0, **k)

def dentro_pol(x, y, pts):
    c = False; j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]; xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi: c = not c
        j = i
    return c

def render(formas, N, estilo='ff', fondo=None):
    S = 100 / N
    col = [[None] * N for _ in range(N)]; dueno = [[-1] * N for _ in range(N)]; rampa_px = [[None] * N for _ in range(N)]
    for idx, f in enumerate(formas):
        R = RAMPAS.get(f['rampa']) if isinstance(f['rampa'], str) else None
        for py in range(N):
            for px in range(N):
                x = (px + .5) * S; y = (py + .5) * S
                dx = x - f['cx']; dy = y - f['cy']
                if f['rot']:
                    c, s = math.cos(-f['rot']), math.sin(-f['rot']); dx, dy = dx * c - dy * s, dx * s + dy * c
                nx = dx / f['rx']; ny = dy / f['ry']
                if f['t'] == 'e':
                    if nx * nx + ny * ny > 1: continue
                elif not dentro_pol(x, y, f['pts']): continue
                if R is None:  # color plano (ojos, brillos)
                    col[py][px] = hx(f['rampa']); dueno[py][px] = idx; rampa_px[py][px] = None; continue
                d2 = min(1, nx * nx + ny * ny)
                nz = math.sqrt(1 - d2)
                if f.get('plano'): nx, ny, nz = nx * .3, ny * .3, 1
                if f['rot']:
                    c, s = math.cos(f['rot']), math.sin(f['rot']); nx, ny = nx * c - ny * s, nx * s + ny * c
                l = nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]
                l = l * f.get('contraste', 1) + f.get('brillo', 0)
                if estilo == 'ff':
                    v = (l + .35) / 1.25 * 4
                    b = math.floor(v); fr = v - b
                    if fr * 16 > BAYER[py % 4][px % 4] + .5: b += 1
                    i = max(0, min(4, b))
                    if i == 0: i = 1  # el tono más oscuro se reserva para contornos
                else:
                    i = 1 if l < .05 else 2 if l < .62 else 3
                    if l > .9 and f.get('brilla', True): i = 4
                col[py][px] = R[i]; dueno[py][px] = idx; rampa_px[py][px] = R
    # líneas interiores: borde de una forma que tapa a otra
    out = [r[:] for r in col]
    for py in range(N):
        for px in range(N):
            a = dueno[py][px]
            if a < 0 or rampa_px[py][px] is None or formas[a].get('sin_linea'): continue
            for qx, qy in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                if 0 <= qx < N and 0 <= qy < N and dueno[qy][qx] >= 0 and dueno[qy][qx] < a \
                   and formas[dueno[qy][qx]]['rampa'] != formas[a]['rampa']:
                    out[py][px] = rampa_px[py][px][1] if estilo == 'ff' else rampa_px[py][px][0]; break
    # contorno exterior
    fin = [r[:] for r in out]
    for py in range(N):
        for px in range(N):
            if out[py][px] is not None: continue
            vec = [(qx, qy) for qx, qy in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1))
                   if 0 <= qx < N and 0 <= qy < N and out[qy][qx] is not None]
            if vec:
                if estilo == 'ff':
                    R = next((rampa_px[qy][qx] for qx, qy in vec if rampa_px[qy][qx]), None)
                    # selout: el contorno toma el tono más oscuro del color vecino; abajo/derecha aún más oscuro
                    fin[py][px] = R[0] if R else OSC
                else:
                    fin[py][px] = OSC
    # luz de borde (rim light) en estilo ff: píxeles del lado opuesto a la luz junto al contorno
    if estilo == 'ff':
        for py in range(N):
            for px in range(N):
                R = rampa_px[py][px]
                if not R or out[py][px] is None: continue
                if px + 1 < N and out[py][px + 1] is None and py - 1 >= 0 and out[py - 1][px] is not None and (px + py) % 2 == 0:
                    fin[py][px] = R[2]
    img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for py in range(N):
        for px in range(N):
            if fin[py][px] is not None: img.putpixel((px, py), fin[py][px] + (255,))
    return img

def ojo(cx, cy, r, iris='#2a2a6a', mira=-1, brillo=True, alto=1.25, iris2=None):
    """Ojo grande estilo anime: blanco, iris, pupila y brillos."""
    f = [E(cx, cy, r, r * alto, '#ffffff', sin_linea=True),
         E(cx + mira * r * .25, cy + r * .15, r * .72, r * alto * .78, iris),
         E(cx + mira * r * .25, cy + r * .3, r * .4, r * alto * .45, '#120818')]
    if iris2: f.insert(2, E(cx + mira * r * .25, cy + r * .55, r * .6, r * alto * .35, iris2))
    if brillo:
        f += [E(cx + mira * r * .05 - r * .3, cy - r * .35, r * .28, r * .28, '#ffffff'),
              E(cx + mira * r * .25 + r * .35, cy + r * .55, r * .14, r * .14, '#ffffff')]
    return f
