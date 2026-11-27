"""Tres líneas de evolución originales del Virtual Monster, una por tipo de comida."""
from motor import E, P, ojo

M = lambda pts: [(100 - x, y) for x, y in pts]  # espejo horizontal
D = '#4a1636'

# ---------------- DULCE: Pompi → Caramelo → Manjarón ----------------
def pompi():
    f = [P([(22, 52), (27, 22), (44, 42)], 'crema'), P([(78, 52), (73, 22), (56, 42)], 'crema'),
         P([(27, 47), (28, 30), (38, 43)], 'rosa', sin_linea=True), P([(73, 47), (72, 30), (62, 43)], 'rosa', sin_linea=True),
         E(38, 90, 8, 4.5, 'crema'), E(62, 90, 8, 4.5, 'crema'),
         E(50, 65, 31, 27, 'crema'), E(50, 76, 17, 11, 'blanco', plano=True, brillo=.2),
         E(43, 40, 9, 8, 'rosa'), E(57, 38, 10, 9, 'rosa'), E(50, 32, 8, 7, 'rosa')]
    f += ojo(40, 61, 6.5, iris='#a0306a') + ojo(60, 61, 6.5, iris='#a0306a')
    f += [E(31, 71, 4, 2.5, '#f58fb4'), E(69, 71, 4, 2.5, '#f58fb4'), E(50, 71, 2.6, 1.6, D)]
    return f

def caramelo():
    f = [E(78, 62, 7, 22, 'crema', rot=30), E(87, 41, 9, 9, 'rosa'),
         E(24, 58, 12, 7, 'blanco', rot=-35), E(76, 56, 12, 7, 'blanco', rot=35),
         E(40, 86, 7, 9, 'crema'), E(60, 86, 7, 9, 'crema'),
         E(50, 70, 18, 18, 'crema'), E(50, 74, 10, 11, 'blanco', plano=True, brillo=.2),
         E(34, 70, 5, 9, 'crema', rot=25), E(66, 70, 5, 9, 'crema', rot=-25),
         P([(30, 36), (24, 4), (47, 26)], 'crema'), P(M([(30, 36), (24, 4), (47, 26)]), 'crema'),
         P([(31, 30), (27, 11), (41, 26)], 'rosa', sin_linea=True), P(M([(31, 30), (27, 11), (41, 26)]), 'rosa', sin_linea=True),
         E(50, 42, 22, 19, 'crema'), E(50, 25, 9, 5, 'rosa'), E(50, 31, 3.4, 4, 'manjar')]
    f += ojo(41, 44, 5.8, iris='#a0306a') + ojo(59, 44, 5.8, iris='#a0306a')
    f += [E(33, 52, 3.5, 2, '#f58fb4'), E(67, 52, 3.5, 2, '#f58fb4'), E(50, 53, 2.6, 1.6, D)]
    return f

def manjaron():
    ala = [(32, 42), (6, 12), (12, 30), (2, 40), (12, 46), (4, 58), (28, 58)]
    f = [P(ala, 'blanco'), P(M(ala), 'blanco'),
         P([(12, 30), (26, 46), (12, 46)], 'rosa', sin_linea=True), P(M([(12, 30), (26, 46), (12, 46)]), 'rosa', sin_linea=True),
         E(76, 84, 18, 6.5, 'manjar', rot=-28), E(93, 71, 6.5, 6.5, 'rosa'),
         E(36, 84, 9, 11, 'manjar'), E(64, 84, 9, 11, 'manjar'),
         E(33, 94, 4, 2.4, 'hueso'), E(61, 94, 4, 2.4, 'hueso'),
         E(50, 66, 20, 22, 'manjar'), E(50, 70, 12, 16, 'crema', contraste=.7),
         E(31, 64, 5, 11, 'manjar', rot=28), E(69, 64, 5, 11, 'manjar', rot=-28),
         E(35, 30, 9, 9, 'rosa'), E(65, 30, 9, 9, 'rosa'), E(50, 21, 11, 8, 'rosa'),
         P([(39, 27), (31, 4), (48, 21)], 'oro'), P(M([(39, 27), (31, 4), (48, 21)]), 'oro'),
         E(50, 37, 19, 16, 'manjar'), E(50, 47, 11, 7, 'crema'),
         E(50, 56, 3.6, 3.6, 'rosa')]
    f += ojo(42.5, 34, 5.2, iris='#c0306a', alto=1.1) + ojo(57.5, 34, 5.2, iris='#c0306a', alto=1.1)
    f += [E(47, 46, 1.2, 1, D), E(53, 46, 1.2, 1, D), P([(44, 50), (56, 50), (50, 53)], D), E(53, 51, 1.2, 1.6, '#ffffff')]
    return f

