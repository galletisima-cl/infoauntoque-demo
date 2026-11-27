from anime import E, S, P, M, linea, ojo_tierno, ojo_guerrero, aura, TINTA

def mej(x, y, r=9):  # rubor de las mejillas
    return f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * .55}" fill="#ff8fb8" opacity=".75"/>'

def musculos(cx, y, w):  # pectorales en arco y "six-pack" (líneas que no se cruzan)
    o = f'<path d="M{cx - w},{y} Q{cx - w * .5},{y + w * .45} {cx - 3},{y + w * .2}" fill="none" stroke="{TINTA}" stroke-width="2.4" stroke-linecap="round"/>'
    o += f'<path d="M{cx + w},{y} Q{cx + w * .5},{y + w * .45} {cx + 3},{y + w * .2}" fill="none" stroke="{TINTA}" stroke-width="2.4" stroke-linecap="round"/>'
    o += linea([(cx, y + w * .45), (cx, y + w * 1.25)], 2)
    for k in (.68, .95):
        o += linea([(cx - w * .42, y + w * k), (cx - w * .1, y + w * (k + .04))], 2) + linea([(cx + w * .1, y + w * (k + .04)), (cx + w * .42, y + w * k)], 2)
    return o

def ojos_nino(cx1, cx2, cy, r, col='#1a1020'):
    """Ojos grandes y redondos de personaje joven, con cejas decididas."""
    o = ojo_tierno(cx1, cy, r, col) + ojo_tierno(cx2, cy, r, col)
    o += linea([(cx1 - r, cy - r * 1.55), (cx1 + r * .9, cy - r * 1.05)], 3.4) + linea([(cx2 + r, cy - r * 1.55), (cx2 - r * .9, cy - r * 1.05)], 3.4)
    return o

# ---------------- DULCE ----------------
def pompi():
    o = P([(46, 108), (56, 46), (92, 88)], 'crema') + P(M([(46, 108), (56, 46), (92, 88)]), 'crema')
    o += P([(56, 98), (60, 64), (82, 88)], 'rosa', sombra=False, grosor=0) + P(M([(56, 98), (60, 64), (82, 88)]), 'rosa', sombra=False, grosor=0)
    o += E(74, 180, 17, 9, 'crema') + E(126, 180, 17, 9, 'crema')
    o += E(100, 132, 63, 54, 'crema') + E(100, 155, 34, 22, 'blanco')
    o += E(84, 84, 19, 16, 'rosa') + E(116, 80, 21, 18, 'rosa') + E(100, 66, 17, 15, 'rosa', brillo=True)
    o += ojo_tierno(80, 124, 12) + ojo_tierno(120, 124, 12) + mej(62, 142) + mej(138, 142)
    o += linea([(92, 142), (96, 146), (100, 142), (104, 146), (108, 142)], 2.6)
    return o

def caramelo():
    o = E(156, 124, 13, 44, 'crema', rot=30) + E(176, 80, 19, 18, 'rosa', brillo=True)
    o += E(46, 112, 26, 14, 'blanco', rot=-35) + E(154, 110, 26, 14, 'blanco', rot=35)
    o += E(80, 174, 14, 18, 'crema') + E(120, 174, 14, 18, 'crema')
    o += E(100, 140, 36, 36, 'crema') + E(100, 146, 20, 23, 'blanco')
    o += P([(66, 152), (134, 152), (132, 163), (68, 163)], 'azul')
    o += E(66, 138, 10, 18, 'crema', rot=25) + E(134, 138, 10, 18, 'crema', rot=-25)
    o += E(58, 160, 12, 11, 'crema') + E(142, 160, 12, 11, 'crema') + E(61, 150, 11, 5, 'azul') + E(139, 150, 11, 5, 'azul')
    o += P([(60, 74), (46, 8), (94, 52)], 'crema') + P(M([(60, 74), (46, 8), (94, 52)]), 'crema')
    o += P([(64, 62), (54, 24), (84, 52)], 'rosa', sombra=False, grosor=0) + P(M([(64, 62), (54, 24), (84, 52)]), 'rosa', sombra=False, grosor=0)
    o += E(100, 84, 44, 38, 'crema')
    o += P([(68, 62), (76, 30), (90, 50), (100, 18), (110, 50), (124, 30), (132, 62), (100, 56)], 'rosa')
    o += ojos_nino(84, 116, 90, 10, '#5a1030')
    o += mej(70, 102, 7) + mej(130, 102, 7) + linea([(94, 108), (102, 110), (108, 106)], 2.6)
    return o

