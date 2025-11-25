# 📋 Plan de Acción: Sistema CRM Sundeck

Basado en la auditoría del sistema (`docs/auditoria_sistema_actual.md`) y los objetivos de la Fase 4.

---

## 🚨 Prioridad Alta: Correcciones Críticas

### DASH-001
**DESCRIPCION:** 
Corrección del cálculo de `montoTotal` en el dashboard unificado. Actualmente, la agregación depende exclusivamente de `cotizacionActual.totales.total`, lo que ignora el campo raíz `total` del Proyecto (actualizado por controladores y hooks) y resulta en valores de cero o incorrectos para proyectos sin cotización vinculada explícitamente o creados por vías directas. Se implementará una lógica de fallback robusta.

**ARCHIVO:** 
`server/routes/dashboardUnificado.js`

**CODIGO_A_REEMPLAZAR:**
```javascript
          // Monto total de ventas (CORRECCIÓN DEFINITIVA)
          montos: [
            {
              $group: {
                _id: null,
                montoTotal: { $sum: { $ifNull: ['$cotizacionActual.totales.total', 0] } }
              }
            }
          ],
```

**CODIGO_NUEVO:**
```javascript
          // Monto total de ventas (CORRECCIÓN DEFINITIVA)
          montos: [
            {
              $group: {
                _id: null,
                // Priorizar el total del proyecto (fuente de verdad), fallback a cotización
                montoTotal: { 
                  $sum: { 
                    $cond: {
                      if: { $gt: [{ $ifNull: ['$total', 0] }, 0] },
                      then: '$total',
                      else: { $ifNull: ['$cotizacionActual.totales.total', 0] }
                    }
                  } 
                }
              }
            }
          ],
```

**COMANDO_VERIFICACION:** 
```bash
# Validar que el endpoint responda sin errores y verificar logs
curl -v http://localhost:5001/api/dashboard-unificado?periodo=30 -H "Authorization: Bearer TOKEN"
```
*(Nota: Se verificará observando los logs del servidor que imprimen "montoVentas" en el objeto de respuesta)*

**RESULTADO_ESPERADO:** 
El campo `montoVentas` y `valorTotalPedidos` en la respuesta JSON debe reflejar la suma de los totales de los proyectos creados en el periodo, tomando el valor del campo raíz `total` cuando esté disponible.

---

## 🗓️ Próximas Tareas (Pendientes de Aprobación)

### PROY-001
**DESCRIPCION:** Documentar y bloquear rutas `proyectoPedido` (Legacy) para evitar divergencia de datos.
**PRIORIDAD:** Inmediata

### EXP-001
**DESCRIPCION:** Consolidar exportaciones en `exportacionController` y eliminar rutas duplicadas en `proyectos.js`.
**PRIORIDAD:** Alta
