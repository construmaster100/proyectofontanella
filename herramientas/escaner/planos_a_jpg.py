"""Planos del proyecto: identifica cada PDF, lo convierte a JPG (con miniatura), lee su información (hoja, título, lámina,
textos del dibujo) y mide sus píxeles. En las plantas busca la silueta de la planta tipo para saber si coinciden en la
implantación, dónde y a qué escala; con eso dice cuántos centímetros reales mide cada píxel del JPG.
Escribe las listas window.PLANOS (JPG para el visor de imágenes) y window.PLANOS_PDF (fichas) de js/datos.js,
que usa la página «Planos (PDF)».

Uso:  python -I herramientas/escaner/planos_a_jpg.py
"""
import glob, json, os, re, unicodedata

import cv2
import numpy as np
import pymupdf
from PIL import Image

RAIZ = os.environ.get("FONTANELLA_RAIZ") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
IMG = os.path.join(RAIZ, "img")
SAL = os.path.join(IMG, "planos", "jpg"); MIN = os.path.join(SAL, "miniaturas")
CM_PT_TIPO = 28.0                     # cm reales por punto en «PLANTA TIPO LINEAS» (escala gráfica 1:150 calibrada por generar_visor.py)
CLIP_TIPO = (80, 100, 668, 345)       # zona del dibujo de esa lámina, en puntos
DPI_M = 60                            # resolución a la que se comparan las siluetas
GRUPOS = [("planos/pdf", "Plantas arquitectónicas"),
          ("secuencia por pisos", "Secuencia por pisos · láminas A0 (vistas 3D)"),
          ("2.0 nueva secuencia", "Nueva secuencia por niveles (vistas 3D)")]
PLANTAS = {   # clave del nombre del archivo: (título, ubicación en el proyecto)
    "4-11": ("Nivel +3,50 (vista 3D)", "Nivel +3,50"),
    "4-12": ("Nivel +7,00 · entrada y portería (vista 3D)", "Nivel +7,00: acceso y portería"),
    "4-13": ("Nivel +10,00 (vista 3D)", "Nivel +10,00"),
    "4-15": ("Planta tipo (vista 3D)", "Pisos tipo de las torres"),
    "4-16": ("Torres 5 y 6 (vista 3D)", "Torres 5 y 6"),
    "LINEAS Y AREAS": ("Planta tipo · muros, áreas y nombres de los espacios", "Pisos tipo de las torres"),
    "PLANTA TIPO LINEAS": ("Implantación del proyecto · planta tipo en muros", "Implantación general en el lote"),
    "SOLO TIPO": ("Planta tipo · lámina simplificada", "Pisos tipo de las torres"),
    "planta con tipologias": ("Planta tipo con las tipologías de apartamento", "Pisos tipo de las torres")}
NUMEROS = {"primer": 1, "segundo": 2, "tercer": 3, "cuarto": 4, "sexto": 6, "octavo": 8, "diez": 10, "once": 11, "doce": 12, "catorce": 14, "diez y seis": 16}
FORMATOS = {"Carta": (279, 216), "A0": (1189, 841), "A1": (841, 594), "A2": (594, 420), "A3": (420, 297), "B2": (707, 500)}


def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def lamina(p):
    w, h = p.rect.width * 25.4 / 72, p.rect.height * 25.4 / 72
    nom = next((n for n, (a, b) in FORMATOS.items() if abs(max(w, h) - a) / a < .03 and abs(min(w, h) - b) / b < .03), "")
    return (nom + " · " if nom else "") + "%.0f × %.0f mm" % (w, h)


def info_md(carpeta):
    """Ficha que acompaña a las láminas A0 (info.md): título y campos «- **Campo:** valor»."""
    d, f = {}, os.path.join(carpeta, "info.md")
    if os.path.exists(f):
        for l in open(f, encoding="utf-8"):
            if l.startswith("# "): d["titulo"] = l[2:].strip()
            m = re.match(r"- \*\*(.+?):\*\*\s*(.+)", l)
            if m: d[m.group(1)] = re.sub(r"\*\*", "", m.group(2)).strip()
    return d


def mascara(p, dpi):
    pm = p.get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY)
    return cv2.GaussianBlur((np.frombuffer(pm.samples, np.uint8).reshape(pm.h, pm.w) < 110).astype(np.float32), (0, 0), 1.2)


