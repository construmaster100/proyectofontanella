/* Visualizador 3D del modelo Collada (docs/3d/Project1.dae, exportado de Revit con Lumion LiveSync).
   three.js r128 (js/vendor) + ColladaLoader + OrbitControls. Página: pages/modelo-3d.html.
   - Desde un servidor (hosting o servidor local) carga docs/3d/Project1.dae solo.
   - Abierto como archivo (file://) el navegador impide leer el modelo: se elige el .dae (y la carpeta de texturas) con los botones o arrastrándolos. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id), canvas = $("c3d"), stage = $("stage3d");
  if (!canvas || !window.THREE || !THREE.ColladaLoader || !THREE.OrbitControls) return;
  const RUTA_MODELO = "../docs/3d/Project1.dae", RUTA_TEX = "../docs/3d/Project1_Textures/";
  const http = /^https?:$/.test(location.protocol);
  const fmt = (v, n = 2) => v.toLocaleString("es-CO", { minimumFractionDigits: n, maximumFractionDigits: n });
  const estado = t => { $("m3dEstado").textContent = t; };

  /* ---------- escena ---------- */
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { estado("El navegador bloqueó el 3D (WebGL). Cierra el navegador por completo, ábrelo de nuevo y vuelve a esta página."); $("m3dCarga").hidden = true; console.error(e); return; }
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); estado("La tarjeta gráfica se reinició y el navegador detuvo el 3D. Recarga la página; si no vuelve, cierra el navegador y ábrelo de nuevo."); });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = false; renderer.shadowMap.type = THREE.PCFShadowMap;   // sombras apagadas al abrir: se encienden en «Sol y sombras»
  renderer.toneMapping = THREE.NoToneMapping;   // los colores del MTL ya vienen listos para pantalla
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xeef0f6);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20000); camera.position.set(80, 60, 80);
  const controls = new THREE.OrbitControls(camera, canvas); controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x9a9585, 1.0));                                         // cielo y rebote del suelo
  const sol = new THREE.DirectionalLight(0xfff1dc, 1.3); sol.castShadow = false; sol.shadow.mapSize.set(1024, 1024); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03;
  scene.add(sol, sol.target);
  const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e5);                                        // corte horizontal: quita lo que queda por encima de la altura elegida
  const corteX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e5), corteZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e5);   // cortes verticales: lateral y de frente
  renderer.clippingPlanes = [corte, corteX, corteZ];
  const marcas = new THREE.Group(); scene.add(marcas);
  let modelo = null, blobs = {}, materiales = new Map(), medir = false, puntos = [];
  const caja = new THREE.Box3();
  function ponSol() {   // sol por dirección (azimut) y altura; su cámara de sombras abarca todo el modelo
    const az = +$("m3dSolAz").value * Math.PI / 180, el = +$("m3dSolEl").value * Math.PI / 180;
    $("m3dSolAzTxt").textContent = $("m3dSolAz").value + "°"; $("m3dSolElTxt").textContent = $("m3dSolEl").value + "°";
    if (caja.isEmpty()) return;
    const c = caja.getCenter(new THREE.Vector3()), r = caja.getSize(new THREE.Vector3()).length() / 2;
    sol.position.set(c.x + 2 * r * Math.cos(el) * Math.sin(az), c.y + 2 * r * Math.sin(el), c.z + 2 * r * Math.cos(el) * Math.cos(az)); sol.target.position.copy(c);
    const sc = sol.shadow.camera; sc.left = sc.bottom = -r; sc.right = sc.top = r; sc.near = r * .1; sc.far = r * 4; sc.updateProjectionMatrix();
  }
  $("m3dSolAz").oninput = $("m3dSolEl").oninput = ponSol; ponSol();
  $("m3dSombras").onchange = e => { renderer.shadowMap.enabled = sol.castShadow = e.target.checked; if (modelo) modelo.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); }); };
  const pbrs = new Map();
  function pbr(m) {   // material físico: vidrio translúcido; el corte también recorta las sombras
    if (m.isMeshStandardMaterial) return m;
    if (pbrs.has(m.uuid)) return pbrs.get(m.uuid);
    const vidrio = m.transparent || m.opacity < .99;
    const n = new THREE.MeshStandardMaterial({ name: m.name, map: m.map || null, side: THREE.DoubleSide, roughness: vidrio ? .08 : .85, metalness: 0, clipShadows: true,
      color: m.map ? 0xffffff : (m.color ? m.color.clone() : 0xcccccc) });
    if (n.map) n.map.anisotropy = renderer.capabilities.getMaxAnisotropy();   // texturas nítidas en ángulo; se dejan en lineal: así el terreno no se oscurece
    if (vidrio) { Object.assign(n, { transparent: true, opacity: .3, depthWrite: false }); n.color.set(0xb9d3e3).convertSRGBToLinear(); }
    pbrs.set(m.uuid, n); return n;
  }

  function ajustaTamano() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(ajustaTamano).observe(stage); ajustaTamano();
  (function bucle() { requestAnimationFrame(bucle); controls.update(); renderer.render(scene, camera); })();

  /* ---------- carga ---------- */
  const nombreBase = u => decodeURIComponent(u.split("?")[0]).split(/[\\/]/).pop();
  const gestor = new THREE.LoadingManager();
  gestor.setURLModifier(u => { const n = nombreBase(u); return blobs[n.toLowerCase()] || (http ? RUTA_TEX + n : u); });   // las texturas del DAE traen rutas absolutas del disco de origen
  function analiza(texto) {
    estado("Analizando el modelo (52 MB: puede tardar un minuto)…");
    setTimeout(() => {
      try { monta(new THREE.ColladaLoader(gestor).parse(texto, "").scene); }
      catch (e) { estado("No se pudo leer el modelo: " + e.message); console.error(e); }
    }, 80);
  }
  function cargaHttp() {
    const x = new XMLHttpRequest(); x.open("GET", RUTA_MODELO); x.responseType = "text";
    x.onprogress = e => estado(e.lengthComputable ? "Descargando el modelo… " + Math.round(e.loaded / e.total * 100) + " %" : "Descargando el modelo… " + Math.round(e.loaded / 1048576) + " MB");
    const falla = t => { estado(t); $("m3dCarga").hidden = false; };
    x.onload = () => x.status === 200 ? (($("m3dCarga").hidden = true), analiza(x.responseText)) : falla("No se encontró docs/3d/Project1.dae en el servidor (" + x.status + "). Elige el archivo con el botón.");
    x.onerror = () => falla("No se pudo descargar el modelo. Elige el archivo con el botón.");
    $("m3dCarga").hidden = true; x.send(); estado("Descargando el modelo…");
  }
  async function desdeArchivos(lista) {
    const fs = [...lista];
    fs.filter(f => !/\.dae$/i.test(f.name)).forEach(f => { blobs[f.name.toLowerCase()] = URL.createObjectURL(f); });
    const dae = fs.find(f => /\.dae$/i.test(f.name));
    if (!dae) { estado(fs.length ? "Texturas cargadas (" + fs.length + "). Elige también el archivo .dae." : "Elige el archivo .dae."); return; }
    estado("Leyendo " + dae.name + " (" + Math.round(dae.size / 1048576) + " MB)…"); analiza(await dae.text());
  }
  $("m3dBtnDae").onclick = () => $("m3dArchivos").click();
  $("m3dBtnCarpeta").onclick = () => $("m3dCarpeta").click();
  $("m3dArchivos").onchange = e => desdeArchivos(e.target.files); $("m3dCarpeta").onchange = e => desdeArchivos(e.target.files);
  stage.addEventListener("dragover", e => { e.preventDefault(); }); stage.addEventListener("drop", e => { e.preventDefault(); desdeArchivos(e.dataTransfer.files); });

  function desdePaquete() {   // modelo empaquetado (herramientas/escaner/empaquetar_3d.py): OBJ + MTL + texturas en data URI
    const M = window.MODELO3D; estado("Preparando el modelo (unos 470 000 triángulos: puede tardar unos segundos)…");
    setTimeout(() => {
      try {
        const g = new THREE.LoadingManager(); g.setURLModifier(u => M.texturas[nombreBase(u)] || u);
        const mats = new THREE.MTLLoader(g).parse(M.mtl, ""); mats.preload();
        const obj = new THREE.OBJLoader().setMaterials(mats).parse(M.obj); obj.rotation.x = -Math.PI / 2;   // el OBJ está en metros con Z hacia arriba
        const grupo = new THREE.Group(); grupo.add(obj); monta(grupo);
      } catch (e) { estado("No se pudo leer el modelo: " + e.message); console.error(e); }
    }, 60);
  }

  /* ---------- montaje del modelo ---------- */
  function monta(esc) {
    if (modelo) scene.remove(modelo);
    modelo = esc; scene.add(modelo); materiales.clear(); let tris = 0, mallas = 0;
    modelo.traverse(o => {
      if (!o.isMesh) return; mallas++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      o.material = Array.isArray(o.material) ? o.material.map(pbr) : pbr(o.material); o.castShadow = !o.material.transparent; o.receiveShadow = true;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.side = THREE.DoubleSide; const k = m.name || m.uuid; if (!materiales.has(k)) materiales.set(k, { m, mallas: [] }); materiales.get(k).mallas.push(o); });
    });
    caja.setFromObject(modelo); ponSol(); const t = caja.getSize(new THREE.Vector3());
    $("m3dInfo").innerHTML = `<b>${mallas}</b> mallas · <b>${Math.round(tris).toLocaleString("es-CO")}</b> triángulos<br>Tamaño: ${fmt(t.x, 1)} × ${fmt(t.z, 1)} m en planta · ${fmt(t.y, 1)} m de alto`;
    for (const [id, , eje] of CORTES) { const cs = $(id); cs.min = caja.min[eje]; cs.max = caja.max[eje]; cs.step = (caja.max[eje] - caja.min[eje]) / 400; cs.value = cs.max; }
    actualizaCorte();
    $("m3dMateriales").innerHTML = ""; let i = 0;
    for (const [k, e] of materiales) {
      const id = "mat" + (i++), li = document.createElement("div"); li.className = "layer";
      const col = e.m.color ? "#" + e.m.color.getHexString() : "#999";
      li.innerHTML = `<input type="checkbox" id="${id}" checked><span class="sw" style="background:${col}"></span><span>${k.replace(/_/g, " ")}</span><span></span>`;
      li.firstChild.onchange = ev => e.mallas.forEach(o => { o.visible = ev.target.checked; });
      $("m3dMateriales").appendChild(li);
    }
    vista("persp"); estado("Modelo cargado. Arrastra para girar, clic derecho para mover, rueda para acercar.");
    $("m3dCarga").hidden = true;
  }

  /* ---------- vistas, corte y medida ---------- */
  function vista(v) {
    if (!modelo) return;
    const t = caja.getSize(new THREE.Vector3()), c = caja.getCenter(new THREE.Vector3()), r = Math.max(t.x, t.y, t.z), d = r * 1.5;
    camera.near = r / 2000; camera.far = r * 40; camera.updateProjectionMatrix(); controls.target.copy(c);
    const dir = { persp: [.75, .55, .75], planta: [0.0005, 1, 0.0005], frente: [0, .12, 1], lateral: [1, .12, 0] }[v] || [.75, .55, .75];
    camera.position.set(c.x + dir[0] * d, c.y + dir[1] * d, c.z + dir[2] * d); controls.update();
  }
  document.querySelectorAll("[data-vista]").forEach(b => b.onclick = () => vista(b.dataset.vista));
  const CORTES = [["m3dCorte", corte, "y", "sobre la base"], ["m3dCorteX", corteX, "x", "desde el extremo"], ["m3dCorteZ", corteZ, "z", "desde el extremo"]];
  function actualizaCorte() {   // el control al tope es «sin corte» (el paso del deslizador no lo deja justo en el máximo)
    for (const [id, p, eje, txt] of CORTES) {
      const cs = $(id), v = +cs.value, sin = v >= +cs.max - 1.01 * +cs.step;   // el deslizador puede quedar un paso por debajo del tope
      p.constant = sin ? 1e5 : v; $(id + "Txt").textContent = sin ? "sin corte" : "a " + fmt(v - caja.min[eje], 1) + " m " + txt;
    }
  }
  CORTES.forEach(([id]) => { $(id).oninput = actualizaCorte; });
  $("m3dSinCorte").onclick = () => { CORTES.forEach(([id]) => { $(id).value = $(id).max; }); actualizaCorte(); };
  $("m3dAlambre").onchange = e => materiales.forEach(m => { m.m.wireframe = e.target.checked; });
  $("m3dFondo").onchange = e => { scene.background = new THREE.Color(e.target.checked ? 0x1b2026 : 0xeef0f6); };
  $("m3dMedir").onclick = () => { medir = !medir; $("m3dMedir").setAttribute("aria-pressed", medir); $("m3dMedTxt").textContent = medir ? "Haz clic en dos puntos del modelo." : ""; if (!medir) limpiaMedida(); };
  function limpiaMedida() { puntos = []; while (marcas.children.length) marcas.remove(marcas.children[0]); }
  let abajo = null; canvas.addEventListener("pointerdown", e => { abajo = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", e => {
    if (!medir || !modelo || !abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5) return;
    const r = canvas.getBoundingClientRect(), rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
    const h = rc.intersectObject(modelo, true).find(i => i.object.visible && CORTES.every(c => c[1].distanceToPoint(i.point) >= 0)); if (!h) return;
    if (puntos.length >= 2) limpiaMedida();
    puntos.push(h.point.clone()); const s = Math.max(...caja.getSize(new THREE.Vector3()).toArray()) / 250;
    const bola = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe11d48, depthTest: false })); bola.position.copy(h.point); bola.renderOrder = 9; marcas.add(bola);
    if (puntos.length === 2) {
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), new THREE.LineBasicMaterial({ color: 0xe11d48, depthTest: false })); l.renderOrder = 9; marcas.add(l);
      const d = puntos[1].clone().sub(puntos[0]);
      $("m3dMedTxt").innerHTML = `<b>${fmt(d.length())} m</b> en 3D · horizontal ${fmt(Math.hypot(d.x, d.z))} m · altura ${fmt(Math.abs(d.y))} m`;
    } else $("m3dMedTxt").textContent = "Primer punto marcado; elige el segundo.";
  });
  // primero el modelo empaquetado: un <script> se carga igual desde un archivo (file://) que desde un servidor
  const paquete = document.createElement("script"); paquete.src = "../js/modelo-3d-datos.js";
  const sinPaquete = () => http ? cargaHttp() : (($("m3dCarga").hidden = false), estado("Abierto como archivo: elige Project1.dae (y la carpeta Project1_Textures) con los botones o arrástralos aquí."));
  paquete.onload = () => window.MODELO3D && THREE.OBJLoader && THREE.MTLLoader ? desdePaquete() : sinPaquete(); paquete.onerror = sinPaquete;
  $("m3dCarga").hidden = true; estado("Cargando el modelo (42 MB)…"); document.head.appendChild(paquete);
})();
