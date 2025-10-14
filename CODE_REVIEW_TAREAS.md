# Observaciones de mejora (PDFs y Excels)

1. **Normalizar datos de piezas antes de generar documentos**
   - `mapearPiezaParaDocumento` sobrescribe `numMotores` a `1` y pierde banderas como `esControlMulticanal`, haciendo que los cálculos de motores y controles sean incorrectos en PDF y Excel. Debe conservar los valores reales y enviar también `piezasPorControl`/`esControlMulticanal` para que los servicios puedan calcular los extras con precisión. 【F:client/src/utils/cotizacionEnVivo.js†L70-L86】
2. **Endurecer la preparación de datos en el PDF de cotizaciones**
   - `cotizacion.productos.map(...)` asume que siempre hay productos. Cuando el arreglo está vacío o indefinido se rompe el flujo. Conviene usar `cotizacion.productos?.map ?? []` y validar datos numéricos antes de formatearlos. 【F:server/services/pdfService.js†L600-L641】
   - El spread sobre `anticipo`/`saldo` falla si esos objetos no existen (`...undefined`). Usar `...(cotizacion.formaPago.anticipo || {})` para evitar `TypeError` y completar montos faltantes con `0`. 【F:server/services/pdfService.js†L642-L651】
3. **Corregir los totales de motores y controles en PDF de levantamiento**
   - El servicio espera `pieza.numMotores`, pero al llegar como `1` los montos de motores y controles se subreportan. Además, hay que respetar `esControlMulticanal` al aplicar `calcularPrecioControlReal`. 【F:server/services/pdfService.js†L1352-L1454】
4. **Alinear los cálculos económicos en Excel**
   - En el formato nuevo, `motorPrecio` no se multiplica por `numMotores`, lo que subestima el subtotal. El control depende del mismo dato, así que la corrección anterior también impacta aquí. 【F:server/services/excelService.js†L200-L234】
   - En el formato anterior pasa lo mismo: se ignora `numMotores` al multiplicar el precio del motor, por lo que los totales son menores. 【F:server/services/excelService.js†L264-L315】
5. **Centralizar lógica compartida entre PDF y Excel**
   - Ambos servicios duplican reglas de cálculo para kits, motores y controles. Extraer utilidades compartidas reduciría discrepancias y facilitaría futuras mejoras. (Mismas secciones citadas arriba).
