// Formas regularizadas de las torres en axonometría (a partir de las imágenes de
// img/Presentación/modulos).
//  - Diseño "123": torres 1, 2 y 3. Unidades azules y cruz naranja de zona común.
//  - Diseño "45": torres 4 y 5. Unidades azules y naranjas, zona común amarilla.
// Se dibujan sobre cada cuadro del esquema del lote (bloque 1), y en las
// implantaciones y unidades de los bloques 3 y 4.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = Math.cos(Math.PI / 6);

  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // Piezas de cada diseño, de atrás hacia adelante (x a la derecha, y hacia el frente).
  // t: "u" unidad (apartamento) o "c" zona común; c: color; rot: punto del rótulo.
  const DISENOS = {
    "123": {
      an: 480, al: 400,
      piezas: [
        { t: "u", c: "azul", pts: [[0, 0], [220, 0], [220, 172], [90, 172], [90, 200], [0, 200]], rot: [110, 85] },
        { t: "c", c: "naranja", pts: rect(220, 30, 260, 172) },
        { t: "u", c: "azul", pts: [[480, 0], [260, 0], [260, 172], [390, 172], [390, 200], [480, 200]], rot: [370, 85] },
        { t: "u", c: "azul", pts: [[0, 200], [90, 200], [90, 228], [220, 228], [220, 400], [0, 400]], rot: [110, 315] },
        { t: "c", c: "naranja", pts: [[144, 172], [336, 172], [336, 228], [260, 228], [260, 370], [220, 370], [220, 228], [144, 228]] },
        { t: "u", c: "azul", pts: [[480, 200], [390, 200], [390, 228], [260, 228], [260, 400], [480, 400]], rot: [370, 315] }
      ]
    },
    "45": {
      // Según la imagen "TORRE 4 Y 5": tipos numerados, azules y amarillos; zona común naranja
      an: 735, al: 320,
      torres: { 4: { x0: 0, an: 500 }, 5: { x0: 500, an: 235 } },
      piezas: [
        { t: "u", c: "azul", torre: 4, tip: 1, pts: rect(0, 0, 160, 135) },
        { t: "u", c: "amarillo", torre: 4, tip: 2, pts: rect(160, 0, 320, 135) },
        { t: "u", c: "azul", torre: 4, tip: 3, pts: rect(320, 0, 425, 135) },
        { t: "c", c: "naranja", torre: 4, pts: rect(0, 135, 425, 185) },
        { t: "u", c: "azul", torre: 4, tip: 4, pts: rect(0, 185, 160, 320) },
        { t: "u", c: "amarillo", torre: 4, tip: 5, pts: rect(160, 185, 218, 320) },
        { t: "u", c: "azul", torre: 4, tip: 6, pts: rect(218, 185, 425, 320) },
        { t: "c", c: "naranja", torre: 4, pts: rect(425, 0, 500, 185) },
        { t: "c", c: "naranja", torre: 4, pts: rect(425, 185, 500, 320) },
        { t: "c", c: "naranja", torre: 5, pts: rect(500, 0, 520, 320) },
        { t: "u", c: "azul", torre: 5, tip: 1, rot: [627, 55], pts: [[520, 0], [735, 0], [735, 150], [610, 150], [610, 125], [543, 125], [543, 150], [520, 150]] },
        { t: "u", c: "amarillo", torre: 5, tip: 2, rot: [627, 250], pts: [[520, 150], [543, 150], [543, 190], [610, 190], [610, 150], [735, 150], [735, 320], [520, 320]] }
      ]
    }
  };

  // Datos de las tipologías de las torres 4 y 5 (área m², valor de la unidad, valor de las 12)
  const DATOS = {
    4: { 1: ["67,27", "$276.624.299", "$3.319,5"], 2: ["65,71", "$270.209.346", "$3.242,5"], 3: ["42,92", "$176.493.458", "$2.117,9"],
         4: ["67,52", "$277.652.336", "$3.331,8"], 5: ["28,37", "$116.661.682", "$1.399,9"], 6: ["84,78", "$348.628.037", "$4.183,5"] },
    5: { 1: ["97,00", "$398.878.505", "$4.786,5"], 2: ["97,00", "$398.878.505", "$4.786,5"] }
  };
  const COMUN = { 4: "106,09", 5: "60,00" };

  window.FontanellaDisenos = DISENOS; // lo usa js/lote3d.js

  const el = (nombre, atributos, texto) => {
    const nodo = document.createElementNS(NS, nombre);
    for (const k in atributos) nodo.setAttribute(k, atributos[k]);
    if (texto) nodo.textContent = texto;
    return nodo;
  };

  // Prisma de un polígono: paredes visibles (normal hacia +x o +y) y tapa.
  // P(x, y, h) lleva un punto del plano y su altura a coordenadas de pantalla.
  function prisma(g, pts, dx, P, z) {
    const q = pts.map(([x, y]) => [x + dx, y]);
    let area = 0;
    q.forEach((a, i) => { const b = q[(i + 1) % q.length]; area += a[0] * b[1] - b[0] * a[1]; });
    const paredes = [];
    q.forEach((a, i) => {
      const b = q[(i + 1) % q.length];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const n = area > 0 ? [ey, -ex] : [-ey, ex];
      if (n[0] + n[1] <= 0) return;
      paredes.push({ a, b, lado: n[0] > 0 ? "ax-der" : "ax-izq", orden: a[0] + a[1] + b[0] + b[1] });
    });
    paredes.sort((u, v) => u.orden - v.orden).forEach(p => {
      g.appendChild(el("polygon", { class: p.lado, points: [P(p.a[0], p.a[1], z), P(p.b[0], p.b[1], z), P(p.b[0], p.b[1], 0), P(p.a[0], p.a[1], 0)].join(" ") }));
    });
    g.appendChild(el("polygon", { class: "ax-tapa", points: q.map(([x, y]) => P(x, y, z)).join(" ") }));
  }

  const NIVELES = 12;
  const claseDe = pz => (pz.t === "u" ? "mod-u" : "mod-c") + " mod-" + pz.c;

  // Esquema del lote (bloque 1): cada cuadro T1 a T5 se reemplaza por su forma
  function formaEnLote(svg) {
    const etiquetas = el("g", { class: "t-etiquetas", "aria-hidden": "true" });
    svg.querySelectorAll(".iso-torre[data-torre]").forEach(g => {
      const n = Number(g.dataset.torre);
      const dis = n <= 3 ? DISENOS["123"] : DISENOS["45"];
      const piezas = dis.piezas.filter(pz => n <= 3 || (pz.torre === n && !pz.solo));
      const ext = n <= 3 ? { x0: 0, an: dis.an } : dis.torres[n];
      const izq = g.querySelector(".iso-izq"), der = g.querySelector(".iso-der");
      if (!izq || !der) return;
      const num = e => e.getAttribute("points").trim().split(/\s+/).map(s => s.split(",").map(Number));
      const f = num(izq), d = num(der);
      const x0 = f[0][0], y0 = f[0][1], w = f[1][0] - f[0][0], alto = f[0][1] - f[3][1];
      const ddx = d[1][0] - d[0][0], ddy = d[1][1] - d[0][1];
      const P = (x, y, h) => {
        const t = 1 - y / dis.al;
        return (x0 + ((x - ext.x0) / ext.an) * w + t * ddx).toFixed(1) + "," + (y0 + t * ddy - h).toFixed(1);
      };
      const nombre = g.querySelector(".t-torre-nom");
      g.querySelectorAll("polygon, line").forEach(e => e.remove());
      g.classList.add("mod-ax");
      if (n >= 4) {
        // Torres 4 y 5: doce niveles apilados; cada uno parte como cristal y se vuelve sólido en secuencia
        const hN = alto / NIVELES;
        for (let k = 0; k < NIVELES; k++) {
          const nivel = el("g", { class: "nivel nivel-vidrio" });
          const Pk = (x, y, h) => P(x, y, h + k * hN);
          piezas.forEach(pz => {
            const p = el("g", { class: claseDe(pz) });
            prisma(p, pz.pts, 0, Pk, hN);
            nivel.appendChild(p);
          });
          g.appendChild(nivel);
        }
      } else {
        piezas.forEach(pz => {
          const p = el("g", { class: claseDe(pz) });
          prisma(p, pz.pts, 0, P, alto);
          g.appendChild(p);
        });
      }
      if (nombre) {
        // Etiqueta T1 a T5 como insignia, al final del dibujo para que ninguna torre la tape
        const x = Number(nombre.getAttribute("x")), y = Number(nombre.getAttribute("y"));
        const texto = nombre.textContent;
        nombre.remove();
        etiquetas.appendChild(el("rect", { x: x - 23, y: y - 21, width: 46, height: 28, rx: 7 }));
        etiquetas.appendChild(el("text", { x, y, "text-anchor": "middle" }, texto));
      }
    });
    svg.appendChild(etiquetas);
  }

  const centro = pts => {
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  };
  const ancho = pts => Math.max(...pts.map(q => q[0])) - Math.min(...pts.map(q => q[0]));

  // Implantaciones y unidades en axonometría isométrica
  function construir(svg) {
    const todas = svg.dataset.planta === "45"; // planta tipo de las torres 4 y 5 juntas
    const planta = svg.dataset.planta && !todas ? Number(svg.dataset.planta) : 0; // o solo de la torre 4 o 5
    let modulos;
    if (todas) {
      modulos = [{ x: 0, dis: DISENOS["45"] }];
    } else if (planta) {
      const origen = DISENOS["45"].piezas.filter(pz => pz.torre === planta);
      const minX = Math.min(...origen.flatMap(pz => pz.pts.map(q => q[0])));
      const maxX = Math.max(...origen.flatMap(pz => pz.pts.map(q => q[0])));
      // Se traslada la torre al origen del plano
      const piezas = origen.map(pz => ({ ...pz, pts: pz.pts.map(([x, y]) => [x - minX, y]), rot: pz.rot && [pz.rot[0] - minX, pz.rot[1]] }));
      modulos = [{ x: 0, dis: { an: maxX - minX, al: DISENOS["45"].al, piezas }, planta }];
    } else {
      modulos = JSON.parse(svg.dataset.modulos); // [{ x, diseno, torre?, torres? }]
      modulos.forEach(m => {
        const d = DISENOS[m.diseno || "123"];
        m.dis = m.torres ? { ...d, piezas: d.piezas.filter(pz => !pz.solo) } : d;
      });
    }
    const W = Number(svg.dataset.ancho), z = Number(svg.dataset.alto);
    const conTexto = svg.dataset.texto === "1";
    const AL = Math.max(...modulos.map(m => m.dis.al));
    const Xmax = Math.max(...modulos.map(m => m.x + m.dis.an));
    const k = W / ((Xmax + AL) * C);
    const margen = conTexto && !todas ? 0 : (todas ? 44 : 26); // espacio para los rótulos T1, T2, T3 o TORRE 4, TORRE 5
    const H = (Xmax + AL) * 0.5 * k + z + margen;
    const oy = z + margen;
    const px = (x, y) => ((x - y) * C + AL * C) * k;
    const py = (x, y, h) => (x + y) * 0.5 * k + oy - h;
    const P = (x, y, h) => px(x, y).toFixed(1) + "," + py(x, y, h).toFixed(1);
    const llamadas = svg.dataset.llamadas === "1"; // etiquetas con línea guía fuera del dibujo
    const VW = llamadas ? Number(svg.dataset.vista) : W, ox = (VW - W) / 2, anclas = [];
    svg.setAttribute("viewBox", "0 0 " + VW + " " + H.toFixed(1));
    svg.classList.add("mod-ax");

    const grupoTorre = (n, titulo) => {
      const g = el("g", { class: "g-torre mod-torre", "data-torre": n, tabindex: "0", role: "button", "aria-label": "Ver ficha de la torre " + n });
      g.appendChild(el("title", {}, titulo));
      svg.appendChild(g);
      return g;
    };
    const rotulo = (g, texto, x, y) => {
      const cx = px(x, y), cy = py(x, y, z) - 10 - (svg.dataset.planta === "45" ? 16 : 0), w = texto.length * 13 + 20;
      g.appendChild(el("rect", { class: "mod-rotulo-fondo", x: (cx - w / 2).toFixed(1), y: (cy - 22).toFixed(1), width: w, height: 31, rx: 6 }));
      g.appendChild(el("text", { class: "mod-rotulo", x: cx.toFixed(1), y: cy.toFixed(1), "text-anchor": "middle" }, texto));
    };
    const texto = (g, clase, x, y, t) =>
      g.appendChild(el("text", { class: clase, x: x.toFixed(1), y: y.toFixed(1), "text-anchor": "middle" }, t));

    modulos.forEach(m => {
      const raices = {};
      let raizUnica = null;
      if (m.torre) raizUnica = grupoTorre(m.torre, "Torre " + m.torre + " · construida · 4 apartamentos por piso · 12 pisos");
      else if (!m.torres) { raizUnica = el("g", {}); svg.appendChild(raizUnica); }

      m.dis.piezas.forEach(pz => {
        let raiz = raizUnica;
        if (m.torres) {
          if (!raices[pz.torre]) raices[pz.torre] = grupoTorre(pz.torre, "Torre " + pz.torre + " · proyectada · " + (pz.torre === 4 ? "6" : "2") + " apartamentos por piso · 12 pisos");
          raiz = raices[pz.torre];
        }
        const suelta = !m.torre && !m.torres; // pieza con ficha propia (planta tipo)
        const tn = planta || pz.torre;
        const g = suelta
          ? el("g", { class: (pz.t === "u" ? "planta-u" : "planta-resto") + " " + claseDe(pz), tabindex: "0", role: "button" })
          : el("g", { class: claseDe(pz) });
        if (suelta) {
          let titulo;
          if (tn) {
            const d = pz.tip && DATOS[tn][pz.tip];
            titulo = pz.t === "u"
              ? "Torre " + tn + " · Tipología " + pz.tip + ": " + d[0] + " m² · " + d[1] + " · 12 unidades · " + d[2] + " millones"
              : "Torre " + tn + " · Área común: " + COMUN[tn] + " m²";
          } else {
            titulo = pz.t === "u" ? svg.dataset.titulo : "Torres 1, 2 y 3 · Área común: 116,00 m²";
          }
          g.appendChild(el("title", {}, titulo));
        }
        prisma(g, pz.pts, m.x, P, z);

        const c = pz.rot || centro(pz.pts);
        const cx = px(m.x + c[0], c[1]), cy = py(m.x + c[0], c[1], z);
        if (llamadas && pz.tip) {
          const d = DATOS[tn][pz.tip];
          anclas.push({ tip: pz.tip, area: d[0] + " m²", valor: d[1], x: ox + cx, y: cy, lado: (m.x + c[0]) - c[1] < 120 ? "izq" : "der" });
        } else if (tn && pz.tip) {
          const d = DATOS[tn][pz.tip], angosta = ancho(pz.pts) < 90;
          texto(g, "pl-nom", cx, cy - (angosta ? 22 : 22), "Tipo " + pz.tip);
          texto(g, angosta ? "pl-area pl-s" : "pl-area", cx, cy + 6, d[0] + " m²");
          if (!angosta) texto(g, "pl-val", cx, cy + 27, d[1]);
        } else if (m.torres && pz.tip) {
          texto(g, "pl-nom", cx, cy + 4, "TIPO " + pz.tip);
        } else if (conTexto && pz.rot) {
          texto(g, "pl-nom", cx, cy - 6, "TIPOLOGÍA 1");
          texto(g, "pl-area", cx, cy + 14, "107 m²");
        }
        raiz.appendChild(g);
      });

      if (todas) {
        for (const n in m.dis.torres) {
          const e = m.dis.torres[n];
          rotulo(svg, "TORRE " + n, e.x0 + e.an / 2, 0);
        }
      }
      if (m.torre) rotulo(raizUnica, "T" + m.torre, m.x, 0);
      if (m.torres) {
        for (const n in raices) {
          const e = m.dis.torres[n];
          rotulo(raices[n], "TORRE " + n, m.x + e.x0 + e.an / 2, 0);
        }
      }
    });

    if (llamadas) {
      // El dibujo se centra y las etiquetas (placa "Tipo n" + área y valor) salen a los lados con una línea guía
      const sup = svg.dataset.superpuesto === "1"; // tarjetas del mismo tamaño encima de cada unidad
      const CW = sup ? 112 : 150, PH = sup ? 22 : 26, TH = sup ? PH + 44 : PH + 52, M = 8, hueco = 8;
      const mayor = Math.max(anclas.filter(a => a.lado === "izq").length, anclas.filter(a => a.lado === "der").length);
      const Hv = svg.dataset.superpuesto === "1" ? H : Math.max(H, mayor * TH + (mayor - 1) * hueco + 2 * M), dy = (Hv - H) / 2;
      anclas.forEach(a => { a.y += dy; });
      svg.setAttribute("viewBox", "0 0 " + VW + " " + Hv.toFixed(1));
      const dibujo = el("g", { transform: "translate(" + ox + " " + dy.toFixed(1) + ")" });
      [...svg.childNodes].forEach(n => dibujo.appendChild(n));
      svg.appendChild(dibujo);
      const fijar = lado => {
        const lista = anclas.filter(a => a.lado === lado).sort((a, b) => a.y - b.y);
        let y = M;
        lista.forEach(a => { a.cy = Math.max(y, Math.min(a.y - TH / 2, Hv - TH - M)); y = a.cy + TH + hueco; });
        if (lista.length) lista[lista.length - 1].cy = Math.min(lista[lista.length - 1].cy, Hv - TH - M);
        for (let i = lista.length - 2; i >= 0; i--) if (lista[i].cy + TH + hueco > lista[i + 1].cy) lista[i].cy = lista[i + 1].cy - TH - hueco;
        lista.forEach(a => { a.cx = lado === "izq" ? M : VW - M - CW; });
      };
      if (sup) {
        // La unidad angosta (Tipo 5 de la Torre 4) y su vecina se separan un poco para que las tarjetas no se pisen
        anclas.forEach(a => {
          const desv = a.tip === 5 ? [16, 10] : a.tip === 4 && a.lado === "izq" ? [-16, -10] : [0, 0];
          a.cx = a.x + desv[0] - CW / 2; a.cy = a.y + desv[1] - TH / 2 - 4;
        });
      } else { fijar("izq"); fijar("der"); }
      const guias = el("g", { class: "co-guias" }), cartas = el("g", { class: "co-cartas" });
      anclas.forEach(a => {
        const bx = a.lado === "izq" ? a.cx + CW : a.cx, by = a.cy + TH / 2;
        if (!sup) {
          guias.appendChild(el("line", { x1: bx, y1: by, x2: a.x.toFixed(1), y2: a.y.toFixed(1) }));
          guias.appendChild(el("circle", { cx: a.x.toFixed(1), cy: a.y.toFixed(1), r: 4 }));
        }
        const g = el("g", { class: "co-carta" });
        g.appendChild(el("rect", { class: "co-fondo", x: a.cx, y: a.cy + PH, width: CW, height: TH - PH, rx: 4 }));
        g.appendChild(el("rect", { class: "co-placa", x: a.cx, y: a.cy, width: sup ? CW : 118, height: PH, rx: 4 }));
        g.appendChild(el("text", { class: "co-tipo", x: a.cx + 10, y: a.cy + 19 }, "Tipo " + a.tip));
        g.appendChild(el("text", { class: "co-area", x: a.cx + 10, y: a.cy + PH + (sup ? 20 : 25) }, a.area));
        g.appendChild(el("text", { class: "co-valor", x: a.cx + 10, y: a.cy + PH + (sup ? 37 : 44) }, a.valor));
        cartas.appendChild(g);
      });
      svg.appendChild(guias); svg.appendChild(cartas);
    }
  }

  document.querySelectorAll("svg[data-modulos], svg[data-planta]").forEach(construir);
  document.querySelectorAll(".terreno-plano .t-implantacion").forEach(formaEnLote);

  // Bloque 4: ubicación general. Copia del esquema del lote con las torres 4 y 5 resaltadas
  const origen = document.querySelector(".terreno-plano:not(.ubic-svg) .t-implantacion");
  document.querySelectorAll(".ubic-svg").forEach(destino => {
    if (!origen) return;
    const c = origen.cloneNode(true);
    c.classList.add("ubic-lote");
    c.querySelectorAll(".iso-torre.t-torre-c").forEach(g => { g.style.opacity = "0.28"; });
    c.querySelectorAll(".nivel-vidrio").forEach(n => n.classList.remove("nivel-vidrio"));
    const t4 = c.querySelector(".iso-torre.t-torre-4");
    if (t4) t4.parentNode.insertBefore(el("polygon", { class: "ubic-marco", points: "266,256 472,256 515,205 309,205" }), t4);
    destino.appendChild(c);
  });
  // Animación en bucle del esquema del lote: los niveles de T4 y T5 pasan de cristal a sólido, de abajo hacia arriba
  document.querySelectorAll(".terreno-plano:not(.ubic-svg) .t-implantacion").forEach(svg => {
    const torres = [...svg.querySelectorAll(".iso-torre.t-torre-4, .iso-torre.t-torre-5")];
    const niveles = k => torres.flatMap(t => [...t.querySelectorAll(".nivel")].slice(k, k + 1));
    if (!torres.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.querySelectorAll(".nivel-vidrio").forEach(n => n.classList.remove("nivel-vidrio"));
      return;
    }
    const PAUSA = 5; // ticks con la torre completa antes de reiniciar
    let k = 0;
    setInterval(() => {
      if (k < NIVELES) niveles(k).forEach(n => n.classList.remove("nivel-vidrio"));
      else if (k === NIVELES + PAUSA - 1) svg.querySelectorAll(".nivel").forEach(n => n.classList.add("nivel-vidrio"));
      k = (k + 1) % (NIVELES + PAUSA);
    }, 450);
  });
})();
