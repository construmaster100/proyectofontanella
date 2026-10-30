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
  {"id": "plano-planos-lineas-y-areas", "archivo": "jpg/planos-lineas-y-areas.jpg", "titulo": "Planta tipo · muros, áreas y nombres de los espacios"},
  {"id": "plano-planos-planta-tipo-lineas", "archivo": "jpg/planos-planta-tipo-lineas.jpg", "titulo": "Implantación del proyecto · planta tipo en muros"},
  {"id": "plano-planos-solo-tipo", "archivo": "jpg/planos-solo-tipo.jpg", "titulo": "Planta tipo · lámina simplificada"},
  {"id": "plano-planos-planta-con-tipologias", "archivo": "jpg/planos-planta-con-tipologias.jpg", "titulo": "Planta tipo con las tipologías de apartamento"},
  {"id": "plano-planos-plan-sheet-4-11-nivel-3-50", "archivo": "jpg/planos-plan-sheet-4-11-nivel-3-50.jpg", "titulo": "Hoja 4-11 · Nivel +3,50 (vista 3D)"},
  {"id": "plano-planos-plan-sheet-4-12-nivel-7-entrada-porteria", "archivo": "jpg/planos-plan-sheet-4-12-nivel-7-entrada-porteria.jpg", "titulo": "Hoja 4-12 · Nivel +7,00 · entrada y portería (vista 3D)"},
  {"id": "plano-planos-plan-sheet-4-13-1000", "archivo": "jpg/planos-plan-sheet-4-13-1000.jpg", "titulo": "Hoja 4-13 · Nivel +10,00 (vista 3D)"},
  {"id": "plano-planos-plan-sheet-4-15-planta-tipo", "archivo": "jpg/planos-plan-sheet-4-15-planta-tipo.jpg", "titulo": "Hoja 4-15 · Planta tipo (vista 3D)"},
  {"id": "plano-planos-plan-sheet-4-16-torre-56", "archivo": "jpg/planos-plan-sheet-4-16-torre-56.jpg", "titulo": "Hoja 4-16 · Torres 5 y 6 (vista 3D)"},
  {"id": "plano-planos-corte-transversal-3d-view-corte-longitudinal", "archivo": "jpg/planos-corte-transversal-3d-view-corte-longitudinal.jpg", "titulo": "Corte Longitudinal"},
  {"id": "plano-planos-corte-transversal-3d-view-corte-longitudinal-2", "archivo": "jpg/planos-corte-transversal-3d-view-corte-longitudinal-2.jpg", "titulo": "Corte Longitudinal 2"},
  {"id": "plano-secuencia-por-pisos-niveles", "archivo": "jpg/secuencia-por-pisos-niveles.jpg", "titulo": "Niveles (lámina general)"},
  {"id": "plano-secuencia-por-pisos-nivel-01", "archivo": "jpg/secuencia-por-pisos-nivel-01.jpg", "titulo": "Hoja 51 · Primer nivel (Nivel 1)"},
  {"id": "plano-secuencia-por-pisos-nivel-02", "archivo": "jpg/secuencia-por-pisos-nivel-02.jpg", "titulo": "Hoja 52 · Segundo nivel (Nivel 2)"},
  {"id": "plano-secuencia-por-pisos-nivel-03", "archivo": "jpg/secuencia-por-pisos-nivel-03.jpg", "titulo": "Hoja 53 · Tercer nivel (Nivel 3)"},
  {"id": "plano-secuencia-por-pisos-nivel-04", "archivo": "jpg/secuencia-por-pisos-nivel-04.jpg", "titulo": "Hoja 54 · Cuarto nivel (Nivel 4)"},
  {"id": "plano-secuencia-por-pisos-nivel-05", "archivo": "jpg/secuencia-por-pisos-nivel-05.jpg", "titulo": "Hoja 55 · Quinto nivel (Nivel 5)"},
  {"id": "plano-secuencia-por-pisos-nivel-07", "archivo": "jpg/secuencia-por-pisos-nivel-07.jpg", "titulo": "Hoja 57 · Séptimo nivel (Nivel 7)"},
  {"id": "plano-secuencia-por-pisos-nivel-08", "archivo": "jpg/secuencia-por-pisos-nivel-08.jpg", "titulo": "Hoja 58 · Octavo nivel (Nivel 8)"},
  {"id": "plano-secuencia-por-pisos-nivel-09", "archivo": "jpg/secuencia-por-pisos-nivel-09.jpg", "titulo": "Hoja 59 · Noveno nivel (Nivel 9)"},
  {"id": "plano-secuencia-por-pisos-nivel-11", "archivo": "jpg/secuencia-por-pisos-nivel-11.jpg", "titulo": "Hoja 511 · Once nivel (Nivel 11)"},
  {"id": "plano-secuencia-por-pisos-nivel-12", "archivo": "jpg/secuencia-por-pisos-nivel-12.jpg", "titulo": "Hoja 512 · Doce nivel (Nivel 12)"},
  {"id": "plano-secuencia-por-pisos-nivel-13", "archivo": "jpg/secuencia-por-pisos-nivel-13.jpg", "titulo": "Hoja 513 · Trece nivel (Nivel 13)"},
  {"id": "plano-secuencia-por-pisos-nivel-14", "archivo": "jpg/secuencia-por-pisos-nivel-14.jpg", "titulo": "Hoja 514 · Catorce nivel (Nivel 14)"},
  {"id": "plano-secuencia-por-pisos-nivel-15", "archivo": "jpg/secuencia-por-pisos-nivel-15.jpg", "titulo": "Hoja 515 · Quince nivel (Nivel 15)"},
  {"id": "plano-secuencia-por-pisos-nivel-16", "archivo": "jpg/secuencia-por-pisos-nivel-16.jpg", "titulo": "Hoja 516 · Dieciséis nivel (Nivel 16)"},
  {"id": "plano-secuencia-por-pisos-nivel-17", "archivo": "jpg/secuencia-por-pisos-nivel-17.jpg", "titulo": "Hoja 517 · Diecisiete nivel (Nivel 17)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-51-1-primer-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-51-1-primer-nivel.jpg", "titulo": "Hoja 51 · Primer nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-52-segundo-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-52-segundo-nivel.jpg", "titulo": "Hoja 52 · Segundo nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-53-tercer-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-53-tercer-nivel.jpg", "titulo": "Hoja 53 · Tercer nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-54-cuarto-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-54-cuarto-nivel.jpg", "titulo": "Hoja 54 · Cuarto nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-56-sexto-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-56-sexto-nivel.jpg", "titulo": "Hoja 56 · Sexto nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-58-octavo-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-58-octavo-nivel.jpg", "titulo": "Hoja 58 · Octavo nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-510-diez-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-510-diez-nivel.jpg", "titulo": "Hoja 510 · Diez nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-511-once-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-511-once-nivel.jpg", "titulo": "Hoja 511 · Once nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-512-doce-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-512-doce-nivel.jpg", "titulo": "Hoja 512 · Doce nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-514-catorce-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-514-catorce-nivel.jpg", "titulo": "Hoja 514 · Catorce nivel (vista 3D)"},
  {"id": "plano-2-0-nueva-secuencia-project1-sheet-516-diez-y-seis-nivel", "archivo": "jpg/2-0-nueva-secuencia-project1-sheet-516-diez-y-seis-nivel.jpg", "titulo": "Hoja 516 · Diez y seis nivel (vista 3D)"}
];
window.PLANOS.forEach(p => { p.carpeta = "planos"; });

