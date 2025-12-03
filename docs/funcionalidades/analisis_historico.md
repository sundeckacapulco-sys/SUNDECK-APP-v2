
# Documentación Técnica: Módulo de Análisis Histórico

**Fecha:** 5 Nov 2025
**Feature:** Análisis Histórico de KPIs
**Autor:** Gemini AI

---

## 1. Visión General y Propósito

El módulo de **Análisis Histórico** es una herramienta de inteligencia de negocios (BI) diseñada para visualizar la evolución de los indicadores clave de rendimiento (KPIs) a lo largo del tiempo. Su propósito es permitir a la dirección y a los líderes de equipo identificar tendencias, patrones estacionales y el impacto de decisiones estratégicas, pasando de una visión "en tiempo real" a una perspectiva histórica.

Esta funcionalidad responde a la necesidad de contestar preguntas como:
- ¿Cómo se comparan las ventas de este mes con las del mes anterior?
- ¿Tuvimos más o menos prospectos este trimestre que el anterior?
- ¿Nuestra capacidad de producción (órdenes finalizadas) está aumentando o disminuyendo?

---

## 2. Arquitectura de la Solución

La solución se compone de tres partes principales que trabajan en conjunto:

### a. Captura de Datos (El "Historiador")

- **Modelo:** `server/models/MetricaHistorica.js`
  - Este es un nuevo modelo de Mongoose diseñado para almacenar una "foto" diaria de los KPIs más importantes del negocio.
  - Guarda una copia aplanada de los resultados de los endpoints de `/dashboard` y `/operacionales-diarios`.
  - Incluye un campo `actividadDetectada` (booleano) para identificar fácilmente los días en que hubo cambios relevantes.

- **Proceso Automatizado:** `server/scheduler.js` (cron job)
  - Un trabajo programado (cron job) se ejecuta automáticamente **todas las noches**.
  - Este script llama a los endpoints de KPIs, recopila los datos del día y los guarda en un nuevo documento en la colección `MetricaHistorica`.
  - Este proceso garantiza que los datos históricos se recolecten de forma consistente y sin intervención manual.

### b. API Endpoint (El "Proveedor de Datos")

- **Ruta:** `GET /api/kpis/historico`
- **Controlador:** `server/routes/kpis.js`
- **Descripción:** Este endpoint es el puente entre la base de datos y el frontend.
- **Parámetros (Query):**
  - `fechaInicio` (String, formato `YYYY-MM-DD`): Fecha de inicio del rango a consultar.
  - `fechaFin` (String, formato `YYYY-MM-DD`): Fecha de fin del rango.
- **Respuesta (JSON):** Devuelve un objeto estructurado que contiene:
  - `meta`: Información sobre la consulta (fechas, número de registros).
  - `resumenes`: Totales y promedios para el período completo (ej. Ventas totales, total de prospectos).
  - `seriesDeTiempo`: Arrays de datos listos para ser consumidos por los gráficos (ej. `fechas`, `ventas`, `prospectos`, `ordenesIniciadas`, `ordenesFinalizadas`).
  - `tablaDeDatos`: Un array de objetos, donde cada objeto representa un día con sus KPIs, listo para ser mostrado en una tabla.

### c. Frontend (La "Cabina de Visualización")

- **Componente Principal:** `client/src/modules/reporteria/AnalisisHistorico.jsx`
- **Descripción:** Es un componente de React que orquesta la interfaz de usuario.
- **Librerías Clave:**
  - `recharts`: Para la creación de gráficos de líneas interactivos y responsivos.
  - `react-date-range` y `date-fns`: Para el selector de rango de fechas y los filtros rápidos.
  - `@mui/material`: Para la estructura de la UI (Grid, Paper, Chip, Table, etc.).

- **Funcionalidades Principales:**
  1.  **Selector de Fechas:** Permite al usuario elegir un rango de fechas personalizado.
  2.  **Filtros Rápidos:** Botones (`Chip`) para seleccionar rangos predefinidos ("7 días", "30 días", "Este Mes").
  3.  **Tarjetas de Resumen:** Muestran los KPIs totales del período seleccionado.
  4.  **Gráficos de Evolución:** Dos gráficos de líneas que muestran la evolución comercial (ventas, prospectos) y de producción (iniciadas, finalizadas).
  5.  **Tabla de Datos Detallada:** Presenta los datos numéricos día por día en una tabla.

---

## 3. Flujo de Trabajo (End-to-End)

1.  **Usuario Navega:** El usuario hace clic en "Análisis Histórico" en el menú lateral.
2.  **Carga Inicial:** El componente `AnalisisHistorico.jsx` se monta y, por defecto, solicita los datos de los últimos 30 días.
3.  **Llamada a la API:** Se realiza una petición `GET` a `/api/kpis/historico` con `fechaInicio` y `fechaFin`.
4.  **Consulta en Backend:** El servidor busca en la colección `MetricaHistorica` todos los documentos dentro del rango de fechas.
5.  **Procesamiento de Datos:** El backend procesa los resultados para crear los objetos `resumenes`, `seriesDeTiempo` y `tablaDeDatos`.
6.  **Respuesta de la API:** El servidor devuelve el objeto JSON al cliente.
7.  **Renderizado en Frontend:** El componente recibe los datos, actualiza su estado y `recharts` dibuja los gráficos. La tabla y las tarjetas de resumen se llenan con la información.
8.  **Interacción del Usuario:** Si el usuario cambia el rango de fechas (usando el calendario o un filtro rápido), el ciclo (pasos 3-7) se repite.

