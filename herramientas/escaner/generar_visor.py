"""Visor de planos: solo muros negros y áreas marcadas, a escala gráfica.

Fuentes (img/planos/pdf):
  PLANTA TIPO LINEAS.pdf     muros: trazos negros (vectorial)
  planta con tipologias.pdf  áreas: polígonos de color dibujados por el arquitecto, a tamaño real (hoja de 707 x 500 mm) -> escala gráfica
  LINEAS Y AREAS.pdf         nombres de las unidades: «alc» = alcoba, «SALA» = sala, «COCINA» = cocina
Los espacios sin marcar no llevan nada. Dentro de cada área detecta los ambientes (alcoba, baño, zona de ropas, cocina, sala).
Escribe js/visor-planos-datos.js (los datos), pages/Fontanella · Planta tipo en 2D.html (el visor, que dibuja js/visor-planos.js + css/visor-planos.css)
y la pestaña «Visor de planos» del menú. El diagrama del index (js/distribucion.js) lee los mismos datos.

Uso:  python -I herramientas/escaner/generar_visor.py [--control]
      (--control guarda control-visor.png: muros, áreas y nombres superpuestos, para revisar el registro entre los tres PDFs)
Requiere pymupdf, numpy y opencv-python."""
import argparse, collections, glob, json, os, re, time
import cv2
import numpy as np
import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.environ.get("FONTANELLA_RAIZ") or os.path.dirname(os.path.dirname(AQUI))
ap = argparse.ArgumentParser(); ap.add_argument("--control", action="store_true"); OPC = ap.parse_args()
PDFS = os.path.join(RAIZ, "img", "planos", "pdf")
PAG = os.path.join(RAIZ, "pages", "Fontanella · Planta tipo en 2D.html")
MUROS_PDF = glob.glob(os.path.join(PDFS, "PLANTA TIPO LINEAS*.pdf"))[0]
ETQ_PDF = glob.glob(os.path.join(PDFS, "LINEAS Y AREAS*.pdf"))[0]
TIPOS_PDF = glob.glob(os.path.join(PDFS, "planta con tipologias*.pdf"))[0]
pymupdf.TOOLS.set_aa_level(0)                                                   # sin antialias: cada píxel es muro (negro) o no lo es
pL, pE, pT = pymupdf.open(MUROS_PDF)[0], pymupdf.open(ETQ_PDF)[0], pymupdf.open(TIPOS_PDF)[0]
CLIP_L = pymupdf.Rect(80, 100, 668, 345)                                        # plano de muros: sin cajetín ni marco de la lámina
CLIP_E = pymupdf.Rect(290, 110, 640, 392)                                       # PDF de nombres: solo las dos torres
REG_E = (295, 280, 630, 380)                                                    # torre larga en el PDF de nombres (pt)
REG_L = (285, 245, 640, 355)                                                    # zona de búsqueda de esa torre en el PDF de muros (pt)
LARGA_L, LARGA_E = 320, 335                                                     # línea de nivel que cruza cada plano: negra, recta y más larga que la torre mayor (pt)
TIPOS = [["Torres 1-3 · tipo", 107, "T1-3"], ["Torre 4 · tipo 1", 67.27, "T4·1"], ["Torre 4 · tipo 2", 65.71, "T4·2"], ["Torre 4 · tipo 3", 42.92, "T4·3"],
         ["Torre 4 · tipo 4", 67.52, "T4·4"], ["Torre 4 · tipo 5", 28.37, "T4·5"], ["Torre 4 · tipo 6", 84.78, "T4·6"], ["Torre 5 · tipo", 97, "T5"], ["Zona común", 0, "ZC"]]   # docs/datos-proyecto.md
TABLA = [t_[1] for t_ in TIPOS if t_[1] > 0]                                    # m² de las tipologías


def pix(p, clip, dpi):
    pm = p.get_pixmap(dpi=dpi, alpha=False, clip=clip)
    return np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width, 3).astype(int)


def negra(p, clip, dpi):
    a = pix(p, clip, dpi)
    return ((a.max(2) < 40) & ((a.max(2) - a.min(2)) <= 10)).astype(np.uint8)         # muro: negro puro y neutro


def color_vivo(p, clip, dpi):
    a = pix(p, clip, dpi)
    return ((a.max(2) - a.min(2)) > 150).astype(np.uint8)                              # guías de color puro: están en los dos planos y sirven para registrarlos


def borra_texto(neg, p, clip, dpi):
    k = dpi / 72                                                                       # las letras de las etiquetas son vectores negros: no son muros
    alto, ancho = neg.shape
    for w_ in p.get_text("words"):
        # Los PDFs suelen tener rótulos fuera del recorte. Limitar las cuatro
        # coordenadas evita que los índices negativos borren píxeles del borde
        # opuesto y que palabras externas interfieran con la máscara de muros.
        x0_, y0_, x1_, y1_ = [int(round(v)) for v in ((w_[0] - clip.x0) * k - 1, (w_[1] - clip.y0) * k - 1, (w_[2] - clip.x0) * k + 1, (w_[3] - clip.y0) * k + 1)]
        x0_, x1_ = max(0, x0_), min(ancho, x1_)
        y0_, y1_ = max(0, y0_), min(alto, y1_)
        if x0_ >= x1_ or y0_ >= y1_:
            continue
        neg[y0_:y1_, x0_:x1_] = 0
    return neg


def sin_lineas_largas(neg, dpi, largo_pt):
    larga = cv2.morphologyEx(neg, cv2.MORPH_OPEN, np.ones((1, int(largo_pt / 72 * dpi)), np.uint8))
    return neg & (1 - cv2.dilate(larga, np.ones((3, 1), np.uint8)))


def recorte(m, clip, reg, dpi=150):
    k = dpi / 72
    x0, y0, x1, y1 = [max(0, int(round(v))) for v in ((reg[0] - clip.x0) * k, (reg[1] - clip.y0) * k, (reg[2] - clip.x0) * k, (reg[3] - clip.y0) * k)]
    return cv2.dilate(m[y0:y1, x0:x1], np.ones((3, 3), np.uint8)).astype(np.float32)


