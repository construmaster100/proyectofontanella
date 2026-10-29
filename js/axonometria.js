// Plantas tipo de los bloques 3 y 4 en axonometría isométrica.
// Cada rectángulo de la planta se extruye en un prisma bajo y el texto queda a 0°
// (horizontal) sobre la cara superior de su cuadro.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = Math.cos(Math.PI / 6);
  const ALTO = 12; // espesor de cada cuadro, en unidades del dibujo

  function el(nombre, atributos) {
    const nodo = document.createElementNS(NS, nombre);
    for (const k in atributos) nodo.setAttribute(k, atributos[k]);
    return nodo;
  }

  function axonometria(svg) {
    const caja = svg.viewBox.baseVal;
    const W0 = caja.width, H0 = caja.height;
    const k = W0 / ((W0 + H0) * C);
    const px = (x, y) => ((x - y) * C + H0 * C) * k;
    const py = (x, y) => (x + y) * 0.5 * k + ALTO;
    const punto = (x, y, z) => px(x, y).toFixed(1) + "," + (py(x, y) - z).toFixed(1);

    svg.setAttribute("viewBox", "0 0 " + W0 + " " + ((W0 + H0) * 0.5 * k + ALTO).toFixed(1));
    svg.classList.add("planta-ax");

    svg.querySelectorAll("g.planta-u, g.planta-resto").forEach(g => {
      const r = g.querySelector("rect");
      if (!r) return;
      const x = parseFloat(r.getAttribute("x")), y = parseFloat(r.getAttribute("y"));
      const w = parseFloat(r.getAttribute("width")), h = parseFloat(r.getAttribute("height"));
      const relleno = r.getAttribute("fill");

      const tapa = el("polygon", { class: "ax-tapa", points: [punto(x, y, ALTO), punto(x + w, y, ALTO), punto(x + w, y + h, ALTO), punto(x, y + h, ALTO)].join(" ") });
      if (relleno && relleno.startsWith("url(")) tapa.setAttribute("fill", relleno);
      const izq = el("polygon", { class: "ax-izq", points: [punto(x, y + h, ALTO), punto(x + w, y + h, ALTO), punto(x + w, y + h, 0), punto(x, y + h, 0)].join(" ") });
      const der = el("polygon", { class: "ax-der", points: [punto(x + w, y, ALTO), punto(x + w, y + h, ALTO), punto(x + w, y + h, 0), punto(x + w, y, 0)].join(" ") });
      r.replaceWith(izq, der, tapa);

      // Texto horizontal centrado sobre la cara superior, conservando el orden de las líneas
      const cx = px(x + w / 2, y + h / 2), cy = py(x + w / 2, y + h / 2) - ALTO;
      g.querySelectorAll("text").forEach(t => {
        const dy = parseFloat(t.getAttribute("y")) - (y + h / 2);
        t.setAttribute("x", cx.toFixed(1));
        t.setAttribute("y", (cy + dy).toFixed(1));
        t.setAttribute("text-anchor", "middle");
      });
    });
  }

  document.querySelectorAll(".planta-svg:not(.planta-mod)").forEach(axonometria);
})();
