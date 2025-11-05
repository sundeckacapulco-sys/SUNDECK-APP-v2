# 🚀 PLAN DE CONTINUIDAD — NOVIEMBRE 2025

**Estado general:** 4 fases completadas ✅ | **Siguiente enfoque:** Consolidación post-migración y retiro de legacy.
**Documento asociado:** `docs/auditoria_sistema_actual.md` (v1.1) — radiografía completa y hallazgos priorizados.

---

## 🎯 Objetivo Global (Próximos 6 Semanas)

**Asegurar que el CRM opere únicamente sobre el dominio unificado (`Proyecto` + `Pedido`), con métricas confiables y sin dependencias legacy.**

---

## 🗓️ Plan de 3 Sprints

### 🟦 Sprint 1 — Consolidación del Dominio (Semanas 1-2)
- [ ] **Congelar rutas legacy** (`routes/proyectoPedido.js`) con middleware que bloquee nuevas altas y documente el retiro.
- [ ] **Crear `pedidoController.js`** trasladando la lógica crítica de `routes/pedidos.js`.
- [ ] **Extraer validaciones de cotización** a servicios compartidos y limpiar el router.
- [ ] **Sincronizar arrays en `Proyecto`** cuando se creen/actualicen pedidos o cotizaciones desde los nuevos controllers.
- [ ] Actualizar documentación (`docs/auditoria_sistema_actual.md`) con el nuevo flujo único.

### 🟧 Sprint 2 — Métricas y Exportaciones (Semanas 3-4)
- [ ] Refactorizar `KPI.calcularKPIs` para consumir `Proyecto` y mantener un adaptador temporal para `ProyectoPedido`.
- [ ] Cubrir controllers de pedidos y cotizaciones con pruebas unitarias (mínimo: creación, actualización, sincronización).
- [ ] Consolidar exportaciones en `exportacionController`; eliminar endpoints duplicados en `routes/proyectos.js` y actualizar clientes.
- [ ] Añadir monitoreo para detectar rutas legacy activadas (alerta Slack/Email).

### 🟥 Sprint 3 — Cierre Legacy y Observabilidad (Semanas 5-6)
- [ ] Retirar `ProyectoPedido.legacy` y su controller tras validar migración (script `migrarProyectoPedidoAProyecto.js`).
- [ ] Migrar `Instalacion.proyectoId` de `String` a `ObjectId` con script de mantenimiento y validaciones.
- [ ] Revisar y documentar servicios de notificaciones/IA; agregar métricas y alertas básicas.
- [ ] Actualizar dashboards/KPIs finales y publicar reporte ejecutivo.

> 📌 **Dependencias cruzadas:** Cada sprint debe cerrar con un `npm test -- --runInBand` y revisión de logs (`logs/combined-*.log`).

---

## ✅ Checklist Operativa por Sprint

| Ítem | Sprint | Responsable | Definición de Hecho |
| --- | --- | --- | --- |
| Congelación rutas legacy | 1 | Backend | Middleware activo + advertencia documentada |
| Controller de pedidos | 1 | Backend | Router delgado + pruebas básicas |
| KPIs modernizados | 2 | Data/Backend | Dashboard interno validado contra datos reales |
| Exportaciones unificadas | 2 | Backend/Front | Endpoints legacy retirados y clientes actualizados |
| Retiro `ProyectoPedido` | 3 | Backend | Modelo eliminado + migración auditada |
| Migración `Instalacion` | 3 | Backend/Data | IDs actualizados + verificación manual de 10 registros |
| Reporte final | 3 | PM | Documento ejecutivo entregado y firmado |

---

## 🔧 Comandos Útiles

```bash
# Ejecutar pruebas completas en modo serial
npm test -- --runInBand

# Verificar que no existan rutas legacy activas
rg "router" server/routes/proyectoPedido.js

# Confirmar sincronización de arrays en Proyecto
rg "proyecto\.cotizaciones" server -n
rg "proyecto\.pedidos" server -n

# Revisar logs estructurados recientes
ls -t logs/combined-*.log | head -n 5

# Simular generación de exportaciones con el nuevo controller
node scripts/demo/exportacionSmokeTest.js
```

---

## 📚 Referencias
- `docs/auditoria_sistema_actual.md` — Radiografía técnica y riesgos priorizados.
- `server/controllers/` — Punto de partida para extraer lógica de rutas.
- `docschecklists/MODELOS_LEGACY.md` — Procedimiento oficial para retiro de modelos legacy.
- `docschecklists/PLAN_TRABAJO_DETALLADO.md` — Roadmap maestro (12 meses) alineado a este plan corto.

---

**Última actualización:** 5 Noviembre 2025 — Preparado por gpt-5-codex.