# ---------------- VERDURA: Brotín → Hojarasco → Araucano ----------------
def brotin():
    f = [E(40, 90, 7, 4.5, 'corteza'), E(60, 90, 7, 4.5, 'corteza'),
         P([(48, 46), (52, 46), (53, 30), (47, 30)], 'verde'),
         E(39, 27, 11, 5, 'verde', rot=-25), E(61, 24, 11, 5, 'verde', rot=25),
         E(50, 66, 27, 25, 'corteza'), E(50, 69, 19, 16, 'hueso', contraste=.6)]
    f += ojo(42, 64, 6, iris='#1c5a30') + ojo(58, 64, 6, iris='#1c5a30')
    f += [E(34, 74, 3.5, 2, '#f0a07a'), E(66, 74, 3.5, 2, '#f0a07a'), E(50, 74, 2.4, 1.4, D)]
    return f

def hojarasco():
    g = lambda s: [E(50 + s * 23, 31, 10, 3.5, 'musgo', rot=s * -30), E(50 + s * 26, 40, 11, 3.5, 'musgo'),
                   E(50 + s * 23, 49, 10, 3.5, 'musgo', rot=s * 30)]
    f = [E(76, 80, 17, 6, 'verde', rot=-30), E(91, 67, 8, 4, 'musgo', rot=-55)] + g(-1) + g(1)
    f += [E(40, 86, 7, 8, 'verde'), E(60, 86, 7, 8, 'verde'),
          E(50, 70, 17, 17, 'verde'), E(50, 74, 10, 11, 'hueso', contraste=.6),
          E(35, 70, 5, 8, 'verde', rot=25), E(65, 70, 5, 8, 'verde', rot=-25),
          E(50, 42, 21, 17, 'verde'), E(44, 29, 3, 2, '#c6ec7a'), E(56, 29, 3, 2, '#c6ec7a'), E(50, 27, 2.5, 2, '#c6ec7a')]
    f += ojo(41, 41, 5.6, iris='#a06a10') + ojo(59, 41, 5.6, iris='#a06a10')
    f += [P([(40, 51), (60, 51), (57, 54), (43, 54)], '#5a1a1a'), E(50, 53.5, 4, 1.2, '#f07a8a')]
    return f

def araucano():
    f = [E(38, 86, 9, 10, 'corteza'), E(62, 86, 9, 10, 'corteza'),
         E(26, 60, 6, 13, 'corteza', rot=18), E(74, 60, 6, 13, 'corteza', rot=-18)]
    hoja = [(14, 46), (24, 60), (16, 88), (6, 64)]
    f += [P(hoja, 'verde'), P(M(hoja), 'verde'), P([(14, 52), (16, 82), (13, 64)], 'musgo', sin_linea=True), P(M([(14, 52), (16, 82), (13, 64)]), 'musgo', sin_linea=True),
          E(50, 64, 21, 22, 'corteza')]
    for y in (52, 61, 70, 79):  # escamas de corteza en el pecho
        f += [P([(40, y), (50, y + 5), (60, y), (60, y + 4), (50, y + 9), (40, y + 4)], 'verde' if y < 70 else 'musgo', contraste=.8)]
    # copa de araucaria: pisos de ramas con las puntas hacia arriba
    for y, w in [(25, 27), (18, 22), (12, 15), (7, 8)]:
        f += [E(50, y, w, 3.2, 'musgo'), E(50 - w, y - 2.5, 2.6, 4.6, 'musgo', rot=-28), E(50 + w, y - 2.5, 2.6, 4.6, 'musgo', rot=28)]
    f += [E(50, 38, 15, 12, 'corteza'), E(50, 40, 11, 8, 'hueso', contraste=.5),
          E(44.5, 38, 3, 2.2, '#fff09c'), E(55.5, 38, 3, 2.2, '#fff09c'), E(44, 38.3, 1.3, 1.3, '#cc961e'), E(55, 38.3, 1.3, 1.3, '#cc961e'),
          P([(46, 44), (54, 44), (50, 46)], '#4a2c1c'), E(50, 50, 7, 3, 'musgo')]
    return f

# ---------------- PROTEÍNA: Ternerín → Torito → Toruno ----------------
def ternerin():
    f = [E(24, 52, 8, 3.6, 'rojo', rot=-20), E(76, 52, 8, 3.6, 'rojo', rot=20),
         E(38, 90, 7, 4.5, 'corteza'), E(62, 90, 7, 4.5, 'corteza'),
         E(50, 66, 28, 25, 'rojo'), E(66, 56, 8, 6, 'hueso', plano=True),
         E(35, 44, 4, 5, 'hueso', rot=-20), E(65, 44, 4, 5, 'hueso', rot=20), E(50, 43, 6, 4, 'manjar'),
         E(50, 77, 13, 9, 'hueso', contraste=.6), E(46, 77, 1.6, 1.6, D), E(54, 77, 1.6, 1.6, D)]
    f += ojo(40, 62, 6, iris='#5a2a10') + ojo(60, 62, 6, iris='#5a2a10')
    f += [E(30, 70, 3.5, 2, '#f58fb4'), E(70, 70, 3.5, 2, '#f58fb4')]
    return f

