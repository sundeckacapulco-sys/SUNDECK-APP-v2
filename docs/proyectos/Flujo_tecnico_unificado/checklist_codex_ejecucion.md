
# ✅ CHECKLIST DE EJECUCIÓN – RUTA ÓPTIMA DE REPARACIÓN  
**Proyecto:** SUNDECK CRM – Flujo Técnico Unificado  
**Ubicación:** `/docs/proyectos/flujo_tecnico_unificado/checklist_codex_ejecucion.md`  
**Fecha de inicio:** 6 Noviembre 2025  
**Responsable técnico:** Agente Codex  
**Supervisión funcional:** David Rojas  

---

## 🎯 Objetivo General
Asegurar que la información técnica capturada en el **Levantamiento** fluya completa hasta **Pedido y Fabricación**, restaurando la trazabilidad técnica y los KPIs del CRM.

---

## 📦 Archivos Principales Involucrados

| Archivo | Estado | Acción |
|----------|---------|--------|
| `server/utils/cotizacionMapper.js` | [ ] | Reinstalar / actualizar con 13 campos técnicos |
| `server/controllers/proyectoController.js` | [ ] | Confirmar mapper activo |
| `server/controllers/pedidoController.js` | [ ] | Integrar mapper unificado |
| `server/models/Pedido.js` | [ ] | Extender schema con `especificacionesTecnicas` |
| `server/controllers/fabricacionController.js` | [ ] | Validar lectura de info completa desde `Pedido` |
| `/docs/proyectos/flujo_tecnico_unificado/verificacion_flujo_tecnico_unificado.md` | [ ] | Generar documento de verificación final |

---

## 🧱 FASE 1 – Diagnóstico Inicial

- [ ] Ejecutar prueba de flujo con levantamiento completo.  
- [ ] Crear pedido desde proyecto.  
- [ ] Ejecutar en MongoDB:
  ```js
  db.pedidos.findOne({}, { "productos.especificacionesTecnicas": 1 });
 Registrar resultado en debug_punto_de_quiebre.md.

🕒 Duración estimada: 1 día

🧩 FASE 2 – Reinstalar Mapper Unificado
 Crear o restaurar server/utils/cotizacionMapper.js.

 Verificar que incluya los 13 campos técnicos.

 Exportar correctamente la función construirProductosDesdePartidas.

 Confirmar integración en proyectoController.js y pedidoController.js.

🕒 Duración estimada: 1 día

⚙️ FASE 3 – Actualizar Modelo de Pedido
 Editar server/models/Pedido.js.

 Agregar bloque especificacionesTecnicas dentro de productos[].

 Validar que los campos coincidan con los del levantamiento.

 Confirmar que los cambios no rompen la validación de Mongoose.

🕒 Duración estimada: 0.5 día

🏗️ FASE 4 – Sincronizar Fabricación
 Revisar fabricacionController.js.

 Confirmar lectura desde Pedido.findById().

 Validar que PDF o vista de taller lean de producto.especificacionesTecnicas.

 Si lee desde cotización, redirigir a pedido.

🕒 Duración estimada: 1 día

🧪 FASE 5 – Prueba Integral del Flujo
 Crear levantamiento con los 13 campos técnicos.

 Generar cotización formal.

 Aprobar → Crear pedido.

 Verificar en Mongo:

js
Copiar código
db.pedidos.findOne({}, { "productos.especificacionesTecnicas": 1 });
 Crear orden de fabricación.

 Verificar que los PDFs muestren todos los campos.

 Registrar evidencias en verificacion_flujo_tecnico_unificado.md.

🕒 Duración estimada: 1 día

🧾 FASE 6 – Documentación Final
 Confirmar que los commits estén registrados:

makefile
Copiar código
fix: flujo tecnico unificado  
chore: reinstalar cotizacionMapper.js  
update: Pedido.js estructura tecnica  
sync: FabricacionController lectura completa  
docs: verificacion flujo tecnico unificado
 Generar archivo verificacion_flujo_tecnico_unificado.md con resultados finales.

 Adjuntar capturas o logs de MongoDB.

 Confirmar estado de trazabilidad completo en el dashboard.

🕒 Duración estimada: 0.5 día

📊 VALIDACIÓN FINAL
Área	Indicador	Resultado Esperado	Estado
Flujo de Datos	Información 13 campos fluye completa	✅ Confirmado	[ ]
Pedido	Contiene estructura técnica completa	✅ Confirmado	[ ]
Fabricación	PDF y órdenes con datos técnicos	✅ Confirmado	[ ]
KPIs	Ventas calculadas desde pedidos	✅ Sin error	[ ]
Logs	Sin errores críticos	✅ Limpio	[ ]

🧠 Observaciones Técnicas / Notas de Codex
(Espacio libre para comentarios durante la ejecución)

python-repl
Copiar código
...
Versión del documento: 1.0
Fecha de emisión: 6 Noviembre 2025
Responsable técnico: Equipo Codex
Supervisión: David Rojas – Dirección Técnica SUNDECK CRM

