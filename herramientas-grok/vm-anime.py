"""Virtual Monster en estilo anime de acción (inspirado en el estilo de dibujo de Dragon Ball, sin copiar personajes).
Cada pieza es una forma vectorial con: color base, sombra dura (cel shading) recortada dentro de la forma,
brillo opcional y contorno negro grueso. Salida: SVG."""
import math, random

COL = {  # base, sombra
 'crema': ('#f8d49c', '#d9a05e'), 'rosa': ('#ff8cc0', '#d9508c'), 'manjar': ('#e08a3c', '#a85a1e'),
 'blanco': ('#ffffff', '#c5cfe8'), 'verde': ('#72cc4a', '#3c8f2c'), 'musgo': ('#3f9a54', '#226838'),
 'corteza': ('#a06c3c', '#6a4222'), 'hueso': ('#f6e8c2', '#cdb283'), 'rojo': ('#e8483a', '#a62824'),
 'acero': ('#bfcde2', '#7486a8'), 'oro': ('#ffd43c', '#dc980e'), 'azul': ('#3d6fe0', '#22409c'),
 'naranja': ('#ff8a1e', '#c85a08'), 'negro': ('#2c2c3a', '#15151e'), 'morado': ('#7a4ad0', '#4a2a90'),
}
TINTA = '#16101c'
_id = [0]

def _nid():
    _id[0] += 1; return f'c{_id[0]}'

def _suave(pts):
    """Curva cerrada suave por los puntos (Catmull-Rom → Bézier)."""
    n = len(pts); d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + 'Z'

def _recto(pts):
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'

def pieza(forma, col, rot=0, brillo=False, grosor=3.4, sombra=True, luz=.34):
    """forma: ('e', cx, cy, rx, ry) | ('s', pts) curva suave | ('p', pts) polígono recto."""
    base, osc = COL[col] if col in COL else (col, col)
    if forma[0] == 'e':
        _, cx, cy, rx, ry = forma
        el = f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"'
    else:
        pts = forma[1]; xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2; rx, ry = (max(xs) - min(xs)) / 2, (max(ys) - min(ys)) / 2
        el = f'<path d="{_suave(pts) if forma[0] == "s" else _recto(pts)}"'
    i = _nid(); tr = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    out = f'<g{tr}><clipPath id="{i}">{el}/></clipPath><g clip-path="url(#{i})">'
    if sombra:
        # cel shading: todo en sombra y encima una elipse iluminada corrida hacia la luz (arriba-izquierda)
        out += f'<rect x="{cx - rx - 5}" y="{cy - ry - 5}" width="{2 * rx + 10}" height="{2 * ry + 10}" fill="{osc}"/>'
        out += f'<ellipse cx="{cx - rx * luz}" cy="{cy - ry * luz}" rx="{rx * 1.08}" ry="{ry * 1.06}" fill="{base}"/>'
    else:
        out += f'<rect x="{cx - rx - 5}" y="{cy - ry - 5}" width="{2 * rx + 10}" height="{2 * ry + 10}" fill="{base}"/>'
    if brillo:
        out += f'<ellipse cx="{cx - rx * .42}" cy="{cy - ry * .5}" rx="{max(1.5, rx * .2)}" ry="{max(1, ry * .12)}" fill="#fff" opacity=".9" transform="rotate(-30 {cx - rx * .42} {cy - ry * .5})"/>'
    out += f'</g>{el} fill="none" stroke="{TINTA}" stroke-width="{grosor}" stroke-linejoin="round"/></g>'
    return out

E = lambda cx, cy, rx, ry, col, **k: pieza(('e', cx, cy, rx, ry), col, **k)
S = lambda pts, col, **k: pieza(('s', pts), col, **k)
P = lambda pts, col, **k: pieza(('p', pts), col, **k)
M = lambda pts: [(200 - x, y) for x, y in pts]

def linea(pts, w=3, c=TINTA):
    return f'<polyline points="{" ".join(f"{x},{y}" for x, y in pts)}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'

