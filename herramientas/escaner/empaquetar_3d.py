"""Empaqueta el modelo 3D (docs/3d/Project1.obj + Project1.mtl + Project1_Textures) en js/modelo-3d-datos.js, como el
visor de Tecnoacademia: un <script> sí se puede cargar abriendo la página como archivo (file://), sin servidor ni
internet, mientras que leer el .dae o el .obj con XMLHttpRequest lo bloquea el navegador. Las texturas van dentro como
data URI. Recorta el terreno de 2 km al entorno del proyecto y quita los objetos sueltos lejanos (encuadre limpio).

Uso:  python -I herramientas/escaner/empaquetar_3d.py
"""
import base64, json, os, re

RAIZ = os.environ.get("FONTANELLA_RAIZ") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
D = os.path.join(RAIZ, "docs", "3d")
SAL = os.path.join(RAIZ, "js", "modelo-3d-datos.js")
MARGEN = 40.0       # m de terreno que se conservan alrededor del proyecto
LEJOS = 400.0       # m: un objeto cuyo centro queda más lejos del conjunto es un resto suelto
TERRENO = 500.0     # m: un objeto más ancho que esto es el terreno


def main():
    lineas = open(os.path.join(D, "Project1.obj"), encoding="utf-8").read().splitlines()
    V, cajas, cur = [], {}, None                                                       # cajas en planta (x, y) de cada objeto
    for l in lineas:
        if l.startswith("o "): cur = l[2:].strip(); cajas[cur] = [1e18, 1e18, -1e18, -1e18]
        elif l.startswith("v "):
            x, y, z = map(float, l.split()[1:4]); V.append((x, y)); c = cajas[cur]
            c[0], c[1], c[2], c[3] = min(c[0], x), min(c[1], y), max(c[2], x), max(c[3], y)
    centro = lambda c: ((c[0] + c[2]) / 2, (c[1] + c[3]) / 2)
    terreno = {k for k, c in cajas.items() if max(c[2] - c[0], c[3] - c[1]) > TERRENO}
    resto = [k for k in cajas if k not in terreno]
    mx = sorted(centro(cajas[k])[0] for k in resto)[len(resto) // 2]; my = sorted(centro(cajas[k])[1] for k in resto)[len(resto) // 2]
    lejos = {k for k in resto if ((centro(cajas[k])[0] - mx) ** 2 + (centro(cajas[k])[1] - my) ** 2) ** .5 > LEJOS}
    obra = [cajas[k] for k in resto if k not in lejos]
    x0, y0 = min(c[0] for c in obra) - MARGEN, min(c[1] for c in obra) - MARGEN
    x1, y1 = max(c[2] for c in obra) + MARGEN, max(c[3] for c in obra) + MARGEN
    dentro = lambda i: x0 <= V[i][0] <= x1 and y0 <= V[i][1] <= y1

    out, cur, quitadas = [], None, 0
    for l in lineas:
        if l.startswith("o "): cur = l[2:].strip(); out.append(l)
        elif l.startswith("v "): x, y, z = l.split()[1:4]; out.append("v %.2f %.2f %.2f" % (float(x), float(y), float(z)))   # al centímetro
        elif l.startswith("f "):
            idx = [int(t.split("/")[0]) for t in l.split()[1:]]
            assert min(idx) > 0, "índices relativos no previstos"
            if cur in lejos or (cur in terreno and not all(dentro(i - 1) for i in idx)): quitadas += 1
            else: out.append(l)
        elif l.strip() and not l.startswith("#"): out.append(l)
    obj = "\n".join(out) + "\n"

    mtl = open(os.path.join(D, "Project1.mtl"), encoding="utf-8").read()
    tex = {}
    for n in sorted({os.path.basename(m.strip()) for m in re.findall(r"map_\w+\s+(.+)", mtl)}):
        f = os.path.join(D, "Project1_Textures", n)
        if os.path.exists(f): tex[n] = "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode()
    datos = {"obj": obj, "mtl": mtl, "texturas": tex, "centro": [(x0 + x1) / 2, (y0 + y1) / 2], "terreno_recortado_m": MARGEN}
    with open(SAL, "w", encoding="utf-8") as f:
        f.write("// Modelo 3D de Fontanella (docs/3d/Project1.obj, .mtl y Project1_Textures), empaquetado por herramientas/escaner/empaquetar_3d.py\n"
                "// para abrir el visor sin servidor: el navegador sí carga un <script> desde file://. No editar a mano.\n"
                "window.MODELO3D = " + json.dumps(datos, separators=(",", ":"), ensure_ascii=False) + ";\n")
    print("terreno %s recortado a %.0f m alrededor (%d caras fuera) | objetos lejanos quitados: %s | %d texturas | %s: %.1f MB"
          % (sorted(terreno), MARGEN, quitadas, sorted(lejos), len(tex), os.path.relpath(SAL, RAIZ), os.path.getsize(SAL) / 1e6))


if __name__ == "__main__":
    main()
