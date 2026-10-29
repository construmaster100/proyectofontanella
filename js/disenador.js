// Diseñador: área de trabajo en blanco con grilla en píxeles del tamaño de la
// pantalla y herramientas para dibujar a lápiz, poner etiquetas de texto,
// marcar formas (bandera, equis, círculo con punto y chulo), trazar polígonos
// y líneas con su medida en metros. La escala se define en una ventana que se
// abre desde el panel derecho: cada casilla de la grilla es un módulo de N
// píxeles que equivale a M metros.
// Con el imán, líneas y polígonos se unen en extremos, puntos medios e
// intersecciones de los trazos existentes. Con el puntero se seleccionan, mueven
// y editan los objetos creados. Se puede poner una imagen de fondo (de la
// galería del sitio o del computador)
// y guardar el resultado (imagen y trazos, sin la grilla) como PNG.
(function () {
  const area = document.getElementById("area");
  if (!area) return;
  const NS = "http://www.w3.org/2000/svg";
  const $ = id => document.getElementById(id);
  const svg = $("dibujo");
  const grilla = $("grilla");
  const trazos = $("trazos");
  const iman = $("iman");
  const posicion = $("area-posicion");
  const botones = document.querySelectorAll("[data-herramienta]");
  const RADIO_IMAN = 10;   // px de pantalla
  let herramienta = "lapiz";
  let imanActivo = true;
  let trazo = null;        // trazo del lápiz en curso
  let medida = null;       // línea de medida con el punto 1 puesto, esperando el punto 2
  let seleccionado = null; // objeto elegido con el puntero
  let arrastre = null;     // arrastre del puntero: { tipo: "mover", ultimo } o { tipo: "vertice", indice }
  let poligono = null;     // polígono en construcción: { g, figura, guia, puntos }

  function crear(etiqueta, atributos, padre) {
    const el = document.createElementNS(NS, etiqueta);
    for (const k in atributos) el.setAttribute(k, atributos[k]);
    if (padre) padre.appendChild(el);
    return el;
  }

  // ---- Escala: módulo de píxeles (casilla de la grilla) y los metros que equivale ----

  const ESCALA_INICIAL = { modulo: 10, metrosModulo: 1 };
  let escalaActual = { ...ESCALA_INICIAL };

  function escala() {
    return { ...escalaActual, pxPorMetro: escalaActual.modulo / escalaActual.metrosModulo };
  }

  // Lee las casillas de la ventana; los valores fuera de rango se corrigen.
  function escalaDeCasillas() {
    const modulo = Math.min(200, Math.max(4, parseFloat($("modulo").value) || ESCALA_INICIAL.modulo));
    const m = parseFloat($("metros-modulo").value);
    return { modulo, metrosModulo: m > 0 ? m : ESCALA_INICIAL.metrosModulo };
  }

  const numero = n => n.toLocaleString("es-CO", { maximumFractionDigits: 2 });
  const metros = px => numero(px / escala().pxPorMetro) + " m";

  // Grilla: una línea por módulo, más marcada cada 5 y cada 10 módulos; los
  // rótulos (en metros) van cada 10 módulos.
  function pintarGrilla() {
    const ancho = area.clientWidth;
    const alto = area.clientHeight;
    const { modulo, metrosModulo } = escala();
    svg.setAttribute("width", ancho);
    svg.setAttribute("height", alto);
    grilla.innerHTML = "";
    const clase = i => i % 10 === 0 ? "g-gruesa" : i % 5 === 0 ? "g-media" : "g-fina";
    for (let i = 0; i * modulo <= ancho; i++) {
      const x = Math.round(i * modulo) + 0.5;
      crear("line", { x1: x, y1: 0, x2: x, y2: alto, class: clase(i) }, grilla);
    }
    for (let i = 0; i * modulo <= alto; i++) {
      const y = Math.round(i * modulo) + 0.5;
      crear("line", { x1: 0, y1: y, x2: ancho, y2: y, class: clase(i) }, grilla);
    }
    for (let i = 0; i * modulo < ancho; i += 10) {
      crear("text", { x: i * modulo + 3, y: 11, class: "g-rotulo" }, grilla).textContent = numero(i * metrosModulo) + " m";
    }
    for (let i = 10; i * modulo < alto; i += 10) {
      crear("text", { x: 3, y: i * modulo - 3, class: "g-rotulo" }, grilla).textContent = numero(i * metrosModulo) + " m";
    }
    $("escala-resumen").textContent = "1 casilla = " + numero(modulo) + " px = " + numero(metrosModulo) + " m";
  }

  // Datos de la ventana, calculados con lo que hay en las casillas (aún sin aplicar).
  function previsualizarEscala() {
    const { modulo, metrosModulo } = escalaDeCasillas();
    const pxPorMetro = modulo / metrosModulo;
    $("escala-relacion").textContent = "1 m = " + numero(pxPorMetro) + " px";
    $("escala-rotulos").textContent = "cada 10 casillas = " + numero(10 * metrosModulo) + " m";
    $("escala-area").textContent = numero(area.clientWidth / pxPorMetro) + " m × " + numero(area.clientHeight / pxPorMetro) + " m";
  }

  // Aplicar: redibuja la grilla y recalcula las medidas con la escala de las casillas.
  function aplicarEscala() {
    escalaActual = escalaDeCasillas();
    $("modulo").value = escalaActual.modulo;
    $("metros-modulo").value = escalaActual.metrosModulo;
    pintarGrilla();
    trazos.querySelectorAll(".t-medida").forEach(g => {
      g.querySelector("text").textContent = metros(+g.dataset.px);
    });
    trazos.querySelectorAll(".t-poligono").forEach(rotularPoligono);
    previsualizarEscala();
  }

  const dialogoEscala = $("dialogo-escala");
  $("abrir-escala").addEventListener("click", () => {
    $("modulo").value = escalaActual.modulo;
    $("metros-modulo").value = escalaActual.metrosModulo;
    previsualizarEscala();
    dialogoEscala.showModal();
  });
  $("modulo").addEventListener("input", previsualizarEscala);
  $("metros-modulo").addEventListener("input", previsualizarEscala);
  $("escala-aplicar").addEventListener("click", aplicarEscala);
  $("escala-aceptar").addEventListener("click", () => { aplicarEscala(); dialogoEscala.close(); });
  $("escala-cancelar").addEventListener("click", () => dialogoEscala.close());
  dialogoEscala.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches("input")) { e.preventDefault(); aplicarEscala(); dialogoEscala.close(); }
  });

  function punto(e) {
    const r = svg.getBoundingClientRect();
    return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) };
  }

  const redondear = n => Math.round(n * 10) / 10;

  // ---- Imán: extremos, puntos medios e intersecciones ----

  // Segmentos de las líneas de medida y de los lados de los polígonos.
  function segmentos() {
    const lista = [];
    trazos.querySelectorAll(".t-medida").forEach(g => {
      if (g === medida || !g.dataset.x2 || editandoVertice(g)) return;
      lista.push([{ x: +g.dataset.x, y: +g.dataset.y }, { x: +g.dataset.x2, y: +g.dataset.y2 }]);
    });
    trazos.querySelectorAll(".t-poligono").forEach(g => {
      if (editandoVertice(g)) return;
      const pts = JSON.parse(g.dataset.puntos || "[]");
      const abierto = g.classList.contains("abierto");
      for (let i = 0; i < pts.length - (abierto ? 1 : 0); i++) {
        if (pts.length > 1) lista.push([pts[i], pts[(i + 1) % pts.length]]);
      }
      if (abierto && pts.length === 1) lista.push([pts[0], pts[0]]);
    });
    return lista;
  }

  function interseccion([a, b], [c, d]) {
    const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
    const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  }

  function puntosIman() {
    const segs = segmentos();
    const lista = [];
    segs.forEach(([a, b]) => {
      lista.push({ ...a, tipo: "extremo" }, { ...b, tipo: "extremo" });
      if (a.x !== b.x || a.y !== b.y) lista.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, tipo: "medio" });
    });
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        const p = interseccion(segs[i], segs[j]);
        if (p) lista.push({ ...p, tipo: "interseccion" });
      }
    }
    return lista;
  }

  // Devuelve el punto ajustado (y su tipo) si hay uno cerca; si no, el original.
  function ajustar(p) {
    const usaIman = herramienta === "medida" || herramienta === "poligono" || (arrastre && arrastre.tipo === "vertice");
    if (!imanActivo || !usaIman) return p;
    let mejor = null;
    let distancia = RADIO_IMAN;
    const prioridad = { extremo: 0, interseccion: 1, medio: 2 };
    puntosIman().forEach(q => {
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < distancia - 0.5 || (mejor && Math.abs(d - distancia) <= 0.5 && prioridad[q.tipo] < prioridad[mejor.tipo])) {
        mejor = q;
        distancia = d;
      }
    });
    return mejor ? { x: redondear(mejor.x), y: redondear(mejor.y), tipo: mejor.tipo } : p;
  }

  // Marca del imán: cuadrado en extremos, triángulo en puntos medios, equis en intersecciones.
  function marcarIman(p) {
    iman.innerHTML = "";
    if (!p.tipo) return;
    const g = crear("g", { class: "iman-" + p.tipo, transform: "translate(" + p.x + " " + p.y + ")" }, iman);
    if (p.tipo === "extremo") crear("rect", { x: -6, y: -6, width: 12, height: 12 }, g);
    if (p.tipo === "medio") crear("path", { d: "M0 -7 L7 5 L-7 5 Z" }, g);
    if (p.tipo === "interseccion") crear("path", { d: "M-6 -6 L6 6 M6 -6 L-6 6" }, g);
  }

  const NOMBRE_IMAN = { extremo: "extremo", medio: "punto medio", interseccion: "intersección" };

  // ---- Formas ----

  // Formas de unos 28 px centradas en el clic (la bandera se apoya en él).
  function forma(tipo, { x, y }) {
    const g = crear("g", { class: "t-forma", transform: "translate(" + x + " " + y + ")" });
    if (tipo === "bandera") {
      // Cada bandera se numera sola dentro de su serie (P1…P4 del lote, CT11…CT14
      // de la torre 1, etc.) con el primer número libre.
      const serie = ($("serie-bandera") || {}).value || "P";
      const usados = new Set([...document.querySelectorAll('.t-forma[data-serie="' + serie + '"]')].map(b => +b.dataset.punto));
      let n = 1;
      while (usados.has(n)) n++;
      g.dataset.serie = serie;
      g.dataset.punto = n;
      crear("line", { x1: 0, y1: 0, x2: 0, y2: -28 }, g);
      crear("path", { d: "M0 -28 L20 -22 L0 -16 Z", class: "relleno" }, g);
      crear("text", { x: 23, y: -18, class: "t-forma-rotulo" + (serie === "P" ? "" : " t-forma-ct") }, g).textContent = serie + n;
    } else if (tipo === "equis") {
      crear("path", { d: "M-10 -10 L10 10 M10 -10 L-10 10" }, g);
    } else if (tipo === "punto") {
      crear("circle", { r: 12 }, g);
      crear("circle", { r: 3, class: "relleno" }, g);
    } else if (tipo === "chulo") {
      crear("path", { d: "M-11 0 L-4 8 L12 -9" }, g);
    }
    return g;
  }

  // ---- Polígonos de las banderas: P1→P4 (lote) y CTn1→CTn4 (cada torre) ----
  // Se redibujan solos cuando se pone, mueve o borra una bandera.
  const capaSeries = $("series");
  const NOMBRE_SERIE = { P: "Lote", CT1: "Torre 1", CT2: "Torre 2", CT3: "Torre 3", CT4: "Torre 4", CT5: "Torre 5" };
  function banderasPorSerie() {
    const series = {};
    trazos.querySelectorAll(".t-forma[data-serie]").forEach(b => {
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(b.getAttribute("transform") || "");
      if (!m) return;
      (series[b.dataset.serie] = series[b.dataset.serie] || []).push({ n: +b.dataset.punto, x: +m[1], y: +m[2] });
    });
    Object.values(series).forEach(l => l.sort((a, b) => a.n - b.n));
    return series;
  }
  function actualizarPoligonos() {
    if (!capaSeries) return;
    capaSeries.innerHTML = "";
    Object.entries(banderasPorSerie()).forEach(([serie, pts]) => {
      if (pts.length < 2) return;
      const color = serie === "P" ? "#e53935" : "#ed7d31";
      const lista = pts.map(q => q.x + "," + q.y).join(" ");
      crear(pts.length >= 3 ? "polygon" : "polyline", {
        points: lista, fill: pts.length >= 3 ? color : "none", "fill-opacity": serie === "P" ? 0.08 : 0.18,
        stroke: color, "stroke-width": 3, "stroke-linejoin": "round"
      }, capaSeries);
      if (pts.length >= 3) {
        const cx = pts.reduce((a, q) => a + q.x, 0) / pts.length;
        const cy = pts.reduce((a, q) => a + q.y, 0) / pts.length;
        const t = crear("text", {
          x: cx, y: cy, "text-anchor": "middle", fill: "#fff", stroke: color, "stroke-width": 4,
          "paint-order": "stroke", "font-family": "Montserrat, sans-serif", "font-size": 15, "font-weight": 800
        }, capaSeries);
        t.textContent = NOMBRE_SERIE[serie] + " · " + serie + pts[0].n + "–" + serie + pts[pts.length - 1].n;
      }
    });
  }
  new MutationObserver(actualizarPoligonos).observe(trazos, { childList: true, subtree: true, attributes: true, attributeFilter: ["transform"] });

  // Gráfico de implantación de referencia (esquema aportado, con P1–P4) que se monta en la imagen guardada.
  function referenciaImplantacion(caja) {
    const ancho = Math.min(300, caja.width * 0.38), k = ancho / 480, alto = 400 * k;
    const x0 = caja.x + caja.width - ancho - 12, y0 = caja.y + caja.height - alto - 12;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", "translate(" + x0 + " " + y0 + ") scale(" + k + ")");
    const el = (tag, at, txt) => { const e = crear(tag, at, g); if (txt) e.textContent = txt; return e; };
    el("rect", { x: 0, y: 0, width: 480, height: 400, rx: 14, fill: "#fff", "fill-opacity": 0.92, stroke: "#0b207b", "stroke-width": 3 });
    el("polygon", { points: "200,63 470,60 296,296 178,300 100,345 18,258", fill: "#4472c4" });
    el("polygon", { points: "68,205 132,138 392,146 352,213", fill: "none", stroke: "#e53935", "stroke-width": 5 });
    [["T4", 166, 158, 72, 45, "#ffd966"], ["T5", 246, 158, 45, 45, "#f2b705"], ["T1", 89, 237, 45, 45, "#ed7d31"],
     ["T2", 143, 237, 45, 45, "#ed7d31"], ["T3", 233, 237, 45, 45, "#ed7d31"]].forEach(([n, x, y, w, h, c]) => {
      el("rect", { x, y, width: w, height: h, fill: c, stroke: "#6b3a12", "stroke-width": 1 });
      el("text", { x: x + w / 2, y: y + h / 2 + 6, "text-anchor": "middle", "font-family": "Montserrat, sans-serif", "font-size": 16, "font-weight": 700, fill: "#111" }, n);
    });
    [["P1", 30, 210], ["P2", 362, 236], ["P3", 400, 140], ["P4", 104, 116]].forEach(([n, x, y]) => {
      el("rect", { x: x - 4, y: y - 20, width: 44, height: 28, rx: 6, fill: "#fff", stroke: "#111", "stroke-width": 1.5 });
      el("text", { x: x + 18, y: y, "text-anchor": "middle", "font-family": "Montserrat, sans-serif", "font-size": 17, "font-weight": 800, fill: "#111" }, n);
    });
    el("text", { x: 20, y: 34, "font-family": "Montserrat, sans-serif", "font-size": 20, "font-weight": 800, fill: "#0b207b" }, "Implantación de referencia");
    return g;
  }

  // ---- Línea con medida: clic en el punto 1 y clic en el punto 2 ----

  function nuevaMedida(p) {
    const g = crear("g", { class: "t-medida" }, trazos);
    crear("line", { x1: p.x, y1: p.y, x2: p.x, y2: p.y }, g);
    crear("circle", { cx: p.x, cy: p.y, r: 3 }, g);
    crear("circle", { cx: p.x, cy: p.y, r: 3 }, g);
    crear("text", { "text-anchor": "middle" }, g);
    g.dataset.x = p.x;
    g.dataset.y = p.y;
    return g;
  }

  function estirarMedida(g, p) {
    const x1 = +g.dataset.x, y1 = +g.dataset.y;
    const linea = g.querySelector("line");
    linea.setAttribute("x2", p.x);
    linea.setAttribute("y2", p.y);
    const fin = g.querySelectorAll("circle")[1];
    fin.setAttribute("cx", p.x);
    fin.setAttribute("cy", p.y);
    g.dataset.x2 = p.x;
    g.dataset.y2 = p.y;
    g.dataset.px = Math.hypot(p.x - x1, p.y - y1);
    const texto = g.querySelector("text");
    texto.setAttribute("x", (x1 + p.x) / 2);
    texto.setAttribute("y", (y1 + p.y) / 2 - 8);
    texto.textContent = metros(+g.dataset.px);
  }

  function colocarMedida(g, p1, p2) {
    g.dataset.x = p1.x;
    g.dataset.y = p1.y;
    const linea = g.querySelector("line");
    linea.setAttribute("x1", p1.x);
    linea.setAttribute("y1", p1.y);
    const inicio = g.querySelectorAll("circle")[0];
    inicio.setAttribute("cx", p1.x);
    inicio.setAttribute("cy", p1.y);
    estirarMedida(g, p2);
  }

  function cancelarMedida() {
    if (medida) medida.remove();
    medida = null;
    cuadro.hidden = true;
  }

  // Cuadro de coordenadas que sigue al cursor: punto 1, punto 2, Δx, Δy y distancia.
  const cuadro = $("cuadro-coordenadas");

  function filaCuadro(nombre, valor, detalle) {
    const fila = document.createElement("div");
    const n = document.createElement("span");
    n.textContent = nombre;
    const v = document.createElement("strong");
    v.textContent = valor;
    fila.append(n, v);
    if (detalle) {
      const d = document.createElement("small");
      d.textContent = detalle;
      fila.appendChild(d);
    }
    return fila;
  }

  const coordenada = q => "x " + metros(q.x) + " · y " + metros(q.y);
  const enPx = q => q.x + " · " + q.y + " px";

  function actualizarCuadro(p) {
    if (herramienta !== "medida" && herramienta !== "poligono") { cuadro.hidden = true; return; }
    cuadro.innerHTML = "";
    if (herramienta === "poligono") {
      cuadroPoligono(p);
    } else if (!medida) {
      cuadro.appendChild(filaCuadro("Punto 1", coordenada(p), enPx(p)));
    } else {
      const p1 = { x: +medida.dataset.x, y: +medida.dataset.y };
      const dx = Math.abs(p.x - p1.x), dy = Math.abs(p.y - p1.y);
      cuadro.appendChild(filaCuadro("Punto 1", coordenada(p1), enPx(p1)));
      cuadro.appendChild(filaCuadro("Punto 2", coordenada(p), enPx(p)));
      cuadro.appendChild(filaCuadro("Δx · Δy", metros(dx) + " · " + metros(dy)));
      cuadro.appendChild(filaCuadro("Distancia", metros(Math.hypot(dx, dy)), numero(Math.hypot(dx, dy)) + " px"));
    }
    cuadro.hidden = false;
    // Junto al cursor, del lado donde quepa dentro del área.
    const x = p.x + 18 + cuadro.offsetWidth > area.clientWidth ? p.x - 18 - cuadro.offsetWidth : p.x + 18;
    const y = p.y + 18 + cuadro.offsetHeight > area.clientHeight ? p.y - 18 - cuadro.offsetHeight : p.y + 18;
    cuadro.style.left = Math.max(4, x) + "px";
    cuadro.style.top = Math.max(4, y) + "px";
  }

  // Polígono: último vértice, punto actual, Δx · Δy, lado en curso y perímetro.
  function cuadroPoligono(p) {
    if (!poligono) {
      cuadro.appendChild(filaCuadro("Vértice 1", coordenada(p), enPx(p)));
      return;
    }
    const pts = poligono.puntos;
    const ultimo = pts[pts.length - 1];
    const dx = Math.abs(p.x - ultimo.x), dy = Math.abs(p.y - ultimo.y);
    const lado = Math.hypot(dx, dy);
    let perimetro = lado;
    for (let i = 1; i < pts.length; i++) perimetro += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cuadro.appendChild(filaCuadro("Vértice " + pts.length, coordenada(ultimo), enPx(ultimo)));
    cuadro.appendChild(filaCuadro("Vértice " + (pts.length + 1), coordenada(p), enPx(p)));
    cuadro.appendChild(filaCuadro("Δx · Δy", metros(dx) + " · " + metros(dy)));
    cuadro.appendChild(filaCuadro("Lado", metros(lado), numero(lado) + " px"));
    cuadro.appendChild(filaCuadro("Perímetro", metros(perimetro)));
  }

  // ---- Polígono: como la línea, un clic por vértice; cada lado lleva su medida.
  // Se cierra con doble clic, Enter o clic en el primer vértice. ----

  function actualizarPoligono() {
    const { g, figura, puntos } = poligono;
    figura.setAttribute("points", puntos.map(q => q.x + "," + q.y).join(" "));
    g.dataset.puntos = JSON.stringify(puntos);
    rotularPoligono(g);
  }

  // Medida en metros de cada lado, en su punto medio.
  function rotularPoligono(g) {
    const pts = JSON.parse(g.dataset.puntos || "[]");
    const cerrado = !g.classList.contains("abierto");
    g.querySelectorAll(".lado").forEach(t => t.remove());
    const lados = cerrado ? pts.length : pts.length - 1;
    for (let i = 0; i < lados; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const t = crear("text", { class: "lado", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 6, "text-anchor": "middle" }, g);
      t.textContent = metros(Math.hypot(b.x - a.x, b.y - a.y));
    }
  }

  function sumarVertice(p) {
    if (!poligono) {
      const g = crear("g", { class: "t-poligono abierto" }, trazos);
      poligono = {
        g,
        figura: crear("polygon", {}, g),
        guia: crear("line", {}, g),
        guiaTexto: crear("text", { class: "guia-texto", "text-anchor": "middle" }, g),
        puntos: []
      };
    }
    const primero = poligono.puntos[0];
    if (primero && poligono.puntos.length >= 3 && Math.hypot(p.x - primero.x, p.y - primero.y) < RADIO_IMAN) {
      cerrarPoligono();
      return;
    }
    poligono.puntos.push({ x: p.x, y: p.y });
    crear("circle", { cx: p.x, cy: p.y, r: 3.5 }, poligono.g);
    actualizarPoligono();
  }

  function cerrarPoligono() {
    if (!poligono) return;
    const { g, guia, guiaTexto, puntos } = poligono;
    poligono = null;
    if (puntos.length < 3) { g.remove(); return; }
    guia.remove();
    guiaTexto.remove();
    g.querySelectorAll("circle").forEach(c => c.remove());
    g.classList.remove("abierto");
    rotularPoligono(g);
  }

  function cancelarPoligono() {
    if (poligono) poligono.g.remove();
    poligono = null;
  }

  // ---- Etiqueta: punto de anclaje y el texto en un recuadro a su derecha ----

  function etiqueta(texto, { x, y }) {
    const g = crear("g", { class: "t-etiqueta", transform: "translate(" + x + " " + y + ")" }, trazos);
    crear("rect", { rx: 6 }, g);
    crear("text", { x: 16, y: 0, "dominant-baseline": "central" }, g);
    crear("circle", { r: 4 }, g);
    textoEtiqueta(g, texto);
  }

  // Cambia el texto y ajusta el recuadro a su tamaño.
  function textoEtiqueta(g, texto) {
    const t = g.querySelector("text");
    t.textContent = texto;
    const caja = t.getBBox();
    const fondo = g.querySelector("rect");
    fondo.setAttribute("x", caja.x - 8);
    fondo.setAttribute("y", caja.y - 4);
    fondo.setAttribute("width", caja.width + 16);
    fondo.setAttribute("height", caja.height + 8);
  }

  function pedirTexto(p, inicial, listo) {
    const entrada = document.createElement("input");
    entrada.className = "area-entrada";
    entrada.placeholder = "Texto de la etiqueta";
    entrada.value = inicial;
    entrada.style.left = p.x + "px";
    entrada.style.top = p.y + "px";
    area.appendChild(entrada);
    entrada.focus();
    let hecho = false;
    const poner = () => {
      if (hecho) return;
      hecho = true;
      const texto = entrada.value.trim();
      entrada.remove();
      if (texto) listo(texto);
    };
    entrada.addEventListener("keydown", e => {
      if (e.key === "Enter") poner();
      if (e.key === "Escape") { entrada.value = ""; poner(); }
    });
    entrada.addEventListener("blur", poner);
  }

  // ---- Puntero: seleccionar, mover y editar los objetos creados ----

  const capaSeleccion = $("seleccion");

  function editandoVertice(g) {
    return arrastre && arrastre.tipo === "vertice" && g === seleccionado;
  }

  function distanciaSegmento(p, a, b) {
    const largo = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    const t = largo ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / largo)) : 0;
    return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
  }

  // Objeto bajo el punto: el de más arriba. Las líneas de medida se prueban por
  // su trazo; el resto, por el rectángulo que las contiene (con 6 px de holgura).
  function objetoEn(p) {
    const r = svg.getBoundingClientRect();
    for (const el of [...trazos.children].reverse()) {
      if (el.classList.contains("t-medida")) {
        const [a, b] = vertices(el);
        if (distanciaSegmento(p, a, b) <= 6) return el;
        continue;
      }
      const c = el.getBoundingClientRect();
      if (p.x >= c.left - r.left - 6 && p.x <= c.right - r.left + 6 && p.y >= c.top - r.top - 6 && p.y <= c.bottom - r.top + 6) return el;
    }
    return null;
  }

  // Vértices editables: los dos puntos de una línea de medida o los de un polígono.
  function vertices(el) {
    if (el.classList.contains("t-medida")) {
      return [{ x: +el.dataset.x, y: +el.dataset.y }, { x: +el.dataset.x2, y: +el.dataset.y2 }];
    }
    if (el.classList.contains("t-poligono")) return JSON.parse(el.dataset.puntos || "[]");
    return [];
  }

  function fijarVertices(el, pts) {
    if (el.classList.contains("t-medida")) {
      colocarMedida(el, pts[0], pts[1]);
    } else {
      el.dataset.puntos = JSON.stringify(pts);
      el.querySelector("polygon").setAttribute("points", pts.map(q => q.x + "," + q.y).join(" "));
      rotularPoligono(el);
    }
  }

  function mover(el, dx, dy) {
    if (el.classList.contains("t-medida") || el.classList.contains("t-poligono")) {
      fijarVertices(el, vertices(el).map(q => ({ x: q.x + dx, y: q.y + dy })));
    } else if (el.classList.contains("t-lapiz")) {
      el.setAttribute("d", el.getAttribute("d").replace(/(-?[\d.]+) (-?[\d.]+)/g, (m, x, y) => (+x + dx) + " " + (+y + dy)));
    } else {
      const [, x, y] = el.getAttribute("transform").match(/translate\(([-\d.]+) ([-\d.]+)\)/);
      el.setAttribute("transform", "translate(" + (+x + dx) + " " + (+y + dy) + ")");
    }
  }

  // Marco punteado alrededor del objeto y asas en sus vértices.
  function marcarSeleccion() {
    capaSeleccion.innerHTML = "";
    if (!seleccionado) return;
    const r = svg.getBoundingClientRect();
    const c = seleccionado.getBoundingClientRect();
    crear("rect", { class: "sel-marco", x: c.left - r.left - 5, y: c.top - r.top - 5, width: c.width + 10, height: c.height + 10 }, capaSeleccion);
    vertices(seleccionado).forEach((q, i) => crear("circle", { class: "asa", cx: q.x, cy: q.y, r: 5, "data-indice": i }, capaSeleccion));
  }

  function seleccionar(el) {
    seleccionado = el;
    marcarSeleccion();
  }

  function eliminarSeleccionado() {
    if (!seleccionado) return;
    seleccionado.remove();
    seleccionar(null);
  }

  // ---- Eventos del área ----

  svg.addEventListener("pointerdown", e => {
    if (herramienta === "puntero") {
      const q = punto(e);
      const asa = e.target.closest(".asa");
      if (asa && seleccionado) {
        arrastre = { tipo: "vertice", indice: +asa.dataset.indice };
      } else {
        seleccionar(objetoEn(q));
        arrastre = seleccionado ? { tipo: "mover", ultimo: q } : null;
      }
      if (arrastre) svg.setPointerCapture(e.pointerId);
      return;
    }
    const p = ajustar(punto(e));
    if (herramienta === "lapiz") {
      trazo = crear("path", { d: "M" + p.x + " " + p.y, class: "t-lapiz" }, trazos);
      svg.setPointerCapture(e.pointerId);
    } else if (herramienta === "medida") {
      if (!medida) {
        medida = nuevaMedida(p);
      } else {
        estirarMedida(medida, p);
        if (+medida.dataset.px < 1) return;   // el punto 2 no puede ser el mismo punto 1
        medida = null;
      }
      actualizarCuadro(p);
    } else if (herramienta === "poligono") {
      sumarVertice(p);
      actualizarCuadro(p);
    } else if (herramienta === "texto") {
      e.preventDefault();   // que el foco quede en el campo de texto
      pedirTexto(p, "", texto => etiqueta(texto, p));
    } else {
      trazos.appendChild(forma(herramienta, p));
    }
  });

  svg.addEventListener("pointermove", e => {
    const p = ajustar(punto(e));
    marcarIman(p);
    posicion.textContent = "x " + p.x + " · y " + p.y + " px (" + metros(p.x) + " · " + metros(p.y) + ")" +
      (p.tipo ? " · " + NOMBRE_IMAN[p.tipo] : "");
    if (medida) estirarMedida(medida, p);
    if (trazo) trazo.setAttribute("d", trazo.getAttribute("d") + " L" + p.x + " " + p.y);
    if (herramienta === "puntero") {
      const q = punto(e);
      if (arrastre && arrastre.tipo === "mover") {
        mover(seleccionado, q.x - arrastre.ultimo.x, q.y - arrastre.ultimo.y);
        arrastre.ultimo = q;
        marcarSeleccion();
      } else if (arrastre) {
        const pts = vertices(seleccionado);
        pts[arrastre.indice] = { x: p.x, y: p.y };
        fijarVertices(seleccionado, pts);
        marcarSeleccion();
      }
      svg.style.cursor = arrastre ? "grabbing" : e.target.closest(".asa") ? "grab" : objetoEn(q) ? "move" : "default";
    }
    actualizarCuadro(p);
    if (poligono) {
      const ultimo = poligono.puntos[poligono.puntos.length - 1];
      poligono.guia.setAttribute("x1", ultimo.x);
      poligono.guia.setAttribute("y1", ultimo.y);
      poligono.guia.setAttribute("x2", p.x);
      poligono.guia.setAttribute("y2", p.y);
      const lado = Math.hypot(p.x - ultimo.x, p.y - ultimo.y);
      poligono.guiaTexto.setAttribute("x", (ultimo.x + p.x) / 2);
      poligono.guiaTexto.setAttribute("y", (ultimo.y + p.y) / 2 - 6);
      poligono.guiaTexto.textContent = lado >= 1 ? metros(lado) : "";
    }
  });

  svg.addEventListener("pointerup", () => {
    trazo = null;
    arrastre = null;
  });

  svg.addEventListener("pointerleave", () => {
    if (trazo || medida || poligono) return;
    posicion.textContent = "";
    iman.innerHTML = "";
    cuadro.hidden = true;
  });

  svg.addEventListener("dblclick", () => {
    // Puntero: doble clic en una etiqueta para cambiar su texto.
    if (herramienta === "puntero" && seleccionado && seleccionado.classList.contains("t-etiqueta")) {
      const g = seleccionado;
      const [, x, y] = g.getAttribute("transform").match(/translate\(([-\d.]+) ([-\d.]+)\)/);
      pedirTexto({ x: +x, y: +y }, g.querySelector("text").textContent, texto => {
        textoEtiqueta(g, texto);
        marcarSeleccion();
      });
      return;
    }
    // El doble clic ya sumó dos vértices iguales: se quita el repetido y se cierra.
    if (!poligono) return;
    const pts = poligono.puntos;
    const [a, b] = pts.slice(-2);
    if (a && b && Math.hypot(a.x - b.x, a.y - b.y) < 4) {
      pts.pop();
      const vertices = poligono.g.querySelectorAll("circle");
      vertices[vertices.length - 1].remove();
      actualizarPoligono();
    }
    cerrarPoligono();
  });

  // ---- Barra de herramientas ----

  function activarHerramienta(b) {
    cerrarPoligono();
    cancelarMedida();
    seleccionar(null);
    svg.style.cursor = "";
    herramienta = b.dataset.herramienta;
    botones.forEach(x => {
      x.classList.toggle("activo", x === b);
      x.setAttribute("aria-pressed", x === b);
    });
    area.classList.toggle("modo-texto", herramienta === "texto");
  }
  botones.forEach(b => b.addEventListener("click", () => activarHerramienta(b)));

  // Formas: un solo botón. Al pulsarlo se activa la forma vigente y se abre su
  // menú; la forma elegida queda activa y su icono pasa al botón.
  const botonFormas = $("boton-formas");
  const menuFormas = $("menu-formas");

  function menuFormasAbierto(abrir) {
    menuFormas.hidden = !abrir;
    botonFormas.setAttribute("aria-expanded", abrir);
    if (abrir) {
      // Fijo junto al botón, para que no lo recorte el desplazamiento de la barra.
      const c = botonFormas.getBoundingClientRect();
      menuFormas.style.left = c.right + 6 + "px";
      menuFormas.style.top = Math.min(c.top, innerHeight - menuFormas.offsetHeight - 8) + "px";
    }
  }

  botonFormas.addEventListener("click", () => menuFormasAbierto(menuFormas.hidden));
  menuFormas.querySelectorAll("[data-forma]").forEach(opcion => opcion.addEventListener("click", () => {
    botonFormas.dataset.herramienta = opcion.dataset.forma;
    botonFormas.querySelector("svg").replaceWith(opcion.querySelector("svg").cloneNode(true));
    botonFormas.title = "Formas: " + opcion.textContent.trim();
    menuFormas.querySelectorAll("[data-forma]").forEach(x => x.setAttribute("aria-checked", x === opcion));
    menuFormasAbierto(false);
    activarHerramienta(botonFormas);
  }));
  document.addEventListener("pointerdown", e => {
    if (!menuFormas.hidden && !e.target.closest(".herramienta-grupo")) menuFormasAbierto(false);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !menuFormas.hidden) menuFormasAbierto(false);
  });

  $("iman-activo").addEventListener("click", e => {
    imanActivo = !imanActivo;
    e.currentTarget.classList.toggle("activo", imanActivo);
    e.currentTarget.setAttribute("aria-pressed", imanActivo);
    iman.innerHTML = "";
  });

  function deshacer() {
    if (poligono) cancelarPoligono();
    else if (medida) cancelarMedida();
    else if (trazos.lastElementChild) {
      if (trazos.lastElementChild === seleccionado) seleccionar(null);
      trazos.lastElementChild.remove();
    }
  }
  $("deshacer").addEventListener("click", deshacer);
  $("deshacer-panel").addEventListener("click", deshacer);
  $("limpiar").addEventListener("click", () => {
    if (trazos.childElementCount && confirm("¿Borrar todo lo dibujado?")) {
      poligono = null;
      cancelarMedida();
      seleccionar(null);
      trazos.innerHTML = "";
    }
  });
  document.addEventListener("keydown", e => {
    if (poligono && e.key === "Enter") cerrarPoligono();
    if (poligono && e.key === "Escape") cancelarPoligono();
    if (medida && e.key === "Escape") cancelarMedida();
    if (seleccionado && !e.target.matches("input, textarea")) {
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); eliminarSeleccionado(); }
      if (e.key === "Escape") seleccionar(null);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.target.matches("input, textarea")) {
      e.preventDefault();
      deshacer();
    }
  });

  // ---- Imagen: seleccionar una de fondo y guardar el resultado ----

  const fondo = $("imagen-fondo");
  let cajaImagen = null;   // posición y tamaño de la imagen en el área
  let nombreImagen = "";
  let fondoGuardable = true;   // false si el navegador no deja copiar la imagen (sitio abierto como archivo)

  // Pone la imagen de fondo, ajustada al área sin agrandarla ni deformarla,
  // desde la esquina superior izquierda.
  function ponerImagen(src, nombre, rotulo) {
    const img = new Image();
    img.onload = () => {
      const factor = Math.min(1, area.clientWidth / img.naturalWidth, area.clientHeight / img.naturalHeight);
      cajaImagen = { x: 0, y: 0, width: Math.round(img.naturalWidth * factor), height: Math.round(img.naturalHeight * factor) };
      for (const k in cajaImagen) fondo.setAttribute(k, cajaImagen[k]);
      // Para guardar el PNG la imagen debe ir incrustada (data:); se copia con un lienzo.
      let incrustada = src;
      if (!src.startsWith("data:")) {
        try {
          const lienzo = document.createElement("canvas");
          lienzo.width = img.naturalWidth;
          lienzo.height = img.naturalHeight;
          lienzo.getContext("2d").drawImage(img, 0, 0);
          incrustada = lienzo.toDataURL("image/jpeg", 0.92);
        } catch (err) {
          incrustada = null;
        }
      }
      fondoGuardable = !!incrustada;
      fondo.setAttribute("href", incrustada || src);
      nombreImagen = nombre;
      $("imagen-info").textContent = rotulo + " · " + img.naturalWidth + " × " + img.naturalHeight + " px" +
        (factor < 1 ? " (mostrada al " + Math.round(factor * 100) + " %)" : "");
    };
    img.src = src;
  }

  // Ventana para elegir: miniaturas de la galería o un archivo del computador.
  const dialogoImagenes = $("dialogo-imagenes");
  const selector = $("selector-imagenes");
  // Galería y vistas aéreas del drone (las mismas del Explorador).
  const grupos = [["Galería", window.GALERIA], ["Vistas aéreas · Explorador", window.DRONE]];
  grupos.forEach(([titulo, fotos]) => {
    const h = document.createElement("p");
    h.className = "selector-grupo";
    h.textContent = titulo;
    selector.appendChild(h);
    fotos.forEach(foto => agregarMiniatura(foto));
  });
  function agregarMiniatura(foto) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "selector-imagen";
    b.title = foto.titulo;
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = window.Fontanella.ruta(foto.id);
    img.alt = foto.titulo;
    const id = document.createElement("span");
    id.textContent = foto.id;
    b.append(img, id);
    b.addEventListener("click", () => {
      ponerImagen(window.Fontanella.ruta(foto.id), foto.id, foto.id + " · " + foto.titulo);
      dialogoImagenes.close();
    });
    selector.appendChild(b);
  }
  $("abrir-imagenes").addEventListener("click", () => dialogoImagenes.showModal());
  $("imagenes-cancelar").addEventListener("click", () => dialogoImagenes.close());

  $("seleccionar-imagen").addEventListener("change", e => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => ponerImagen(lector.result, archivo.name.replace(/\.[^.]+$/, ""), archivo.name);
    lector.readAsDataURL(archivo);
    e.target.value = "";
    dialogoImagenes.close();
  });

  // Los estilos de los trazos vienen de la hoja CSS: se copian en línea para
  // que viajen con el SVG al convertirlo en PNG.
  const ESTILOS = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
    "stroke-dasharray", "shape-rendering", "paint-order", "font-family", "font-size", "font-weight",
    "dominant-baseline", "text-anchor"];

  $("guardar-imagen").addEventListener("click", () => {
    if (!fondoGuardable) {
      alert("El navegador no permite guardar imágenes de la galería cuando el sitio se abre como archivo. " +
        "Ábrelo desde el hosting o un servidor local, o elige la imagen con «Desde mi computador».");
      return;
    }
    const caja = cajaImagen || { x: 0, y: 0, width: area.clientWidth, height: area.clientHeight };
    const escalaPng = 2;   // el doble de resolución que en pantalla
    const copia = svg.cloneNode(true);
    copia.querySelector("#grilla").remove();
    copia.querySelector("#iman").remove();
    copia.querySelector("#seleccion").remove();
    const originales = trazos.querySelectorAll("*");
    copia.querySelectorAll("#trazos *").forEach((el, i) => {
      const cs = getComputedStyle(originales[i]);
      el.setAttribute("style", ESTILOS.map(k => k + ":" + cs.getPropertyValue(k)).join(";"));
    });
    copia.setAttribute("xmlns", NS);
    copia.setAttribute("viewBox", [caja.x, caja.y, caja.width, caja.height].join(" "));
    copia.setAttribute("width", caja.width * escalaPng);
    copia.setAttribute("height", caja.height * escalaPng);

    const img = new Image();
    img.onload = () => {
      const lienzo = document.createElement("canvas");
      lienzo.width = caja.width * escalaPng;
      lienzo.height = caja.height * escalaPng;
      const ctx = lienzo.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.drawImage(img, 0, 0);
      lienzo.toBlob(blob => {
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = (nombreImagen || "disenador") + "-editada.png";
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copia));
  });

  // ---- Nuevo proyecto: área en blanco, sin imagen y con la escala inicial ----

  $("nuevo-proyecto").addEventListener("click", () => {
    const hayTrabajo = trazos.childElementCount || cajaImagen || poligono || medida;
    if (hayTrabajo && !confirm("¿Empezar un proyecto nuevo? Se borrará lo dibujado y la imagen de fondo.")) return;
    cerrarPoligono();
    cancelarMedida();
    seleccionar(null);
    trazos.innerHTML = "";
    fondo.removeAttribute("href");
    ["x", "y", "width", "height"].forEach(k => fondo.removeAttribute(k));
    cajaImagen = null;
    nombreImagen = "";
    fondoGuardable = true;
    $("imagen-info").textContent = "";
    $("modulo").value = ESCALA_INICIAL.modulo;
    $("metros-modulo").value = ESCALA_INICIAL.metrosModulo;
    aplicarEscala();
  });

  if (window.ResizeObserver) new ResizeObserver(pintarGrilla).observe(area);
  pintarGrilla();
})();