def coincidencia(p, R):
    """Silueta de la planta tipo dentro de la lámina: correlación, escala relativa y posición (a DPI_M)."""
    M = mascara(p, DPI_M); S1, S2 = cv2.integral(M), cv2.integral(M * M)
    def prueba(escalas, mejor):
        for s in escalas:
            T = cv2.resize(R, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
            if T.shape[0] >= M.shape[0] or T.shape[1] >= M.shape[1] or T.std() == 0: continue
            r = cv2.matchTemplate(M, T, cv2.TM_CCOEFF_NORMED); h, w = T.shape; n = h * w
            win = lambda I: I[h:, w:] - I[:-h, w:] - I[h:, :-w] + I[:-h, :-w]                 # suma de cada ventana (imagen integral)
            r[win(S2) / n - (win(S1) / n) ** 2 < .3 * T.var()] = -1                             # ventanas casi en blanco: OpenCV da ±1 ahí
            _, v, _, loc = cv2.minMaxLoc(r)
            if v > mejor[0]: mejor = (v, s, loc[0], loc[1])
        return mejor
    mejor = prueba(np.geomspace(.35, 3, 46), (-1, 1, 0, 0))
    return prueba(np.linspace(mejor[1] * .97, mejor[1] * 1.03, 13), mejor)


def textos(p):
    """Lo que dice el dibujo: nombres de espacios, torres, niveles y escala escrita."""
    t = p.get_text().lower(); d = []
    for clave, nombre in (("alc", "alcobas"), ("sala", "salas"), ("cocina", "cocinas"), ("baño", "baños"), ("torre", "rótulos de torre"), ("nivel", "rótulos de nivel")):
        n = len(re.findall(r"\b" + clave, t))
        if n: d.append("%d %s" % (n, nombre))
    esc = sorted(set(re.findall(r"\b1\s*:\s*(\d{2,4})\b", t)))
    if esc: d.append("escala escrita 1:" + ", 1:".join(esc))
    return " · ".join(d)


def ficha(ruta, grupo):
    nombre = os.path.basename(ruta).replace(".pdf", ""); carpeta = os.path.dirname(ruta)
    hoja = (re.search(r"Sheet - (\d[\d-]*)", nombre) or [None, ""])[1]
    if grupo == GRUPOS[0][0]:
        clave = hoja or next((k for k in PLANTAS if nombre.startswith(k)), None)
        if clave:
            titulo, ubic = PLANTAS[clave]; tipo, orden = "Planta arquitectónica", (0, clave)
            if hoja: tipo, orden = "Vista 3D (isometría) del nivel, exportada de Revit", (0.5, clave)   # las hojas 4-1x no son plantas
        else:                                                                         # PDF nuevo sin ficha: título por su nombre
            titulo = re.sub(r"\s+", " ", nombre.split(" - ")[-1]).strip(); titulo = titulo[0].upper() + titulo[1:]
            ubic, orden = "Proyecto", (0.7, nombre)
            tipo = "Vista 3D exportada de Revit" if "3D View" in nombre else "Plano"
    elif grupo == GRUPOS[1][0]:
        md = info_md(carpeta); titulo = md.get("titulo", nombre); n = re.search(r"nivel-(\d+)", ruta)
        ubic = "Nivel %d" % int(n[1]) if n else "Todos los niveles"; tipo = md.get("Tipo de lámina", "Vista 3D (isometría)")
        hoja = (re.search(r"n\.º\s*(\d+)", md.get("Contiene", "")) or [None, ""])[1]; orden = (1, int(n[1]) if n else 0)
    else:
        lv = re.sub(r"\s+", " ", nombre.split(" - ")[-1]).strip(); n = NUMEROS.get(lv.lower().replace(" nivel", ""), 0)
        titulo, ubic, tipo, orden = lv[0].upper() + lv[1:] + " (vista 3D)", "Nivel %d" % n, "Vista 3D (isometría) exportada de Revit", (2, n)
    return {"nombre": nombre, "hoja": hoja.strip("-"), "titulo": titulo, "ubicacion": ubic, "tipo": tipo, "orden": orden,
            "grupo": "Vistas 3D por nivel · hojas 4-11 a 4-16" if orden[0] == 0.5 else "Cortes y otras vistas" if orden[0] == 0.7 else None}


def main():
    os.makedirs(MIN, exist_ok=True)
    ref = pymupdf.open(glob.glob(os.path.join(IMG, "planos", "pdf", "PLANTA TIPO LINEAS*.pdf"))[0])[0]
    x0, y0, x1, y1 = [int(round(v * DPI_M / 72)) for v in CLIP_TIPO]
    R = mascara(ref, DPI_M)[y0:y1, x0:x1]
    fichas = []
    for grupo, titulo_g in GRUPOS:
        for ruta in sorted(glob.glob(os.path.join(IMG, grupo, "**", "*.pdf"), recursive=True)):
            f = ficha(ruta, grupo); p = pymupdf.open(ruta)[0]
            lado = 3000 if max(p.rect.width, p.rect.height) > 1500 else 2400            # lado mayor del JPG en píxeles
            dpi = lado / (max(p.rect.width, p.rect.height) / 72)
            base = slug(("%s-%s" % (grupo.split("/")[0], f["nombre"]))[:90]); jpg = os.path.join(SAL, base + ".jpg")
            if os.path.exists(jpg) and os.path.getmtime(jpg) > os.path.getmtime(ruta): im = Image.open(jpg).convert("RGB")   # ya convertido
            else:
                pm = p.get_pixmap(matrix=pymupdf.Matrix(dpi / 72, dpi / 72)); im = Image.frombytes("RGB", (pm.w, pm.h), pm.samples)
                im.save(jpg, quality=85, optimize=True)
            mi = im.copy(); mi.thumbnail((480, 480)); mi.save(os.path.join(MIN, base + ".jpg"), quality=80, optimize=True)
            g = np.asarray(im.convert("L")); ys, xs = np.nonzero(g < 235)
            medida = "JPG %d × %d px a %.0f ppp; en papel 1 px = %.2f mm; el dibujo ocupa x %d–%d, y %d–%d px" % (im.width, im.height, dpi, 25.4 / dpi, xs.min(), xs.max(), ys.min(), ys.max())
            d = {"grupo": f["grupo"] or titulo_g, "archivo": os.path.relpath(ruta, IMG).replace("\\", "/"), "jpg": "plano-" + base,
                 "miniatura": "planos/jpg/miniaturas/" + base + ".jpg", "titulo": f["titulo"], "hoja": f["hoja"], "tipo": f["tipo"],
                 "ubicacion": f["ubicacion"], "lamina": lamina(p), "medida": medida, "contenido": textos(p), "orden": f["orden"],
                 "carpeta_jpg": "jpg/" + base + ".jpg"}
            if f["tipo"] == "Planta arquitectónica":                                       # coincidencia con la planta tipo
                if f["nombre"].startswith("PLANTA TIPO LINEAS"):
                    d["coincidencia"] = "Es la referencia: escala gráfica 1:150, 1 pt = %.1f cm reales" % CM_PT_TIPO; s = 1.0; v = 1.0
                else:
                    v, s, cx, cy = coincidencia(p, R); k = dpi / DPI_M
                    estado = "Coincide" if v >= .45 else "Coincidencia parcial" if v >= .25 else "Sin coincidencia clara"
                    d["coincidencia"] = "%s con la planta tipo: correlación %.2f; la silueta tipo aparece a escala ×%.2f en x %d, y %d px del JPG" % (estado, v, s, cx * k, cy * k)
                if v >= .25: d["escala_px"] = "1 px del JPG ≈ %.1f cm reales (por la coincidencia con la planta tipo)" % (CM_PT_TIPO / s * 72 / dpi)
            else:
                d["escala_px"] = "Vista 3D en isometría: sin escala métrica"
            fichas.append(d); print("%-62s %s" % (d["archivo"][:62], d.get("coincidencia", d["tipo"])[:80]))
    fichas.sort(key=lambda d: d["orden"])
    planos = [{"id": d["jpg"], "archivo": d.pop("carpeta_jpg"), "titulo": ("Hoja %s · " % d["hoja"] if d["hoja"] else "") + d["titulo"]} for d in fichas]
    for d in fichas: d.pop("orden")
    js = os.path.join(RAIZ, "js", "datos.js"); s = open(js, encoding="utf-8").read()
    lista = lambda xs: "[\n" + ",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in xs) + "\n]"
    s = re.sub(r"window\.PLANOS = \[.*?\];", lambda _: "window.PLANOS = " + lista(planos) + ";", s, count=1, flags=re.S)
    s = re.sub(r"window\.PLANOS_PDF = \[.*?\];", lambda _: "window.PLANOS_PDF = " + lista(fichas) + ";", s, count=1, flags=re.S)
    open(js, "w", encoding="utf-8").write(s)
    print("%d planos convertidos a JPG en img/planos/jpg y listados en js/datos.js" % len(fichas))


if __name__ == "__main__":
    main()
