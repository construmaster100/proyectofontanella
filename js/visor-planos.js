/* Visor de planos: representación gráfica (canvas) de lo que escanea herramientas/escaner/generar_visor.py.
   Datos: window.VISOR (js/visor-planos-datos.js). Estilos: css/visor-planos.css. Páginas: pages/Fontanella · Planta tipo en 2D.html */
(function () {
  "use strict";
  const SCAN = window.VISOR, $ = id => document.getElementById(id) || document.createElement("div");   // controles que la página no muestra: quedan sueltos
  if (!SCAN || !$("c")) return;
  const canvas = $("c"), stage = $("stage"), ctx = canvas.getContext("2d"), info = $("info");
  const imgCom = SCAN.comunes_img ? new Image() : null;   // zonas comunes y escaleras con el dibujo original del plano
  if (imgCom) { imgCom.onload = () => draw(); imgCom.src = SCAN.comunes_img; }
  const [W, H] = SCAN.size, ESC = SCAN.esc, st = { scale: ESC };                   // escala gráfica 1:S del PDF a tamaño real
  const mpp = () => 0.0254 / SCAN.dpi * st.scale * SCAN.red;                        // metros reales por píxel
  const NIV = [.125, .25, .5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32];                    // píxeles de pantalla por píxel del plano: enteros, así cada píxel es un bloque nítido
  const TIPOS = SCAN.tipos;                                                          // [nombre, m² de referencia, código corto]
  const NOM = { a: "Alcoba", s: "Sala", c: "Cocina" };
  const AMB = { alcoba: ["Alcoba", "#4a74d9"], bano: ["Baño", "#16a7b8"], ropas: ["Zona de ropas", "#8e5cd0"], cocina: ["Cocina", "#f39a27"], sala: ["Sala", "#3fa974"], otro: ["Otro", "#a9afc0"], comun: ["Zona común", "#c9d0e6"], vacio: ["Vacío (X)", "#ececf1"] };
  const COL_T = { "T1-3": "#7a7f8c", "T4·1": "#3b6fb6", "T4·2": "#d0453a", "T4·3": "#8a5cc2", "T4·4": "#e08a1e", "T4·5": "#2a9d8f", "T4·6": "#b8961a", "T5": "#3f9a4a", "ZC": "#9aa3b5" };
  const colT = zz => COL_T[tipDe(zz).corto] || zz.col;                              // un color sólido por tipología
  const rotT = tp => { const m = /·(\d+)$/.exec(tp.corto); return "Tipo " + (m ? m[1] : tp.corto); };   // T4·1 → «Tipo 1»
  const ARCHIVOS_TEX_AMB = {
    alcoba: "textura_alcoba_lite.jpg", bano: "textura_bano_lite.jpg",
    ropas: "textura_ropas_lite.jpg", cocina: "textura_cocina_lite.jpg",
    sala: "textura_sala_lite.jpg", otro: "textura_otro_lite.jpg"
  };
  const CLAVE = "visor-planos.areas.v1", CLAVE_A = "visor-planos.ambientes.v1";
  let ETQ = {}, TA = {};
  try { ETQ = JSON.parse(localStorage.getItem(CLAVE) || "{}"); TA = JSON.parse(localStorage.getItem(CLAVE_A) || "{}"); } catch (_) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(ETQ)); localStorage.setItem(CLAVE_A, JSON.stringify(TA)); } catch (_) {} };
  const show = { mu: true, zon: true, amb: true, nom: true, grid: false, nod: true };
  let V = { x: 0, y: 0, k: 1 }, dpr = 1, bgc = "#ffffff", sel = null, tool = "nav", meds = [], tmp = null, cur = null, down = null, drag = null, pinch = 0, acc = 0, rmed = [], rvivo = null, cel = 50, modo = "tip";
  const pts = new Map();
  let pend = false;   // varios cambios seguidos (arrastre, rueda) se pintan una sola vez por fotograma
  const draw = () => { if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; pintar(); }); } };
  const texAmb = {};
  const colaTexturas = Object.entries(ARCHIVOS_TEX_AMB);
  let indiceTextura = 0;
  const cargarTextura = () => {
    if (indiceTextura >= colaTexturas.length) { draw(); return; }
    const [tipo, archivo] = colaTexturas[indiceTextura];
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const tile = document.createElement("canvas");
      tile.width = tipo === "alcoba" ? 32 : 64;
      tile.height = tipo === "alcoba" ? 96 : 64;
      const tileCtx = tile.getContext("2d");
      tileCtx.imageSmoothingEnabled = true;
      tileCtx.drawImage(img, 0, 0, tile.width, tile.height);
      texAmb[tipo] = ctx.createPattern(tile, "repeat");
      indiceTextura++;
      setTimeout(cargarTextura, 0);
    };
    img.onerror = () => { indiceTextura++; setTimeout(cargarTextura, 0); };
    img.src = encodeURI("texturas y mobiliario/" + archivo);
  };
  setTimeout(cargarTextura, 0);
  const fmt = (v, n = 1) => v.toLocaleString("es-CO", { minimumFractionDigits: n, maximumFractionDigits: n });
  const inside = (p, x, y) => { let d = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) d = !d; return d; };
  const enR = (r, x, y) => x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3];
  function path(p) { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); }

  /* ---------- datos escaneados ---------- */
  const zon = SCAN.zon.map(z => { const n = { a: 0, s: 0, c: 0 }; SCAN.nom.forEach(q => { if (inside(z.p, q[0], q[1])) n[q[2]]++; }); const xs = z.p.map(q => q[0]), ys = z.p.map(q => q[1]); return { ...z, kind: "zon", n, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }; });
  const zonPorId = Object.fromEntries(zon.map(z => [z.id, z]));
  const amb = SCAN.amb.map(g => { const r = g.r; return { ...g, kind: "amb", a: r.reduce((s, q) => s + q[2] * q[3], 0), x0: Math.min(...r.map(q => q[0])), y0: Math.min(...r.map(q => q[1])), x1: Math.max(...r.map(q => q[0] + q[2])), y1: Math.max(...r.map(q => q[1] + q[3])) }; });
  const tipoAmb = g => TA[g.id] || g.t;
  // nodos de los muros: extremos y cruces de los ejes; sirven de imán al medir (la distancia entre dos nodos sale en píxeles y metros)
  const NOD = SCAN.nod || [], HN = new Map(); NOD.forEach((n, i) => { const k = Math.floor(n[0] / 32) + "," + Math.floor(n[1] / 32); if (!HN.has(k)) HN.set(k, []); HN.get(k).push(i); });
  const nodoCerca = (x, y, r) => { let b = null, d = Math.min(r, 32); const cx = Math.floor(x / 32), cy = Math.floor(y / 32); for (let i = cx - 1; i <= cx + 1; i++) for (let j = cy - 1; j <= cy + 1; j++) for (const k of HN.get(i + "," + j) || []) { const m = Math.hypot(NOD[k][0] - x, NOD[k][1] - y); if (m < d) { d = m; b = NOD[k]; } } return b; };
  const imanN = p => (show.nod && nodoCerca(p[0], p[1], 10 / V.k)) || p;
  // máscara de muros a píxel completo: sirve para medir entre muros
  const WM = new Uint8Array(W * H); for (const r of SCAN.mu) for (let y = r[1]; y < r[1] + r[3]; y++) WM.fill(1, y * W + r[0], y * W + r[0] + r[2]);
  const rayo = (x, y, dx, dy) => { let n = 0, cx = x, cy = y; while (n < 3000) { cx += dx; cy += dy; if (cx < 0 || cy < 0 || cx >= W || cy >= H || WM[cy * W + cx]) break; n++; } return [n, cx - dx, cy - dy]; };   // [píxeles libres, último píxel libre]
  const entreMuros = (x, y) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H || WM[y * W + x]) return null;
    const l = rayo(x, y, -1, 0), r = rayo(x, y, 1, 0), u = rayo(x, y, 0, -1), d = rayo(x, y, 0, 1); return { x, y, l, r, u, d, h: l[0] + r[0] + 1, v: u[0] + d[0] + 1 }; };
  // grilla de precisión alfanumérica: columnas en letras (A, B… AA), filas en números, desde la esquina superior izquierda
  const letras = i => { let t = ""; i++; while (i > 0) { const m = (i - 1) % 26; t = String.fromCharCode(65 + m) + t; i = Math.floor((i - 1) / 26); } return t; };
  const celda = (x, y) => letras(Math.floor(x / cel)) + (Math.floor(y / cel) + 1);
  const ubic = o => celda(o.x0, o.y0) + " – " + celda(o.x1 - 1, o.y1 - 1);
  // tipología de un área: la asignada por el usuario o, si no, la más cercana por superficie
  const tipCerca = zz => { const m = zz.a * mpp() * mpp(); let b = null; for (const t of TIPOS) if (t[1] > 0 && (!b || Math.abs(t[1] - m) < Math.abs(b[1] - m))) b = t; return b; };
  const tipDe = zz => { const e = ETQ[zz.id] || {}, t = e.t ? TIPOS.find(x => x[0] === e.t) : null, m = zz.a * mpp() * mpp(), b = t || tipCerca(zz); return { nombre: b[0], ref: b[1], corto: b[2], asignada: !!t, dif: b[1] ? (m / b[1] - 1) * 100 : 0 }; };
  const cuenta = n => [n.a ? n.a + (n.a > 1 ? " alcobas" : " alcoba") : "", n.s ? n.s + " sala" + (n.s > 1 ? "s" : "") : "", n.c ? n.c + (n.c > 1 ? " cocinas" : " cocina") : ""].filter(Boolean).join(" · ") || "—";

  /* ---------- dibujo ---------- */
  function txt(t, x, y, fs, fill) { ctx.font = `600 ${fs}px Archivo,sans-serif`; ctx.lineWidth = 3 / V.k; ctx.strokeStyle = "#fff"; ctx.fillStyle = fill || "#1d2730"; ctx.strokeText(t, x, y); ctx.fillText(t, x, y); }
  function pintar() {
    const s = mpp(), z = V.k * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bgc; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * V.k, 0, 0, dpr * V.k, Math.round(V.x * dpr), Math.round(V.y * dpr));
    ctx.imageSmoothingEnabled = false; ctx.textAlign = "center"; ctx.lineJoin = "round";
    if (z >= 8) {   // cuadrícula: un cuadro = un píxel del plano
      const x0 = Math.max(0, Math.floor(-V.x / V.k)), x1 = Math.min(W, Math.ceil((stage.clientWidth - V.x) / V.k)), y0 = Math.max(0, Math.floor(-V.y / V.k)), y1 = Math.min(H, Math.ceil((stage.clientHeight - V.y) / V.k));
      ctx.lineWidth = 1 / z;
      for (let x = x0; x <= x1; x++) { ctx.strokeStyle = x % 10 ? "rgba(0,0,0,.08)" : "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
      for (let y = y0; y <= y1; y++) { ctx.strokeStyle = y % 10 ? "rgba(0,0,0,.08)" : "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    }
    if (show.zon && modo === "tip") for (const zz of zon) { path(zz.p); ctx.globalAlpha = zz === sel ? .3 : .14; ctx.fillStyle = colT(zz); ctx.fill(); ctx.globalAlpha = 1; }   // tinte suave de su tipología
    if (show.amb) for (const g of amb) {
      const on = g === sel, estilo = AMB[tipoAmb(g)] || AMB.otro;   // espacios regulares: rectángulos en tono plano, sin texturas
      if (modo === "amb" || on) { ctx.globalAlpha = on ? .45 : .2; ctx.fillStyle = estilo[1]; if (g.p) { path(g.p); ctx.fill(); } else for (const r of g.r) ctx.fillRect(r[0], r[1], r[2], r[3]); }   // distribución: cada espacio en el color de su tipo
      ctx.globalAlpha = 1;
      if (g.t === "vacio") { const r = g.r[0]; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 1.6 / V.k; ctx.beginPath(); ctx.moveTo(r[0], r[1]); ctx.lineTo(r[0] + r[2], r[1] + r[3]); ctx.moveTo(r[0] + r[2], r[1]); ctx.lineTo(r[0], r[1] + r[3]); ctx.stroke(); }
    }
    if (imgCom && imgCom.naturalWidth) ctx.drawImage(imgCom, 0, 0);
    if (show.zon) { ctx.lineJoin = "miter"; for (const zz of zon) { path(zz.p); ctx.lineWidth = (zz === sel ? 6 : 4) / V.k; ctx.strokeStyle = colT(zz); ctx.stroke(); } ctx.lineJoin = "round"; }   // margen completo: línea gruesa del color de su tipo
    if (show.mu) { ctx.fillStyle = "#111"; for (const r of SCAN.mu) ctx.fillRect(r[0], r[1], r[2], r[3]); }
    if (show.mu && SCAN.pu) {   // puertas: hoja perpendicular al muro y su giro
      ctx.strokeStyle = "#333"; ctx.lineWidth = 1.2 / V.k;
      for (const [x0, y0, x1, y1, lado] of SCAN.pu) {
        const L = Math.hypot(x1 - x0, y1 - y0); ctx.beginPath();
        if (y0 === y1) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + lado * L); ctx.moveTo(x1, y0); ctx.arc(x0, y0, L, 0, lado * Math.PI / 2, lado < 0); }
        else { ctx.moveTo(x0, y0); ctx.lineTo(x0 + lado * L, y0); ctx.moveTo(x0, y1); ctx.arc(x0, y0, L, Math.PI / 2, lado > 0 ? 0 : Math.PI, lado > 0); }
        ctx.stroke();
      }
    }
    if (show.nod && z >= 2 && tool !== "nav") { ctx.fillStyle = "#e11d48"; const a = 1.6 / V.k; for (const n of NOD) ctx.fillRect(n[0] - a, n[1] - a, 2 * a, 2 * a); if (cur && tool !== "nav") { const h = nodoCerca(cur[0], cur[1], 10 / V.k); if (h) { ctx.strokeStyle = "#e11d48"; ctx.lineWidth = 2 / V.k; ctx.beginPath(); ctx.arc(h[0], h[1], 6 / V.k, 0, 7); ctx.stroke(); } } }
    if (show.grid) {
      const c = cel, i0 = Math.max(0, Math.floor(-V.x / V.k / c)), i1 = Math.min(Math.ceil(W / c), Math.ceil((stage.clientWidth - V.x) / V.k / c)), j0 = Math.max(0, Math.floor(-V.y / V.k / c)), j1 = Math.min(Math.ceil(H / c), Math.ceil((stage.clientHeight - V.y) / V.k / c));
      if ((i1 - i0) * (j1 - j0) < 7000) {
        ctx.lineWidth = 1 / V.k; ctx.strokeStyle = "rgba(42,70,184,.5)"; ctx.beginPath();
        for (let i = i0; i <= i1; i++) { ctx.moveTo(i * c, j0 * c); ctx.lineTo(i * c, j1 * c); }
        for (let j = j0; j <= j1; j++) { ctx.moveTo(i0 * c, j * c); ctx.lineTo(i1 * c, j * c); }
        ctx.stroke();
        if (c * V.k >= 26) for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) txt(letras(i) + (j + 1), (i + .5) * c, (j + .5) * c + 3 / V.k, 9 / V.k, "#2a46b8");
      }
    }
    if (show.zon) {   // rótulo de cada unidad: su tipo y su área, nada más
      const ocup = [], fs = 13 / V.k; ctx.font = `700 ${fs}px Archivo,sans-serif`;
      for (const zz of [...zon].sort((a, b) => b.a - a.a)) {
        const t1 = rotT(tipDe(zz)), t2 = fmt(zz.a * s * s) + " m²", w = Math.max(ctx.measureText(t1).width, ctx.measureText(t2).width), b = [zz.c[0] - w / 2, zz.c[1] - fs * 1.1, w, fs * 2.4];
        if (ocup.some(o => b[0] < o[0] + o[2] && b[0] + b[2] > o[0] && b[1] < o[1] + o[3] && b[1] + b[3] > o[1])) continue;
        ocup.push(b); txt(t1, zz.c[0], zz.c[1], fs, "#111"); txt(t2, zz.c[0], zz.c[1] + fs * 1.15, fs * .9, "#333");
      }
    }
    const lines = meds.concat(tmp && cur ? [[tmp, cur]] : []);
    for (const [p, q] of lines) {
      ctx.strokeStyle = "#e11d48"; ctx.lineWidth = 2 / V.k; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      ctx.setLineDash([5 / V.k, 4 / V.k]); ctx.lineWidth = 1.2 / V.k; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.setLineDash([]);
      for (const e of [p, q]) { ctx.beginPath(); ctx.arc(e[0], e[1], 3 / V.k, 0, 7); ctx.fillStyle = "#e11d48"; ctx.fill(); }
      const dx = Math.abs(p[0] - q[0]), dy = Math.abs(p[1] - q[1]), dd = Math.hypot(dx, dy);
      txt(Math.round(dd) + " px · " + fmt(dd * s, 2) + " m", (p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 5 / V.k, 12 / V.k, "#e11d48");
      txt("Δx " + Math.round(dx) + " px (" + fmt(dx * s, 2) + " m) · Δy " + Math.round(dy) + " px (" + fmt(dy * s, 2) + " m)", (p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 9 / V.k, 10 / V.k, "#7a1230");
    }
    for (const m of rmed.concat(rvivo ? [rvivo] : [])) {   // medidas entre muros: píxeles libres hasta el muro de cada lado
      ctx.strokeStyle = "#0b8f6a"; ctx.lineWidth = 2 / V.k; ctx.beginPath(); ctx.moveTo(m.l[1], m.y + .5); ctx.lineTo(m.r[1] + 1, m.y + .5); ctx.moveTo(m.x + .5, m.u[2]); ctx.lineTo(m.x + .5, m.d[2] + 1); ctx.stroke();
      for (const e of [[m.l[1], m.y + .5], [m.r[1] + 1, m.y + .5], [m.x + .5, m.u[2]], [m.x + .5, m.d[2] + 1]]) { ctx.beginPath(); ctx.arc(e[0], e[1], 2.5 / V.k, 0, 7); ctx.fillStyle = "#0b8f6a"; ctx.fill(); }
      txt(m.h + " px · " + fmt(m.h * s, 2) + " m", (m.l[1] + m.r[1] + 1) / 2, m.y - 5 / V.k, 11 / V.k, "#0b8f6a");
      txt(m.v + " px · " + fmt(m.v * s, 2) + " m", m.x + .5, (m.u[2] + m.d[2] + 1) / 2 + 14 / V.k, 11 / V.k, "#0b8f6a");
    }
    if (show.grid) {   // cabeceras de la grilla: letras arriba y números a la izquierda, como en una hoja de cálculo
      const w = stage.clientWidth, h = stage.clientHeight, px = cel * V.k;
      if (px >= 18) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "rgba(244,245,241,.95)"; ctx.fillRect(0, 0, w, 18); ctx.fillRect(0, 0, 32, h);
        ctx.fillStyle = "#2a46b8"; ctx.font = "600 10px Archivo, sans-serif"; ctx.textAlign = "center";
        for (let i = Math.max(0, Math.floor(-V.x / px)), i1 = Math.ceil((w - V.x) / px); i < i1; i++) { const cx = V.x + (i + .5) * px; if (cx > 32) ctx.fillText(letras(i), cx, 12); }
        for (let j = Math.max(0, Math.floor(-V.y / px)), j1 = Math.ceil((h - V.y) / px); j < j1; j++) { const cy = V.y + (j + .5) * px; if (cy > 18) ctx.fillText(String(j + 1), 16, cy + 3); }
      }
    }
    const pxm = V.k / s; let m = 0.5; for (const v of [0.5, 1, 2, 5, 10, 20, 50, 100]) if (v * pxm <= 140) m = v;   // barra de escala
    $("sbi").style.width = (m * pxm) + "px"; $("sbn").textContent = " " + m + " m";
  }
  function resize() { const r = stage.getBoundingClientRect(); dpr = devicePixelRatio || 1; canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); draw(); }
  function zoomAt(px, py, f) { const k = Math.max(.1, Math.min(32 / dpr, V.k * f)); f = k / V.k; V.x = px - (px - V.x) * f; V.y = py - (py - V.y) * f; V.k = k; draw(); }
  function paso(px, py, dir) { const c = V.k * dpr; const n = dir > 0 ? NIV.find(v => v > c * 1.0001) : [...NIV].reverse().find(v => v < c * .9999); if (n != null) zoomAt(px, py, n / dpr / V.k); }
  function encaja(px, py) { const c = V.k * dpr; const n = NIV.reduce((a, v) => Math.abs(Math.log(v / c)) < Math.abs(Math.log(a / c)) ? v : a, NIV[0]); zoomAt(px, py, n / dpr / V.k); }
  function setView(v) {
    const w = stage.clientWidth, h = stage.clientHeight; let b;
    if (v === "1") { const k = 1 / dpr; V = { k, x: (w - W * k) / 2, y: (h - H * k) / 2 }; draw(); return; }
    if (v === "A" || v === "B") b = SCAN.torres[v];
    else { const A = SCAN.torres.A, B = SCAN.torres.B, x0 = Math.min(A[0], B[0]), y0 = Math.min(A[1], B[1]); b = [x0, y0, Math.max(A[0] + A[2], B[0] + B[2]) - x0, Math.max(A[1] + A[3], B[1] + B[3]) - y0]; }
    const kf = Math.min(w / (b[2] + 40), h / (b[3] + 60)) * dpr, n = kf < 1 ? kf : NIV.filter(x => x <= kf * 1.0001).pop(), k = n / dpr; V = { k, x: w / 2 - (b[0] + b[2] / 2) * k, y: h / 2 - (b[1] + b[3] / 2) * k }; draw();
  }
  function irA(b) { const w = stage.clientWidth, h = stage.clientHeight, kf = Math.min(w / (b[2] + 40), h / (b[3] + 60)) * dpr, n = kf < 1 ? kf : NIV.filter(x => x <= kf * 1.0001).pop(), k = n / dpr; V = { k, x: w / 2 - (b[0] + b[2] / 2) * k, y: h / 2 - (b[1] + b[3] / 2) * k }; draw(); }
  $("selUnidad").onchange = e => { const zz = zonPorId[e.target.value]; if (!zz) return; sel = zz; showInfo(zz); irA([zz.x0, zz.y0, zz.x1 - zz.x0, zz.y1 - zz.y0]); };
  document.querySelectorAll("#views button").forEach(bt => bt.onclick = () => { document.querySelectorAll("#views button").forEach(x => x.setAttribute("aria-pressed", x === bt)); setView(bt.dataset.v); });
  $("lyGrid").onchange = e => { show.grid = e.target.checked; draw(); };
  $("selGrid").onchange = e => { cel = +e.target.value; if (sel) showInfo(sel); draw(); };
  for (const [id, k] of [["lyMu", "mu"], ["lyNod", "nod"], ["lyNom", "nom"], ["lyZon", "zon"], ["lyAmb", "amb"]]) $(id).onchange = e => { show[k] = e.target.checked; if (sel && !show[sel.kind]) { sel = null; info.style.display = "none"; } draw(); };

  /* ---------- leyendas y totales ---------- */
  function leyenda() {
    const s = mpp(), g = {}; for (const zz of zon) { const tp = tipDe(zz); (g[tp.corto] = g[tp.corto] || { tp, zs: [] }).zs.push(zz); }
    $("leyenda").innerHTML = Object.values(g).sort((a, b) => a.tp.corto.localeCompare(b.tp.corto)).map(({ tp, zs }) => { const as = zs.map(zz => zz.a * s * s), lo = fmt(Math.min(...as), 0), hi = fmt(Math.max(...as), 0);
      return `<li><span class="sw" style="background:${COL_T[tp.corto] || zs[0].col}"></span><b>${rotT(tp)}</b> · ${zs.length} ${zs.length > 1 ? "unidades" : "unidad"} · ${lo === hi ? lo : lo + "–" + hi} m²</li>`; }).join("");
    const t = {}; for (const a of amb) { const k = tipoAmb(a), e = t[k] = t[k] || { n: 0, a: 0, p: 0 }; e.n++; e.a += a.a * s * s; if (!TA[a.id] && a.o === "e") e.p++; }
    $("leyAmb").innerHTML = Object.entries(AMB).filter(([k]) => t[k]).map(([k, [nom, col]]) => `<li style="list-style:none;margin-left:-16px"><span class="sw" style="display:inline-block;vertical-align:middle;background:${col};margin-right:6px"></span><b>${nom}</b> · ${t[k].n} · ${fmt(t[k].a)} m²${t[k].p ? ` <small>(${t[k].p} propuestos)</small>` : ""}</li>`).join("");
  }
  function resumen() {
    const s = mpp(), g = {}; for (const zz of zon) { const t = (ETQ[zz.id] || {}).t; if (!t) continue; (g[t] = g[t] || { n: 0, a: 0 }).n++; g[t].a += zz.a * s * s; }
    const f = Object.entries(g); $("resumen").innerHTML = f.length ? f.map(([t, v]) => { const r = (TIPOS.find(x => x[0] === t) || [0, 0])[1]; return `<li><b>${t}</b><br>${v.n} área(s) · ${fmt(v.a)} m²${r ? ` · ref. ${fmt(r, 2)} m² por unidad` : ""}</li>`; }).join("") : '<li style="list-style:none;margin-left:-16px;color:var(--muted)">Aún no hay tipologías asignadas.</li>';
  }
  function upScale() {
    const s = mpp(); $("scv").textContent = st.scale; $("mpp").textContent = fmt(s * 100, 2) + " cm/px";
    $("notaEsc").textContent = `La escala es gráfica: «planta con tipologías» está a tamaño real (hoja de 707 × 500 mm) y su escala 1:${SCAN.esc} sale de ajustar las áreas de sus polígonos a las tipologías del proyecto (error mediano ${fmt(SCAN.err)} %). El plano de muros se registró con él, así que 1 px equivale a ${fmt(s * 100, 2)} cm reales.`;
    const A = SCAN.torres.A, B = SCAN.torres.B;
    $("sbt").textContent = `Torre A ≈ ${fmt(A[2] * s)} × ${fmt(A[3] * s)} m · Torre B ≈ ${fmt(B[2] * s)} × ${fmt(B[3] * s)} m`;
    $("totales").innerHTML = `<b>${zon.length} áreas</b> · ${fmt(zon.reduce((t, zz) => t + zz.a, 0) * s * s)} m² · <b>${amb.length} ambientes</b> · ${SCAN.mu.length} rectángulos de muro`;
    const un = $("selUnidad"); un.innerHTML = '<option value="">Elegir…</option>' + [...zon].sort((a, b) => (a.t === "A") - (b.t === "A") || a.id.localeCompare(b.id)).map(zz => `<option value="${zz.id}">${zz.id} · Torre ${zz.t} · ${tipDe(zz).corto} · ${fmt(zz.a * s * s)} m²</option>`).join("");
    if (sel) showInfo(sel); leyenda(); resumen(); draw();
  }
  $("sc").oninput = e => { st.scale = parseFloat(e.target.value); upScale(); };

  /* ---------- herramientas y etiquetas ---------- */
  function usar(t) {
    tool = t; tmp = null; $("tNav").setAttribute("aria-pressed", t === "nav"); $("tMed").setAttribute("aria-pressed", t === "med"); $("tMuro").setAttribute("aria-pressed", t === "muro"); rvivo = null;
    $("hint").textContent = t === "med" ? "Medir: clic en dos puntos · Esc cancela" : t === "muro" ? "Entre muros: mueve el cursor dentro de un ambiente y haz clic para dejar la medida (píxeles y metros) · Esc termina" : "Arrastra para mover · rueda para acercar · clic en un ambiente o un área para ver su superficie";
    canvas.style.cursor = t === "nav" ? "grab" : "crosshair"; draw();
  }
  $("tNav").onclick = () => usar("nav"); $("tMed").onclick = () => usar("med"); $("tMuro").onclick = () => usar("muro"); $("tClr").onclick = () => { meds = []; rmed = []; tmp = null; draw(); };
  for (const [id, m] of [["mTip", "tip"], ["mAmb", "amb"]]) $(id).onclick = () => { modo = m; $("mTip").setAttribute("aria-pressed", m === "tip"); $("mAmb").setAttribute("aria-pressed", m === "amb"); draw(); };
  $("tLey").onclick = () => { const a = document.querySelector(".plano aside"); $("tLey").setAttribute("aria-pressed", a.classList.toggle("abierta")); };   // convenciones: plegadas
  $("zMas").onclick = () => paso(stage.clientWidth / 2, stage.clientHeight / 2, 1); $("zMenos").onclick = () => paso(stage.clientWidth / 2, stage.clientHeight / 2, -1);
  $("edTip").innerHTML = '<option value="">Automática (la más cercana)</option>' + TIPOS.map(t => `<option>${t[0]}</option>`).join("");
  $("edTipoA").innerHTML = '<option value="">Automático</option>' + Object.entries(AMB).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("");
  function setEt(k, v) { if (!sel || sel.kind !== "zon") return; const e = ETQ[sel.id] = ETQ[sel.id] || {}; if (v) e[k] = v; else delete e[k]; if (!Object.keys(e).length) delete ETQ[sel.id]; guarda(); upScale(); }
  $("edNom").onchange = e => setEt("n", e.target.value.trim()); $("edTip").onchange = e => setEt("t", e.target.value);
  $("edTipoA").onchange = e => { if (!sel || sel.kind !== "amb") return; if (e.target.value) TA[sel.id] = e.target.value; else delete TA[sel.id]; guarda(); upScale(); };
  $("borraEt").onclick = () => { if ((Object.keys(ETQ).length || Object.keys(TA).length) && !confirm("¿Borrar todas las etiquetas?")) return; ETQ = {}; TA = {}; guarda(); upScale(); };
  $("exp").onclick = () => {
    const s = mpp(), out = { proyecto: "Fontanella", plano: "Planta tipo", escala_grafica: "1:" + st.scale, cm_por_px: +(s * 100).toFixed(2),
      areas: zon.map(zz => { const tp = tipDe(zz), e = ETQ[zz.id] || {}; return { id: zz.id, torre: zz.t, color: zz.col, etiqueta: e.n || null, area_m2: +(zz.a * s * s).toFixed(2), tipologia: tp.nombre, tipologia_asignada: tp.asignada, referencia_m2: tp.ref, diferencia_pct: +tp.dif.toFixed(1), alcobas: zz.n.a, salas: zz.n.s, cocinas: zz.n.c }; }),
      ambientes: amb.map(g => ({ id: g.id, area: g.z, tipo: AMB[tipoAmb(g)][0], origen: TA[g.id] ? "editado" : g.o === "p" ? "nombre del plano" : "propuesta", area_m2: +(g.a * s * s).toFixed(2), rectangulos_m: g.r.map(q => q.map(v => +(v * s).toFixed(2))) })),
      muros_rectangulos_m: SCAN.mu.map(q => q.map(v => +(v * s).toFixed(2))), nodos_m: NOD.map(n => [+(n[0] * s).toFixed(2), +(n[1] * s).toFixed(2)]) };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" })); a.download = "fontanella-planta-tipo.json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  function showInfo(o) {
    const s = mpp(); let t, rows;
    if (o.kind === "amb") {
      const k = tipoAmb(o), zz = zonPorId[o.z], tz = zz ? tipDe(zz) : null;
      t = AMB[k][0] + " · " + o.id;
      rows = [["Superficie", fmt(o.a * s * s, 2) + " m²"], ["Área escaneada", fmt(o.a0 * s * s, 2) + " m²"], ["Frente × fondo", fmt((o.x1 - o.x0) * s, 2) + " × " + fmt((o.y1 - o.y0) * s, 2) + " m"],
        ["Tipo", AMB[k][0] + (TA[o.id] ? " (editado)" : o.o === "p" ? " (nombre del plano)" : " (propuesta)")], ["Dentro del área", zz ? zz.id + " · " + tz.corto : "— (fuera de las áreas de apartamento)"], ["Rectángulos", o.r.length + " dentro de los muros"], ["Ubicación (grilla de " + cel + " px)", ubic(o)]];
      $("ed").style.display = "none"; $("edA").style.display = ""; $("edTipoA").value = TA[o.id] || "";
    } else {
      const tp = tipDe(o), et = ETQ[o.id] || {}; t = (et.n || "Área " + o.id) + " · " + tp.corto;
      const rs = amb.filter(g => g.z === o.id), por = {}; rs.forEach(g => { const k = tipoAmb(g), e = por[k] = por[k] || { n: 0, a: 0 }; e.n++; e.a += g.a * s * s; });
      const lista = Object.entries(por).map(([k, e]) => AMB[k][0] + (e.n > 1 ? " ×" + e.n : "") + " " + fmt(e.a) + " m²").join(" · "), suma = rs.reduce((t2, g) => t2 + g.a * s * s, 0), total = o.a * s * s;
      rows = [["Superficie", fmt(o.a * s * s, 2) + " m²"], [tp.asignada ? "Tipología asignada" : "Tipología más cercana", tp.nombre], ["Superficie de referencia", tp.ref ? fmt(tp.ref, 2) + " m²" : "—"], ["Diferencia", tp.ref ? (tp.dif > 0 ? "+" : "") + fmt(tp.dif) + " %" : "—"],
        ["Nombres dentro", cuenta(o.n)], ["Ambientes", lista || "—"], ["Suma de ambientes", fmt(suma) + " m² de " + fmt(total) + " m² (" + fmt(suma / total * 100, 0) + " %; el resto son muros)"], ["Ubicación (grilla de " + cel + " px)", ubic(o)], ["Torre", o.t], ["Color", o.col]];
      $("ed").style.display = ""; $("edA").style.display = "none"; if (document.activeElement !== $("edNom")) $("edNom").value = et.n || ""; $("edTip").value = et.t || "";
    }
    $("it").textContent = t; $("id").innerHTML = rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join(""); info.style.display = "block";
  }
  $("ix").onclick = () => { info.style.display = "none"; sel = null; draw(); };

  /* ---------- puntero, rueda y teclado ---------- */
  const rel = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const world = e => { const p = rel(e); return [(p[0] - V.x) / V.k, (p[1] - V.y) / V.k]; };
  const sep = () => { const q = [...pts.values()]; return Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]); };
  canvas.addEventListener("pointerdown", e => { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} pts.set(e.pointerId, [e.clientX, e.clientY]);
    down = [e.clientX, e.clientY, false]; drag = { x: V.x, y: V.y, cx: e.clientX, cy: e.clientY }; if (pts.size === 2) pinch = sep(); });
  canvas.addEventListener("pointermove", e => {
    cur = world(e); if (tool === "med") cur = imanN(cur);
    { const x = Math.floor(cur[0]), y = Math.floor(cur[1]), m = mpp(); $("px").textContent = (x >= 0 && y >= 0 && x < W && y < H) ? `píxel ${x}, ${y} · celda ${celda(x, y)}${show.grid ? "" : " (grilla de " + cel + " px)"} · ${fmt(cur[0] * m, 2)} m, ${fmt(cur[1] * m, 2)} m` : ""; }
    rvivo = tool === "muro" ? entreMuros(cur[0], cur[1]) : null;
    if (pts.has(e.pointerId)) {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const d = sep(), q = [...pts.values()], r = canvas.getBoundingClientRect(); if (pinch) zoomAt((q[0][0] + q[1][0]) / 2 - r.left, (q[0][1] + q[1][1]) / 2 - r.top, d / pinch); pinch = d; if (down) down[2] = true; return; }
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) down[2] = true;
      if (down && down[2]) { V.x = drag.x + e.clientX - drag.cx; V.y = drag.y + e.clientY - drag.cy; canvas.style.cursor = "grabbing"; }
    }
    if ((down && down[2]) || tool !== "nav") draw();
  });
  canvas.addEventListener("pointerup", e => { const had = pts.delete(e.pointerId); if (pinch && pts.size < 2) { const r = rel(e); encaja(r[0], r[1]); } pinch = 0; canvas.style.cursor = tool === "nav" ? "grab" : "crosshair";
    if (had && down && !down[2] && pts.size === 0) clic(world(e)); down = null; });
  canvas.addEventListener("pointercancel", e => { pts.delete(e.pointerId); down = null; });
  canvas.addEventListener("wheel", e => { e.preventDefault(); acc += e.deltaY * (e.deltaMode === 1 ? 33 : 1); if (Math.abs(acc) < 50) return; const p = rel(e); paso(p[0], p[1], acc < 0 ? 1 : -1); acc = 0; }, { passive: false });
  function clic(p) {
    if (tool === "med") { p = imanN(p); if (!tmp) tmp = p; else { meds.push([tmp, p]); tmp = null; } draw(); return; }
    if (tool === "muro") { const m = entreMuros(p[0], p[1]); if (m) rmed.push(m); draw(); return; }
    let hit = show.amb ? amb.filter(g => g.r.some(r => enR(r, p[0], p[1]))).sort((a, b) => a.a - b.a)[0] : null;      // el ambiente más pequeño que contiene el punto
    if (!hit && show.zon) hit = zon.filter(zz => inside(zz.p, p[0], p[1])).sort((a, b) => a.a - b.a)[0];
    sel = hit || null; if (hit) showInfo(hit); else info.style.display = "none"; draw();
  }
  document.addEventListener("keydown", e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; const w = stage.clientWidth / 2, h = stage.clientHeight / 2;
    if (e.key === "Escape") { tmp = null; sel = null; info.style.display = "none"; draw(); }
    else if (e.key === "+" || e.key === "=") paso(w, h, 1); else if (e.key === "-") paso(w, h, -1); else if (e.key === "0") setView("1");
    else if (e.key.startsWith("Arrow")) { V.x += e.key === "ArrowLeft" ? 60 : e.key === "ArrowRight" ? -60 : 0; V.y += e.key === "ArrowUp" ? 60 : e.key === "ArrowDown" ? -60 : 0; draw(); e.preventDefault(); }
  });
  new ResizeObserver(resize).observe(stage);
  canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "Plano de la planta tipo con muros, áreas de apartamento y ambientes; se recorre con el teclado (flechas, + y -) o con la lista «Ir a la unidad»"); canvas.tabIndex = 0;
  $("sc").value = ESC; canvas.style.cursor = "grab"; upScale(); resize(); setView("all"); pintar();
})();
