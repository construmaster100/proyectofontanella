// Esquema del lote (bloque 1) en 3D real: se gira arrastrando con el puntero.
// Reconstruye la escena del esquema isométrico en coordenadas de plano y la dibuja con three.js.
// Si WebGL no está disponible se conserva el esquema SVG.
(function () {
  const svg = document.querySelector(".terreno-plano:not(.ubic-svg) .t-implantacion");
  if (!svg || !window.THREE || !window.FontanellaDisenos) return;
  const figura = svg.parentElement;

  // --- Del esquema SVG (proyección oblicua) a coordenadas de plano ---------------
  const C0 = 400, EX = 0.691, EY = 0.723; // vector de profundidad por unidad: (EX, -EY)
  const plano = (sx, sy) => { const Y = (C0 - sy) / EY; return [sx - EX * Y, Y]; };
  const lista = s => s.trim().split(/\s+/).map(p => p.split(",").map(Number));

  const lote = lista(svg.querySelector(".t-lote-pol").getAttribute("points")).map(p => plano(p[0], p[1]));
  const calles = [...svg.querySelectorAll(".iso-calle")].map(p => lista(p.getAttribute("points")).map(q => plano(q[0], q[1])));
  const TORRES = [
    { n: 1, x0: 84.9, y0: 320.8, w: 71 }, { n: 2, x0: 167.9, y0: 320.8, w: 71 }, { n: 3, x0: 307.9, y0: 320.8, w: 71 },
    { n: 4, x0: 272.6, y0: 249.4, w: 113 }, { n: 5, x0: 395.6, y0: 249.4, w: 70 }
  ];
  const PROF = 57, NIVELES = 12, HN = 9, ALTO = NIVELES * HN, ESPESOR = 16;
  const D = window.FontanellaDisenos;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { return; }

  // --- Contenedor ------------------------------------------------------------------
  const caja = document.createElement("div");
  caja.className = "lote3d";
  caja.setAttribute("role", "img");
  caja.setAttribute("aria-label", "Implantación de las torres en el lote en 3D. Arrastre para girar.");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  caja.appendChild(renderer.domElement);
  figura.insertBefore(caja, svg);
  svg.style.display = "none";

  const escena = new THREE.Scene();
  escena.add(new THREE.AmbientLight(0xffffff, 0.72));
  const sol = new THREE.DirectionalLight(0xffffff, 0.55);
  sol.position.set(180, 420, 260);
  escena.add(sol);

  const mundo = ([X, Y]) => new THREE.Vector3(X, 0, -Y); // plano (X, Y atrás) -> mundo (x, y arriba, z hacia el espectador)
  const forma = pts => new THREE.Shape(pts.map(([X, Y]) => new THREE.Vector2(X, Y)));
  const prisma = (pts, h, material) => {
    const g = new THREE.ExtrudeGeometry(forma(pts), { depth: h, bevelEnabled: false });
    const m = new THREE.Mesh(g, material);
    m.rotation.x = -Math.PI / 2;
    // Relieve de degradado: más oscuro en la base y más claro arriba
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const v = 0.6 + 0.4 * (h > 0 ? pos.getZ(i) / h : 1); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (Array.isArray(material) ? material : [material]).forEach(mt => { mt.vertexColors = true; });
    return m;
  };
  const bordes = (malla, material) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(malla.geometry, 25), material);
    malla.add(l);
    return l;
  };

  // --- Lote y vías --------------------------------------------------------------------
  const lotePrisma = prisma(lote, ESPESOR, [
    new THREE.MeshLambertMaterial({ color: 0x1d4a1f }), new THREE.MeshLambertMaterial({ color: 0x6b4a2f })]);
  lotePrisma.position.y = -ESPESOR;
  escena.add(lotePrisma);

  const negro = new THREE.MeshLambertMaterial({ color: 0x141414 });
  calles.forEach(pts => { const c = prisma(pts, ESPESOR, negro); c.position.y = -ESPESOR; escena.add(c); });

  // Rótulos sobre el terreno (planos con texto) y sprites siempre de frente
  const texturaTexto = (texto, ancho, alto, estilo) => {
    const c = document.createElement("canvas");
    c.width = ancho; c.height = alto;
    const x = c.getContext("2d");
    estilo(x, texto, ancho, alto);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  };
  const sobreSuelo = (texto, centro, dir, ancho, alto, color) => {
    const t = texturaTexto(texto, 512, Math.round(512 * alto / ancho), (x, s, w, h) => {
      x.fillStyle = color; x.font = "800 " + Math.round(h * 0.6) + "px Montserrat, sans-serif";
      x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s.split("").join(" "), w / 2, h / 2);
    });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    p.rotation.x = -Math.PI / 2;
    const g = new THREE.Object3D();
    let ang = Math.atan2(dir[1], dir[0]); // dir en plano (X, Y atrás): z = -Y
    if (Math.cos(ang) < 0) ang += Math.PI;
    g.rotation.y = ang;
    g.position.set(centro[0], 0.6, -centro[1]);
    g.add(p);
    escena.add(g);
  };
  const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const nombresCalle = ["CALLE 63", "CARRERA 2"];
  calles.forEach((pts, i) => {
    const a = medio(pts[0], pts[3]), b = medio(pts[1], pts[2]);
    const dir = [b[0] - a[0], b[1] - a[1]];
    const t = i === 0 ? 0.3 : 0.62;
    sobreSuelo(nombresCalle[i], [a[0] + dir[0] * t, a[1] + dir[1] * t], dir, 90, 17, "#ffffff");
  });
  const cl = lote.reduce((s, p) => [s[0] + p[0] / lote.length, s[1] + p[1] / lote.length], [0, 0]);
  const lugarLote = plano(617, 168); // la etiqueta del lote queda en su sitio y siempre de frente, como las T1 a T5

  // Norte: flecha sobre el terreno, en la dirección de la Carrera 2
  (function norte() {
    const b = calles[1];
    const a = medio(b[0], b[3]), z = medio(b[1], b[2]);
    let d = [z[0] - a[0], z[1] - a[1]]; const L = Math.hypot(d[0], d[1]); d = [d[0] / L, d[1] / L];
    const len = 38;
    // Pegada a la Carrera 2, sobre el terreno libre del borde del lote
    const c = plano(48, 338);
    const o = [c[0] - d[0] * len / 2, c[1] - d[1] * len / 2];
    const p = [d[0], d[1]], q = [-d[1], d[0]];
    const pt = (u, v) => [o[0] + p[0] * u + q[0] * v, o[1] + p[1] * u + q[1] * v];
    // Triángulo isósceles: base de 20 y altura de 38, con el vértice hacia el norte
    const flecha = forma([pt(0, -10), pt(len, 0), pt(0, 10)]);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(flecha), new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.5;
    escena.add(m);
    const punta = pt(len + 16, 0);
    insignia("N", mundo(punta).setY(8), 22, 22, true);
  })();

  // --- Torres ---------------------------------------------------------------------------
  const niveles = Array.from({ length: NIVELES }, () => ({ p: 0, objetivo: 0, mats: [] }));
  const vidrio = new THREE.Color(0xcde4ff);
  // Áreas privadas (unidades) en azul y zonas comunes en naranja, en todas las torres
  const AZUL = { u: 0x3e59d9, c: 0xf39a27, borde: 0x102779 };
  // T4 y T5: cristal naranja (traslúcido) que se va acumulando por niveles
  const CRISTAL_AMARILLO = { u: 0xf39a27, c: 0xe38a1c, borde: 0x8c5516, cristal: true };
  const paleta = { 1: AZUL, 4: CRISTAL_AMARILLO, 5: CRISTAL_AMARILLO };
  const pieza = (pz, ext, al, X0, Yf, W) =>
    pz.pts.map(([x, y]) => [X0 + ((x - ext.x0) / ext.an) * W, Yf + (1 - y / al) * PROF]);

  const piezasClic = []; // partes de T1, T2 y T3 que responden al clic
  TORRES.forEach(t => {
    const Yf = (C0 - t.y0) / EY, X0 = t.x0 - EX * Yf;
    const dis = t.n <= 3 ? D["123"] : D["45"];
    const piezas = dis.piezas.filter(pz => t.n <= 3 || (pz.torre === t.n && !pz.solo));
    const ext = t.n <= 3 ? { x0: 0, an: dis.an } : dis.torres[t.n];
    const col = paleta[t.n <= 3 ? 1 : t.n];
    const grupo = new THREE.Group();
    escena.add(grupo);

    if (t.n <= 3) {
      const acrilico = { transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide };
      const mU = new THREE.MeshLambertMaterial({ color: col.u, ...acrilico }), mC = new THREE.MeshLambertMaterial({ color: col.c, ...acrilico });
      const lin = new THREE.LineBasicMaterial({ color: col.borde, transparent: true, opacity: 0.55 });
      const lineaPiso = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85 });
      piezas.forEach((pz, idx) => {
        const pts = pieza(pz, ext, dis.al, X0, Yf, t.w);
        const m = prisma(pts, ALTO, pz.t === "u" ? mU : mC);
        m.userData = { torre: t.n, idx, tipo: pz.t };
        piezasClic.push(m);
        bordes(m, lin); grupo.add(m);
        // Una línea por piso (12 pisos): contorno de la pieza a cada nivel
        for (let k = 1; k < NIVELES; k++) {
          const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map(([X, Y]) => new THREE.Vector3(X, k * HN, -Y))), lineaPiso);
          grupo.add(l);
        }
      });
    } else {
      for (let k = 0; k < NIVELES; k++) {
        const mU = new THREE.MeshLambertMaterial({ transparent: true, side: THREE.DoubleSide });
        const mC = new THREE.MeshLambertMaterial({ transparent: true, side: THREE.DoubleSide });
        const lin = new THREE.LineBasicMaterial({ transparent: true });
        niveles[k].mats.push({ mat: mU, solido: new THREE.Color(col.u), opS: col.cristal ? 0.62 : 1, opV: 0.16 });
        niveles[k].mats.push({ mat: mC, solido: new THREE.Color(col.c), opS: col.cristal ? 0.7 : 1, opV: 0.16 });
        niveles[k].mats.push({ mat: lin, solido: new THREE.Color(col.borde), opS: col.cristal ? 0.8 : 0.55, opV: 0.85, linea: true });
        piezas.forEach(pz => {
          const m = prisma(pieza(pz, ext, dis.al, X0, Yf, t.w), HN, pz.t === "u" ? mU : mC);
          m.position.y = k * HN;
          m.userData = { torre: t.n, idx: D["45"].piezas.indexOf(pz), tipo: pz.t, tip: pz.tip };
          piezasClic.push(m);
          bordes(m, lin); grupo.add(m);
        });
      }
    }
    const centro = [X0 + t.w / 2, Yf + PROF / 2];
    insignia("T" + t.n, mundo(centro).setY(ALTO + 16), 46, 28, false);
  });

  // Icono de usuario (sin texto) para la zona común
  function iconoUsuario(pos, tam) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#1c6f98"; x.strokeStyle = "#ffffff"; x.lineWidth = 6;
    x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = "#ffffff";
    x.beginPath(); x.arc(64, 48, 18, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(30, 100); x.quadraticCurveTo(30, 68, 64, 68); x.quadraticCurveTo(98, 68, 98, 100); x.closePath(); x.fill();
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
    sp.scale.set(tam, tam, 1); sp.position.copy(pos); sp.renderOrder = 10;
    escena.add(sp);
  }

  function insignia(texto, pos, w, h, circulo, fondo) {
    const tex = texturaTexto(texto, Math.round(w * 4), Math.round(h * 4), (x, s, cw, ch) => {
      x.fillStyle = circulo ? "rgba(255,255,255,0.92)" : (fondo || "#0f1a3c");
      x.strokeStyle = circulo ? "#1a1a1a" : "#ffffff"; x.lineWidth = 6;
      const r = circulo ? ch / 2 - 4 : 18;
      x.beginPath(); x.roundRect ? x.roundRect(4, 4, cw - 8, ch - 8, r) : x.rect(4, 4, cw - 8, ch - 8); x.fill(); x.stroke();
      x.fillStyle = circulo ? "#1a1a1a" : "#ffffff"; x.font = "800 " + Math.round(Math.min(ch * 0.62, (cw - 40) / (s.length * 0.66))) + "px Montserrat, sans-serif";
      x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s, cw / 2, ch / 2 + 2);
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(w, h, 1); sp.position.copy(pos); sp.renderOrder = 10;
    escena.add(sp);
  }

  // --- Zona común, salón común y ventas -------------------------------------------------------
  const volumen = (centro, ancho, fondo, alto, color, colorBorde) => {
    const g = new THREE.BoxGeometry(ancho, alto, fondo);
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
    m.position.set(centro[0], alto / 2, -centro[1]);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: colorBorde, transparent: true, opacity: 0.6 })));
    escena.add(m);
    return m;
  };
  const arbol = (X, Y, escala) => {
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(1.2 * escala, 1.6 * escala, 8 * escala, 8), new THREE.MeshLambertMaterial({ color: 0x5a3b22 }));
    tronco.position.set(X, 4 * escala, -Y);
    const copa = new THREE.Mesh(new THREE.SphereGeometry(6 * escala, 12, 10), new THREE.MeshLambertMaterial({ color: 0x1f5a22 }));
    copa.position.set(X, 12 * escala, -Y);
    escena.add(tronco, copa);
  };

  // Ubicación según la imagen "zona comun y salon comun y ventasd"
  const t4 = TORRES[3], Yf4 = (C0 - t4.y0) / EY, X04 = t4.x0 - EX * Yf4;
  const t1 = TORRES[0], Yf1 = (C0 - t1.y0) / EY;

  // Salón de ventas (rojo): de un nivel, en la esquina siguiente de la Calle 63 con la Carrera 2 (la Carrera 2 es continua)
  const vent = plano(-34, 214);
  volumen(vent, 38, 32, HN, 0xd9372e, 0x6e1a15);
  insignia("SALÓN DE VENTAS", mundo(vent).setY(HN + 16), 70, 13, false, "#b3261e");

  // Zona común (azul claro): de un nivel, a la izquierda de la torre 4, en la fila de T4 y T5
  const salon = [X04 - 56, Yf4 + PROF / 2];
  volumen(salon, 92, 50, HN, 0x6ec6f0, 0x1c6f98);
  iconoUsuario(mundo(salon).setY(HN + 24), 30);

  // Zona de acceso adoquinada, sin rótulo: arranca en el borde de la Calle 63, sigue entre la fila de T1 a T3 y la de T4 y T5 y llega a los árboles
  const borde0 = plano(-2.6, 297), borde1 = plano(446.9, 123.6); // borde del lote sobre la Calle 63
  const xBorde = Y => borde0[0] + (Y - borde0[1]) * (borde1[0] - borde0[0]) / (borde1[1] - borde0[1]);
  const yAbajo = Yf1 + PROF + 2, yArriba = Yf4 - 2, xFin = 330;
  // Adoquín: textura de piezas rectangulares trabadas, repetida sobre la franja
  const adoquin = (() => {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 64;
    const x = c.getContext("2d");
    x.fillStyle = "#8d8679"; x.fillRect(0, 0, 128, 64);
    const tonos = ["#c9c2b4", "#bdb5a6", "#d3ccbf", "#b5ad9e"];
    for (let fila = 0; fila < 8; fila++) {
      const desfase = fila % 2 ? 8 : 0;
      for (let col = -1; col < 9; col++) {
        x.fillStyle = tonos[(fila * 3 + col * 5 + 8) % tonos.length];
        x.fillRect(col * 16 + desfase + 1, fila * 8 + 1, 14, 6);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 32, 1 / 16);
    t.anisotropy = 4;
    return t;
  })();
  const acceso = prisma([[xBorde(yAbajo), yAbajo], [xFin, yAbajo], [xFin, yArriba], [xBorde(yArriba), yArriba]], 1.6,
    [new THREE.MeshLambertMaterial({ map: adoquin }), new THREE.MeshLambertMaterial({ color: 0x8d8679 })]);
  acceso.position.y = 0;
  escena.add(acceso);
  // Árboles repartidos al azar sobre el lote (siempre la misma disposición), fuera de torres, camino y edificios
  const huecos = TORRES.map(t => { const yf = (C0 - t.y0) / EY; return [t.x0 - EX * yf - 12, yf - 12, t.w + 24, PROF + 24]; });
  huecos.push([xBorde(yAbajo) - 6, yAbajo - 8, xFin - xBorde(yAbajo) + 12, yArriba - yAbajo + 16]); // camino adoquinado
  huecos.push([salon[0] - 56, salon[1] - 33, 112, 66]); // zona común
  const dentroLote = (x, y) => {
    let d = false;
    for (let i = 0, k = lote.length - 1; i < lote.length; k = i++) {
      const [xi, yi] = lote[i], [xk, yk] = lote[k];
      if ((yi > y) !== (yk > y) && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) d = !d;
    }
    return d;
  };
  let semilla = 7;
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
  const minX = Math.min(...lote.map(p => p[0])), maxX = Math.max(...lote.map(p => p[0]));
  const minY = Math.min(...lote.map(p => p[1])), maxY = Math.max(...lote.map(p => p[1]));
  const colocados = [];
  for (let intento = 0; intento < 900 && colocados.length < 26; intento++) {
    const x = minX + azar() * (maxX - minX), y = minY + azar() * (maxY - minY), s = 0.65 + azar() * 0.5;
    if (!dentroLote(x, y) || !dentroLote(x + 12, y) || !dentroLote(x - 12, y) || !dentroLote(x, y + 12) || !dentroLote(x, y - 12)) continue;
    if (huecos.some(([hx, hy, hw, hh]) => x > hx && x < hx + hw && y > hy && y < hy + hh)) continue;
    if (colocados.some(([cx, cy]) => Math.hypot(cx - x, cy - y) < 26)) continue;
    colocados.push([x, y]);
    arbol(x, y, s);
  }

  // La etiqueta del lote flota a la altura de las azoteas, con una línea hasta su punto en el terreno,
  // y se dibuja siempre encima: ningún edificio la tapa al girar.
  const alturaLote = ALTO + 26;
  insignia("LOTE 15.702 m²", mundo(lugarLote).setY(alturaLote), 150, 28, false);
  const hilo = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([mundo(lugarLote), mundo(lugarLote).setY(alturaLote - 14)]),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false }));
  hilo.renderOrder = 9;
  escena.add(hilo);

  // --- Cámara y giro con el puntero -------------------------------------------------------
  const xs = lote.map(p => p[0]), ys = lote.map(p => p[1]);
  const centroEscena = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2 - 55, 20, -(Math.min(...ys) + Math.max(...ys)) / 2);
  const radio = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;
  const camara = new THREE.PerspectiveCamera(28, 1, 10, 4000);
  // Vista inicial: desde el final de la Calle 63 mirando hacia las torres
  const finCalle = medio(calles[0][1], calles[0][2]); // extremo de la Calle 63 opuesto a la Carrera 2
  const inicial = { theta: Math.atan2(finCalle[0] - centroEscena.x, -finCalle[1] - centroEscena.z), phi: 0.75 };
  let theta = inicial.theta, phi = inicial.phi, vel = 0, arrastrando = false, ultimoX = 0, ultimoY = 0;
  const distancia0 = radio * 3.0;

  function colocar() {
    const distancia = distancia0 * zoom * (camara.aspect < 1.4 ? 1.35 : 1); // en pantallas angostas (celular) se aleja un poco
    camara.position.set(
      centroEscena.x + distancia * Math.sin(theta) * Math.cos(phi),
      centroEscena.y + distancia * Math.sin(phi),
      centroEscena.z + distancia * Math.cos(theta) * Math.cos(phi));
    camara.lookAt(centroEscena);
  }
  const el = renderer.domElement;
  const punteros = new Map();
  let zoom = 1, distPellizco = 0;
  const limitarZoom = () => { zoom = Math.min(1.7, Math.max(0.3, zoom)); };
  const separacion = () => { const [a, b] = [...punteros.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

  el.addEventListener("pointerdown", e => {
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    el.setPointerCapture(e.pointerId);
    ultimoX = e.clientX; ultimoY = e.clientY; vel = 0;
    if (punteros.size === 2) { distPellizco = separacion(); arrastrando = false; }
    else { arrastrando = true; caja.classList.add("girando"); }
   
  });
  el.addEventListener("pointermove", e => {
    if (!punteros.has(e.pointerId)) return;
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.size === 2) {
      // Dos dedos: pellizcar para acercar o alejar
      const d = separacion();
      if (distPellizco > 0) { zoom *= distPellizco / d; limitarZoom(); }
      distPellizco = d;
      return;
    }
    if (!arrastrando) return;
    const dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
    ultimoX = e.clientX; ultimoY = e.clientY;
    theta -= dx * 0.008; vel = -dx * 0.008;
    phi = Math.min(1.35, Math.max(0.18, phi + dy * 0.006));
  });
  const soltar = e => {
    punteros.delete(e.pointerId);
    distPellizco = 0;
    if (punteros.size === 1) { const [p] = [...punteros.values()]; ultimoX = p.x; ultimoY = p.y; arrastrando = true; }
    else { arrastrando = false; caja.classList.remove("girando"); }
  };
  el.addEventListener("pointerup", soltar); el.addEventListener("pointercancel", soltar);
  // Rueda del ratón: acercar o alejar solo sobre el esquema
  el.addEventListener("wheel", e => {
    e.preventDefault();
    zoom *= Math.exp(e.deltaY * 0.0012); limitarZoom();
   
  }, { passive: false });
  // Clic (sin arrastrar) sobre una parte de T1, T2 o T3: se despliega una pequeña etiqueta con la sección 3
  let bajoX = 0, bajoY = 0;
  el.addEventListener("pointerdown", e => { bajoX = e.clientX; bajoY = e.clientY; });
  const rayo = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const etiqueta = document.createElement("div");
  etiqueta.className = "lote-etiqueta";
  etiqueta.hidden = true;
  caja.appendChild(etiqueta);
  const cerrarEtiqueta = () => { etiqueta.hidden = true; };
  function abrirEtiqueta(m, x, y) {
    // Al picar una torre se despliega su implantación; dentro de la card se elige la tipología
    const n = m.userData.torre, t4y5 = n >= 4;
    const planoTipo = document.querySelector('.planta-svg[aria-label="' + (t4y5 ? "Planta tipo Torres 4 y 5" : "Planta tipo Torres 1, 2 y 3") + '"]');
    const implantacion = t4y5 ? planoTipo : document.querySelector('svg.implantacion-mod[aria-label^="Implantación 123"]');
    if (!planoTipo || !implantacion) return;
    const limpiar = origen => {
      const copia = origen.cloneNode(true);
      copia.removeAttribute("style");
      copia.querySelectorAll("[tabindex]").forEach(c => c.removeAttribute("tabindex"));
      copia.querySelectorAll("[role]").forEach(c => c.removeAttribute("role"));
      copia.querySelectorAll(".co-cartas, .co-guias").forEach(c => c.remove());
      return copia;
    };
    const tituloDe = g => g.querySelector("title") ? g.querySelector("title").textContent : "";
    const tipos = t4y5
      ? [...new Set([...planoTipo.querySelectorAll("g.planta-u")].map(g => tituloDe(g).match(new RegExp("Torre " + n + " · Tipología (\\d+):"))).filter(Boolean).map(r => Number(r[1])))].sort((p, q) => p - q)
      : [1];
    etiqueta.innerHTML = '<button type="button" class="le-cerrar" aria-label="Cerrar">×</button><b>Torre ' + n + '</b>';
    const mapa = document.createElement("div"), datos = document.createElement("p"), fila = document.createElement("div");
    mapa.className = "le-mapa"; fila.className = "le-chips";
    const chips = [];
    const marcar = i => chips.forEach((c, k) => c.classList.toggle("activo", k === i));
    const verImplantacion = () => {
      const copia = limpiar(implantacion);
      copia.querySelectorAll("g.g-torre").forEach(g => { g.style.opacity = Number(g.dataset.torre) === n ? "1" : "0.3"; });
      mapa.replaceChildren(copia); datos.textContent = ""; marcar(0);
    };
    const verTipo = (tip, i) => {
      const copia = limpiar(planoTipo);
      const clave = t4y5 ? "Torre " + n + " · Tipología " + tip + ":" : "Tipología 1:";
      let texto = "";
      copia.querySelectorAll("g.planta-u, g.planta-resto").forEach(g => {
        const t = tituloDe(g), activa = t.includes(clave);
        g.style.opacity = activa ? "1" : "0.3";
        if (activa && !texto) texto = t.split(": ")[1].split(" · ").slice(0, 2).join(" · ");
      });
      mapa.replaceChildren(copia); datos.textContent = texto; marcar(i);
    };
    [["Implantación", verImplantacion]].concat(tipos.map((tip, k) => [t4y5 ? "Tipo " + tip : "Tipología 1", () => verTipo(tip, k + 1)])).forEach(([texto, fn]) => {
      const c = document.createElement("button");
      c.type = "button"; c.className = "le-chip"; c.textContent = texto;
      c.addEventListener("click", fn);
      chips.push(c); fila.appendChild(c);
    });
    etiqueta.appendChild(mapa); etiqueta.appendChild(fila); etiqueta.appendChild(datos);
    etiqueta.querySelector(".le-cerrar").addEventListener("click", cerrarEtiqueta);
    verImplantacion();
    etiqueta.hidden = false;
    const r = caja.getBoundingClientRect();
    const ancho = etiqueta.offsetWidth, alto = etiqueta.offsetHeight;
    etiqueta.style.left = Math.max(6, Math.min(x - r.left + 14, r.width - ancho - 6)) + "px";
    etiqueta.style.top = Math.max(6, Math.min(y - r.top - alto / 2, r.height - alto - 6)) + "px";
  }
  el.addEventListener("click", e => {
    if (Math.hypot(e.clientX - bajoX, e.clientY - bajoY) > 5) return;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(ndc, camara);
    const toque = rayo.intersectObjects(piezasClic, false)[0];
    if (toque) abrirEtiqueta(toque.object, e.clientX, e.clientY); else cerrarEtiqueta();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarEtiqueta(); });
  el.addEventListener("dblclick", () => { theta = inicial.theta; phi = inicial.phi; zoom = 1; vel = 0; });

  function ajustar() {
    const r = caja.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camara.aspect = r.width / Math.max(1, r.height);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(caja);
  ajustar();

  // --- Bucle: giro con inercia y niveles de T4 y T5 de cristal a sólido -----------------------
  const reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAUSA = 5, TICK = 450;
  let paso = 0, acumulado = 0, previo = performance.now(), visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(caja);

  function aplicar(k) {
    const n = niveles[k];
    n.mats.forEach(m => {
      m.mat.color.copy(vidrio).lerp(m.solido, n.p);
      m.mat.opacity = m.opV + (m.opS - m.opV) * n.p;
      if (!m.linea) m.mat.depthWrite = m.opS >= 1 && n.p > 0.9;
      if (m.linea) m.mat.color.copy(new THREE.Color(0xffffff)).lerp(m.solido, n.p);
    });
  }
  niveles.forEach((n, k) => { n.p = reducido ? 1 : 0; n.objetivo = n.p; aplicar(k); });

  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (ahora - previo) / 1000); previo = ahora;
    if (!visible) return;
    if (!arrastrando && Math.abs(vel) > 0.0003) { theta += vel; vel *= 0.94; }
    if (!reducido) {
      acumulado += dt * 1000;
      while (acumulado >= TICK) {
        acumulado -= TICK;
        if (paso < NIVELES) niveles[paso].objetivo = 1;
        else if (paso === NIVELES + PAUSA - 1) niveles.forEach(n => { n.objetivo = 0; });
        paso = (paso + 1) % (NIVELES + PAUSA);
      }
      niveles.forEach((n, k) => {
        if (n.p !== n.objetivo) { n.p += Math.sign(n.objetivo - n.p) * Math.min(Math.abs(n.objetivo - n.p), dt / 0.4); aplicar(k); }
      });
    }
    colocar();
    renderer.render(escena, camara);
  }
  requestAnimationFrame(cuadro);
})();
