// Avatares amarillos sobre cada tipología del panel "Tipologías", según su área:
// hasta 30 m² 1 persona, de 30 a 60 m² 2 personas, más de 60 m² 3 personas.
(function () {
  const AVATAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="4.6"/><path d="M3.2 22c0-5 3.9-8.4 8.8-8.4s8.8 3.4 8.8 8.4z"/></svg>';
  const personas = area => (area <= 30 ? 1 : area <= 60 ? 2 : 3);

  document.querySelectorAll(".tipos-cuadros .tipo-cuadro[data-area]").forEach(cuadro => {
    const area = parseFloat(cuadro.dataset.area.replace(/\./g, "").replace(",", "."));
    if (isNaN(area)) return;
    const n = personas(area);
    const col = document.createElement("div");
    col.className = "tipo-col";
    const fila = document.createElement("div");
    fila.className = "tipo-avatares";
    fila.setAttribute("role", "img");
    fila.setAttribute("aria-label", n + (n === 1 ? " persona" : " personas"));
    fila.innerHTML = AVATAR.repeat(n);
    cuadro.parentNode.insertBefore(col, cuadro);
    col.appendChild(fila);
    col.appendChild(cuadro);
  });
})();
