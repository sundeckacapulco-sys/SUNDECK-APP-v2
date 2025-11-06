
# 🧭 RUTA ÓPTIMA DE REPARACIÓN — FLUJO TÉCNICO SUNDECK CRM

**Ubicación:** `/docs/proyectos/flujo_tecnico_unificado/ruta_optima_reparacion.md`  
**Autor:** Dirección Técnica – Sundeck CRM  
**Fecha:** 6 Noviembre 2025  
**Objetivo:** Corregir la pérdida de información técnica entre **Levantamiento → Pedido → Fabricación**, dejando el CRM funcional, coherente y sin duplicidades.

---

## 🎯 OBJETIVO PRINCIPAL
Restablecer el flujo de datos técnicos (13 campos) desde `Proyecto.levantamiento` hasta `Pedido` y `Fabricación`, garantizando trazabilidad completa y consistencia con los KPIs.

---

## 🧩 ENFOQUE ESTRATÉGICO

✅ No alterar la lógica comercial (cotización directa o formal).  
✅ Reforzar `Pedido` como **nodo principal del flujo operativo**.  
✅ Reutilizar el `Levantamiento` como **única fuente de verdad técnica**.  
✅ Reactivar el mapper unificado (`cotizacionMapper.js`) y extender `Pedido.js`.

---

## 🔹 PASO 1 – Confirmar el punto de ruptura

**Archivos a revisar:**
- `server/controllers/proyectoController.js`
- `server/controllers/pedidoController.js`
- `server/utils/cotizacionMapper.js`

**Acción:**
1. Generar un pedido desde un levantamiento real.
2. En MongoDB ejecutar:
   ```js
   db.pedidos.findOne({}, { "productos.especificacionesTecnicas": 1 });
Si está vacío → el corte está en el mapper.
Si llega completo → revisar fabricacionController.js.

Registrar hallazgo:
/docs/proyectos/flujo_tecnico_unificado/debug_punto_de_quiebre.md

🔹 PASO 2 – Reinstalar el mapper unificado
Archivo clave:
server/utils/cotizacionMapper.js

Acción:

Crear o restaurar el archivo si no existe.

Debe incluir todos los 13 campos técnicos dentro de especificacionesTecnicas:

js
Copiar código
especificacionesTecnicas: {
  sistema: [String],
  control: String,
  tipoInstalacion: String,
  tipoFijacion: String,
  caida: String,
  galeria: String,
  telaMarca: String,
  baseTabla: String,
  modoOperacion: String,
  detalleTecnico: String,
  traslape: String,
  modeloCodigo: String,
  observacionesTecnicas: String
}
Exportación:

js
Copiar código
module.exports = { construirProductosDesdePartidas };
🔹 PASO 3 – Integrar mapper en flujo de pedidos
Archivo: server/controllers/pedidoController.js

js
Copiar código
const { construirProductosDesdePartidas } = require('../utils/cotizacionMapper');
Reemplazar cualquier construcción manual de productos con:

js
Copiar código
const productosPedido = construirProductosDesdePartidas(partidasNormalizadas);
pedido.productos = productosPedido;
➡️ Esto garantiza que los datos del levantamiento se copien completos al pedido.

🔹 PASO 4 – Ampliar modelo Pedido.js
Archivo: server/models/Pedido.js

Verificar que incluya el bloque anterior dentro del array productos[].
Si no está presente, agregarlo manualmente.

Esto permitirá almacenar la información técnica de cada pieza directamente en el pedido.

🔹 PASO 5 – Sincronizar Fabricación con Pedido
Archivo: server/controllers/fabricacionController.js

Confirmar que lee productos desde:

js
Copiar código
const pedido = await Pedido.findById(pedidoId).lean();
const productos = pedido.productos;
Asegurar que los PDFs o vistas lean:

js
Copiar código
producto.especificacionesTecnicas
Si Fabricación usa datos desde cotizacion, redirigir lectura a Pedido.

🔹 PASO 6 – Prueba Integral de Validación
Flujo de prueba:

Crear levantamiento técnico (13 campos).

Generar cotización formal.

Aprobar → crear pedido.

Confirmar que en Mongo:

js
Copiar código
db.pedidos.findOne({}, { "productos.especificacionesTecnicas": 1 });
aparezcan los 13 campos.

Crear orden de fabricación y revisar que el PDF o JSON incluya toda la info.

Evidencia:
Guardar resultados en
/docs/proyectos/flujo_tecnico_unificado/verificacion_flujo_tecnico_unificado.md

🧱 RESULTADO FINAL ESPERADO
Módulo	Fuente	Estado Final
Levantamiento	proyecto.levantamiento	✅ Guarda 13 campos técnicos
Cotización	proyecto.cotizacionActual	⚙️ Presenta datos resumidos
Pedido	pedido.productos[].especificacionesTecnicas	✅ Estructura técnica completa
Fabricación	pedido.productos	✅ Genera etiquetas y planos completos
KPIs Ventas	pedidos	✅ Calcula ventas, conversión y anticipos
Dashboard	Sistema Unificado	✅ Muestra trazabilidad completa

🧰 ARCHIVOS INVOLUCRADOS
Archivo	Acción requerida
server/utils/cotizacionMapper.js	Restaurar función unificada
server/controllers/proyectoController.js	Validar mapper activo
server/controllers/pedidoController.js	Integrar mapper
server/models/Pedido.js	Extender schema técnico
server/controllers/fabricacionController.js	Leer info desde pedido
/docs/proyectos/flujo_tecnico_unificado/	Documentar verificación final

🚀 INSTRUCCIÓN PARA CODEX
Acción:
Abrir y ejecutar esta guía completa.

Ubicación:
/docs/proyectos/flujo_tecnico_unificado/ruta_optima_reparacion.md

Secuencia:
1️⃣ Confirmar punto de ruptura
2️⃣ Reinstalar mapper unificado
3️⃣ Integrar en pedido
4️⃣ Extender modelo
5️⃣ Validar fabricación
6️⃣ Documentar resultado

Commits esperados:

makefile
Copiar código
fix: flujo tecnico unificado
chore: reinstalar cotizacionMapper.js
update: Pedido.js estructura tecnica
sync: FabricacionController lectura completa
docs: verificacion flujo tecnico unificado
Entrega final:
/docs/proyectos/flujo_tecnico_unificado/verificacion_flujo_tecnico_unificado.md

💡 BENEFICIOS DE ESTA RUTA
✅ No rompe ventas ni KPIs existentes

✅ Mantiene compatibilidad con Fabricación actual

✅ Una sola fuente de verdad: Levantamiento

✅ Cierre completo del flujo comercial y técnico

✅ Preparado para automatización (Fase 2 del Roadmap)

Versión del documento: 1.0
Fecha de entrega: 6 Nov 2025
Responsable funcional: David Rojas
Responsable técnico: Equipo de Desarrollo CRM – Sundeck

