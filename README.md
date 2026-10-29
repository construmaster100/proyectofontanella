# Fontanella · Sitio web

Sitio corporativo de ventas de **Fontanella**, apartamentos en Tunja. La pieza principal es una galería de imágenes con puntos señalados por coordenadas de píxel, y el sitio incluye un modo administrador para crear esos puntos sobre una grilla.

## Estructura

```
fontanella/
├── index.html            Inicio (portada)
├── planos.html           Una página por pestaña del menú
├── galeria.html
├── explorador.html
├── presentacion.html
├── proyecto.html
├── disenador.html
├── contacto.html
├── movil.html            Versión para celular: todas las secciones en una columna
├── pages/
│   └── administrador.html  Redirige a index.html?admin
├── css/
│   └── estilos.css       Estilos compartidos por todas las páginas
├── js/
│   ├── datos.js          Catálogo de imágenes (id, archivo, categoría, título) y apartados
│   ├── puntos.js         Puntos publicados, por id de imagen
│   ├── galeria.js        Galería, visor, carrusel y presentación (cada parte, si su sección está en la página)
│   └── administrador.js  Modo administrador (?admin): barras, grilla alfanumérica y exportación
└── img/
    ├── galeria/          Imágenes del proyecto
    ├── Drone/            Vistas aéreas del carrusel «Explorador»
    ├── Marca Fontanella/ Originales de la marca (no se usan directamente)
    ├── marca/            Versiones web de la marca: logo, banner e iconos
    └── planos/           Planos de los apartamentos
```

## Marca

**Colores:** la paleta del sitio (`:root` en `css/estilos.css`) usa el azul del logotipo (`--azul: #0b207b`, `--azul-oscuro: #08185c`) y el blanco (`--blanco`); fondos suaves, bordes y textos van teñidos de ese azul, y el naranja (`--naranja`) queda como color de acento.

Los originales están en `img/Marca Fontanella/`; las versiones para la web, en `img/marca/`:

- `logo-blanco.png`: logo blanco con fondo transparente (flor, FONTANELLA y lema), sacado del logotipo púrpura; va en la barra superior de todas las páginas (la versión móvil conserva el logo en texto).
- `banner.jpg`: el banner horizontal, al inicio de la portada (`index.html`) sobre su mismo azul.
- `favicon.png`: solo la flor en el círculo azul, icono de la pestaña del navegador.
- `apple-touch-icon.png`: el logotipo circular completo, icono al guardar el sitio en la pantalla de un teléfono.

## Páginas

Cada pestaña del menú es una página propia con su sección: Planos, Galería, Explorador, Presentación, Proyecto, Diseñador, Móvil y Contacto. La marca FONTANELLA lleva a `index.html` (portada). La pestaña actual se resalta en el menú.

Todas las páginas comparten la misma barra superior, el pie, el visor y los scripts. Al cambiar el menú o el pie, aplica el mismo cambio en todas las páginas.

**Móvil** (`movil.html`) es la versión para celular. Arriba lleva el logo FONTANELLA (solo texto) y una barra de 5 × 2 con las ocho pestañas del menú, que llevan a sus páginas; el contenido son solo las tarjetas de la galería (`window.GALERIA`), de dos en dos y sin textos; abajo, una barra fija con los iconos Usuario, Carrito y Catálogo (destinos pendientes). En el computador se ve como una columna del ancho de un teléfono.

## Identificadores de imagen

Cada imagen se identifica por el nombre de su archivo sin extensión (`portada`, `p1`, `d4`, `089i`…). Ese id se usa en:

- **El diseño:** `<button class="imagen-id" data-img="d4">` coloca esa imagen en cualquier bloque de una página.
- **Enlaces directos:** `galeria.html#p1` abre la imagen `p1` en el visor (funciona en cualquier página).
- **Los puntos:** `js/puntos.js` agrupa los puntos por id.

Para añadir una imagen, cópiala en `img/galeria/` y agrega una entrada en `window.GALERIA` de `js/datos.js`.

## Planos

La página **Planos** es la primera pestaña del menú. Para publicar un plano, cópialo en `img/planos/` y agrégalo a `window.PLANOS` en `js/datos.js`:

```js
window.PLANOS = [
  { id: "tipo-a", archivo: "tipo-a.jpg", titulo: "Apartamento tipo A · 107 m²" }
];
```

Los planos usan el mismo visor, los mismos botones con etiqueta y la misma grilla del administrador. Mientras la lista esté vacía, la sección muestra un aviso con el botón «Solicitar planos».

## Explorador

La página **Explorador** muestra un carrusel con las vistas aéreas de `img/Drone/`. Se desliza con las flechas, las miniaturas, el teclado o el dedo, y al tocar una imagen se abre en el visor, con sus puntos y su grilla como cualquier otra. Para añadir una vista, cópiala en `img/Drone/` y agrégala a `window.DRONE` en `js/datos.js`; para cambiar el texto, edita su `titulo`.

## Presentación

La página **Presentación** recoge el alcance de la presentación de la segunda etapa (`docs/portafolio victor/ALCANCE PRESENTACION 2 ETAPA.pdf`): un menú lateral a la izquierda con los apartados y un panel a la derecha con el apartado elegido, sus subapartados y botones «Anterior / Siguiente» para recorrerla en orden.

Los apartados están en `window.PRESENTACION` de `js/datos.js`. Para mostrar un plano o una imagen 3D en un apartado, añade la imagen al catálogo (por ejemplo a `window.PLANOS`) y pon su id en la propiedad `img` del apartado; al tocarla se abre en el visor, con sus puntos y su grilla. Sin `img`, el panel muestra «Planimetría e imágenes 3D en preparación».