def ojo_tierno(cx, cy, r, col='#1a1020'):
    """Ojo de criatura tierna: óvalo negro brillante con dos reflejos."""
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{r * .8}" ry="{r}" fill="{col}"/>'
            f'<ellipse cx="{cx - r * .28}" cy="{cy - r * .42}" rx="{r * .3}" ry="{r * .34}" fill="#fff"/>'
            f'<circle cx="{cx + r * .3}" cy="{cy + r * .45}" r="{r * .14}" fill="#fff"/>')

def ojo_guerrero(cx, cy, w, lado, iris='#1a1020', enojo=1):
    """Ojo de guerrero: almendrado, pupila chica, párpado grueso y ceja en ángulo hacia el centro."""
    s = 1 if lado == 'izq' else -1  # el lado interno queda hacia el centro de la cara
    x0, x1 = cx - s * w, cx + s * w
    ojo = f'M{x0},{cy} Q{cx},{cy - w * .9} {x1},{cy - w * .2} Q{cx},{cy + w * .8} {x0},{cy}Z'
    out = f'<path d="{ojo}" fill="#fff" stroke="{TINTA}" stroke-width="2"/>'
    out += f'<circle cx="{cx + s * w * .25}" cy="{cy}" r="{w * .4}" fill="{iris}"/><circle cx="{cx + s * w * .25}" cy="{cy}" r="{w * .18}" fill="#000"/>'
    out += f'<circle cx="{cx + s * w * .15}" cy="{cy - w * .12}" r="{w * .08}" fill="#fff"/>'
    out += f'<path d="M{x0 - s * 2},{cy - 1} Q{cx},{cy - w * 1.05} {x1 + s * 1},{cy - w * .25}" fill="none" stroke="{TINTA}" stroke-width="3.6" stroke-linecap="round"/>'
    by = cy - w * 1.05
    out += f'<path d="M{x0 - s * 3},{by - w * .35 * enojo} L{x1 + s * 2},{by + w * .3 * enojo} L{x1 + s * 2},{by + w * .3 * enojo + 4} L{x0 - s * 3},{by - w * .35 * enojo + 5}Z" fill="{TINTA}"/>'
    return out

def aura(cx, cy, rx, ry, colores=('#ffe14a', '#fff6a8', '#ffffff'), semilla=1, llamas=26):
    """Aura de energía: llamas puntiagudas que suben, en tres capas (afuera amarilla, centro casi blanco)."""
    random.seed(semilla); out = ''
    for k, (col, esc, op) in enumerate(zip(colores, (1, .82, .62), (.92, .9, .8))):
        pts = []
        for i in range(llamas * 2):
            a = math.pi * 2 * i / (llamas * 2)
            sube = max(0, -math.sin(a))  # las llamas de arriba son más largas
            r = (1 + (.25 + .55 * sube + random.random() * .18) if i % 2 == 0 else .92)
            x = cx + math.cos(a) * rx * esc * r
            y = cy + math.sin(a) * ry * esc * (r if i % 2 == 0 else .95) - (sube * 22 * esc if i % 2 == 0 else 0)
            pts.append((x, y))
        out += f'<path d="{_recto(pts)}" fill="{col}" opacity="{op}" stroke="{"#ff9a1a" if k == 0 else "none"}" stroke-width="2" stroke-linejoin="round"/>'
    return out

def rayos(cx, cy, n=4, semilla=3, col='#7fe8ff'):
    """Chispas eléctricas alrededor del aura (estado de máximo poder)."""
    random.seed(semilla); out = ''
    for _ in range(n):
        a = random.random() * math.pi * 2; r = 70 + random.random() * 20
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 1.1; pts = [(x, y)]
        for j in range(4):
            x += random.uniform(-10, 10); y += random.uniform(6, 12) * (1 if random.random() > .5 else -1); pts.append((x, y))
        out += linea(pts, 2.6, col) + linea(pts, 1, '#ffffff')
    return out