def registra(img, tpl0):
    """Factor f (y posición) con el que la plantilla coincide con la imagen: correlación de líneas a varias escalas."""
    def punt(f):
        t = cv2.resize(tpl0, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
        if t.shape[0] > img.shape[0] or t.shape[1] > img.shape[1]: return -1.0, (0, 0)
        _, mx_, _, loc = cv2.minMaxLoc(cv2.matchTemplate(img, t, cv2.TM_CCOEFF_NORMED)); return mx_, loc
    f0 = max(np.arange(0.6, 1.1, 0.004), key=lambda f: punt(f)[0])
    f1 = max(np.arange(f0 - 0.004, f0 + 0.0041, 0.0005), key=lambda f: punt(f)[0])
    sc, loc = punt(f1)
    return float(f1), float(sc), loc


def poligono(d):
    pts = []
    for it in d["items"]:
        if it[0] == "l": pts += [(it[1].x, it[1].y), (it[2].x, it[2].y)]
        elif it[0] == "re": r_ = it[1]; pts += [(r_.x0, r_.y0), (r_.x1, r_.y0), (r_.x1, r_.y1), (r_.x0, r_.y1)]
        elif it[0] == "qu": q_ = it[1]; pts += [(q_.ul.x, q_.ul.y), (q_.ur.x, q_.ur.y), (q_.lr.x, q_.lr.y), (q_.ll.x, q_.ll.y)]
    out = []
    for q_ in pts:
        if not out or abs(q_[0] - out[-1][0]) > 1e-3 or abs(q_[1] - out[-1][1]) > 1e-3: out.append(q_)
    if len(out) > 1 and abs(out[0][0] - out[-1][0]) < 1e-3 and abs(out[0][1] - out[-1][1]) < 1e-3: out.pop()
    return out


def area_poligono(P):
    return abs(sum(P[k][0] * P[(k + 1) % len(P)][1] - P[(k + 1) % len(P)][0] * P[k][1] for k in range(len(P)))) / 2


def centroide(P):
    a_ = sum(P[k][0] * P[(k + 1) % len(P)][1] - P[(k + 1) % len(P)][0] * P[k][1] for k in range(len(P)))
    if abs(a_) < 1e-9: return [sum(q_[0] for q_ in P) / len(P), sum(q_[1] for q_ in P) / len(P)]
    cx_ = sum((P[k][0] + P[(k + 1) % len(P)][0]) * (P[k][0] * P[(k + 1) % len(P)][1] - P[(k + 1) % len(P)][0] * P[k][1]) for k in range(len(P))) / (3 * a_)
    cy_ = sum((P[k][1] + P[(k + 1) % len(P)][1]) * (P[k][0] * P[(k + 1) % len(P)][1] - P[(k + 1) % len(P)][0] * P[k][1]) for k in range(len(P))) / (3 * a_)
    return [cx_, cy_]


def centros(p, clave):
    return np.array([[(w_[0] + w_[2]) / 2, (w_[1] + w_[3]) / 2] for w_ in p.get_text("words") if w_[4] == clave])


def rects(m):
    """Máscara -> rectángulos [x, y, ancho, alto] (tramos horizontales unidos en vertical)."""
    out, abiertos = [], {}
    for y in range(m.shape[0] + 1):
        fila = m[y] if y < m.shape[0] else np.zeros(m.shape[1], np.uint8)
        d = np.diff(np.concatenate([[0], fila, [0]]).astype(np.int8))
        actuales = {(int(a_), int(b_ - a_)) for a_, b_ in zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0])}
        for k in list(abiertos):
            if k not in actuales:
                y0_ = abiertos.pop(k); out.append([k[0], y0_, k[1], y - y0_])
        for k in actuales: abiertos.setdefault(k, y)
    return out


# ---------------- 1. escala gráfica ----------------
# «planta con tipologias.pdf» está a tamaño real: su escala 1:S se ajusta con las áreas de sus polígonos, porque las tipologías tienen áreas conocidas.
ZON = []
for d_ in pT.get_drawings():
    if (d_.get("width") or 0) >= 1.5 and d_.get("color"):
        P_ = poligono(d_)
        if len(P_) >= 3: ZON.append({"col": d_["color"], "P": P_, "a": area_poligono(P_)})
assert ZON, "no hay polígonos de área (trazos gruesos) en el PDF de tipologías"


def error_escala(S):
    f = (0.0254 / 72 * S) ** 2
    return float(np.median([min(abs(np.log(z_["a"] * f / t_)) for t_ in TABLA) for z_ in ZON]))


S_ajust = min(range(110, 201), key=error_escala)
S_std = min([100, 125, 150, 175, 200], key=lambda s_: abs(s_ - S_ajust))
S = S_std if abs(S_std - S_ajust) / S_ajust < 0.02 else S_ajust                  # escala normalizada si el ajuste cae a menos del 2 %
err_med = error_escala(S)
print("escala gráfica: error mediano de las áreas frente a la tabla de tipologías %s" % {s_: round(error_escala(s_) * 100, 1) for s_ in (120, 135, 150, 165, 180, 200)})
print("-> escala 1:%d (mejor ajuste 1:%d), error mediano %.1f %% | %d polígonos" % (S, S_ajust, err_med * 100, len(ZON)))

# ---------------- 2. registro entre los tres PDFs ----------------
PA = np.vstack([centros(pE, "SALA"), centros(pE, "COCINA")]); PB = np.vstack([centros(pT, "SALA"), centros(pT, "COCINA")])       # tipologías -> nombres: mismas etiquetas
s_ab = float((np.ptp(PA[:, 0]) / np.ptp(PB[:, 0]) + np.ptp(PA[:, 1]) / np.ptp(PB[:, 1])) / 2)
tx_ab = float(PA[:, 0].min() - s_ab * PB[:, 0].min()); ty_ab = float(PA[:, 1].min() - s_ab * PB[:, 1].min())
residuo = float(np.sqrt(np.mean([np.min(np.hypot(*(PA - q_).T)) ** 2 for q_ in PB * s_ab + [tx_ab, ty_ab]])))
print("registro tipologías -> nombres: escala %.4f | residuo de las etiquetas %.2f pt" % (s_ab, residuo))
assert residuo < 8, "las etiquetas de los dos PDFs no coinciden"
# nombres -> muros: las guías de color (verde, azul, rojo, magenta) son las mismas en ambos; si no bastan, los muros negros de fachada y núcleos
f_el, sc_el, loc = registra(recorte(color_vivo(pL, CLIP_L, 150), CLIP_L, REG_L), recorte(color_vivo(pE, CLIP_E, 150), CLIP_E, REG_E))
print("registro nombres -> muros con guías de color: factor %.4f | correlación %.2f" % (f_el, sc_el))
if sc_el < 0.25:
    nl_ = sin_lineas_largas(negra(pL, CLIP_L, 150), 150, LARGA_L); ne_ = sin_lineas_largas(borra_texto(negra(pE, CLIP_E, 150), pE, CLIP_E, 150), 150, LARGA_E)
    alt = registra(recorte(nl_, CLIP_L, REG_L), recorte(ne_, CLIP_E, REG_E))
    print("registro nombres -> muros con muros negros: factor %.4f | correlación %.2f" % alt[:2])
    if alt[1] > sc_el: f_el, sc_el, loc = alt
