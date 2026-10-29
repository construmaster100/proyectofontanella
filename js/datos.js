// Catálogo de imágenes. El "id" es el nombre del archivo sin extensión y es el
// identificador que usa todo el sitio: atributos data-img del diseño, enlaces
// directos (galeria.html#p1) y claves de los puntos en js/puntos.js.
window.GALERIA = [
  { id: "portada", archivo: "portada.JPG", categoria: "fachada",    titulo: "Oportunidad única, últimas unidades" },
  { id: "p3",      archivo: "p3.JPG",      categoria: "fachada",    titulo: "Tu lugar perfecto, hecho realidad" },
  { id: "p6",      archivo: "p6.JPG",      categoria: "fachada",    titulo: "Amenidades exclusivas que elevan tu estilo" },
  { id: "j7",      archivo: "j7.JPG",      categoria: "fachada",    titulo: "Últimas unidades" },
  { id: "p8",      archivo: "p8.JPG",      categoria: "fachada",    titulo: "Arquitectura moderna" },
  { id: "d4",      archivo: "d4.JPG",      categoria: "fachada",    titulo: "Gimnasio, zonas verdes y parque infantil" },
  { id: "p1",      archivo: "p1.JPG",      categoria: "interiores", titulo: "Tranquilidad, el confort en cada espacio" },
  { id: "b7",      archivo: "b7.JPG",      categoria: "interiores", titulo: "Disfruta de espacios acogedores" },
  { id: "l9",      archivo: "l9.JPG",      categoria: "interiores", titulo: "365 días de confort" },
  { id: "g6",      archivo: "g6.JPG",      categoria: "interiores", titulo: "Inversión inteligente" },
  { id: "v5",      archivo: "v5.JPG",      categoria: "interiores", titulo: "Acabados de lujo" },
  { id: "g23",     archivo: "g23.JPG",     categoria: "interiores", titulo: "Más momentos en familia" },
  { id: "089i",    archivo: "089i.JPG",    categoria: "interiores", titulo: "Muchos momentos especiales" },
  { id: "p2",      archivo: "p2.JPG",      categoria: "interiores", titulo: "Habitaciones amplias" },
  { id: "p4",      archivo: "p4.JPG",      categoria: "interiores", titulo: "Nuevo hogar" },
  { id: "p5",      archivo: "p5.JPG",      categoria: "interiores", titulo: "Esperanza, una promesa de bienestar" },
  { id: "p7",      archivo: "p7.JPG",      categoria: "interiores", titulo: "Recorrido 360°" },
  { id: "f5",      archivo: "f5.JPG",      categoria: "eventos",    titulo: "Feliz día de la mujer" }
];

window.CATEGORIAS = { fachada: "Fachada y zonas comunes", interiores: "Interiores", eventos: "Eventos" };

// Planos (carpeta img/planos). Mismo formato; aparecen en la sección "Planos".
// Ejemplo: { id: "tipo-a", archivo: "tipo-a.jpg", titulo: "Apartamento tipo A · 107 m²" }
window.PLANOS = [
];
window.PLANOS.forEach(p => { p.carpeta = "planos"; });

// Planos en PDF (carpeta img/planos/pdf). Aparecen en "Proyecto › Planos (PDF)".
// Ejemplo: { archivo: "torre-4.pdf", titulo: "Planta tipo Torre 4" }
window.PLANOS_PDF = [
];

// Vistas aéreas (carpeta img/Drone). Aparecen en el carrusel de "Explorador".
window.DRONE = [
  { id: "drone-01", archivo: "drone-01.jpeg", titulo: "Vista aérea 1" },
  { id: "drone-02", archivo: "drone-02.jpeg", titulo: "Vista aérea 2" },
  { id: "drone-03", archivo: "drone-03.jpeg", titulo: "Vista aérea 3" },
  { id: "drone-04", archivo: "drone-04.jpeg", titulo: "Vista aérea 4" },
  { id: "drone-05", archivo: "drone-05.jpeg", titulo: "Vista aérea 5" },
  { id: "drone-06", archivo: "drone-06.jpeg", titulo: "Vista aérea 6" },
  { id: "drone-07", archivo: "drone-07.jpeg", titulo: "Vista aérea 7" },
  { id: "drone-08", archivo: "drone-08.jpeg", titulo: "Vista aérea 8" },
  { id: "drone-09", archivo: "drone-09.jpeg", titulo: "Vista aérea 9" },
  { id: "drone-10", archivo: "drone-10.jpeg", titulo: "Vista aérea 10" },
  { id: "drone-11", archivo: "drone-11.jpeg", titulo: "Vista aérea 11" },
  { id: "drone-12", archivo: "drone-12.jpeg", titulo: "Vista aérea 12" },
  { id: "drone-13", archivo: "drone-13.jpeg", titulo: "Vista aérea 13" },
  { id: "drone-14", archivo: "drone-14.jpeg", titulo: "Vista aérea 14" },
  { id: "drone-15", archivo: "drone-15.jpeg", titulo: "Vista aérea 15" },
  { id: "drone-14-lote", archivo: "drone-14-editada(1).png", titulo: "Vista aérea 14 · lote P1–P4" },
  { id: "drone-15-lote", archivo: "drone-15-editada.png", titulo: "Vista aérea 15 · lote P1–P4 (cenital)" }
];
window.DRONE.forEach(d => { d.carpeta = "Drone"; });