def torito():
    cuerno = [(36, 38), (17, 27), (13, 14), (24, 21), (38, 29)]
    f = [E(77, 76, 3, 12, 'rojo', rot=40), E(83, 66, 4.5, 4.5, 'manjar'),
         E(40, 86, 8, 9, 'rojo'), E(60, 86, 8, 9, 'rojo'), E(40, 94, 7, 2.6, 'corteza'), E(60, 94, 7, 2.6, 'corteza'),
         E(50, 68, 19, 18, 'rojo'), E(50, 72, 11, 12, 'hueso', contraste=.6),
         E(30, 66, 6, 10, 'rojo', rot=22), E(70, 66, 6, 10, 'rojo', rot=-22), E(27, 76, 6, 5, 'hueso'), E(73, 76, 6, 5, 'hueso'),
         P([(34, 54), (66, 54), (60, 60), (50, 64), (40, 60)], 'cielo'),
         P(cuerno, 'hueso'), P(M(cuerno), 'hueso'),
         E(50, 41, 19, 16, 'rojo'), E(50, 30, 7, 4, 'manjar'), E(50, 50, 11, 7, 'hueso', contraste=.6),
         E(46, 51, 1.6, 1.6, D), E(54, 51, 1.6, 1.6, D)]
    f += ojo(42.5, 40, 4.6, iris='#5a2a10', alto=1.0) + ojo(57.5, 40, 4.6, iris='#5a2a10', alto=1.0)
    f += [P([(37, 33), (47, 36), (46, 38), (37, 35)], D), P(M([(37, 33), (47, 36), (46, 38), (37, 35)]), D)]
    return f

def toruno():
    cuerno = [(38, 28), (16, 17), (5, 1), (21, 7), (40, 18)]
    punta = [(13, 13), (5, 1), (17, 6)]
    f = [P([(30, 44), (70, 44), (86, 94), (14, 94)], 'cielo'),
         E(38, 84, 10, 12, 'rojo'), E(62, 84, 10, 12, 'rojo'), E(38, 90, 9, 6, 'acero'), E(62, 90, 9, 6, 'acero'),
         E(24, 64, 7, 12, 'rojo', rot=10), E(76, 64, 7, 12, 'rojo', rot=-10), E(23, 75, 7.5, 6.5, 'acero'), E(77, 75, 7.5, 6.5, 'acero'),
         E(50, 62, 22, 22, 'rojo'), P([(35, 49), (65, 49), (60, 71), (40, 71)], 'acero'), E(50, 58, 4, 4, 'fuego'),
         E(50, 74, 19, 3.4, 'oro'), E(26, 48, 11, 8.5, 'acero'), E(74, 48, 11, 8.5, 'acero'),
         P(cuerno, 'hueso'), P(M(cuerno), 'hueso'), P(punta, 'oro'), P(M(punta), 'oro'),
         E(50, 32, 16, 14, 'rojo'), E(50, 41, 10, 7, 'hueso', contraste=.6),
         E(46, 42, 1.6, 1.6, D), E(54, 42, 1.6, 1.6, D),
         E(50, 47.5, 4.6, 3.4, 'oro'), E(50, 47, 2, 1.4, D),
         E(43, 30, 3.8, 2.2, '#ffe24a'), E(57, 30, 3.8, 2.2, '#ffe24a'), E(43.6, 30.3, 1.4, 1.4, '#ffffff'), E(57.6, 30.3, 1.4, 1.4, '#ffffff'),
         P([(37, 25), (48, 28), (47, 30), (37, 27.5)], D), P(M([(37, 25), (48, 28), (47, 30), (37, 27.5)]), D)]
    return f

LINEAS = [
 ('Dulce', '#f58fb4', [('Pompi', 'Bebé I', pompi), ('Caramelo', 'Novato', caramelo), ('Manjarón', 'Definitivo', manjaron)]),
 ('Verdura', '#74c048', [('Brotín', 'Bebé I', brotin), ('Hojarasco', 'Novato', hojarasco), ('Araucano', 'Definitivo', araucano)]),
 ('Proteína', '#d85e40', [('Ternerín', 'Bebé I', ternerin), ('Torito', 'Novato', torito), ('Toruno', 'Definitivo', toruno)]),
]
