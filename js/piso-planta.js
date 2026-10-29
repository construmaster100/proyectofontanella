// Bloque 2: al hacer clic en un piso del gráfico de torres, el recuadro marcado con X
// muestra la planta tipo (bloque 3 o 4) que corresponde a esa torre.
(function () {
  const caja = document.querySelector(".tipos-vacio");
  if (!caja) return;
  let elegido = null;

  function mostrar(nivel) {
    const torreG = nivel.closest(".g-torre[data-torre]");
    const n = Number(torreG.dataset.torre);
    const etiqueta = n <= 3 ? "Torres 1, 2 y 3" : "Torres 4 y 5";
    const planta = document.querySelector('.ilus-plantas .planta-svg[aria-label="Planta tipo ' + etiqueta + '"]');
    if (!planta) return;
    const piso = (nivel.querySelector("title").textContent.match(/piso (\d+)/) || [])[1];

    if (elegido) elegido.classList.remove("sel");
    elegido = nivel;
    nivel.classList.add("sel");

    const copia = planta.cloneNode(true);
    copia.removeAttribute("style");
    copia.querySelectorAll("[tabindex]").forEach(g => g.removeAttribute("tabindex"));
    copia.querySelectorAll("[role]").forEach(g => g.removeAttribute("role"));
    copia.classList.add("vacio-planta");

    caja.classList.add("con-imagen");
    caja.innerHTML = "";
    caja.insertAdjacentHTML("beforeend", "<p class='vacio-tit'><b>Torre " + n + " · piso " + piso + "</b><span>Planta tipo " + etiqueta + "</span></p>");
    caja.appendChild(copia);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "ver-detalle";
    boton.textContent = "Ver ficha de la torre " + n;
    boton.addEventListener("click", () =>
      torreG.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    caja.appendChild(boton);
  }

  // En fase de captura: el clic en un piso ya no abre la ficha, solo muestra la planta
  document.addEventListener("click", e => {
    const nivel = e.target.closest && e.target.closest(".g-torre[data-torre] .g-nivel");
    if (!nivel) return;
    e.stopPropagation();
    mostrar(nivel);
  }, true);
})();