def manjaron():
    ala = [(66, 90), (20, 34), (30, 64), (12, 80), (30, 94), (18, 116), (58, 118)]
    o = P(ala, 'blanco') + P(M(ala), 'blanco') + P([(30, 64), (56, 98), (30, 94)], 'rosa', sombra=False, grosor=0) + P(M([(30, 64), (56, 98), (30, 94)]), 'rosa', sombra=False, grosor=0)
    o += E(156, 170, 36, 12, 'manjar', rot=-28) + P([(182, 150), (198, 134), (192, 156)], 'rosa')
    o += S([(62, 150), (96, 150), (94, 186), (60, 186)], 'azul') + S([(104, 150), (138, 150), (140, 186), (106, 186)], 'azul')
    o += E(76, 190, 18, 7, 'manjar') + E(124, 190, 18, 7, 'manjar')
    o += S([(54, 98), (146, 98), (152, 122), (134, 158), (66, 158), (48, 122)], 'manjar')
    o += S([(84, 112), (116, 112), (112, 152), (88, 152)], 'crema', sombra=False, grosor=2) + musculos(100, 106, 22)
    o += P([(62, 150), (138, 150), (136, 160), (64, 160)], 'naranja') + P([(110, 158), (122, 178), (112, 176), (104, 160)], 'naranja')
    o += E(46, 108, 20, 18, 'manjar') + E(154, 108, 20, 18, 'manjar')
    o += E(38, 138, 13, 20, 'manjar', rot=12) + E(162, 138, 13, 20, 'manjar', rot=-12)
    o += E(36, 162, 15, 13, 'manjar') + E(164, 162, 15, 13, 'manjar') + E(37, 150, 13, 6, 'naranja') + E(163, 150, 13, 6, 'naranja')
    o += P([(62, 74), (40, 44), (68, 50), (62, 16), (88, 40), (100, 4), (112, 40), (138, 16), (132, 50), (160, 44), (138, 74), (100, 60)], 'rosa')
    o += P([(80, 50), (70, 18), (92, 44)], 'oro', brillo=True) + P(M([(80, 50), (70, 18), (92, 44)]), 'oro', brillo=True)
    o += E(100, 72, 37, 33, 'manjar') + E(100, 92, 22, 14, 'crema')
    o += ojo_guerrero(86, 70, 9, 'izq', '#c0306a') + ojo_guerrero(114, 70, 9, 'der', '#c0306a')
    o += f'<ellipse cx="94" cy="88" rx="2" ry="1.6" fill="{TINTA}"/><ellipse cx="106" cy="88" rx="2" ry="1.6" fill="{TINTA}"/>'
    o += linea([(88, 96), (100, 99), (112, 95)], 2.8) + P([(106, 97), (109, 97), (108, 102)], '#ffffff', sombra=False, grosor=1.4)
    return o

# ---------------- VERDURA ----------------
def brotin():
    o = E(80, 182, 15, 9, 'corteza') + E(120, 182, 15, 9, 'corteza')
    o += P([(96, 92), (104, 92), (106, 58), (94, 58)], 'verde')
    o += E(76, 52, 23, 10, 'verde', rot=-25, brillo=True) + E(124, 46, 23, 10, 'verde', rot=25, brillo=True)
    o += E(100, 132, 55, 52, 'corteza') + E(100, 138, 39, 33, 'hueso')
    o += ojo_tierno(84, 130, 11) + ojo_tierno(116, 130, 11) + mej(70, 150, 7) + mej(130, 150, 7)
    o += linea([(94, 150), (100, 154), (106, 150)], 2.6)
    return o

def hojarasco():
    g = lambda s: (E(100 + s * 46, 62, 20, 7, 'musgo', rot=s * -30) + E(100 + s * 52, 80, 22, 7, 'musgo') + E(100 + s * 46, 98, 20, 7, 'musgo', rot=s * 30))
    o = E(152, 160, 34, 12, 'verde', rot=-30) + P([(176, 132), (196, 116), (190, 142)], 'musgo') + g(-1) + g(1)
    o += E(80, 172, 14, 16, 'verde') + E(120, 172, 14, 16, 'verde')
    o += E(100, 140, 34, 34, 'verde') + E(100, 148, 20, 22, 'hueso')
    o += E(70, 140, 10, 16, 'verde', rot=25) + E(130, 140, 10, 16, 'verde', rot=-25) + E(62, 156, 11, 10, 'verde') + E(138, 156, 11, 10, 'verde')
    o += E(100, 84, 42, 34, 'verde')
    o += P([(58, 70), (142, 70), (142, 80), (58, 80)], 'rojo') + P([(142, 72), (168, 62), (164, 76), (142, 78)], 'rojo') + P([(142, 76), (170, 84), (160, 92), (142, 80)], 'rojo')
    o += ojos_nino(84, 116, 94, 9.5, '#3a2408')
    o += S([(84, 104), (116, 104), (110, 114), (90, 114)], '#7a1a2a', sombra=False, grosor=2.6) + E(100, 112, 7, 2.6, '#ff8fa0', sombra=False, grosor=0)
    return o