// Planos en PDF (carpeta img/planos/pdf). Aparecen en "Proyecto › Planos (PDF)".
// Ejemplo: { archivo: "torre-4.pdf", titulo: "Planta tipo Torre 4" }
window.PLANOS_PDF = [
  {"grupo": "Plantas arquitectónicas", "archivo": "planos/pdf/LINEAS Y AREAS.pdf", "jpg": "plano-planos-lineas-y-areas", "miniatura": "planos/jpg/miniaturas/planos-lineas-y-areas.jpg", "titulo": "Planta tipo · muros, áreas y nombres de los espacios", "hoja": "", "tipo": "Planta arquitectónica", "ubicacion": "Pisos tipo de las torres", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2280, y 249–1608 px", "contenido": "51 alcobas · 25 salas · 24 cocinas · 1 rótulos de nivel · escala escrita 1:100", "coincidencia": "Sin coincidencia clara con la planta tipo: correlación 0.19; la silueta tipo aparece a escala ×0.40 en x 985, y 825 px del JPG"},
  {"grupo": "Plantas arquitectónicas", "archivo": "planos/pdf/PLANTA TIPO LINEAS.pdf", "jpg": "plano-planos-planta-tipo-lineas", "miniatura": "planos/jpg/miniaturas/planos-planta-tipo-lineas.jpg", "titulo": "Implantación del proyecto · planta tipo en muros", "hoja": "", "tipo": "Planta arquitectónica", "ubicacion": "Implantación general en el lote", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1685 px", "contenido": "", "coincidencia": "Es la referencia: escala gráfica 1:150, 1 pt = 28.0 cm reales", "escala_px": "1 px del JPG ≈ 9.2 cm reales (por la coincidencia con la planta tipo)"},
  {"grupo": "Plantas arquitectónicas", "archivo": "planos/pdf/SOLO TIPO.pdf", "jpg": "plano-planos-solo-tipo", "miniatura": "planos/jpg/miniaturas/planos-solo-tipo.jpg", "titulo": "Planta tipo · lámina simplificada", "hoja": "", "tipo": "Planta arquitectónica", "ubicacion": "Pisos tipo de las torres", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 583–1804, y 155–1768 px", "contenido": "1 rótulos de nivel · escala escrita 1:200", "coincidencia": "Coincide con la planta tipo: correlación 0.65; la silueta tipo aparece a escala ×0.64 en x 680, y 120 px del JPG", "escala_px": "1 px del JPG ≈ 14.5 cm reales (por la coincidencia con la planta tipo)"},
  {"grupo": "Plantas arquitectónicas", "archivo": "planos/pdf/planta con tipologias.pdf", "jpg": "plano-planos-planta-con-tipologias", "miniatura": "planos/jpg/miniaturas/planos-planta-con-tipologias.jpg", "titulo": "Planta tipo con las tipologías de apartamento", "hoja": "", "tipo": "Planta arquitectónica", "ubicacion": "Pisos tipo de las torres", "lamina": "B2 · 707 × 500 mm", "medida": "JPG 3000 × 2122 px a 108 ppp; en papel 1 px = 0.24 mm; el dibujo ocupa x 341–2674, y 173–2063 px", "contenido": "52 alcobas · 25 salas · 24 cocinas", "coincidencia": "Coincidencia parcial con la planta tipo: correlación 0.29; la silueta tipo aparece a escala ×0.38 en x 675, y 249 px del JPG", "escala_px": "1 px del JPG ≈ 49.1 cm reales (por la coincidencia con la planta tipo)"},
  {"grupo": "Vistas 3D por nivel · hojas 4-11 a 4-16", "archivo": "planos/pdf/plan - Sheet - 4-11 - Nivel +3-50.pdf.pdf", "jpg": "plano-planos-plan-sheet-4-11-nivel-3-50", "miniatura": "planos/jpg/miniaturas/planos-plan-sheet-4-11-nivel-3-50.jpg", "titulo": "Nivel +3,50 (vista 3D)", "hoja": "4-11", "tipo": "Vista 3D (isometría) del nivel, exportada de Revit", "ubicacion": "Nivel +3,50", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1685 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Vistas 3D por nivel · hojas 4-11 a 4-16", "archivo": "planos/pdf/plan - Sheet - 4-12 - nivel +7 entrada porteria.pdf.pdf", "jpg": "plano-planos-plan-sheet-4-12-nivel-7-entrada-porteria", "miniatura": "planos/jpg/miniaturas/planos-plan-sheet-4-12-nivel-7-entrada-porteria.jpg", "titulo": "Nivel +7,00 · entrada y portería (vista 3D)", "hoja": "4-12", "tipo": "Vista 3D (isometría) del nivel, exportada de Revit", "ubicacion": "Nivel +7,00: acceso y portería", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1685 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Vistas 3D por nivel · hojas 4-11 a 4-16", "archivo": "planos/pdf/plan - Sheet - 4-13 - +1000.pdf.pdf", "jpg": "plano-planos-plan-sheet-4-13-1000", "miniatura": "planos/jpg/miniaturas/planos-plan-sheet-4-13-1000.jpg", "titulo": "Nivel +10,00 (vista 3D)", "hoja": "4-13", "tipo": "Vista 3D (isometría) del nivel, exportada de Revit", "ubicacion": "Nivel +10,00", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1685 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Vistas 3D por nivel · hojas 4-11 a 4-16", "archivo": "planos/pdf/plan - Sheet - 4-15 - Planta tipo.pdf.pdf", "jpg": "plano-planos-plan-sheet-4-15-planta-tipo", "miniatura": "planos/jpg/miniaturas/planos-plan-sheet-4-15-planta-tipo.jpg", "titulo": "Planta tipo (vista 3D)", "hoja": "4-15", "tipo": "Vista 3D (isometría) del nivel, exportada de Revit", "ubicacion": "Pisos tipo de las torres", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 200–1799, y 618–1606 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Vistas 3D por nivel · hojas 4-11 a 4-16", "archivo": "planos/pdf/plan - Sheet - 4-16 - torre 56.pdf.pdf", "jpg": "plano-planos-plan-sheet-4-16-torre-56", "miniatura": "planos/jpg/miniaturas/planos-plan-sheet-4-16-torre-56.jpg", "titulo": "Torres 5 y 6 (vista 3D)", "hoja": "4-16", "tipo": "Vista 3D (isometría) del nivel, exportada de Revit", "ubicacion": "Torres 5 y 6", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1685 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Cortes y otras vistas", "archivo": "planos/pdf/corte transversal - 3D View - Corte Longitudinal.pdf.pdf", "jpg": "plano-planos-corte-transversal-3d-view-corte-longitudinal", "miniatura": "planos/jpg/miniaturas/planos-corte-transversal-3d-view-corte-longitudinal.jpg", "titulo": "Corte Longitudinal", "hoja": "", "tipo": "Vista 3D exportada de Revit", "ubicacion": "Proyecto", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 143–2240, y 233–1671 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Cortes y otras vistas", "archivo": "planos/pdf/corte transversal - 3D View - Corte Longitudinal 2.pdf.pdf", "jpg": "plano-planos-corte-transversal-3d-view-corte-longitudinal-2", "miniatura": "planos/jpg/miniaturas/planos-corte-transversal-3d-view-corte-longitudinal-2.jpg", "titulo": "Corte Longitudinal 2", "hoja": "", "tipo": "Vista 3D exportada de Revit", "ubicacion": "Proyecto", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 175–2321, y 157–1707 px", "contenido": "", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/00-niveles-general/niveles.pdf", "jpg": "plano-secuencia-por-pisos-niveles", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-niveles.jpg", "titulo": "Niveles (lámina general)", "hoja": "", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Todos los niveles", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 0–2863, y 112–2038 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-01/nivel-01.pdf", "jpg": "plano-secuencia-por-pisos-nivel-01", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-01.jpg", "titulo": "Primer nivel (Nivel 1)", "hoja": "51", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 1", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-02/nivel-02.pdf", "jpg": "plano-secuencia-por-pisos-nivel-02", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-02.jpg", "titulo": "Segundo nivel (Nivel 2)", "hoja": "52", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 2", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 0–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-03/nivel-03.pdf", "jpg": "plano-secuencia-por-pisos-nivel-03", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-03.jpg", "titulo": "Tercer nivel (Nivel 3)", "hoja": "53", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 3", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 0–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-04/nivel-04.pdf", "jpg": "plano-secuencia-por-pisos-nivel-04", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-04.jpg", "titulo": "Cuarto nivel (Nivel 4)", "hoja": "54", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 4", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-05/nivel-05.pdf", "jpg": "plano-secuencia-por-pisos-nivel-05", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-05.jpg", "titulo": "Quinto nivel (Nivel 5)", "hoja": "55", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 5", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-07/nivel-07.pdf", "jpg": "plano-secuencia-por-pisos-nivel-07", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-07.jpg", "titulo": "Séptimo nivel (Nivel 7)", "hoja": "57", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 7", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-08/nivel-08.pdf", "jpg": "plano-secuencia-por-pisos-nivel-08", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-08.jpg", "titulo": "Octavo nivel (Nivel 8)", "hoja": "58", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 8", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-09/nivel-09.pdf", "jpg": "plano-secuencia-por-pisos-nivel-09", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-09.jpg", "titulo": "Noveno nivel (Nivel 9)", "hoja": "59", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 9", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-11/nivel-11.pdf", "jpg": "plano-secuencia-por-pisos-nivel-11", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-11.jpg", "titulo": "Once nivel (Nivel 11)", "hoja": "511", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 11", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-12/nivel-12.pdf", "jpg": "plano-secuencia-por-pisos-nivel-12", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-12.jpg", "titulo": "Doce nivel (Nivel 12)", "hoja": "512", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 12", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-13/nivel-13.pdf", "jpg": "plano-secuencia-por-pisos-nivel-13", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-13.jpg", "titulo": "Trece nivel (Nivel 13)", "hoja": "513", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 13", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-14/nivel-14.pdf", "jpg": "plano-secuencia-por-pisos-nivel-14", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-14.jpg", "titulo": "Catorce nivel (Nivel 14)", "hoja": "514", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 14", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-15/nivel-15.pdf", "jpg": "plano-secuencia-por-pisos-nivel-15", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-15.jpg", "titulo": "Quince nivel (Nivel 15)", "hoja": "515", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 15", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 112–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-16/nivel-16.pdf", "jpg": "plano-secuencia-por-pisos-nivel-16", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-16.jpg", "titulo": "Dieciséis nivel (Nivel 16)", "hoja": "516", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 16", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 59–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Secuencia por pisos · láminas A0 (vistas 3D)", "archivo": "secuencia por pisos/nivel-17/nivel-17.pdf", "jpg": "plano-secuencia-por-pisos-nivel-17", "miniatura": "planos/jpg/miniaturas/secuencia-por-pisos-nivel-17.jpg", "titulo": "Diecisiete nivel (Nivel 17)", "hoja": "517", "tipo": "Plano en isometría (vista 3D) exportado de Revit, 1 página", "ubicacion": "Nivel 17", "lamina": "1000 × 707 mm", "medida": "JPG 3000 × 2121 px a 76 ppp; en papel 1 px = 0.33 mm; el dibujo ocupa x 136–2863, y 59–2007 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 51 (1) - Primer nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-51-1-primer-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-51-1-primer-nivel.jpg", "titulo": "Primer nivel (vista 3D)", "hoja": "51", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 1", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1716 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 52 - Segundo nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-52-segundo-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-52-segundo-nivel.jpg", "titulo": "Segundo nivel (vista 3D)", "hoja": "52", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 2", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1775 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 53 - Tercer nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-53-tercer-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-53-tercer-nivel.jpg", "titulo": "Tercer nivel (vista 3D)", "hoja": "53", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 3", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1775 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 54 - Cuarto nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-54-cuarto-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-54-cuarto-nivel.jpg", "titulo": "Cuarto nivel (vista 3D)", "hoja": "54", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 4", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 56 - Sexto  nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-56-sexto-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-56-sexto-nivel.jpg", "titulo": "Sexto nivel (vista 3D)", "hoja": "56", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 6", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 58 - Octavo  nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-58-octavo-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-58-octavo-nivel.jpg", "titulo": "Octavo nivel (vista 3D)", "hoja": "58", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 8", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 510 - diez nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-510-diez-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-510-diez-nivel.jpg", "titulo": "Diez nivel (vista 3D)", "hoja": "510", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 10", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 511 - once nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-511-once-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-511-once-nivel.jpg", "titulo": "Once nivel (vista 3D)", "hoja": "511", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 11", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 512 - doce nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-512-doce-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-512-doce-nivel.jpg", "titulo": "Doce nivel (vista 3D)", "hoja": "512", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 12", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 514 - catorce nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-514-catorce-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-514-catorce-nivel.jpg", "titulo": "Catorce nivel (vista 3D)", "hoja": "514", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 14", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"},
  {"grupo": "Nueva secuencia por niveles (vistas 3D)", "archivo": "2.0 nueva secuencia/Project1 - Sheet - 516 - diez y seis nivel.pdf.pdf", "jpg": "plano-2-0-nueva-secuencia-project1-sheet-516-diez-y-seis-nivel", "miniatura": "planos/jpg/miniaturas/2-0-nueva-secuencia-project1-sheet-516-diez-y-seis-nivel.jpg", "titulo": "Diez y seis nivel (vista 3D)", "hoja": "516", "tipo": "Vista 3D (isometría) exportada de Revit", "ubicacion": "Nivel 16", "lamina": "Carta · 279 × 216 mm", "medida": "JPG 2400 × 1855 px a 218 ppp; en papel 1 px = 0.12 mm; el dibujo ocupa x 108–2291, y 169–1765 px", "contenido": "1 rótulos de nivel", "escala_px": "Vista 3D en isometría: sin escala métrica"}
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
