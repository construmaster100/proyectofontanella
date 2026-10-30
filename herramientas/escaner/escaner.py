"""Escáner de planos PDF: revisa su parte gráfica, su escala y su raster, y rasteriza las capas a píxeles.

Uso (desde la raíz del proyecto):
    python -I herramientas/escaner/escaner.py                 # todos los PDF de img/planos/pdf
    python -I herramientas/escaner/escaner.py plano.pdf --escala 200 --capas
Opciones:
    --escala N     escala de la lámina original (por defecto 200, es decir 1:200)
    --capas        además rasteriza cada capa a PNG en img/planos/capas/<plano>/
    --salida DIR   carpeta de las capas (por defecto img/planos/capas)

Qué comprueba en cada PDF:
  1. Parte gráfica: imágenes incrustadas (resolución real en dpi), dibujos vectoriales y texto.
  2. Escala: el cajetín de Revit es igual en todas las láminas, así que se compara la posición de sus textos con la
     lámina A0 de referencia (a tamaño real) para medir cuánto se redujo la impresión; con la escala de la lámina
     se obtiene cuántos metros reales mide cada píxel del raster.
  3. Capas: pasadas de escaneo sobre el raster guardadas como PNG. Hoy solo los muros negros; las sombras se descartan.
Requiere pymupdf, numpy y opencv-python.
"""
import argparse, collections, glob, json, os, sys
import cv2
import numpy as np
import pymupdf

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REFERENCIA = os.path.join(RAIZ, "img", "secuencia por pisos", "nivel-01", "nivel-01.pdf")   # lámina A0, a tamaño real
PULGADA = 0.0254


def graficos(p):
    """Parte gráfica de la página: raster incrustado (dpi reales), vectores y texto."""
    imgs = [i for i in p.get_image_info() if i["width"] > 100]
    dpis = [i["width"] / ((i["bbox"][2] - i["bbox"][0]) / 72) for i in imgs if i["bbox"][2] > i["bbox"][0]]
    cubierto = 0.0
    if imgs:
        x0 = min(i["bbox"][0] for i in imgs); y0 = min(i["bbox"][1] for i in imgs)
        x1 = max(i["bbox"][2] for i in imgs); y1 = max(i["bbox"][3] for i in imgs)
        cubierto = max(0, (min(x1, p.rect.x1) - max(x0, 0))) * max(0, (min(y1, p.rect.y1) - max(y0, 0))) / (p.rect.width * p.rect.height)
    return {"imagenes": len(imgs), "dpi_raster": round(float(np.median(dpis)), 1) if dpis else None,
            "raster_cubre_pagina": round(cubierto, 2), "dibujos_vectoriales": len(p.get_drawings()),
            "palabras": len(p.get_text("words"))}


def reduccion(p, ref):
    """Factor de reducción de la impresión respecto a la lámina de referencia: ajuste lineal de los textos únicos comunes."""
    def pal(q):
        c = collections.Counter(w[4] for w in q.get_text("words"))
        return {w[4]: (w[0], w[1]) for w in q.get_text("words") if c[w[4]] == 1 and len(w[4]) > 3}
    a, b = pal(p), pal(ref)
    com = [t for t in a if t in b]
    if len(com) >= 6:
        X = np.array([b[t][0] for t in com]); Y = np.array([b[t][1] for t in com])
        sx, tx = np.polyfit(X, [a[t][0] for t in com], 1)
        sy, ty = np.polyfit(Y, [a[t][1] for t in com], 1)
        res = float(np.sqrt(np.mean(np.concatenate([(sx * X + tx) - [a[t][0] for t in com], (sy * Y + ty) - [a[t][1] for t in com]]) ** 2)))
        return {"factor": round(1 / ((sx + sy) / 2), 4), "textos_comunes": len(com), "error_pt": round(res, 2), "metodo": "cajetín"}
    s = min(p.rect.width / ref.rect.width, p.rect.height / ref.rect.height)
    return {"factor": round(1 / s, 4), "textos_comunes": len(com), "error_pt": None, "metodo": "tamaño de hoja (aproximado)"}


# ---------------- pasadas de escaneo sobre el raster (BGR) ----------------
def _canales(im):
    b, g, r = [im[..., i].astype(int) for i in range(3)]
    return b, g, r, cv2.cvtColor(im, cv2.COLOR_BGR2HSV)