def araucano():
    o = S([(62, 150), (96, 150), (94, 186), (58, 186)], 'negro') + S([(104, 150), (138, 150), (142, 186), (106, 186)], 'negro')
    o += E(74, 190, 18, 7, 'corteza') + E(126, 190, 18, 7, 'corteza')
    o += S([(52, 100), (148, 100), (154, 124), (136, 158), (64, 158), (46, 124)], 'corteza') + musculos(100, 110, 24)
    for y in (124, 140):
        o += linea([(70, y), (78, y + 6), (86, y)], 2) + linea([(114, y), (122, y + 6), (130, y)], 2)
    o += P([(62, 150), (138, 150), (136, 160), (64, 160)], 'verde') + P([(92, 158), (82, 180), (90, 178), (98, 160)], 'verde')
    o += E(44, 110, 21, 18, 'corteza') + E(156, 110, 21, 18, 'corteza')
    o += E(36, 140, 13, 20, 'corteza', rot=12) + E(164, 140, 13, 20, 'corteza', rot=-12)
    o += E(34, 164, 15, 13, 'corteza') + E(166, 164, 15, 13, 'corteza') + E(35, 152, 13, 6, 'verde') + E(165, 152, 13, 6, 'verde')
    # copa de araucaria peinada hacia arriba, como pelo en punta
    o += P([(58, 72), (30, 52), (54, 48), (36, 18), (66, 34), (70, 2), (90, 28), (104, -6), (114, 28), (136, 4), (138, 36), (166, 20), (150, 50), (172, 54), (142, 74), (100, 60)], 'musgo')
    o += P([(66, 50), (60, 26), (80, 40)], 'verde', sombra=False, grosor=0) + P([(100, 34), (104, 8), (110, 34)], 'verde', sombra=False, grosor=0) + P([(132, 46), (140, 24), (122, 40)], 'verde', sombra=False, grosor=0)
    o += E(100, 74, 37, 34, 'corteza') + E(100, 86, 25, 19, 'hueso')
    o += ojo_guerrero(85, 76, 10, 'izq', '#cc961e') + ojo_guerrero(115, 76, 10, 'der', '#cc961e')
    o += linea([(90, 98), (100, 95), (110, 98)], 2.8)
    return o

# ---------------- PROTEÍNA ----------------
def ternerin():
    o = E(48, 106, 18, 8, 'rojo', rot=-20) + E(152, 106, 18, 8, 'rojo', rot=20)
    o += E(76, 182, 15, 9, 'corteza') + E(124, 182, 15, 9, 'corteza')
    o += E(100, 132, 57, 52, 'rojo') + E(134, 110, 15, 12, 'hueso', sombra=False, grosor=0)
    o += E(70, 88, 8, 11, 'hueso', rot=-20) + E(130, 88, 8, 11, 'hueso', rot=20) + P([(88, 84), (100, 70), (112, 84), (100, 90)], 'manjar')
    o += E(100, 156, 28, 18, 'hueso')
    o += f'<ellipse cx="91" cy="156" rx="3.4" ry="4" fill="{TINTA}"/><ellipse cx="109" cy="156" rx="3.4" ry="4" fill="{TINTA}"/>'
    o += ojo_tierno(80, 124, 11, '#2a1408') + ojo_tierno(120, 124, 11, '#2a1408') + mej(60, 140, 7) + mej(140, 140, 7)
    return o

