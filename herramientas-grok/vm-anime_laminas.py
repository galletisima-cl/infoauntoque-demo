import math, random
from anime_criaturas import LINEAS, AURAS
from anime import aura, rayos
def svg_criatura(fn, nombre, con_aura):
    a = aura(100, 112, 90, 92, AURAS[nombre], semilla=len(nombre)) + rayos(100, 110, 5, len(nombre)) if con_aura and nombre in AURAS else ''
    return f'<svg viewBox="-20 -30 240 240" xmlns="http://www.w3.org/2000/svg" overflow="visible">{a}{fn()}</svg>'

FUENTE = "font-family:'Bangers','Impact','Arial Black',sans-serif"
def lamina():
    filas = ''
    for tipo, col, etapas in LINEAS:
        celdas = ''
        for k, (n, niv, fn) in enumerate(etapas):
            celdas += f'<div class="c"><div class="spr">{svg_criatura(fn, n, k == 2)}</div><b>{n}</b><small>{niv} · {tipo}</small></div>'
            if k < 2: celdas += f'<div class="fl" style="color:{col}">➜</div>'
        filas += f'<div class="fila"><div class="tipo" style="background:{col}">{tipo}</div>{celdas}</div>'
    return f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{{margin:0;background:#fff8ee;font-family:'DejaVu Sans',sans-serif;color:#1a1020}}
.w{{width:1180px;padding:40px 50px}} h1{{margin:0;font:900 54px/1 'DejaVu Sans',sans-serif;letter-spacing:-1px}} p.s{{margin:8px 0 26px;color:#7a6070;font-size:20px}}
.fila{{display:flex;align-items:center;gap:6px;margin-bottom:18px}}
.tipo{{writing-mode:vertical-rl;transform:rotate(180deg);color:#fff;font-weight:900;font-size:22px;padding:16px 10px;border-radius:14px;border:3px solid #16101c;margin-right:10px}}
.c{{width:300px;text-align:center}} .spr{{height:290px;background:radial-gradient(circle at 50% 60%,#fff 0 55%,#fff1dc 56%);border:3px solid #16101c;border-radius:24px;overflow:hidden;box-shadow:6px 6px 0 #16101c}}
.spr svg{{width:100%;height:100%}} b{{display:block;font-size:28px;margin-top:12px}} small{{color:#7a6070;font-size:17px}}
.fl{{font-size:44px;font-weight:900;-webkit-text-stroke:2px #16101c;width:46px;text-align:center}}
</style></head><body><div class="w"><h1>Virtual Monster · estilo anime de acción</h1>
<p class="s">Contorno negro grueso, sombra dura (cel shading) y aura de energía en la forma final · una rama por tipo de comida</p>{filas}</div></body></html>'''

def poster():
    random.seed(5); lineas = ''
    for i in range(90):  # líneas de velocidad radiales
        a = i / 90 * math.pi * 2 + random.random() * .03; w = random.uniform(.004, .014)
        r0 = random.uniform(330, 420)
        p = [(640 + math.cos(a) * r0, 400 + math.sin(a) * r0), (640 + math.cos(a - w) * 1100, 400 + math.sin(a - w) * 1100), (640 + math.cos(a + w) * 1100, 400 + math.sin(a + w) * 1100)]
        lineas += f'<polygon points="{" ".join(f"{x:.0f},{y:.0f}" for x, y in p)}" fill="#fff" opacity=".55"/>'
    defs = [l[2][2] for l in LINEAS]; pos = [(250, 480, 470), (640, 440, 560), (1030, 480, 470)]
    figs = ''
    for (n, niv, fn), (x, y, s) in sorted(zip(defs, pos), key=lambda t: t[1][2]):
        figs += f'<g transform="translate({x - s / 2},{y - s / 2}) scale({s / 240})"><g transform="translate(20,30)">{aura(100, 112, 90, 92, AURAS[n], semilla=len(n))}{rayos(100, 110, 6, len(n))}{fn()}</g></g>'
        figs += f'<text x="{x}" y="{y + s / 2 - 6}" text-anchor="middle" class="n">{n}</text>'
    return f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{{margin:0}} .n{{font:900 40px 'DejaVu Sans',sans-serif;fill:#fff;stroke:#16101c;stroke-width:7px;paint-order:stroke}}
.t{{font:900 italic 74px 'DejaVu Sans',sans-serif;fill:#ffe14a;stroke:#16101c;stroke-width:10px;paint-order:stroke;letter-spacing:-2px}}</style></head><body>
<svg width="1280" height="900" viewBox="0 0 1280 900" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="#ffb02e"/><stop offset=".75" stop-color="#e8481c"/><stop offset="1" stop-color="#7a1030"/></radialGradient></defs>
<rect width="1280" height="900" fill="url(#g)"/>{lineas}{figs}
<text x="640" y="96" text-anchor="middle" class="t">¡TRANSFORMACIÓN!</text></svg></body></html>'''

open('lamina_anime.html', 'w').write(lamina()); open('poster_anime.html', 'w').write(poster())