# Solo se escanean los muros: negro puro y neutro. Sombras (verde oscuro), guías de color y mobiliario se descartan;
# esa información se asigna después con etiquetas. Para añadir otra pasada, agrega una entrada a esta lista.
PASADAS = [
    ("01-muros-negros", lambda b, g, r, h: (np.maximum(np.maximum(r, g), b) < 70) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) <= 10)),
]


def capas(p, dpi, carpeta, vectorial=False):
    os.makedirs(carpeta, exist_ok=True)
    pymupdf.TOOLS.set_aa_level(0 if vectorial else 8)   # vectorial: sin antialias, el muro es negro o no lo es
    pm = p.get_pixmap(dpi=dpi, alpha=False)
    im = cv2.cvtColor(np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width, 3), cv2.COLOR_RGB2BGR)
    canales = _canales(im)
    out = {"ancho_px": pm.width, "alto_px": pm.height, "capas": {}}
    for nombre, fn in PASADAS:
        m = fn(*canales)
        cv2.imwrite(os.path.join(carpeta, nombre + ".png"), (m * 255).astype(np.uint8))
        out["capas"][nombre] = int(m.sum())
    b_, g_, r_, _ = canales
    out["oscuros_descartados_como_sombra"] = int(((np.maximum(np.maximum(r_, g_), b_) < 70) & ~PASADAS[0][1](*canales)).sum())
    cv2.imwrite(os.path.join(carpeta, "00-raster.png"), im)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", nargs="*"); ap.add_argument("--escala", type=float, default=200)
    ap.add_argument("--capas", action="store_true"); ap.add_argument("--salida", default=os.path.join(RAIZ, "img", "planos", "capas"))
    a = ap.parse_args()
    archivos = a.pdf or sorted(glob.glob(os.path.join(RAIZ, "img", "planos", "pdf", "*.pdf")))
    ref = pymupdf.open(REFERENCIA)[0]
    informe = []
    print("lámina de referencia: %.1f x %.1f pt (%.0f x %.0f mm)" % (ref.rect.width, ref.rect.height, ref.rect.width * 25.4 / 72, ref.rect.height * 25.4 / 72))
    for ruta in archivos:
        p = pymupdf.open(ruta)[0]
        g = graficos(p); r = reduccion(p, ref)
        vect = g["dibujos_vectoriales"] > 1000 and g["raster_cubre_pagina"] < 0.1     # plano vectorial: se rasteriza a 300 ppp
        dpi = 300 if vect else (g["dpi_raster"] or 150)
        esc_pdf = a.escala * r["factor"]                       # escala efectiva sobre el PDF
        m_px = PULGADA / dpi * esc_pdf                         # metros reales por píxel del raster
        item = {"archivo": os.path.basename(ruta), "pagina_pt": [round(p.rect.width, 1), round(p.rect.height, 1)], "grafico": g, "reduccion": r,
                "escala_lamina": "1:%g" % a.escala, "escala_sobre_pdf": "1:%.0f" % esc_pdf, "px_por_m": round(1 / m_px, 3), "cm_por_px": round(m_px * 100, 2)}
        if a.capas:
            item["capas"] = capas(p, int(round(dpi)), os.path.join(a.salida, (os.path.splitext(os.path.basename(ruta))[0].split(" - ")[2].split(" ")[0] if " - " in ruta else os.path.splitext(os.path.basename(ruta))[0].replace(" ", "-").lower())), vect)
        informe.append(item)
        print("\n%s\n  raster: %s imágenes a %s dpi, cubre %d %% de la página | vectores: %d | palabras: %d" % (item["archivo"], g["imagenes"], g["dpi_raster"], g["raster_cubre_pagina"] * 100, g["dibujos_vectoriales"], g["palabras"]))
        print("  reducción de impresión ×%.3f (%s, %s textos, error %s pt)" % (r["factor"], r["metodo"], r["textos_comunes"], r["error_pt"]))
        print("  escala lámina %s -> %s sobre el PDF | 1 px = %.2f cm | %.3f px por metro" % (item["escala_lamina"], item["escala_sobre_pdf"], item["cm_por_px"], item["px_por_m"]))
        if a.capas: print("  capas:", ", ".join("%s=%d px" % (k.split("-", 1)[1], v) for k, v in item["capas"]["capas"].items()), "| oscuros descartados como sombra: %d px" % item["capas"]["oscuros_descartados_como_sombra"])
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "informe.json"), "w", encoding="utf-8") as f:
        json.dump(informe, f, ensure_ascii=False, indent=1)
    print("\ninforme: herramientas/escaner/informe.json")


if __name__ == "__main__":
    sys.exit(main())
