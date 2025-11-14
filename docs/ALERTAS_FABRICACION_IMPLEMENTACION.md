# 📊 Implementación - Alertas de Fabricación (Fase 2)

## 🏭 Resumen General
- **Servicio principal:** `server/services/alertasFabricacionService.js`
- **Cobertura:** Órdenes retrasadas, materiales faltantes y controles de calidad pendientes.
- **Consumo:** API REST en `/api/alertas/inteligentes/fabricacion` y panel React (`PanelAlertasFabricacion`).
- **Actualización automática:** Job programado cada 4 horas (`server/jobs/scheduler.js`).

## 🚨 Categorías de Alerta
| Categoría | Clave (`tipo`) | Umbral | Prioridad | Descripción |
|-----------|----------------|--------|-----------|-------------|
| Órdenes retrasadas | `fabricacion_retrasada` | `ALERTAS_FABRICACION_UMBRAL_RETRASO` (default **3** días) | Crítica | Orden en fabricación que superó la fecha estimada sin completarse. |
| Materiales faltantes | `materiales_faltantes` | N/A | Alta | Órdenes que no pueden avanzar por materiales no disponibles o sin confirmar. |
| Control de calidad pendiente | `calidad_pendiente` | `ALERTAS_FABRICACION_UMBRAL_CALIDAD` (default **1** día) | Importante | Fabricación terminada sin registro de revisión de calidad. |

Cada alerta incluye datos de cliente, responsables, resumen contextual y acciones sugeridas (`actualizar_cronograma`, `solicitar_materiales`, etc.).

## 🔌 Endpoints Disponibles
Base: `/api/alertas`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/inteligentes/fabricacion` | Panel completo (resumen, categorías e items) con filtros opcionales `limite`, `umbralRetraso`, `umbralCalidad`. |
| `GET` | `/inteligentes/fabricacion/retrasadas` | Solo alertas de órdenes retrasadas (`?limite` y `?umbral`). |
| `GET` | `/inteligentes/fabricacion/materiales` | Solo alertas por materiales faltantes (`?limite`). |
| `GET` | `/inteligentes/fabricacion/calidad` | Solo alertas de control de calidad (`?limite` y `?umbral`). |

Todas las rutas requieren autenticación y permiso `proyectos:leer`.

## 🧠 Flujo Backend
1. **Detección:** `AlertasFabricacionService` consulta `Proyecto` y formatea resultados.
2. **Agregación:** `obtenerTodasLasAlertas()` consolida categorías, resumen y lista plana (`alertas`).
3. **Programación:** `server/jobs/alertasFabricacion.js` ejecuta las consultas y genera notificaciones automáticas.
4. **Scheduler:** `server/jobs/scheduler.js` agenda la ejecución cada 4 horas (`0 */4 * * *`).

## 💻 Integración Frontend
- **Dashboard proyectos:** `FabricacionTab.jsx` renderiza `PanelAlertasFabricacion` al inicio del módulo, refrescando automáticamente tras acciones.
- **Vista unificada:** `AlertasView.jsx` añade pestaña de "Fabricación" y mezcla las alertas con las comerciales.
- **Hook compartido:** `useAlertasInteligentes` permite consumir diferentes endpoints con parámetros dinámicos.

### Componentes Clave
- `client/src/modules/fabricacion/components/PanelAlertasFabricacion.jsx`
  - Divide por categoría, muestra contadores, badges de prioridad y acciones rápidas.
- `client/src/modules/alertas/AlertasView.jsx`
  - Tabs: Comercial / Fabricación / Todas.
  - Resumen cuantitativo y lista detallada reutilizando estilos comunes.

## ⚙️ Configuración
Variables opcionales en `.env`:
```
ALERTAS_FABRICACION_UMBRAL_RETRASO=3
ALERTAS_FABRICACION_UMBRAL_CALIDAD=1
ALERTAS_FABRICACION_CRON='0 */4 * * *'
```
Si no se definen, el sistema usa los valores por defecto señalados.

## 📈 Ejemplos de Consumo
```bash
# Panel completo (limita a 10 resultados por categoría)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5001/api/alertas/inteligentes/fabricacion?limite=10"

# Solo órdenes retrasadas con umbral de 5 días
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5001/api/alertas/inteligentes/fabricacion/retrasadas?umbral=5"
```

En frontend, el hook puede invocarse así:
```js
const { data, cargarAlertas } = useAlertasInteligentes({
  endpoint: '/alertas/inteligentes/fabricacion',
  limite: 6
});
```

## 🛠️ Troubleshooting
- **Sin alertas:** verificar estados y fechas en `Proyecto.fabricacion` y `cronograma`.
- **Datos incompletos:** confirmar `populate` de `fabricacion.asignadoA`, `asesor_asignado` y `cliente`.
- **Cron inactivo:** asegurar que `Scheduler.start()` se ejecuta (archivo `server/index.js`).
- **Permisos:** chequear middleware `auth`/`verificarPermiso` para el rol consultante.

## ✅ Checklist de Verificación
- [x] Servicio `AlertasFabricacionService` operativo.
- [x] Endpoints REST funcionales.
- [x] Panel React conectado y refrescando.
- [x] Job programado registrando métricas en logs.
- [x] Documentación actualizada (este archivo).
