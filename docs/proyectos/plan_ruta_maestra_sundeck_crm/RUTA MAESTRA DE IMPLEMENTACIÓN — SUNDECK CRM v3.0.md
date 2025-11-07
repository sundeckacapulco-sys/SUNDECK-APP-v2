# 🧭 RUTA MAESTRA DE IMPLEMENTACIÓN — SUNDECK CRM v3.0  
**Autor:** Dirección Técnica – David Rojas  
**Responsable Técnico:** Agente Codex  
**Fecha:** 7 Noviembre 2025  
**Versión:** 3.0.0 – Base Operativa Definitiva

---

## 🎯 PROPÓSITO
Consolidar el ecosistema completo del CRM Sundeck, garantizando un flujo continuo y trazable desde **Prospecto → Proyecto → Pedido → Instalación**,  
con automatización, supervisión, auditoría e inteligencia comercial integradas.

---

## 📍 ESTADO ACTUAL
✅ Modelo `Proyecto.js` finalizado con trazabilidad completa  
✅ Prospectos unificados e integrados  
✅ Back-end estable y modularizado  
✅ Flujo técnico de fabricación e instalación operativo  
✅ KPIs comerciales activos  
🔜 Próximas fases: interfaz, automatización y dashboards

---

# 🧩 FASE 1 – SINCRONIZACIÓN DE INTERFAZ (Frontend + UX)
**Objetivo:** conectar la experiencia del usuario con la nueva estructura de datos.

### 🔧 Acciones
1. **Actualizar formularios**  
   - Un solo formulario que puede iniciar como `tipo: "prospecto"` o `tipo: "proyecto"`.  
   - Incluir campos:
     - `origenComercial.fuente`
     - `asesorComercial`
     - `estadoComercial`
   - Secciones: “Notas”, “Seguimiento”, “Historial”.

2. **Refactorizar vistas existentes**  
   - Levantamiento técnico → leer/escribir desde `proyecto.levantamiento.partidas`.  
   - Cotización → solo lectura de campos técnicos.  
   - Pedido → lectura desde `proyecto.cotizaciones`.

3. **Agregar filtros globales en el dashboard**
   - Por tipo (`prospecto` / `proyecto`)  
   - Por asesor  
   - Por fuente comercial

🕒 **Duración estimada:** 5 días  
🎯 **Resultado:** Interfaz sincronizada con la base de datos y nuevos campos visibles.

---

# 🧩 FASE 2 – AUTOMATIZACIÓN INTELIGENTE
**Objetivo:** liberar carga operativa y garantizar seguimiento automático.

### 🔧 Acciones
1. Activar **scheduler (cron)** para:
   - Prospectos sin nota en 5 días → alerta al asesor.  
   - Proyectos sin movimiento en 10 días → alerta al coordinador.  
   - Instalaciones retrasadas → alerta a operaciones.

2. Implementar **estado inteligente**
   - Si se genera cotización → `estadoComercial = "cotizado"`.  
   - Si se crea pedido → `estadoComercial = "convertido"`.  
   - Si pasan 30 días sin pedido → `estadoComercial = "perdido"`.

3. Middleware automático:
   ```js
   ProyectoSchema.pre("save", function(next) {
     if (this.isModified("estadoComercial")) {
       this.historialEstados.push({
         fecha: new Date(),
         estado: this.estadoComercial,
         usuario: this.actualizadoPor,
         comentario: "Cambio automático de estado"
       });
     }
     next();
   });
🕒 Duración: 3 días
🎯 Resultado: CRM autoactualizable con trazabilidad completa por tiempo y acción.

🧩 FASE 3 – PANEL DE SUPERVISIÓN Y KPIs DINÁMICOS
Objetivo: convertir los datos en inteligencia operativa y comercial.

🔧 Acciones
Crear Dashboard de Supervisión

Vista consolidada por asesor y canal de origen.

Métricas:

% de conversión

Tiempo promedio de cierre

Prospectos activos / en riesgo

Agregar línea de tiempo de estados

Visualización del historialEstados por proyecto.

Botón “Ver historial” desde cada tarjeta.

Reportes PDF automáticos

/api/reportes/prospectos

Exportables por asesor o campaña.

🕒 Duración: 5–7 días
🎯 Resultado: panel gerencial completo para medir desempeño comercial.

🧩 FASE 4 – CONTROL DE CALIDAD Y AUDITORÍA
Objetivo: garantizar trazabilidad y transparencia en toda acción comercial.

🔧 Acciones
Implementar módulo de auditoría comercial

Usa historialEstados, seguimiento y actualizadoPor.

Filtros: usuario, fecha, tipo de acción.

Exportable a PDF para Mesa de Control.

Alertas de auditoría:

“Proyecto editado sin autorización”

“Prospecto eliminado sin seguimiento”

“Pedido sin anticipo registrado”

Logs estructurados (Winston o Pino):

js
Copiar código
logger.info(`[AUDITORÍA] Proyecto ${this.numero} cambiado a ${this.estadoComercial} por ${usuario}`);
🕒 Duración: 4 días
🎯 Resultado: sistema auditable y listo para certificación ISO interna.

🧩 FASE 5 – INTELIGENCIA COMERCIAL (IA LIGERA)
Objetivo: anticipar cierres o abandonos mediante modelos predictivos simples.

🔧 Acciones
Campo probabilidadCierre dinámico:

js
Copiar código
probabilidadCierre =
  (contactosRecientes * 0.4) +
  (tiempoPromedioDeRespuesta * 0.3) +
  (historicoNotas * 0.3);
Mostrar probabilidad en Dashboard (semáforo):

🔴 < 30%

🟠 30–70%

🟢 > 70%

Registrar evolución en historialEstados.

🕒 Duración: 5 días
🎯 Resultado: CRM predictivo y priorización automática de prospectos.

🧩 FASE 6 – ENTREGA Y DOCUMENTACIÓN
Objetivo: cerrar versión estable y dejarla lista para producción.

🔧 Acciones
Generar documentos institucionales:

acta_cierre_modelo_proyecto.md

acta_cierre_modulo_prospectos_unificados.md

Crear scripts automáticos de respaldo:

/scripts/backup.sh → respaldo Mongo diario.

Actualizar:

README principal

CHANGELOG.md

Etiqueta de versión v3.0.0

🕒 Duración: 2 días
🎯 Resultado: sistema estable, documentado y versionado.

📊 RESUMEN GENERAL
Fase	Objetivo	Entregable
1	Sincronizar formularios y dashboard	Formularios + filtros por tipo y asesor
2	Automatización inteligente	Jobs + middleware + alertas
3	Supervisión comercial y KPIs	Dashboard gerencial
4	Auditoría interna	Panel de auditoría + logs
5	Inteligencia comercial	Algoritmo predictivo + semáforo
6	Entrega formal	Actas + backup + versión final

🧱 PRIORIDAD ACTUAL (INICIO DE EJECUCIÓN)
🚀 Iniciar con Fase 1: Sincronización de Formularios y Dashboard Comercial.
Esto permitirá que el equipo de ventas cree, siga y convierta prospectos desde el CRM.

Versión: 3.0.0
Revisión Técnica: Dirección Sundeck
Ejecución: Agente Codex
Estado: ✅ Plan aprobado – pendiente de ejecución inicial