def torito():
    cuerno = [(70, 76), (34, 52), (26, 24), (46, 42), (74, 60)]
    o = E(154, 150, 5, 24, 'rojo', rot=40) + E(166, 130, 9, 9, 'manjar')
    o += E(80, 172, 16, 18, 'rojo') + E(120, 172, 16, 18, 'rojo') + E(80, 189, 15, 6, 'corteza') + E(120, 189, 15, 6, 'corteza')
    o += E(100, 138, 38, 36, 'rojo') + E(100, 146, 22, 24, 'hueso') + musculos(100, 118, 18)
    o += E(60, 134, 12, 20, 'rojo', rot=22) + E(140, 134, 12, 20, 'rojo', rot=-22)
    o += E(54, 156, 13, 12, 'rojo') + E(146, 156, 13, 12, 'rojo') + E(57, 146, 12, 5, 'azul') + E(143, 146, 12, 5, 'azul')
    o += P([(68, 106), (132, 106), (120, 120), (100, 128), (80, 120)], 'azul')
    o += P(cuerno, 'hueso', brillo=True) + P(M(cuerno), 'hueso', brillo=True)
    o += E(100, 82, 38, 32, 'rojo') + P([(86, 54), (94, 38), (100, 50), (108, 36), (116, 54)], 'manjar')
    o += E(100, 100, 22, 14, 'hueso')
    o += f'<ellipse cx="92" cy="101" rx="3" ry="3.6" fill="{TINTA}"/><ellipse cx="108" cy="101" rx="3" ry="3.6" fill="{TINTA}"/>'
    o += ojos_nino(86, 114, 80, 9, '#2a1408')
    return o

def toruno():
    cuerno = [(74, 58), (30, 34), (8, 2), (42, 20), (78, 40)]
    punta = [(26, 30), (8, 2), (32, 16)]
    o = P([(58, 92), (142, 92), (176, 196), (24, 196)], 'rojo')
    o += S([(60, 150), (96, 150), (94, 186), (56, 186)], 'negro') + S([(104, 150), (140, 150), (144, 186), (106, 186)], 'negro')
    o += E(74, 190, 19, 7, 'acero') + E(126, 190, 19, 7, 'acero')
    o += S([(48, 96), (152, 96), (160, 122), (138, 158), (62, 158), (40, 122)], 'rojo') + musculos(100, 106, 26)
    o += P([(60, 146), (140, 146), (138, 162), (62, 162)], 'oro', brillo=True) + E(100, 154, 12, 10, 'acero', brillo=True)
    o += E(40, 106, 24, 21, 'rojo') + E(160, 106, 24, 21, 'rojo')
    o += E(30, 138, 15, 22, 'rojo', rot=10) + E(170, 138, 15, 22, 'rojo', rot=-10)
    o += E(28, 164, 17, 15, 'rojo') + E(172, 164, 17, 15, 'rojo') + E(29, 151, 15, 7, 'oro') + E(171, 151, 15, 7, 'oro')
    o += P(cuerno, 'hueso', brillo=True) + P(M(cuerno), 'hueso', brillo=True) + P(punta, 'oro') + P(M(punta), 'oro')
    o += E(100, 62, 37, 33, 'rojo') + P([(84, 32), (92, 12), (100, 28), (108, 10), (116, 32)], 'negro')
    o += E(100, 82, 23, 15, 'hueso')
    o += f'<ellipse cx="92" cy="83" rx="3" ry="3.6" fill="{TINTA}"/><ellipse cx="108" cy="83" rx="3" ry="3.6" fill="{TINTA}"/>'
    o += f'<circle cx="100" cy="94" r="8" fill="none" stroke="{TINTA}" stroke-width="6"/><circle cx="100" cy="94" r="8" fill="none" stroke="#ffd43c" stroke-width="3"/>'
    o += ojo_guerrero(84, 58, 10, 'izq', '#ffcc22') + ojo_guerrero(116, 58, 10, 'der', '#ffcc22')
    return o

LINEAS = [
 ('Dulce', '#ff8cc0', [('Pompi', 'Bebé I', pompi), ('Caramelo', 'Novato', caramelo), ('Manjarón', 'Definitivo', manjaron)]),
 ('Verdura', '#72cc4a', [('Brotín', 'Bebé I', brotin), ('Hojarasco', 'Novato', hojarasco), ('Araucano', 'Definitivo', araucano)]),
 ('Proteína', '#e8483a', [('Ternerín', 'Bebé I', ternerin), ('Torito', 'Novato', torito), ('Toruno', 'Definitivo', toruno)]),
]
AURAS = {'Manjarón': ('#ff9ad0', '#ffd6ec', '#ffffff'), 'Araucano': ('#8ff06a', '#d8ffc0', '#ffffff'), 'Toruno': ('#ffe14a', '#fff6a8', '#ffffff')}
