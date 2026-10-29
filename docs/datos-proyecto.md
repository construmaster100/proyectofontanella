# Fontanella · Datos numéricos del proyecto

Registro de los datos que sustentan la portada (`index.html`, sección "Datos del proyecto").
Las fórmulas de cada cálculo están en [relaciones-matematicas.txt](relaciones-matematicas.txt).

Convención: punto para miles y coma para decimales (15.702 m²; 67,27 m²).

## 1. Terreno

| Dato | Valor | Origen |
|---|---|---|
| Área del lote | 15.702 m² | Suministrado |
| Huella de las 5 torres | 2.348,66 m² | Calculado |
| Índice de ocupación | 0,15 (15,0 %) | Calculado |
| Área construida de las 5 torres | 28.183,92 m² | Calculado |
| Índice de construcción | 1,79 | Calculado |

## 2. Torres

Cada etapa es una torre. Todas tienen 12 pisos tipo.

| Torre | Etapa | Estado | Pisos tipo | Apto. por piso | Total apto. | Área construida por piso (m²) | Área construida total (m²) |
|---|---|---|---|---|---|---|---|
| Torre 1 | 1 | Construida | 12 | 4 | 48 | 544,00 | 6.528,00 |
| Torre 2 | 2 | Construida | 12 | 4 | 48 | 544,00 | 6.528,00 |
| Torre 3 | 3 | Construida | 12 | 4 | 48 | 544,00 | 6.528,00 |
| Torre 4 | 4 | Proyectada | 12 | 6 | 72 | 462,66 | 5.551,92 |
| Torre 5 | 5 | Proyectada | 12 | 2 | 24 | 254,00 | 3.048,00 |
| **Total** | | | | | **240** | **2.348,66** | **28.183,92** |

Datos suministrados:
- Torres 1 a 3: 12 pisos tipo, 4 apartamentos por piso por torre, 107 m² cada apartamento, 544 m² por piso por torre.
- Torres 4 y 5: 8 unidades por piso (6 en la Torre 4 y 2 en la Torre 5), 12 pisos, 716,66 m² construidos por piso entre las dos.
- Torre 5: 254 m² por piso; cada unidad 97 m².
- Torre 4: 462,66 m² por piso (716,66 − 254).

Área común por piso (construida − apartamentos):

| Torre | Construida por piso | Apartamentos por piso | Común por piso |
|---|---|---|---|
| Torres 1 a 3 (c/u) | 544,00 | 428,00 | 116,00 |
| Torre 4 | 462,66 | 356,57 | 106,09 |
| Torre 5 | 254,00 | 194,00 | 60,00 |

Dato registrado sin conciliar: "piso tipo 1.770 m²" (suministrado al inicio). No coincide con 3 × 544 = 1.632 m².

## 3. Tipologías torres 4 y 5

Valor m²: 440.000.000 ÷ 107 = $4.112.149,53 (en la página: $4.112.150).

| Torre | Tipología | Área (m²) | Valor unidad ($) | Unidades (12 pisos) | Valor total (millones $) |
|---|---|---|---|---|---|
| Torre 4 | 1 | 67,27 | 276.624.299 | 12 | 3.319,5 |
| Torre 4 | 2 | 65,71 | 270.209.346 | 12 | 3.242,5 |
| Torre 4 | 3 | 42,92 | 176.493.458 | 12 | 2.117,9 |
| Torre 4 | 4 | 67,52 | 277.652.336 | 12 | 3.331,8 |
| Torre 4 | 5 | 28,37 | 116.661.682 | 12 | 1.399,9 |
| Torre 4 | 6 | 84,78 | 348.628.037 | 12 | 4.183,5 |
| Torre 5 | 1 | 97,00 | 398.878.505 | 12 | 4.786,5 |
| Torre 5 | 2 | 97,00 | 398.878.505 | 12 | 4.786,5 |
| **Total** | | | | **96** | **27.168,3** |

Por torre:

| Torre | Apartamentos por piso (m²) | Área apartamentos 12 pisos (m²) | Valor por piso ($) | Valor torre (millones $) |
|---|---|---|---|---|
| Torre 4 | 356,57 | 4.278,84 | 1.466.269.159 | 17.595,2 |
| Torre 5 | 194,00 | 2.328,00 | 797.757.009 | 9.573,1 |
| **Total** | | **6.606,84** | | **27.168,3** |

Referencia torres 1 a 3 (no son tipologías): 107 m² a $440.000.000; 48 apartamentos por torre = $21.120 millones por torre; $63.360 millones las tres.

## 4. Parqueaderos

Todos los parqueaderos están en sótano.

| Sótano | Torres 1, 2 y 3 | Acumulado | Torres 4 y 5 | Acumulado |
|---|---|---|---|---|
| Sótano 1 | 72 | 72 | 42 | 42 |
| Sótano 2 | 53 | 125 | 142 | 184 |
| Sótano 3 | 45 (visitantes) | 170 | 104 | 288 |
| **Total** | **170** | | **288** | |

Total de parqueaderos: 458.
Área de sótanos (suministrada como primer y segundo nivel de parqueaderos): 20.000 + 26.000 = 46.000 m².

## 5. Áreas totales

| Concepto | Cálculo | Área (m²) |
|---|---|---|
| Sótanos | 20.000 + 26.000 | 46.000,00 |
| Torres 1 a 3 (construidas) | 544 × 12 × 3 | 19.584,00 |
| Torres 4 y 5 (proyectadas) | 716,66 × 12 | 8.599,92 |
| **Área total construida** | | **74.183,92** |

Índice de construcción incluyendo sótanos: 74.183,92 ÷ 15.702 = 4,72 (retirado de la página; se conserva aquí).

## 6. Valor del proyecto

| Concepto | Valor (millones $) |
|---|---|
| Torres 1 a 3 | 63.360,0 |
| Torres 4 y 5 | 27.168,3 |
| **Total** | **90.528,3** |