assert sc_el > 0.2, "no se pudo registrar el plano de nombres con el de muros (correlación %.2f)" % sc_el
k150 = 150 / 72
ex0, ey0 = REG_E[0], REG_E[1]; lx0, ly0 = REG_L[0] + loc[0] / k150, REG_L[1] + loc[1] / k150
a_el = lambda x_, y_: (f_el * (x_ - ex0) + lx0, f_el * (y_ - ey0) + ly0)                  # PDF de nombres -> PDF de muros (pt)
a_bl = lambda x_, y_: a_el(s_ab * x_ + tx_ab, s_ab * y_ + ty_ab)                          # PDF de tipologías -> PDF de muros (pt)
sBL = f_el * s_ab                                                                         # tamaño del PDF de muros respecto al de tipologías
M_PT = 0.0254 / 72 * S / sBL                                                              # metros reales por punto del PDF de muros
DPI = int(round(M_PT * 72 / 0.0607))                                                      # resolución con la que 1 px ≈ 6,07 cm
RED = 1.0 / sBL                                                                           # el visor calcula m/px = 0,0254 / DPI * S * RED
print("1 pt del PDF de muros = %.1f cm | rasterizado a %d ppp (1 px = %.2f cm)" % (M_PT * 100, DPI, M_PT * 72 / DPI * 100))
a_px = lambda x_, y_: [int(round((x_ - CLIP_L.x0) * DPI / 72)), int(round((y_ - CLIP_L.y0) * DPI / 72))]

# ---------------- 3. áreas (polígonos de color) y nombres, en píxeles del plano de muros ----------------
H, W = pix(pL, CLIP_L, DPI).shape[:2]
zp = []
for z_ in ZON:
    Q = [a_px(*a_bl(x_, y_)) for x_, y_ in z_["P"]]
    zp.append({"col": z_["col"], "Q": Q, "c": centroide(Q), "a": area_poligono(Q)})
corte = (min(z_["c"][1] for z_ in zp) + max(z_["c"][1] for z_ in zp)) / 2
for z_ in zp: z_["t"] = "A" if z_["c"][1] > corte else "B"                              # A = torre larga (abajo), B = torre corta (arriba)
torres = {}
for tk in "AB":
    xs_ = [q_[0] for z_ in zp if z_["t"] == tk for q_ in z_["Q"]]; ys_ = [q_[1] for z_ in zp if z_["t"] == tk for q_ in z_["Q"]]
    x0_, y0_ = max(0, min(xs_) - 25), max(0, min(ys_) - 25)
    torres[tk] = [x0_, y0_, min(W, max(xs_) + 25) - x0_, min(H, max(ys_) + 25) - y0_]
zonas = []
for k_, z_ in enumerate(sorted(zp, key=lambda z_: (z_["t"] == "A", round(z_["c"][1] / 200), z_["c"][0])), 1):
    zonas.append({"id": "Z%02d" % k_, "col": "#%02x%02x%02x" % tuple(int(round(v_ * 255)) for v_ in z_["col"]), "t": z_["t"],
                  "a": int(round(z_["a"])), "c": [int(round(z_["c"][0])), int(round(z_["c"][1]))], "p": z_["Q"]})
LET = {"alc": "a", "SALA": "s", "COCINA": "c"}
nombres = []
for w_ in pE.get_text("words"):
    if w_[4] in LET:
        px_, py_ = a_px(*a_el((w_[0] + w_[2]) / 2, (w_[1] + w_[3]) / 2)); nombres.append([px_, py_, LET[w_[4]]])

ANCHO = 3                                                      # px: ancho único de todos los muros (≈ 18 cm; moda del espesor de los muros dobles del plano)


def regulariza_muros(brutos):
    """Todos los muros pasan al mismo ancho sobre su eje: segmentos horizontales y verticales alineados y unidos, con nodos en extremos y cruces."""
    hs, vs, pil = [], [], []
    for x, y, w, h in brutos:
        if max(w, h) < 12: pil.append([x, y, w, h]); continue                  # pilares y cabos
        if w >= h: hs.append([int(round(y + h / 2 - .5)), x, x + w])           # [fila del eje, desde, hasta]
        else: vs.append([int(round(x + w / 2 - .5)), y, y + h])

    def une(segs):
        segs = sorted(segs); grupos = []
        for sg in segs:                                                           # ejes que difieren <= 2 px son el mismo eje
            for gr in grupos:
                if abs(sg[0] - gr["c"]) <= 2: gr["m"].append(sg); gr["c"] = sum(m_[0] * (m_[2] - m_[1]) for m_ in gr["m"]) / sum(m_[2] - m_[1] for m_ in gr["m"]); break
            else: grupos.append({"c": sg[0], "m": [sg]})
        out = []
        for gr in grupos:
            c = int(round(gr["c"])); ivs = sorted([m_[1], m_[2]] for m_ in gr["m"]); cur = ivs[0]
            for a_, b_ in ivs[1:]:
                if a_ <= cur[1] + 3: cur[1] = max(cur[1], b_)                     # une tramos separados por menos de 3 px (las puertas miden > 12 px)
                else: out.append([c, cur[0], cur[1]]); cur = [a_, b_]
            out.append([c, cur[0], cur[1]])
        return [o for o in out if o[2] - o[1] >= 8]

    hs, vs = une(hs), une(vs); e = ANCHO // 2
    nodos = []
    def nodo(x, y):
        if not any(abs(x - n_[0]) <= 2 and abs(y - n_[1]) <= 2 for n_ in nodos): nodos.append([round(x, 1), round(y, 1)])
    for c, a_, b_ in hs: nodo(a_, c + .5); nodo(b_, c + .5)
    for c, a_, b_ in vs: nodo(c + .5, a_); nodo(c + .5, b_)
    for cy, ax, bx in hs:
        for cx, ay, by in vs:
            if ax - 2 <= cx <= bx + 2 and ay - 2 <= cy <= by + 2: nodo(cx + .5, cy + .5)
    # los extremos que tocan otro muro se prolongan media anchura para cerrar la esquina
    hs2 = [[c, a_ - (e if any(abs(cx - a_) <= 2 and ay - 2 <= c <= by + 2 for cx, ay, by in vs) else 0), b_ + (e if any(abs(cx - b_) <= 2 and ay - 2 <= c <= by + 2 for cx, ay, by in vs) else 0)] for c, a_, b_ in hs]
    vs2 = [[c, a_ - (e if any(abs(cy - a_) <= 2 and ax - 2 <= c <= bx + 2 for cy, ax, bx in hs) else 0), b_ + (e if any(abs(cy - b_) <= 2 and ax - 2 <= c <= bx + 2 for cy, ax, bx in hs) else 0)] for c, a_, b_ in vs]
    muros = [[a_, c - e, b_ - a_, ANCHO] for c, a_, b_ in hs2] + [[c - e, a_, ANCHO, b_ - a_] for c, a_, b_ in vs2] + pil
    return muros, nodos