## Diseñador: área de trabajo

`disenador.html` es un área de trabajo en blanco con una grilla en píxeles del tamaño de la pantalla y la posición del cursor (en px y en m) abajo a la derecha. A la izquierda está la barra de **Herramientas** y a la derecha el panel de **Escala** (`js/disenador.js`).

**+ Nuevo proyecto** (arriba en el panel derecho, junto al icono **Deshacer**, que hace lo mismo que el de la barra de herramientas): deja el área en blanco, quita la imagen de fondo y vuelve a la escala inicial (10 px = 1 m); si hay algo hecho, pide confirmación.

**Escala:** el botón **Escala** del panel derecho abre una ventana centrada donde cada casilla de la grilla es un **módulo** de N píxeles que **equivale a** M metros (por defecto 10 px = 1 m). La ventana muestra, con los valores escritos, la relación (1 m = … px), los rótulos y el área visible en metros. **Aplicar** usa la escala sin cerrar, **Aceptar** la usa y cierra, **Cancelar** cierra sin cambiar nada (Enter = Aceptar, Esc = Cancelar). Bajo el botón se ve la escala vigente. Al aplicar se redibuja la grilla (una línea por módulo, más marcada cada 5 y cada 10, rótulos en metros cada 10 casillas) y se recalculan todas las medidas.

**Herramientas:**

- **Puntero:** clic para seleccionar un objeto (marco punteado) y arrastrar para moverlo. En líneas y polígonos, arrastrar las asas de sus vértices (con imán); las medidas se recalculan. Doble clic en una etiqueta para cambiar su texto. Supr elimina el objeto seleccionado y Esc quita la selección.
- **Lápiz:** dibujo a mano alzada.
- **Texto:** clic donde va la etiqueta, escribir y Enter.
- **Formas:** un solo botón con un menú para elegir **Bandera, Equis, Punto** (círculo con punto en el centro) **o Chulo**. La forma elegida queda activa, su icono pasa al botón y se coloca con un clic. Volver a pulsar el botón usa la misma forma y reabre el menú.
- **Línea (m):** un clic fija el punto 1 y otro clic el punto 2, sin mantener el botón presionado (Esc cancela). Mientras se mueve el cursor, la línea y su medida en metros se actualizan, y un cuadro de coordenadas junto al cursor muestra el punto 1, el punto 2 (en m y px), Δx · Δy y la distancia.
- **Polígono:** igual que la línea, un clic por vértice; cada lado muestra su medida en metros y el cuadro de coordenadas indica el último vértice, el punto actual, Δx · Δy, el lado en curso y el perímetro. Se cierra con doble clic, Enter o clic en el primer vértice (Esc cancela).
- **Imán:** las líneas y los vértices de los polígonos se unen a extremos (□), puntos medios (△) e intersecciones (×) de lo ya trazado.
- **Deshacer** (Ctrl+Z) y **Limpiar**.

**Imagen** (recuadro bajo Escala): **Seleccionar imagen** abre una ventana con las miniaturas de la galería (`window.GALERIA`) para elegir cuál editar, o el botón **Desde mi computador** para abrir un archivo. La imagen queda de fondo, desde la esquina superior izquierda y reducida si no cabe; **Guardar imagen** descarga un PNG con la imagen y lo dibujado encima (sin la grilla), al doble de la resolución en pantalla. Sin imagen, se guarda toda el área. Para guardar una imagen de la galería, el sitio debe abrirse desde el hosting o un servidor local: abierto como archivo (`file://`), el navegador lo impide y se muestra un aviso.

Lo dibujado no se guarda en la página: se pierde al recargarla (usa «Guardar imagen» antes).

## Administrador y grilla alfanumérica

Añade `?admin` a la dirección de cualquier página (por ejemplo `galeria.html?admin`) o usa el enlace «Administrador» del pie. El modo se mantiene al navegar entre pestañas y se abandona con «Salir del administrador». En este modo cada imagen tiene un botón **A1** que activa su grilla:

- Columnas en letras (A, B, C… AA) y filas en números (1, 2, 3…), así que cada celda tiene un código como `C4`.
- Las celdas se miden en píxeles de la imagen original. El tamaño (10 a 100 px) se elige en la barra superior, que también activa o desactiva todas las grillas a la vez.
- En el visor se muestran la celda y el píxel bajo el cursor.

Cada imagen muestra su resolución (ancho × alto en px), y el visor la indica en su cabecera.

## Botones sobre las imágenes

En el visor del administrador, la **barra de edición** permite marcar botones sobre la imagen:

1. Pulsa **+ Crear botón** y haz clic sobre la imagen donde debe ir.
2. Escribe su **Nombre** y su **Etiqueta** (el texto que se despliega).
3. Arrastra el botón para moverlo, selecciónalo con un clic para editarlo o pulsa **Eliminar**.
4. Los cambios se guardan en el navegador al instante. Para publicarlos, pulsa **Exportar puntos.js** en la barra superior y reemplaza `js/puntos.js` con el archivo descargado.

En la web, al hacer clic en un botón se despliega su etiqueta con el nombre y el texto.

Las coordenadas se expresan en píxeles de la imagen original (0,0 es la esquina superior izquierda), así que los puntos coinciden con la imagen a cualquier tamaño de pantalla.

## Uso

Es un sitio estático, sin dependencias ni compilación: basta con abrir `index.html` en el navegador o publicar la carpeta en cualquier hosting estático (GitHub Pages, Netlify…).
