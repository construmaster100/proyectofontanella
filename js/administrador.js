// Modo administrador y grilla alfanumérica. Se carga antes de galeria.js y escucha
// las imágenes que esta crea: a cada una le añade un activador de grilla.
// Columnas en letras (A, B… AA) y filas en números, sobre los píxeles originales.
(function () {
  // El modo administrador se activa con ?admin en cualquier página. Este script
  // se carga antes de galeria.js para añadir las barras y la clase modo-admin.
  if (!new URLSearchParams(location.search).has("admin")) return;

  const F = window.Fontanella;
  const $ = id => document.getElementById(id);
  const activas = new Set();   // ids de imagen con la grilla visible

  document.body.classList.add("modo-admin");
  document.title = "Administrador | " + document.title;

  // Los enlaces entre páginas conservan el modo administrador.
  document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(a => {
    const url = new URL(a.getAttribute("href"), location.href);
    url.search = "?admin";
    a.href = url.href;
  });
  const salir = $("enlace-admin");
  salir.textContent = "Salir del administrador";
  salir.href = location.pathname;

  document.querySelector(".barra, .movil-cabecera").insertAdjacentHTML("afterend", `
  <div class="barra-admin">
    <label>Celda
      <select id="celda">
        <option value="10">10 px</option>
        <option value="20">20 px</option>
        <option value="25">25 px</option>
        <option value="50">50 px</option>
        <option value="100">100 px</option>
      </select>
    </label>
    <span>Grillas activas: <strong id="grillas-activas">0</strong></span>
    <button class="boton boton-borde" id="grilla-todas">Activar todas</button>
    <button class="boton boton-borde" id="grilla-ninguna">Desactivar todas</button>
    <span class="barra-admin-ayuda">Pulsa <b>A1</b> en cualquier imagen para ver su grilla. En el visor, usa la barra de edición para crear botones.</span>
    <span class="barra-admin-acciones">
      <button class="boton boton-naranja" id="exportar">Exportar puntos.js</button>
      <label class="boton boton-borde">Importar<input type="file" id="importar" accept=".js,.json" hidden></label>
      <button class="boton boton-borde" id="restablecer">Restablecer</button>
    </span>
  </div>`);

  document.querySelector(".visor-cabecera").insertAdjacentHTML("afterend", `
    <div class="barra-edicion">
      <button class="boton boton-naranja" id="crear-boton" aria-pressed="false">+ Crear botón</button>
      <label>Nombre <input id="editar-nombre" placeholder="Nombre del botón" disabled></label>
      <label>Etiqueta <input id="editar-etiqueta" placeholder="Texto que se despliega al hacer clic" disabled></label>
      <button class="boton boton-borde" id="eliminar-boton" disabled>Eliminar</button>
      <span class="editar-posicion" id="editar-posicion"></span>
      <span class="editar-ayuda" id="editar-ayuda"></span>
    </div>`);
  document.querySelector(".visor-lado h4").textContent = "Botones";
  document.querySelector(".visor-lado h4").insertAdjacentHTML("afterend",
    '<p class="ayuda">Los cambios se guardan en este navegador. Usa «Exportar puntos.js» para publicarlos.</p>');
  let instancias = [];         // { contenedor, img, id, capa, boton }

  try {
    const guardada = parseInt(localStorage.getItem("fontanella_celda"), 10);
    if (guardada) F.tamCelda = guardada;
  } catch (e) { /* sin almacenamiento */ }

  document.addEventListener("fontanella:imagen", e => registrar(e.detail));
  document.addEventListener("fontanella:visor", e => registrar(e.detail));

  function registrar({ contenedor, img, id }) {
    instancias = instancias.filter(i => i.contenedor.isConnected);
    let inst = instancias.find(i => i.contenedor === contenedor);

    if (!inst) {
      inst = { contenedor, img };
      contenedor.classList.add("con-grilla");

      inst.capa = document.createElement("div");
      inst.capa.className = "grilla-an";
      inst.capa.hidden = true;
      img.after(inst.capa);

      // span con role=button: varios contenedores ya son <button>.
      inst.boton = document.createElement("span");
      inst.boton.className = "activar-grilla";
      inst.boton.setAttribute("role", "button");
      inst.boton.tabIndex = 0;
      inst.boton.textContent = "A1";
      const alternar = ev => {
        ev.stopPropagation();
        ev.preventDefault();
        activas.has(inst.id) ? activas.delete(inst.id) : activas.add(inst.id);
        pintarId(inst.id);
      };
      inst.boton.addEventListener("click", alternar);
      inst.boton.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") alternar(ev); });
      contenedor.appendChild(inst.boton);

      // La resolución del visor va en su cabecera; el resto la muestra encima.
      if (contenedor.id === "visor-lienzo") {
        prepararLectura(inst);
      } else {
        inst.resolucion = document.createElement("span");
        inst.resolucion.className = "resolucion";
        contenedor.appendChild(inst.resolucion);
      }
      if (window.ResizeObserver) new ResizeObserver(() => pintar(inst)).observe(contenedor);
      instancias.push(inst);
    }

    inst.id = id;
    if (img.complete && img.naturalWidth) pintar(inst);
    else img.addEventListener("load", () => pintar(inst), { once: true });
  }

  function pintarId(id) {
    instancias.filter(i => i.id === id).forEach(pintar);
    actualizarContador();
  }

  function pintarTodas() {
    instancias.forEach(pintar);
    actualizarContador();
  }

  function pintar(inst) {
    const activa = activas.has(inst.id);
    inst.boton.classList.toggle("activo", activa);
    inst.boton.setAttribute("aria-pressed", activa);
    inst.boton.title = (activa ? "Ocultar" : "Mostrar") + " grilla de " + inst.id;
    inst.capa.hidden = !activa;
    const ancho = inst.img.naturalWidth;
    const alto = inst.img.naturalHeight;
    if (inst.resolucion && ancho) inst.resolucion.textContent = ancho + " × " + alto + " px";
    if (!activa || !ancho) return;

    const c = F.tamCelda;
    const columnas = Math.ceil(ancho / c);
    const filas = Math.ceil(alto / c);
    const capa = inst.capa;
    capa.style.backgroundSize = (c / ancho * 100) + "% " + (c / alto * 100) + "%";
    capa.innerHTML = "";

    // Etiquetas: se saltan algunas si la celda en pantalla es muy pequeña.
    const celdaPantalla = capa.clientWidth * c / ancho;
    const salto = Math.max(1, Math.ceil(18 / celdaPantalla));
    capa.style.setProperty("--tam-etiqueta", Math.min(13, Math.max(8, celdaPantalla * 0.42)) + "px");

    for (let i = 0; i < columnas; i += salto) {
      const centro = (i * c + Math.min(c, ancho - i * c) / 2) / ancho * 100;
      etiqueta(capa, "etiqueta-col", F.letras(i), "left", centro);
    }
    for (let j = 0; j < filas; j += salto) {
      const centro = (j * c + Math.min(c, alto - j * c) / 2) / alto * 100;
      etiqueta(capa, "etiqueta-fila", j + 1, "top", centro);
    }
  }

  function etiqueta(capa, clase, texto, lado, porcentaje) {
    const s = document.createElement("span");
    s.className = clase;
    s.textContent = texto;
    s.style[lado] = porcentaje + "%";
    capa.appendChild(s);
  }

  // En el visor: celda y píxel bajo el cursor.
  function prepararLectura(inst) {
    const lectura = document.createElement("span");
    lectura.className = "visor-celda";
    document.querySelector(".visor-contador").before(lectura);
    const resalte = document.createElement("div");
    resalte.className = "celda-activa";
    resalte.hidden = true;
    inst.capa.after(resalte);

    inst.contenedor.addEventListener("mousemove", e => {
      const ancho = inst.img.naturalWidth;
      const alto = inst.img.naturalHeight;
      if (!ancho) return;
      const r = inst.img.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / r.width * ancho);
      const y = Math.floor((e.clientY - r.top) / r.height * alto);
      if (x < 0 || y < 0 || x >= ancho || y >= alto) return;
      const c = F.tamCelda;
      lectura.textContent = F.codigoCelda(x, y) + " · x " + x + " · y " + y + " px";
      resalte.hidden = !activas.has(inst.id);
      resalte.style.left = Math.floor(x / c) * c / ancho * 100 + "%";
      resalte.style.top = Math.floor(y / c) * c / alto * 100 + "%";
      resalte.style.width = Math.min(c, ancho - Math.floor(x / c) * c) / ancho * 100 + "%";
      resalte.style.height = Math.min(c, alto - Math.floor(y / c) * c) / alto * 100 + "%";
    });
    inst.contenedor.addEventListener("mouseleave", () => {
      lectura.textContent = "";
      resalte.hidden = true;
    });
  }

  // Barra de herramientas
  function actualizarContador() {
    $("grillas-activas").textContent = activas.size;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const selector = $("celda");
    selector.value = F.tamCelda;
    selector.addEventListener("change", () => {
      F.tamCelda = parseInt(selector.value, 10);
      try { localStorage.setItem("fontanella_celda", F.tamCelda); } catch (e) { /* sin almacenamiento */ }
      pintarTodas();
      document.dispatchEvent(new CustomEvent("fontanella:celda"));
    });

    $("grilla-todas").addEventListener("click", () => {
      F.todas().forEach(f => activas.add(f.id));
      pintarTodas();
    });
    $("grilla-ninguna").addEventListener("click", () => {
      activas.clear();
      pintarTodas();
    });

    $("exportar").addEventListener("click", () => {
      const contenido =
        "// Puntos señalados sobre cada imagen, por id de imagen. Coordenadas en píxeles\n" +
        "// de la imagen original (0,0 = esquina superior izquierda).\n" +
        "// Generado desde el modo administrador (?admin) el " + new Date().toLocaleString("es-CO") + ".\n" +
        "window.PUNTOS = " + JSON.stringify(F.cargarPuntos(), null, 2) + ";\n";
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(new Blob([contenido], { type: "text/javascript" }));
      enlace.download = "puntos.js";
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    });

    $("importar").addEventListener("change", e => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      archivo.text().then(texto => {
        try {
          const datos = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1));
          if (typeof datos !== "object" || Array.isArray(datos)) throw new Error();
          F.guardarPuntos(datos);
          location.reload();
        } catch (err) {
          alert("El archivo no contiene puntos válidos.");
        }
      });
    });

    $("restablecer").addEventListener("click", () => {
      if (!confirm("¿Descartar los puntos editados en este navegador y volver a js/puntos.js?")) return;
      F.borrarPuntos();
      location.reload();
    });

    actualizarContador();
  });
})();