# ---------------- 4. muros: negro estricto, regularizado a rectángulos de 4 lados ----------------
negro = sin_lineas_largas(negra(pL, CLIP_L, DPI), DPI, LARGA_L)
negro = cv2.morphologyEx(negro, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))               # cierra rendijas del trazado (< 30 cm); las puertas siguen abiertas
zona = np.zeros((H, W), np.uint8)
for x, y, w, h in torres.values(): zona[max(0, y - 6):y + h + 6, max(0, x - 6):x + w + 6] = 1
negro &= zona                                                                              # solo los muros de las dos torres
hor = cv2.morphologyEx(negro, cv2.MORPH_OPEN, np.ones((1, 21), np.uint8))                  # tramos horizontales >= 1,3 m
ver = cv2.morphologyEx(negro, cv2.MORPH_OPEN, np.ones((21, 1), np.uint8))                  # tramos verticales >= 1,3 m
resto = negro & (1 - cv2.dilate(hor | ver, np.ones((3, 3), np.uint8)))                     # pilares y cabos
MU_BRUTO = rects(hor) + rects(ver) + [r_ for r_ in rects(resto) if r_[2] * r_[3] >= 25]
MU, NOD = regulariza_muros(MU_BRUTO)


def alinea(p, muros, tol=10):
    """Lados del área pegados al eje del muro que los acompaña: quedan horizontales y verticales, coinciden con los muros
    y con el lado de las áreas vecinas (comparten el mismo eje)."""
    q = cv2.approxPolyDP(np.array(p, np.float32).reshape(-1, 1, 2), 2.5, True).reshape(-1, 2).tolist()
    if len(q) < 4: return p
    lados = []
    for i in range(len(q)):
        (x0, y0), (x1, y1) = q[i], q[(i + 1) % len(q)]
        h = abs(x1 - x0) >= abs(y1 - y0)
        c, a, b = ((y0 + y1) / 2, *sorted((x0, x1))) if h else ((x0 + x1) / 2, *sorted((y0, y1)))
        cub = collections.defaultdict(float)                                           # largo cubierto por cada eje de muro cercano
        for x, y, w, hh in muros:
            if (w > hh) != h: continue
            eje = y + hh / 2 if h else x + w / 2
            if abs(eje - c) <= tol: cub[eje] += max(0, min(b, x + w if h else y + hh) - max(a, x if h else y))
        mejor = max(cub.items(), key=lambda kv: kv[1], default=(c, 0))
        lados.append([h, mejor[0] if mejor[1] >= .35 * (b - a) else c, q[(i + 1) % len(q)]])
    out = []
    for l in lados:                                                                   # lados seguidos sobre el mismo eje: uno solo
        if out and out[-1][0] == l[0] and abs(out[-1][1] - l[1]) < .6: out[-1][2] = l[2]
        else: out.append(l)
    if len(out) > 1 and out[0][0] == out[-1][0] and abs(out[0][1] - out[-1][1]) < .6: out.pop()
    pts = []
    for i, (h, c, v) in enumerate(out):
        h2, c2, _ = out[(i + 1) % len(out)]
        if h != h2: pts.append([c2, c] if h else [c, c2])                             # esquina: cruce de los dos ejes
        else: pts += [[v[0], c], [v[0], c2]] if h else [[c, v[1]], [c2, v[1]]]          # escalón entre dos lados paralelos
    return [[round(x, 1), round(y, 1)] for x, y in pts] if len(pts) >= 4 else p


for z_ in zonas: z_["p"] = alinea(z_["p"], MU)
m_px = M_PT * 72 / DPI
print("muros homogéneos: %d rectángulos de %d px (%.0f cm) sobre sus ejes (antes %d de espesor variable) | %d nodos" % (len(MU), ANCHO, ANCHO * m_px * 100, len(MU_BRUTO), len(NOD)))
print("muros: %d rectángulos | áreas: %d polígonos (%.0f m²) | nombres: %d (alc %d, sala %d, cocina %d) | torres A %.1f x %.1f m, B %.1f x %.1f m"
      % (len(MU), len(zonas), sum(z_["a"] for z_ in zonas) * m_px ** 2, len(nombres), *[sum(1 for n_ in nombres if n_[2] == c_) for c_ in "asc"],
         torres["A"][2] * m_px, torres["A"][3] * m_px, torres["B"][2] * m_px, torres["B"][3] * m_px))
