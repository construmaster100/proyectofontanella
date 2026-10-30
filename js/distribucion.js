/* Bloque 6 del index: diagrama de la distribución del proyecto (planta tipo escaneada del PDF a escala gráfica 1:150).
   Datos: window.VISOR (js/visor-planos-datos.js, generado por herramientas/escaner/generar_visor.py). Estilos: css/distribucion.css. */
(function () {
  "use strict";
  const V = window.VISOR, svg = document.getElementById("distri-svg");
  if (!V || !svg) return;
  const NS = "http://www.w3.org/2000/svg", $ = id => document.getElementById(id);
  const fmt = (v, n = 1) => v.toLocaleString("es-CO", { minimumFractionDigits: n, maximumFractionDigits: n });
  const m2 = (0.0254 / V.dpi * V.esc * V.red) ** 2;                                  // m² por píxel²
  const TIP_COL = { "T1-3": "#102779", "T5": "#f39a27", "T4·1": "#3b6fd8", "T4·2": "#5aa1e6", "T4·3": "#7cc7bd", "T4·4": "#58b57b", "T4·5": "#d8c040", "T4·6": "#e07b5a", "ZC": "#9aa0b5" };
  const AMB = { alcoba: ["Alcoba", "#4a74d9"], bano: ["Baño", "#16a7b8"], ropas: ["Zona de ropas", "#8e5cd0"], cocina: ["Cocina", "#f39a27"], sala: ["Sala", "#3fa974"], otro: ["Otro", "#c3c8d6"], comun: ["Zona común", "#d5dbec"], vacio: ["Vacío (X)", "#e9e9ef"] };
  const inside = (p, x, y) => { let d = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) d = !d; return d; };
  const el = (n, a, padre) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (padre) padre.appendChild(e); return e; };

  // tipología más cercana por superficie (la tabla viene de docs/datos-proyecto.md, vía el escáner)
  const zonas = V.zon.map(z => {
    const a = z.a * m2; let b = null; for (const t of V.tipos) if (t[1] > 0 && (!b || Math.abs(t[1] - a) < Math.abs(b[1] - a))) b = t;
    const n = { a: 0, s: 0, c: 0 }; V.nom.forEach(q => { if (inside(z.p, q[0], q[1])) n[q[2]]++; });
    return { ...z, m2: a, tip: b, n };
  });
  const ambs = V.amb.map(g => ({ ...g, m2: g.r.reduce((s, q) => s + q[2] * q[3], 0) * m2 }));

  // encuadre: las dos torres
  const A = V.torres.A, B = V.torres.B, x0 = Math.min(A[0], B[0]) - 10, y0 = Math.min(A[1], B[1]) - 28, x1 = Math.max(A[0] + A[2], B[0] + B[2]) + 10, y1 = Math.max(A[1] + A[3], B[1] + B[3]) + 10;
  const hueco = Math.max(0, A[1] - (B[1] + B[3]) - 40);                           // los dos bloques se acercan: diagrama compacto
  svg.setAttribute("viewBox", [x0, y0, x1 - x0, y1 - y0 - hueco].join(" "));
  const tz = Object.fromEntries(V.zon.map(z => [z.id, z.t])), torreDe = g => tz[g.z] || (g.c[1] >= A[1] - 10 ? "A" : "B");
  let modo = "tip", elegida = null;

  function dibuja() {
    svg.textContent = "";
    const gB = el("g", {}, svg), gA = el("g", { transform: "translate(0 " + (-hueco) + ")" }, svg), grupo = t => t === "A" ? gA : gB;
    const corte = A[1] - 10, muro = f => V.mu.filter(f).map(r => `M${r[0]} ${r[1]}h${r[2]}v${r[3]}h${-r[2]}z`).join("");
    el("path", { "class": "d-muro", d: muro(r => r[1] + r[3] / 2 < corte) }, gB); el("path", { "class": "d-muro", d: muro(r => r[1] + r[3] / 2 >= corte) }, gA);
    if (modo === "amb") for (const g of ambs) {
      const [nom, col] = AMB[g.t], gr = el("g", { "class": "d-amb", fill: col }, grupo(torreDe(g)));
      el("title", {}, gr).textContent = `${nom} · ${fmt(g.m2)} m²${g.o === "e" ? " (propuesta)" : ""}`;
      for (const r of g.r) el("rect", { x: r[0], y: r[1], width: r[2], height: r[3] }, gr);
      if (g.t === "vacio") { const r = g.r[0]; el("path", { d: `M${r[0]} ${r[1]}L${r[0] + r[2]} ${r[1] + r[3]}M${r[0] + r[2]} ${r[1]}L${r[0]} ${r[1] + r[3]}`, stroke: "#555", "stroke-width": 1.5, fill: "none" }, gr); }
    }
    for (const z of zonas) {
      const col = modo === "tip" ? TIP_COL[z.tip[2]] : z.col;
      const p = el("polygon", { "class": "d-zona" + (z === elegida ? " sel" : ""), points: z.p.map(q => q.join(",")).join(" "), stroke: z.col, fill: modo === "tip" ? col : "none", "data-id": z.id }, grupo(z.t));
      if (modo === "amb") p.style.pointerEvents = "stroke";
      el("title", {}, p).textContent = `${z.tip[0]} · ${fmt(z.m2)} m² (ref. ${fmt(z.tip[1], 2)} m²)`;
      p.addEventListener("click", () => { elegida = z; info(z); dibuja(); });
      if (modo === "tip") el("text", { "class": "d-etq", x: z.c[0], y: z.c[1] + 4 }, grupo(z.t)).textContent = z.tip[2];
    }
    for (const [k, b] of Object.entries(V.torres)) el("text", { "class": "d-torre", x: b[0] + b[2] / 2, y: b[1] - 8 }, grupo(k)).textContent = "Torre " + k;
  }
  function info(z) {
    const n = [z.n.a ? z.n.a + (z.n.a > 1 ? " alcobas" : " alcoba") : "", z.n.s ? z.n.s + " sala" : "", z.n.c ? z.n.c + " cocina" : ""].filter(Boolean).join(" · ");
    const amb = ambs.filter(g => g.z === z.id), cnt = {}; amb.forEach(g => cnt[g.t] = (cnt[g.t] || 0) + 1);
    $("distri-info").innerHTML = `<b>${z.tip[0]}</b> · ${fmt(z.m2, 2)} m² (ref. ${fmt(z.tip[1], 2)} m², ${z.m2 / z.tip[1] > 1 ? "+" : ""}${fmt((z.m2 / z.tip[1] - 1) * 100)} %) · ${n || "sin nombres"} · baños ${cnt.bano || 0}, zona de ropas ${cnt.ropas || 0}`;
  }
  function leyenda() {
    const li = (col, tit, txt) => `<li><span class="sw" style="background:${col}"></span><span><b>${tit}</b>${txt}</span></li>`;
    if (modo === "tip") {
      const g = {}; zonas.forEach(z => (g[z.tip[2]] = g[z.tip[2]] || { t: z.tip, n: 0, a: 0 }, g[z.tip[2]].n++, g[z.tip[2]].a += z.m2));
      $("distri-leyenda").innerHTML = V.tipos.filter(t => g[t[2]]).map(t => li(TIP_COL[t[2]], t[0], `${g[t[2]].n} áreas · ${fmt(g[t[2]].a)} m² en total · ref. ${fmt(t[1], 2)} m²`)).join("");
    } else {
      const g = {}; ambs.forEach(a => (g[a.t] = g[a.t] || { n: 0, a: 0, p: 0 }, g[a.t].n++, g[a.t].a += a.m2, g[a.t].p += a.o === "e" ? 1 : 0));
      $("distri-leyenda").innerHTML = Object.entries(AMB).filter(([k]) => g[k]).map(([k, [nom, col]]) => li(col, nom, `${g[k].n} ambientes · ${fmt(g[k].a)} m²${g[k].p ? " · " + g[k].p + " propuestos por tamaño" : ""}`)).join("");
    }
  }
  document.querySelectorAll(".distri-barra [data-modo]").forEach(b => b.onclick = () => {
    modo = b.dataset.modo; document.querySelectorAll(".distri-barra [data-modo]").forEach(x => x.setAttribute("aria-pressed", x === b)); dibuja(); leyenda();
  });
  $("distri-info").textContent = "Toca un área del diagrama para ver su tipología, superficie y ambientes.";
  dibuja(); leyenda();
})();