// Pestaña "Presentación": alcance de la presentación de la segunda etapa
// (docs/portafolio victor/ALCANCE PRESENTACION 2 ETAPA.pdf). Cada apartado
// admite "img" con el id de una imagen (galería, planos o dron) para mostrarla.
window.PRESENTACION = [
  { id: "localizacion", titulo: "Localización" },
  { id: "conjunto", titulo: "Plano del conjunto", texto: "Relación y ubicación de:", hijos: [
    { id: "primera-etapa", titulo: "Primera etapa" },
    { id: "zonas-comunes", titulo: "Salón comunal, área adicional de juegos y área común", nota: "Proyectada" },
    { id: "segunda-etapa", titulo: "Segunda etapa", nota: "Torres 4 y 5" },
    { id: "tercera-etapa", titulo: "Tercera etapa", nota: "Torre 6 · Proyectada" },
    { id: "urbanismo", titulo: "Urbanismo interior", hijos: [
      { id: "circulacion", titulo: "Circulación desde el acceso hasta la entrada peatonal a Torre 4 y Torre 5" },
      { id: "rampas", titulo: "Rampas de acceso vehicular" },
      { id: "entorno", titulo: "Entorno a juegos infantiles y zonas verdes" }
    ] }
  ] },
  { id: "torre-4", titulo: "Planos de Torre 4", texto: "Indicando los tipos de apartamento." },
  { id: "tipos", titulo: "Planos por tipo de apartamento", hijos: [
    { id: "tipo-1", titulo: "Tipo 1 · Opción básica", nota: "96 m²" },
    { id: "tipo-1-emergencia", titulo: "Tipo 1 · Opción con baño de emergencia" },
    { id: "tipo-3", titulo: "Tipo 3", nota: "Apartamento de 3 alcobas" },
    { id: "tipo-4", titulo: "Tipo 4", nota: "Apartamento de 2 alcobas" },
    { id: "tipo-7", titulo: "Tipo 7", nota: "Apartamento de 1 alcoba" },
    { id: "tipo-8", titulo: "Tipo 8", nota: "Apartaestudio" }
  ] }
];

window.Fontanella = {
  // Relativa a este script, para que funcione desde la raíz y desde pages/.
  RUTA_IMG: new URL("../img/", document.currentScript.src).href,
  CLAVE: "fontanella_puntos",
  tamCelda: 50, // px de la imagen original por celda de la grilla alfanumérica

  // 0 → A, 25 → Z, 26 → AA…
  letras(n) {
    let s = "";
    for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
    return s;
  },

  // Código de celda para un píxel: columna en letras, fila en número (p. ej. "C4").
  codigoCelda(x, y) {
    return this.letras(Math.floor(x / this.tamCelda)) + (Math.floor(y / this.tamCelda) + 1);
  },

  todas() {
    return window.GALERIA.concat(window.PLANOS, window.DRONE);
  },

  buscar(id) {
    return this.todas().find(f => f.id === id);
  },

  ruta(id) {
    const f = this.buscar(id);
    return f ? this.RUTA_IMG + (f.carpeta || "galeria") + "/" + f.archivo : "";
  },

  // Los puntos editados en el modo administrador se guardan en este navegador y
  // tienen prioridad sobre js/puntos.js hasta que se exporten.
  cargarPuntos() {
    try {
      const guardado = localStorage.getItem(this.CLAVE);
      if (guardado) return JSON.parse(guardado);
    } catch (e) { /* almacenamiento no disponible */ }
    return JSON.parse(JSON.stringify(window.PUNTOS || {}));
  },

  guardarPuntos(puntos) {
    try {
      localStorage.setItem(this.CLAVE, JSON.stringify(puntos));
      return true;
    } catch (e) {
      return false;
    }
  },

  borrarPuntos() {
    try { localStorage.removeItem(this.CLAVE); } catch (e) { /* nada que borrar */ }
  }
};
