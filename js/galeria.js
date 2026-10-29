// Galería, visor y secciones compartidos por todas las páginas del sitio. Cada
// parte se activa solo si su sección está en la página actual.
// Los puntos son botones sobre la imagen: al hacer clic despliegan su etiqueta.
// En modo administrador (body.modo-admin) la barra de edición del visor permite
// crearlos, nombrarlos, moverlos y eliminarlos.
(function () {
  const F = window.Fontanella;
  const fotos = window.GALERIA;
  const ADMIN = document.body.classList.contains("modo-admin");
  const puntos = F.cargarPuntos();

  const $ = id => document.getElementById(id);
  const rejilla = $("rejilla");
  const filtros = $("filtros");
  const visor = $("visor");
  const visorImg = $("visor-img");
  const lienzo = $("visor-lienzo");
  const capa = $("visor-puntos");
  const lista = $("visor-lista");

  // Secuencia que recorre el visor: la galería filtrada actual.
  let secuencia = fotos.map(f => f.id);
  let posicion = 0;
  let seleccion = -1;     // índice del botón seleccionado (administrador)
  let modoCrear = false;

  $("anio").textContent = new Date().getFullYear();

  // Avisa de cada imagen creada para que el administrador le añada su grilla.
  function avisar(tipo, contenedor, img, id) {
    document.dispatchEvent(new CustomEvent("fontanella:" + tipo, { detail: { contenedor, img, id } }));
  }

  // Imágenes del diseño enlazadas por id (data-img="...").
  document.querySelectorAll(".imagen-id").forEach(el => {
    const foto = F.buscar(el.dataset.img);
    if (!foto) return;
    const img = document.createElement("img");
    img.src = F.ruta(foto.id);
    img.alt = foto.titulo;
    el.appendChild(img);
    el.addEventListener("click", () => abrir(foto.id, fotos.map(f => f.id)));
    avisar("imagen", el, img, foto.id);
  });

  if (filtros) {
    // Filtros por categoría
    const categorias = ["todas", ...new Set(fotos.map(f => f.categoria))];
    categorias.forEach(cat => {
      const b = document.createElement("button");
      b.className = "filtro" + (cat === "todas" ? " activo" : "");
      b.textContent = cat === "todas" ? "Todas" : window.CATEGORIAS[cat] || cat;
      b.dataset.categoria = cat;
      b.addEventListener("click", () => filtrar(cat));
      filtros.appendChild(b);
    });
  }

  function filtrar(cat) {
    if (filtros) filtros.querySelectorAll(".filtro").forEach(b => b.classList.toggle("activo", b.dataset.categoria === cat));
    const visibles = fotos.filter(f => cat === "todas" || f.categoria === cat);
    secuencia = visibles.map(f => f.id);
    pintarRejilla(visibles);
  }

  function pintarRejilla(lista) {
    rejilla.innerHTML = "";
    lista.forEach(foto => crearTarjeta(rejilla, foto, () => secuencia));
  }

  function crearTarjeta(destino, foto, orden) {
    const tarjeta = document.createElement("button");
    tarjeta.className = "miniatura" + (foto.carpeta === "planos" ? " miniatura-plano" : "");
    tarjeta.id = "img-" + foto.id;
    tarjeta.innerHTML =
      '<img loading="lazy" alt="">' +
      '<span class="miniatura-id"></span>' +
      '<span class="insignia" hidden></span>' +
      '<span class="miniatura-titulo"></span>';
    const img = tarjeta.querySelector("img");
    img.src = F.ruta(foto.id);
    img.alt = foto.titulo;
    tarjeta.querySelector(".miniatura-id").textContent = foto.id;
    tarjeta.querySelector(".miniatura-titulo").textContent = foto.titulo;
    tarjeta.addEventListener("click", () => abrir(foto.id, orden()));
    destino.appendChild(tarjeta);
    actualizarInsignia(foto.id);
    avisar("imagen", tarjeta, img, foto.id);
  }

  // Planos: mismo visor, botones y grilla que la galería.
  const rejillaPlanos = $("rejilla-planos");
  const idsPlanos = window.PLANOS.map(p => p.id);
  if (rejillaPlanos) {
    window.PLANOS.forEach(plano => crearTarjeta(rejillaPlanos, plano, () => idsPlanos));
    $("planos-vacio").hidden = window.PLANOS.length > 0;
  }

  function actualizarInsignia(id) {
    const insignia = document.querySelector("#img-" + CSS.escape(id) + " .insignia");
    if (!insignia) return;
    const n = (puntos[id] || []).length;
    insignia.hidden = !n;
    insignia.textContent = n + (n === 1 ? " punto" : " puntos");
  }

  function abrir(id, orden) {
    secuencia = orden;
    posicion = Math.max(0, secuencia.indexOf(id));
    mostrar();
    if (!visor.open) visor.showModal();
  }

  function fotoActual() {
    return F.buscar(secuencia[posicion]);
  }

  function marcasActuales() {
    return puntos[fotoActual().id] || [];
  }

  function mostrar() {
    const foto = fotoActual();
    $("visor-id").textContent = "ID " + foto.id;
    $("visor-titulo").textContent = foto.titulo;
    $("visor-contador").textContent = (posicion + 1) + " / " + secuencia.length;
    $("visor-resolucion").textContent = "";
    capa.innerHTML = "";
    lista.innerHTML = "";
    seleccion = -1;
    if (ADMIN) activarCrear(false);
    history.replaceState(null, "", "#" + foto.id);

    visorImg.onload = null;
    visorImg.alt = foto.titulo;
    visorImg.src = F.ruta(foto.id);
    if (visorImg.complete && visorImg.naturalWidth) dibujarPuntos();
    else visorImg.onload = () => dibujarPuntos();
    avisar("visor", lienzo, visorImg, foto.id);
  }

  function dibujarPuntos() {
    const ancho = visorImg.naturalWidth;
    const alto = visorImg.naturalHeight;
    const marcas = marcasActuales();
    $("visor-resolucion").textContent = "Resolución " + ancho + " × " + alto + " px";
    capa.innerHTML = "";
    lista.innerHTML = "";

    if (!marcas.length) {
      lista.innerHTML = ADMIN
        ? '<li class="vacio">Pulsa «Crear botón» y haz clic sobre la imagen.</li>'
        : '<li class="vacio">Esta imagen no tiene puntos señalados.</li>';
    }

    marcas.forEach((p, i) => {
      const m = document.createElement("button");
      m.className = "marcador" + (i === seleccion ? " seleccionado abierto" : "");
      m.style.left = ((p.x + 0.5) / ancho * 100) + "%";
      m.style.top = ((p.y + 0.5) / alto * 100) + "%";
      m.textContent = i + 1;
      m.setAttribute("aria-label", p.titulo);
      m.setAttribute("aria-expanded", i === seleccion);
      const globo = document.createElement("span");
      globo.className = "globo";
      globo.innerHTML = "<strong></strong><span></span>";
      globo.querySelector("strong").textContent = p.titulo;
      globo.querySelector("span").textContent = p.descripcion || "";
      m.appendChild(globo);
      capa.appendChild(m);

      const li = document.createElement("li");
      li.className = i === seleccion ? "seleccionado" : "";
      li.innerHTML = "<strong></strong><p></p><small></small>";
      li.querySelector("strong").textContent = p.titulo;
      li.querySelector("p").textContent = p.descripcion || "";
      li.querySelector("small").textContent =
        (ADMIN ? "Celda " + F.codigoCelda(p.x, p.y) + " · " : "") + "x " + p.x + " · y " + p.y + " px";
      li.addEventListener("mouseenter", () => m.classList.add("activo"));
      li.addEventListener("mouseleave", () => m.classList.remove("activo"));
      lista.appendChild(li);

      if (ADMIN) {
        prepararArrastre(m, p, i);
        li.addEventListener("click", () => seleccionar(i));
      } else {
        m.addEventListener("click", e => { e.stopPropagation(); alternarEtiqueta(m); });
        li.addEventListener("click", () => alternarEtiqueta(m, true));
      }
    });

    if (ADMIN) actualizarBarra();
  }

  // Un clic en el botón despliega su etiqueta; solo una abierta a la vez.
  function alternarEtiqueta(m, forzar) {
    const abrirla = forzar || !m.classList.contains("abierto");
    capa.querySelectorAll(".marcador").forEach(x => {
      x.classList.remove("abierto");
      x.setAttribute("aria-expanded", "false");
    });
    m.classList.toggle("abierto", abrirla);
    m.setAttribute("aria-expanded", abrirla);
  }

  function pixelDesdeEvento(e) {
    const r = visorImg.getBoundingClientRect();
    const ancho = visorImg.naturalWidth;
    const alto = visorImg.naturalHeight;
    return {
      x: Math.min(Math.max(Math.floor((e.clientX - r.left) / r.width * ancho), 0), ancho - 1),
      y: Math.min(Math.max(Math.floor((e.clientY - r.top) / r.height * alto), 0), alto - 1)
    };
  }

  // ---- Barra de edición (solo administrador) ----

  function activarCrear(activo) {
    modoCrear = activo;
    $("crear-boton").classList.toggle("activo", activo);
    $("crear-boton").setAttribute("aria-pressed", activo);
    lienzo.classList.toggle("creando", activo);
    $("editar-ayuda").textContent = activo
      ? "Haz clic sobre la imagen donde irá el botón (Esc para cancelar)."
      : "Selecciona un botón para editarlo o arrástralo para moverlo.";
  }

  function seleccionar(i) {
    seleccion = i;
    dibujarPuntos();
    if (i >= 0) $("editar-nombre").focus();
  }

  function actualizarBarra() {
    const p = marcasActuales()[seleccion];
    const nombre = $("editar-nombre");
    const etiqueta = $("editar-etiqueta");
    nombre.disabled = etiqueta.disabled = $("eliminar-boton").disabled = !p;
    nombre.value = p ? p.titulo : "";
    etiqueta.value = p ? p.descripcion || "" : "";
    $("editar-posicion").textContent = p
      ? "Botón " + (seleccion + 1) + " · celda " + F.codigoCelda(p.x, p.y) + " · x " + p.x + " · y " + p.y + " px"
      : "";
  }

  function guardar() {
    F.guardarPuntos(puntos);
    actualizarInsignia(fotoActual().id);
  }

  // Arrastrar mueve el botón; un clic sin arrastrar lo selecciona.
  function prepararArrastre(m, p, i) {
    let inicio = null;
    let movido = false;
    m.addEventListener("pointerdown", e => {
      e.stopPropagation();
      inicio = { x: e.clientX, y: e.clientY };
      movido = false;
      m.setPointerCapture(e.pointerId);
    });
    m.addEventListener("pointermove", e => {
      if (!inicio) return;
      if (!movido && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 4) return;
      movido = true;
      const pos = pixelDesdeEvento(e);
      p.x = pos.x;
      p.y = pos.y;
      m.style.left = ((p.x + 0.5) / visorImg.naturalWidth * 100) + "%";
      m.style.top = ((p.y + 0.5) / visorImg.naturalHeight * 100) + "%";
    });
    m.addEventListener("pointerup", () => {
      if (!inicio) return;
      inicio = null;
      if (movido) guardar();
      seleccionar(i);
    });
    m.addEventListener("click", e => e.stopPropagation());
  }

  if (ADMIN) {
    $("crear-boton").addEventListener("click", () => activarCrear(!modoCrear));

    lienzo.addEventListener("click", e => {
      if (e.target.closest(".marcador, .activar-grilla") || !visorImg.naturalWidth) return;
      if (!modoCrear) {
        if (seleccion >= 0) seleccionar(-1);
        return;
      }
      const { x, y } = pixelDesdeEvento(e);
      const foto = fotoActual();
      const marcas = puntos[foto.id] || (puntos[foto.id] = []);
      marcas.push({ x, y, titulo: "Botón " + (marcas.length + 1), descripcion: "" });
      guardar();
      activarCrear(false);
      seleccionar(marcas.length - 1);
      $("editar-nombre").select();
    });

    $("editar-nombre").addEventListener("input", e => {
      const p = marcasActuales()[seleccion];
      if (!p) return;
      p.titulo = e.target.value;
      guardar();
      refrescarTextos(p);
    });
    $("editar-etiqueta").addEventListener("input", e => {
      const p = marcasActuales()[seleccion];
      if (!p) return;
      p.descripcion = e.target.value;
      guardar();
      refrescarTextos(p);
    });
    $("eliminar-boton").addEventListener("click", () => {
      const foto = fotoActual();
      if (!puntos[foto.id] || seleccion < 0) return;
      puntos[foto.id].splice(seleccion, 1);
      if (!puntos[foto.id].length) delete puntos[foto.id];
      guardar();
      seleccionar(-1);
    });

    // Al cambiar el tamaño de celda se recalculan los códigos.
    document.addEventListener("fontanella:celda", () => {
      if (visor.open && visorImg.naturalWidth) dibujarPuntos();
    });
  } else {
    lienzo.addEventListener("click", e => {
      if (!e.target.closest(".marcador")) capa.querySelectorAll(".abierto").forEach(m => m.classList.remove("abierto"));
    });
  }

  // Actualiza la etiqueta y la lista sin redibujar (no interrumpe la escritura).
  function refrescarTextos(p) {
    const m = capa.querySelectorAll(".marcador")[seleccion];
    const li = lista.children[seleccion];
    if (m) {
      m.querySelector(".globo strong").textContent = p.titulo;
      m.querySelector(".globo span").textContent = p.descripcion;
      m.setAttribute("aria-label", p.titulo);
    }
    if (li) {
      li.querySelector("strong").textContent = p.titulo;
      li.querySelector("p").textContent = p.descripcion;
    }
  }

  function mover(paso) {
    posicion = (posicion + paso + secuencia.length) % secuencia.length;
    mostrar();
  }

  $("visor-anterior").addEventListener("click", () => mover(-1));
  $("visor-siguiente").addEventListener("click", () => mover(1));
  $("visor-cerrar").addEventListener("click", () => visor.close());
  visor.addEventListener("click", e => { if (e.target === visor) visor.close(); });
  visor.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  visor.addEventListener("cancel", e => {
    // Esc cancela primero el modo crear antes de cerrar el visor.
    if (ADMIN && modoCrear) {
      e.preventDefault();
      activarCrear(false);
    }
  });
  document.addEventListener("keydown", e => {
    if (!visor.open || e.target.matches("input, textarea")) return;
    if (e.key === "ArrowLeft") mover(-1);
    if (e.key === "ArrowRight") mover(1);
  });

  // Carrusel: vistas aéreas en "Explorador" o la galería en el inicio
  // (data-fuente="galeria"). La pista se desliza con scroll-snap
  // (incluido el arrastre táctil); flechas y miniaturas solo la desplazan.
  const pista = $("carrusel-pista");
  const tiras = $("carrusel-miniaturas");
  const fuentes = { galeria: window.GALERIA, planos: window.PLANOS };
  const fotosCarrusel = (pista && fuentes[pista.dataset.fuente]) || window.DRONE;
  const idsDrone = fotosCarrusel.map(d => d.id);
  let actual = 0;

  if (pista) {
    if ($("explorador")) $("explorador").hidden = !idsDrone.length;
    if ($("planos-vacio")) { $("planos-vacio").hidden = idsDrone.length > 0; $("carrusel").hidden = !idsDrone.length; }

    fotosCarrusel.forEach((foto, i) => {
      const diapositiva = document.createElement("button");
      diapositiva.className = "carrusel-diapositiva";
      diapositiva.setAttribute("aria-label", foto.titulo + " (" + (i + 1) + " de " + idsDrone.length + ")");
      const img = document.createElement("img");
      if (i) img.loading = "lazy";
      img.src = F.ruta(foto.id);
      img.alt = foto.titulo;
      diapositiva.appendChild(img);
      diapositiva.addEventListener("click", () => abrir(foto.id, idsDrone));
      pista.appendChild(diapositiva);
      avisar("imagen", diapositiva, img, foto.id);

      const mini = document.createElement("button");
      mini.className = "carrusel-miniatura";
      mini.setAttribute("aria-label", "Ir a " + foto.titulo);
      mini.innerHTML = '<img loading="lazy" alt="">';
      mini.querySelector("img").src = F.ruta(foto.id);
      mini.addEventListener("click", () => irA(i));
      tiras.appendChild(mini);
    });

    function irA(i) {
      i = (i + idsDrone.length) % idsDrone.length;
      pista.scrollTo({ left: i * pista.clientWidth, behavior: "smooth" });
    }

    function marcarActual(i) {
      actual = i;
      $("carrusel-contador").textContent = (i + 1) + " / " + idsDrone.length;
      [...tiras.children].forEach((m, j) => m.classList.toggle("activa", j === i));
      const mini = tiras.children[i];
      if (mini) tiras.scrollTo({ left: mini.offsetLeft - (tiras.clientWidth - mini.offsetWidth) / 2, behavior: "smooth" });
    }

    pista.addEventListener("scroll", () => {
      const i = Math.round(pista.scrollLeft / pista.clientWidth);
      if (i !== actual) marcarActual(i);
    }, { passive: true });
    $("carrusel-anterior").addEventListener("click", () => irA(actual - 1));
    $("carrusel-siguiente").addEventListener("click", () => irA(actual + 1));
    $("carrusel").addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      irA(actual + (e.key === "ArrowLeft" ? -1 : 1));
    });
    if (idsDrone.length) marcarActual(0);
  }

  // Planos en PDF: una tarjeta por archivo de img/planos/pdf
  const listaPdf = $("lista-pdf");
  if (listaPdf) {
    const pdfs = window.PLANOS_PDF || [];
    $("pdf-vacio").hidden = pdfs.length > 0;
    pdfs.forEach(p => {
      const li = document.createElement("li");
      const ruta = F.RUTA_IMG + "planos/pdf/" + p.archivo;
      li.innerHTML = '<span class="pdf-icono">PDF</span><b></b><span class="pdf-acciones"><a class="boton boton-borde" target="_blank" rel="noopener">Ver</a><a class="boton boton-naranja" download>Descargar</a></span>';
      li.querySelector("b").textContent = p.titulo || p.archivo;
      li.querySelectorAll("a").forEach(a => (a.href = ruta));
      listaPdf.appendChild(li);
    });
  }

  // Presentación: menú lateral con el alcance de la segunda etapa. Cada apartado
  // se muestra en el panel; si tiene "img" la imagen se abre en el visor, si no,
  // se avisa que la planimetría está pendiente.
  const menuPresentacion = $("presentacion-menu");
  const panel = $("presentacion-panel");
  const apartados = [];        // recorrido en orden del menú: { item, ruta }
  const idsPresentacion = [];

  function crearMenu(items, destino, ruta) {
    const ol = document.createElement("ol");
    items.forEach(item => {
      const r = ruta.concat(item);
      apartados.push({ item, ruta: r });
      if (item.img && F.buscar(item.img)) idsPresentacion.push(item.img);
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.className = "presentacion-enlace";
      b.dataset.apartado = item.id;
      b.textContent = item.titulo;
      if (item.nota) b.appendChild(nodo("small", "", item.nota));
      b.addEventListener("click", () => verApartado(item.id));
      li.appendChild(b);
      if (item.hijos) crearMenu(item.hijos, li, r);
      ol.appendChild(li);
    });
    destino.appendChild(ol);
  }

  function nodo(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  }

  function verApartado(id) {
    const pos = apartados.findIndex(a => a.item.id === id);
    if (pos < 0) return;
    const { item, ruta } = apartados[pos];

    menuPresentacion.querySelectorAll(".presentacion-enlace").forEach(b => {
      const activo = b.dataset.apartado === id;
      b.classList.toggle("activo", activo);
      b.classList.toggle("en-ruta", !activo && ruta.some(r => r.id === b.dataset.apartado));
      if (activo) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });

    panel.innerHTML = "";
    const migas = ruta.slice(0, -1).map(r => r.titulo).join(" › ");
    panel.appendChild(nodo("p", "etiqueta", migas || "Segunda etapa"));
    panel.appendChild(nodo("h3", "", item.titulo));
    if (item.nota) panel.appendChild(nodo("p", "presentacion-nota", item.nota));
    if (item.texto) panel.appendChild(nodo("p", "presentacion-texto", item.texto));

    if (item.hijos) {
      const ul = nodo("ul", "presentacion-hijos");
      item.hijos.forEach(h => {
        const b = nodo("button", "", h.titulo);
        if (h.nota) b.appendChild(nodo("small", "", h.nota));
        b.addEventListener("click", () => verApartado(h.id));
        const li = nodo("li");
        li.appendChild(b);
        ul.appendChild(li);
      });
      panel.appendChild(ul);
    }

    const foto = item.img && F.buscar(item.img);
    if (foto) {
      const marco = nodo("button", "imagen-id presentacion-imagen");
      marco.setAttribute("aria-label", "Ampliar " + item.titulo);
      const img = nodo("img");
      img.src = F.ruta(foto.id);
      img.alt = item.titulo;
      marco.appendChild(img);
      marco.addEventListener("click", () => abrir(foto.id, idsPresentacion));
      panel.appendChild(marco);
      avisar("imagen", marco, img, foto.id);
    } else {
      const pendiente = nodo("div", "presentacion-pendiente");
      const aviso = nodo("div");
      aviso.appendChild(nodo("strong", "", "Planimetría e imágenes 3D en preparación"));
      if (ADMIN) aviso.appendChild(nodo("span", "", "Asigna una imagen a «" + item.id + "» con la propiedad img en js/datos.js."));
      pendiente.appendChild(aviso);
      panel.appendChild(pendiente);
    }

    const pasos = nodo("div", "presentacion-pasos");
    [[pos - 1, "‹ Anterior"], [pos + 1, "Siguiente ›"]].forEach(([j, texto]) => {
      const destino = apartados[j];
      const b = nodo("button", "boton boton-borde", texto);
      b.disabled = !destino;
      if (destino) {
        b.title = destino.item.titulo;
        b.addEventListener("click", () => verApartado(destino.item.id));
      }
      pasos.appendChild(b);
    });
    panel.appendChild(pasos);
  }

  if (menuPresentacion) {
    crearMenu(window.PRESENTACION, menuPresentacion, []);
    if (apartados.length) verApartado(apartados[0].item.id);
  }

  if (rejilla) filtrar("todas");

  // Enlace directo: galeria.html#p1 abre esa imagen.
  const inicial = location.hash.slice(1);
  if (F.buscar(inicial)) {
    abrir(inicial, idsPlanos.includes(inicial) ? idsPlanos : idsDrone.includes(inicial) ? idsDrone : secuencia);
  }
})();