# ---------------- 4b. ambientes: polígonos regulares (rectángulos inscritos) dentro de cada área ----------------
def contorno(m, ox, oy):
    """Borde del ambiente hasta la cara de los muros, como polígono (píxeles del plano)."""
    m2 = (cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)) & (1 - MUR[oy:oy + m.shape[0], ox:ox + m.shape[1]])).astype(np.uint8)
    cs, _ = cv2.findContours(m2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cs: return None
    return [[int(x) + ox, int(y) + oy] for x, y in cv2.approxPolyDP(max(cs, key=cv2.contourArea), 1.0, True).reshape(-1, 2)]


def mayor_rect(m):
    """Mayor rectángulo alineado a los ejes dentro de la máscara (histograma + pila). Devuelve (área, x, y, ancho, alto)."""
    h, w = m.shape
    alt = np.zeros(w + 1, np.int32); mejor = (0, 0, 0, 0, 0)
    for y in range(h):
        alt[:w] = np.where(m[y] > 0, alt[:w] + 1, 0)
        pila = []
        for x in range(w + 1):
            cur = int(alt[x]); ini = x
            while pila and pila[-1][1] >= cur:
                sx, sh = pila.pop(); area = sh * (x - sx)
                if area > mejor[0]: mejor = (area, sx, y - sh + 1, x - sx, sh)
                ini = sx
            pila.append((ini, cur))
    return mejor


def cobertura(m, maxn=8):
    """Cubre el ambiente con los mayores rectángulos que caben dentro de él."""
    m = m.copy(); total = int(m.sum()); out = []
    for _ in range(maxn):
        a, x, y, w, h = mayor_rect(m)
        if a < max(60, 0.05 * total): break
        out.append([x, y, w, h]); m[y:y + h, x:x + w] = 0
    return out


MUR = np.zeros((H, W), np.uint8)
for x, y, w, h in MU: MUR[y:y + h, x:x + w] = 1
M2PX = (M_PT * 72 / DPI) ** 2                                                       # m² por píxel²
amb = []
for z_ in zonas:
    Q = np.array(z_["p"], np.int32)
    bx, by, bw, bh = cv2.boundingRect(Q)
    x0, y0, x1, y1 = max(0, bx - 6), max(0, by - 6), min(W, bx + bw + 6), min(H, by + bh + 6)
    pm_ = np.zeros((y1 - y0, x1 - x0), np.uint8); cv2.fillPoly(pm_, [(Q - [x0, y0]).astype(np.int32)], 1)
    pm0 = pm_.copy(); pm_ = cv2.erode(pm_, np.ones((3, 3), np.uint8))                                  # la línea gruesa del área no es espacio libre
    libre = (pm_ & (1 - cv2.dilate(MUR[y0:y1, x0:x1], np.ones((3, 3), np.uint8)))).astype(np.uint8)
    libre = cv2.morphologyEx(libre, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    dist = cv2.distanceTransform(libre, cv2.DIST_L2, 5)
    n2, mk = cv2.connectedComponents((dist > 7.5).astype(np.uint8))                  # una semilla por ambiente (> ~0,9 m de ancho); los vanos de puerta los separan
    mk = mk.astype(np.int32)
    cv2.watershed(cv2.cvtColor(np.uint8(np.clip(dist * 8, 0, 255)), cv2.COLOR_GRAY2BGR), mk)
    mk[libre == 0] = 0
    regs = {}
    for k in range(1, n2):
        m = (mk == k).astype(np.uint8); a = int(m.sum())
        if a * M2PX < 1.0: continue                                                  # menos de 1 m²: no es un ambiente
        bx2, by2, bw2, bh2 = cv2.boundingRect(m)
        rs = cobertura(m[by2:by2 + bh2, bx2:bx2 + bw2])
        if not rs: continue
        rs = [[r_[0] + bx2 + x0, r_[1] + by2 + y0, r_[2], r_[3]] for r_ in rs]
        gran = max(rs, key=lambda r_: r_[2] * r_[3])
        regs[k] = {"z": z_["id"], "a0": a, "r": rs, "c": [gran[0] + gran[2] // 2, gran[1] + gran[3] // 2], "m": m, "p": contorno(m, x0, y0)}
    for g_ in regs.values(): g_["lab"] = []
    for px_, py_, c_ in nombres:                                                      # nombres del plano que caen dentro del área
        if cv2.pointPolygonTest(Q.reshape(-1, 1, 2), (float(px_), float(py_)), False) < 0: continue
        mejor, dmin = None, 1e9
        for k, g_ in regs.items():
            for r_ in g_["r"]:
                dx_ = max(r_[0] - px_, 0, px_ - (r_[0] + r_[2])); dy_ = max(r_[1] - py_, 0, py_ - (r_[1] + r_[3])); d_ = (dx_ * dx_ + dy_ * dy_) ** 0.5
                if d_ < dmin: dmin, mejor = d_, k
        if mejor is not None and dmin <= 25: regs[mejor]["lab"].append((px_ - x0, py_ - y0, c_))
    for k, g_ in list(regs.items()):                                                  # un ambiente con dos nombres distintos (sala abierta a cocina...) se reparte entre ellos
        if len({c_ for _, _, c_ in g_["lab"]}) < 2: continue
        ys_, xs_ = np.nonzero(g_["m"]); L_ = np.array([[lx, ly] for lx, ly, _ in g_["lab"]], float); T_ = np.array([c_ for _, _, c_ in g_["lab"]])
        pt_ = T_[((xs_[:, None] - L_[:, 0]) ** 2 + (ys_[:, None] - L_[:, 1]) ** 2).argmin(1)]      # etiqueta más cercana de cada píxel
        del regs[k]
        for c_ in sorted(set(T_)):
            sm = np.zeros_like(g_["m"]); sm[ys_[pt_ == c_], xs_[pt_ == c_]] = 1
            a = int(sm.sum())
            if a * M2PX < 1.0: continue
            bx2, by2, bw2, bh2 = cv2.boundingRect(sm); rs = cobertura(sm[by2:by2 + bh2, bx2:bx2 + bw2])
            if not rs: continue
            rs = [[r_[0] + bx2 + x0, r_[1] + by2 + y0, r_[2], r_[3]] for r_ in rs]; gran = max(rs, key=lambda r_: r_[2] * r_[3])
            regs[(k, c_)] = {"z": z_["id"], "a0": a, "r": rs, "c": [gran[0] + gran[2] // 2, gran[1] + gran[3] // 2], "m": sm, "p": contorno(sm, x0, y0), "lab": [l_ for l_ in g_["lab"] if l_[2] == c_]}
    claves_ = list(regs); L_ = np.zeros(pm0.shape, np.float32)                     # cada ambiente crece hasta los muros y el borde del área: llenan el polígono sin huecos
    for i_, k in enumerate(claves_, 1): L_[regs[k]["m"] > 0] = i_
    perm_ = (pm0 > 0) & (MUR[y0:y1, x0:x1] == 0)
    for _ in range(120):
        D_ = cv2.dilate(L_, np.ones((3, 3), np.uint8)); nuevo_ = (L_ == 0) & perm_ & (D_ > 0)
        if not nuevo_.any(): break
        L_[nuevo_] = D_[nuevo_]
    for i_, k in enumerate(claves_, 1):
        m = (L_ == i_).astype(np.uint8); regs[k]["m"] = m; regs[k]["a0"] = int(m.sum()); regs[k]["p"] = contorno(m, x0, y0)
        bx2, by2, bw2, bh2 = cv2.boundingRect(m); rs = cobertura(m[by2:by2 + bh2, bx2:bx2 + bw2])
        if rs: regs[k]["r"] = [[r_[0] + bx2 + x0, r_[1] + by2 + y0, r_[2], r_[3]] for r_ in rs]
    for g_ in regs.values():                                                           # tipo por el nombre del plano
        cs_ = collections.Counter(c_ for _, _, c_ in g_["lab"])
        if cs_: g_["t"], g_["o"] = {"s": "sala", "c": "cocina", "a": "alcoba"}[cs_.most_common(1)[0][0]], "p"
    claves = list(regs)
    for ka in claves:                                                                   # vecinos: ambientes que se tocan (puerta o paso abierto); un muro los separa más de 4 px
        da = cv2.dilate(regs[ka]["m"], np.ones((9, 9), np.uint8)); regs[ka]["ady"] = {kb for kb in claves if kb != ka and (da & regs[kb]["m"]).any()}
    for g_ in regs.values():                                                           # sin nombre: propuesta por tamaño y vecindad (baño, zona de ropas u otro)
        if "t" in g_: continue
        m2_ = g_["a0"] * M2PX; g_["o"] = "e"
        g_["t"] = ("ropas" if (m2_ <= 4.5 and any(regs[v].get("t") == "cocina" for v in g_["ady"])) else "bano") if m2_ <= 7.5 else "otro"
    amb += sorted(regs.values(), key=lambda g_: (round(g_["c"][1] / 60), g_["c"][0]))
# ---------------- 4c. todo lo que no es un área de apartamento tipo: zona común, o vacío si lleva una X ----------------
def equis(p):
    """Cajas de las X del plano: dos diagonales que comparten la misma caja (huecos de ascensor, ductos, vacíos)."""
    diag = []
    for d_ in p.get_drawings():
        for it in d_["items"]:
            if it[0] == "l":
                a_, b_ = it[1], it[2]; dx_, dy_ = b_.x - a_.x, b_.y - a_.y
                if abs(dx_) > 2.5 and abs(dy_) > 2.5 and (dx_ * dx_ + dy_ * dy_) ** .5 > 5: diag.append((min(a_.x, b_.x), min(a_.y, b_.y), max(a_.x, b_.x), max(a_.y, b_.y), dx_ * dy_ > 0))
    out = []
    for i_, a_ in enumerate(diag):
        for b_ in diag[i_ + 1:]:
            if a_[4] != b_[4] and all(abs(a_[k] - b_[k]) < 1.2 for k in range(4)) and not any(all(abs(a_[k] - o[k]) < 1.5 for k in range(4)) for o in out): out.append(a_[:4])
    return out


vac = []
for x0_, y0_, x1_, y1_ in equis(pT):
    (xa, ya), (xb, yb) = a_px(*a_bl(x0_, y0_)), a_px(*a_bl(x1_, y1_)); vac.append([min(xa, xb), min(ya, yb), abs(xb - xa), abs(yb - ya)])
ZM = np.zeros((H, W), np.uint8); VM = np.zeros((H, W), np.uint8)
for z_ in zonas: cv2.fillPoly(ZM, [np.array(z_["p"], np.int32)], 1)
ZM = cv2.dilate(ZM, np.ones((7, 7), np.uint8))                                      # incluye la línea gruesa del polígono
for x, y, w, h in vac: VM[y:y + h, x:x + w] = 1
VM = cv2.dilate(VM, np.ones((3, 3), np.uint8))
ncom = 0
for tk, (x, y, w, h) in torres.items():
    x0, y0, x1, y1 = max(0, x - 6), max(0, y - 6), min(W, x + w + 6), min(H, y + h + 6)
    sub = lambda m: m[y0:y1, x0:x1]
    hull = cv2.morphologyEx(sub(MUR), cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8))
    hull |= cv2.morphologyEx(sub(MUR), cv2.MORPH_CLOSE, np.ones((5, 61), np.uint8)) | cv2.morphologyEx(sub(MUR), cv2.MORPH_CLOSE, np.ones((61, 5), np.uint8))   # vanos de fachada de hasta 3,6 m entre muros alineados (halls abiertos de la torre B)
    ff = cv2.copyMakeBorder((hull * 255).astype(np.uint8), 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
    cv2.floodFill(ff, np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8), (0, 0), 128)
    piso = (ff[1:-1, 1:-1] != 128).astype(np.uint8)                                 # interior del edificio
    libre = (piso & (1 - sub(ZM)) & (1 - sub(VM)) & (1 - cv2.dilate(sub(MUR), np.ones((3, 3), np.uint8)))).astype(np.uint8)
    libre = cv2.morphologyEx(libre, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n2, lab = cv2.connectedComponents(libre, connectivity=4)
    for k in range(1, n2):
        m = (lab == k).astype(np.uint8); a = int(m.sum())
        if a * M2PX < 1.5: continue
        bx2, by2, bw2, bh2 = cv2.boundingRect(m); rs = cobertura(m[by2:by2 + bh2, bx2:bx2 + bw2], 14)
        if not rs: continue
        rs = [[r_[0] + bx2 + x0, r_[1] + by2 + y0, r_[2], r_[3]] for r_ in rs]; gran = max(rs, key=lambda r_: r_[2] * r_[3])
        amb.append({"z": "", "t": "comun", "o": "c", "a0": a, "r": rs, "c": [gran[0] + gran[2] // 2, gran[1] + gran[3] // 2], "p": contorno(m, x0, y0)}); ncom += 1
for x, y, w, h in vac: amb.append({"z": "", "t": "vacio", "o": "x", "a0": w * h, "r": [[x, y, w, h]], "c": [x + w // 2, y + h // 2]})
print("fuera de las áreas de apartamento: %d zonas comunes y %d vacíos (X)" % (ncom, len(vac)))
amb = [g_ for g_ in amb if not (g_["t"] == "comun" and max(min(r_[2], r_[3]) for r_ in g_["r"]) < 20)]   # franjas de menos de 1,2 m por fuera de la fachada: no son zonas comunes
EDIF = ((ZM > 0) | (VM > 0)).astype(np.uint8)                                       # el edificio: áreas, zonas comunes y vacíos
for g_ in amb:
    if g_["t"] == "comun":
        for x, y, w, h in g_["r"]: EDIF[y:y + h, x:x + w] = 1
EDIF = cv2.dilate(EDIF, np.ones((5, 5), np.uint8)); n0 = len(MU)


def recorta(r_):
    """El muro solo donde está el edificio: el tramo continuo más largo de su eje dentro de él (fuera quedan barandas y bordes del lote)."""
    x, y, w, h = r_; hor = w >= h
    eje = EDIF[y + h // 2, x:x + w] if hor else EDIF[y:y + h, x + w // 2]
    d = np.flatnonzero(np.diff(np.concatenate(([0], eje.astype(np.int8), [0]))))
    if not len(d): return None
    a, b = max(zip(d[::2].tolist(), d[1::2].tolist()), key=lambda t: t[1] - t[0])
    if b - a < 12: return None
    return [x + a, y, b - a, h] if hor else [x, y + a, w, b - a]


MU = [r_ for r_ in (recorta(r_) for r_ in MU if max(r_[2], r_[3]) >= 12) if r_]
MURF = np.zeros((H, W), np.uint8)
for x, y, w, h in MU: MURF[y:y + h, x:x + w] = 1
nc_, lab_, st_, _ = cv2.connectedComponentsWithStats(cv2.dilate(MURF, np.ones((3, 3), np.uint8)), connectivity=8)
sueltos = {k for k in range(1, nc_) if max(st_[k, 2], st_[k, 3]) < 40}              # trozos de menos de 2,4 m que no tocan ningún otro muro
MU = [r_ for r_ in MU if lab_[r_[1] + r_[3] // 2, r_[0] + r_[2] // 2] not in sueltos]
NOD = [q_ for q_ in NOD if EDIF[min(H - 1, int(q_[1])), min(W - 1, int(q_[0]))]]
print("muros: quedan %d de %d (recortados al edificio, sin barandas, bordes del lote ni trozos sueltos)" % (len(MU), n0))
# puertas: vano de 0,55 a 1,2 m en la línea de un muro con espacio interior a ambos lados; si es el mismo ambiente, solo entre dos tramos del mismo muro
RM = np.zeros((H, W), np.int32)                                                     # número de ambiente de cada píxel
for i_, g_ in enumerate(amb, 1):
    if g_["t"] == "vacio": continue
    if g_.get("p"): cv2.fillPoly(RM, [np.array(g_["p"], np.int32)], i_)
    else:
        for x, y, w, h in g_["r"]: RM[y:y + h, x:x + w] = i_
MURF = np.zeros((H, W), np.uint8)
for x, y, w, h in MU: MURF[y:y + h, x:x + w] = 1
amb_de = lambda x, y: int(RM[y, x]) if 0 <= x < W and 0 <= y < H and not MURF[y, x] else 0
PU = []
for hor in (True, False):
    lineas = collections.defaultdict(list)                                           # eje -> tramos de muro sobre esa línea
    for x, y, w, h in MU:
        if (w > h) == hor: lineas[y + h // 2 if hor else x + w // 2].append((x, x + w, "m") if hor else (y, y + h, "m"))
    for c in list(lineas):                                                           # muros perpendiculares que cruzan la línea: topes
        for x, y, w, h in MU:
            if (w > h) != hor and ((y <= c < y + h) if hor else (x <= c < x + w)): lineas[c].append((x, x + w, "p") if hor else (y, y + h, "p"))
    for c, tr in lineas.items():
        tr.sort(); fin, tipo = tr[0][1], tr[0][2]
        for a_, b_, t_ in tr[1:]:
            if 9 <= a_ - fin <= 20 and "m" in (tipo, t_):
                mid = (fin + a_) // 2; (xa, ya), (xb, yb) = ((mid, c - 6), (mid, c + 6)) if hor else ((c - 6, mid), (c + 6, mid))
                la, lb = amb_de(xa, ya), amb_de(xb, yb)
                if la and lb and (la != lb or tipo == t_ == "m" or a_ - fin <= 16):   # une dos espacios, está entre dos tramos del mismo muro o mide lo de una puerta (los pasos anchos dentro de un ambiente no)
                    lado = -1 if amb[lb - 1]["t"] == "comun" and amb[la - 1]["t"] != "comun" else 1   # la hoja abre hacia el ambiente, no hacia la zona común
                    PU.append([fin, c + .5, a_, c + .5, lado] if hor else [c + .5, fin, c + .5, a_, lado])
            if b_ > fin: fin, tipo = b_, t_
print("puertas: %d vanos" % len(PU))
for i_, g_ in enumerate(amb, 1): g_["id"] = "A%03d" % i_
print("ambientes: %d %s | por el nombre del plano: %d, propuestos: %d" % (len(amb), dict(collections.Counter(g_["t"] for g_ in amb)), sum(1 for g_ in amb if g_["o"] == "p"), sum(1 for g_ in amb if g_["o"] == "e")))
# zonas comunes y escaleras tal como están en el plano: el dibujo original del PDF de muros, solo dentro de las zonas comunes
pm_g = pL.get_pixmap(matrix=pymupdf.Matrix(DPI / 72, DPI / 72), clip=CLIP_L, colorspace=pymupdf.csGRAY)
gris = np.full((H, W), 255, np.uint8); g0_ = np.frombuffer(pm_g.samples, np.uint8).reshape(pm_g.h, pm_g.w)[:H, :W]; gris[:g0_.shape[0], :g0_.shape[1]] = g0_
COMM = np.zeros((H, W), np.uint8)
for g_ in amb:
    if g_["t"] == "comun" and g_.get("p"): cv2.fillPoly(COMM, [np.array(g_["p"], np.int32)], 1)
COMM = cv2.dilate(COMM, np.ones((5, 5), np.uint8))
DIB = np.zeros((H, W, 4), np.uint8); DIB[..., :3] = 70; DIB[..., 3] = np.where((gris < 200) & (COMM > 0), 255 - gris, 0)

# esquema compacto: la torre de abajo sube hasta quedar a 2,4 m de la de arriba (las medidas dentro de cada torre no cambian)
A_, B_ = torres["A"], torres["B"]
DY = max(0, A_[1] - (B_[1] + B_[3]) - 40); S0 = B_[1] + B_[3] + 20                  # se quita la franja vacía [S0, S0 + DY)
sube = lambda y: y - DY if y >= S0 else y
MU = [[x, sube(y), w, h] for x, y, w, h in MU]
NOD = [[x, sube(y)] for x, y in NOD]
for z_ in zonas: z_["p"] = [[x, sube(y)] for x, y in z_["p"]]; z_["c"] = [z_["c"][0], sube(z_["c"][1])]
nombres = [[x, sube(y), c_] for x, y, c_ in nombres]
for g_ in amb:
    g_["r"] = [[x, sube(y), w, h] for x, y, w, h in g_["r"]]; g_["c"] = [g_["c"][0], sube(g_["c"][1])]
    if g_.get("p"): g_["p"] = [[x, sube(y)] for x, y in g_["p"]]
PU = [[x0_, sube(y0_), x1_, sube(y1_), l_] for x0_, y0_, x1_, y1_, l_ in PU]
torres["A"] = [A_[0], sube(A_[1]), A_[2], A_[3]]
DIB = np.concatenate([DIB[:S0], DIB[S0 + DY:]]); H -= DY
cv2.imwrite(os.path.join(RAIZ, "img", "planos", "visor-comunes.png"), DIB[..., [2, 1, 0, 3]])
print("esquema compacto: torre de abajo subida %d px (%.1f m) | zonas comunes y escaleras con el dibujo original" % (DY, DY * m_px))
SCAN = {"size": [W, H], "dpi": DPI, "red": round(RED, 4), "esc": S, "err": round(err_med * 100, 1), "tipos": TIPOS, "torres": torres, "mu": MU, "nod": NOD, "zon": zonas, "nom": nombres,
        "comunes_img": "../img/planos/visor-comunes.png", "pu": PU, "amb": [{"id": g_["id"], "z": g_["z"], "t": g_["t"], "o": g_["o"], "a0": g_["a0"], "c": g_["c"], "r": g_["r"], "p": g_.get("p")} for g_ in amb]}
os.makedirs(os.path.join(RAIZ, "js"), exist_ok=True)
with open(os.path.join(RAIZ, "js", "visor-planos-datos.js"), "w", encoding="utf-8") as f_:
    f_.write("// Generado por herramientas/escaner/generar_visor.py a partir de los PDF de img/planos/pdf: no editar a mano.\nwindow.VISOR=" + json.dumps(SCAN, separators=(",", ":")) + ";\n")

if OPC.control:
    vis = np.full((H, W, 3), 255, np.uint8)
    for x, y, w, h in MU: cv2.rectangle(vis, (x, y), (x + w - 1, y + h - 1), (40, 40, 40), -1)
    for z_ in zp: cv2.polylines(vis, [np.array(z_["Q"], np.int32)], True, tuple(int(v_ * 255) for v_ in z_["col"][::-1]), 3)
    for x, y, c_ in nombres: cv2.putText(vis, c_, (x - 4, y + 4), cv2.FONT_HERSHEY_SIMPLEX, .5, (0, 0, 220), 1)
    cv2.imwrite(os.path.join(AQUI, "control-visor.png"), vis)

# ---------------- 5. página con el navbar de Fontanella ----------------
VER = int(time.time())                                                                   # evita que el navegador muestre una versión vieja de los scripts
DEST = "Fontanella%20%C2%B7%20Planta%20tipo%20en%202D.html"
plan = open(os.path.join(RAIZ, "pages", "planos.html"), encoding="utf-8").read()
HEADER = re.search(r'<header class="barra">.*?</header>', plan, re.S).group(0)
HEADER = HEADER.replace(' aria-current="page"', "").replace(' class="activo"', "")             # el visor no es ninguna de esas pestañas
if "Visor de planos" not in HEADER:
    HEADER = re.sub(r'(?m)^([ \t]*)<a href="galeria\.html"', lambda m: '%s<a href="%s">Visor de planos</a>\n%s<a href="galeria.html"' % (m.group(1), DEST, m.group(1)), HEADER, count=1)
HEADER = HEADER.replace('<a href="%s">Visor de planos</a>' % DEST, '<a href="%s" class="activo" aria-current="page">Visor de planos</a>' % DEST)
cabeza = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="../img/marca/favicon.png">
  <link rel="apple-touch-icon" href="../img/marca/apple-touch-icon.png">
  <title>Visor de planos | Fontanella</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/estilos.css?v=72">
  <link rel="stylesheet" href="../css/visor-planos.css?v=%d">
</head>""" % VER

cuerpo = "\n<body class=\"vplanos\">\n  " + HEADER + r"""
<div class="app plano">
<div class="stage" id="stage">
  <canvas id="c"></canvas>
  <div class="barra-h" role="toolbar" aria-label="Herramientas del plano">
    <div class="grupo">
      <button id="tNav" aria-pressed="true" title="Navegar y consultar" aria-label="Navegar y consultar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3l12 9-5.5 1.2L10 19z"/></svg></button>
      <button id="tMed" aria-pressed="false" title="Medir entre dos puntos (px y m)" aria-label="Medir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16.5L16.5 3 21 7.5 7.5 21z"/><path d="M7 12.5l2 2M10 9.5l2 2M13 6.5l2 2"/></svg></button>
      <button id="tClr" title="Borrar medidas" aria-label="Borrar medidas"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/></svg></button>
    </div>
    <div class="grupo">
      <button id="mTip" aria-pressed="true" title="Tipologías" aria-label="Ver tipologías"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg></button>
      <button id="mAmb" aria-pressed="false" title="Distribución del apartamento" aria-label="Ver distribución"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM4 12h7M11 4v11M15 12v8M15 12h5"/></svg></button>
    </div>
    <div class="grupo" id="views">
      <button data-v="all" aria-pressed="true" title="Ajustar a la pantalla" aria-label="Ajustar a la pantalla"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg></button>
      <button data-v="A" aria-pressed="false" title="Torre A">A</button>
      <button data-v="B" aria-pressed="false" title="Torre B">B</button>
    </div>
    <div class="grupo">
      <button id="tLey" aria-pressed="false" title="Convenciones" aria-label="Convenciones"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 5h2v2H4zM4 11h2v2H4zM4 17h2v2H4z"/></svg></button>
    </div>
    <div class="grupo">
      <button id="zMas" title="Acercar" aria-label="Acercar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
      <button id="zMenos" title="Alejar" aria-label="Alejar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>
    </div>
  </div>
  <div id="info" role="dialog" aria-live="polite"><button class="x" id="ix" aria-label="Cerrar">×</button><h3 id="it"></h3><dl id="id"></dl>
    <div id="ed">
      <label for="edNom">Etiqueta</label><input id="edNom" type="text" placeholder="p. ej. Apartamento 101">
      <label for="edTip">Tipología asignada</label><select id="edTip"></select>
    </div>
    <div id="edA" style="display:none">
      <label for="edTipoA">Tipo de ambiente</label><select id="edTipoA"></select>
    </div>
  </div>
  <div class="hint" id="hint">Arrastra para mover · rueda para acercar · toca una unidad o un espacio</div>
  <div class="scalebar" id="sb"><span id="sbt"></span><br><i id="sbi" style="display:inline-block;height:6px;border:2px solid var(--ink);border-top:0;vertical-align:middle"></i><b id="sbn"></b></div>
</div>
<aside>
  <h1>Planta tipo</h1>
  <p class="sub">Escala 1:<span id="scv"></span> · <output id="mpp"></output></p>
  <h2>Muros</h2>
  <ul class="conv">
    <li><span class="sw" style="background:#111"></span><b>Muro</b> · ancho único 18 cm (3 px)</li>
    <li><span class="sw" style="background:#fff;border:3px solid #3b6fb6"></span><b>Límite de la unidad</b> · línea gruesa del color de su tipo</li>
    <li><svg width="14" height="14" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:6px" aria-hidden="true"><path d="M1 13V1M1 1a12 12 0 0 1 12 12" fill="none" stroke="#333" stroke-width="1.3"/></svg><b>Puerta</b> · hoja y giro</li>
  </ul>
  <h2>Tipologías</h2>
  <ul class="conv" id="leyenda"></ul>
  <h2>Distribución</h2>
  <ul class="conv" id="leyAmb"></ul>
</aside>
</div>
<script src="../js/visor-planos-datos.js?v=%d"></script>
<script src="../js/visor-planos.js?v=%d"></script>
</body>
</html>
""" % (VER, VER)
with open(PAG, "w", encoding="utf-8") as f_:
    f_.write(cabeza + cuerpo)
print("página escrita:", os.path.basename(PAG), os.path.getsize(PAG) // 1024, "KB | datos: js/visor-planos-datos.js", os.path.getsize(os.path.join(RAIZ, "js", "visor-planos-datos.js")) // 1024, "KB")

# ---------------- 6. pestaña «Visor de planos» en el menú de index y de todas las páginas ----------------
for p in glob.glob(os.path.join(RAIZ, "pages", "*.html")) + [os.path.join(RAIZ, "index.html")]:
    if os.path.basename(p).startswith("Fontanella"): continue
    t = open(p, encoding="utf-8").read(); n = t
    if "Visor de planos" not in n:                                                       # la pestaña es un enlace propio antes de «Modelo 3D» o de Galería (idempotente)
        n = re.sub(r'(?m)^([ \t]*)<a href="((?:pages/)?)(?:modelo-3d|galeria)\.html"([^>]*)>', lambda m: '%s<a href="%s%s">Visor de planos</a>\n%s' % (m.group(1), m.group(2), DEST, m.group(0)), n, count=1)
    if n != t:
        with open(p, "w", encoding="utf-8") as f_: f_.write(n)
    if n.count("Visor de planos") != 1 and not os.path.basename(p).startswith("administrador"): print("¡revisar menú!", os.path.relpath(p, RAIZ), n.count("Visor de planos"))
print("menú «Visor de planos» comprobado en index y páginas")
