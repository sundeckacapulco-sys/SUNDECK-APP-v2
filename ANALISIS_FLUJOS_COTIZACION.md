# Análisis integral de los flujos de cotización

## Resumen ejecutivo

El frontend mantiene **cuatro implementaciones independientes** para capturar levantamientos técnicos y generar cotizaciones. Cada flujo replica lógica de productos, totales e instalación, pero con **estados locales y estructuras de datos incompatibles**, lo que provoca pérdida de información cuando los datos se transforman entre componentes y servicios. La siguiente tabla resume el objetivo de cada flujo y los principales hallazgos.

| Flujo | Archivo principal | Objetivo | Problemas clave |
| --- | --- | --- | --- |
| Levantamiento técnico | `client/src/components/Prospectos/AgregarEtapaModal.js` | Captura técnica sin precios | Estructura técnica rica (`medidas[]`, motorización, instalación) que se normaliza en múltiples payloads y se reduce al primer juego de medidas al generar documentos. |
| Cotización en vivo | `client/src/components/Prospectos/AgregarEtapaModal.js` | Cotizar durante la visita | Instancia el mismo modal con `tipoVisitaInicial='cotizacion'`, calcula totales al vuelo, pero los extras como instalación especial dependen de cálculos dispersos y no siempre se conservan en el payload enviado. |
| Cotización tradicional | `client/src/components/Cotizaciones/CotizacionForm.js` | Cotización formal para prospectos | Maneja productos con otra forma (`productos[].medidas.area`) y recalcula totales/IVA de forma distinta. Importa levantamientos mapeando estructuras heterogéneas. |
| Cotización directa | `client/src/components/Cotizaciones/CotizacionDirecta.js` | Cotización express con wizard | Crea prospecto y cotización en cascada, pero genera otra variante de productos y totales y fija `origen: 'directa'` sin contemplar otros escenarios. |

---

## 1. Levantamiento técnico

- **Contexto de UI:** Modal `AgregarEtapaModal` inicia con `tipoVisitaInicial='levantamiento'`, activando captura técnica detallada, descuentos, facturación e instalación.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L92-L160】
- **Estructura capturada:** Cada pieza se inicializa desde `createEmptyPieza` con un arreglo de `medidas` y metadatos técnicos (motorización, kits, controles, fotos).【F:client/src/components/Prospectos/AgregarEtapaModal.constants.js†L60-L92】 El hook `usePiezasManager` valida y normaliza estos arreglos, manteniendo las medidas por pieza.【F:client/src/components/Prospectos/hooks/usePiezasManager.js†L1-L118】
- **Normalización actual:** Antes de guardar, las piezas pasan por `mapearPiezaParaDocumento`, que proyecta cada elemento a un objeto plano y añade extras opcionales.【F:client/src/utils/cotizacionEnVivo.js†L42-L113】 Posteriormente el payload agrega `tipoVisita: 'levantamiento'` y `datosLevantamiento` al llamar al endpoint `/etapas`.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L1084-L1121】
- **Problemas observados:**
  - El mapeo prioriza la primera medida (`primeraMedida`) para campos de ancho/alto, lo que dificulta reconstruir series de medidas cuando otros servicios consumen sólo los campos planos.【F:client/src/utils/cotizacionEnVivo.js†L46-L64】
  - La exportación a PDF/Excel reutiliza la misma normalización, por lo que cualquier extensión al objeto (ej. información de instalación especial) depende de banderas dispersas en el estado y puede omitirse si no se sincroniza antes de generar el documento.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L1000-L1035】【F:client/src/components/Prospectos/AgregarEtapaModal.js†L1084-L1104】

## 2. Cotización en vivo

- **Contexto de UI:** El mismo modal cambia a modo cotización cuando `tipoVisitaInicial='cotizacion'`, habilitando precios, descuentos e instalación especial durante la visita.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L92-L160】
- **Estructura y cálculos:** Se reutiliza `mapearPiezaParaDocumento`, pero el resumen económico agrega instalación y descuentos según múltiples estados (`cobraInstalacion`, `precioInstalacion`, `valorDescuento`, etc.).【F:client/src/components/Prospectos/AgregarEtapaModal.js†L440-L499】
- **Problemas observados:**
  - El payload arma `instalacionEspecial` usando `resumenEconomico.instalacion`, pero depende de que los cálculos corran antes de enviar; cualquier inconsistencia en el orden de actualización deja `instalacion.cobra` en falso y la instalación se envía en cero.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L1000-L1035】
  - El módulo comparte estado con el flujo de levantamiento, por lo que el reseteo del formulario puede revertir banderas críticas como `tipoVisitaInicial` o `cobraInstalacion` cuando se cierra/reabre el modal, generando payloads incompletos.

## 3. Cotización tradicional

- **Contexto de UI:** Formulario independiente (`CotizacionForm`) con selector de prospecto, tabla editable, calculadoras y validaciones antes del guardado.【F:client/src/components/Cotizaciones/CotizacionForm.js†L485-L556】
- **Estructura capturada:** Los productos se modelan como objetos con `medidas: { ancho, alto, area }`, `cantidad`, `precioUnitario` y `subtotal`, además de propiedades comerciales (descuento, forma de pago).【F:client/src/components/Cotizaciones/CotizacionForm.js†L491-L519】【F:client/src/components/Cotizaciones/CotizacionForm.js†L684-L701】
- **Cálculos internos:** `calcularTotales` recalcula subtotal, descuento, IVA y total, con lógica propia de parseo y validación de descuentos.【F:client/src/components/Cotizaciones/CotizacionForm.js†L661-L681】
- **Problemas observados:**
  - Al importar levantamientos, el componente consulta `/etapas` y trata de reconciliar múltiples formas (`etapa.piezas`, `etapa.data`, `etapa.partidas`), evidenciando que no existe una estructura unificada y forzando condicionales en cascada.【F:client/src/components/Cotizaciones/CotizacionForm.js†L704-L758】
  - Los cálculos de totales duplican la lógica del modal de prospectos pero con reglas distintas (descuento topeado al subtotal, IVA siempre al final), generando discrepancias frente a la cotización en vivo.

## 4. Cotización directa

- **Contexto de UI:** Wizard de tres pasos que crea prospecto y cotización automáticamente.【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L68-L128】
- **Estructura capturada:** El formulario mantiene `cliente`, `productos` (con `medidas` anidadas), condiciones comerciales y descuento, similar pero no idéntico al formulario tradicional.【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L70-L118】
- **Procesos automáticos:** Tras calcular totales propios, crea un prospecto y luego la cotización marcando `origen: 'directa'`, además de recalcular subtotales por producto antes de enviar.【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L240-L295】
- **Problemas observados:**
  - A pesar de recalcular `subtotal` localmente, el payload vuelve a calcularlo multiplicando área × precio × cantidad, pudiendo divergir de la lógica del resto de flujos (especialmente para productos por pieza).【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L130-L159】【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L252-L290】
  - La bandera de origen sólo acepta `'directa'`, complicando la trazabilidad si se quisiera reutilizar el wizard para otros escenarios (muestras, renovaciones, etc.).

---

## Inconsistencias transversales

1. **Estructuras incompatibles:**
   - Levantamiento captura `piezas` con arreglos de `medidas[]` y campos técnicos opcionales.【F:client/src/components/Prospectos/AgregarEtapaModal.constants.js†L60-L92】
   - Cotizaciones tradicionales y directas almacenan `productos[]` con un objeto `medidas` (no arreglo) y calculan `subtotal` localmente.【F:client/src/components/Cotizaciones/CotizacionForm.js†L684-L701】【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L81-L95】

2. **Cálculos duplicados:** Cada flujo implementa su propio `calcularTotales`, generando variaciones en descuentos, IVA e instalación.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L440-L499】【F:client/src/components/Cotizaciones/CotizacionForm.js†L661-L681】【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L130-L158】

3. **Transformaciones múltiples:** Los datos se mapean varias veces (`mapearPiezaParaDocumento`, normalizaciones en `CotizacionForm`, reconstrucciones en `CotizacionDirecta`), lo que introduce puntos de pérdida cuando un servicio espera un formato distinto.【F:client/src/utils/cotizacionEnVivo.js†L42-L113】【F:client/src/components/Cotizaciones/CotizacionForm.js†L704-L758】【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L240-L295】

4. **Estado fragmentado:** Cada componente mantiene su propio `useState`/`useForm`; no existe un store común que permita compartir capturas entre flujos o persistir un levantamiento para reutilizarlo en cualquier cotización.【F:client/src/components/Prospectos/AgregarEtapaModal.js†L92-L160】【F:client/src/components/Cotizaciones/CotizacionForm.js†L491-L528】【F:client/src/components/Cotizaciones/CotizacionDirecta.js†L70-L128】

---

## Recomendaciones de consolidación

1. **Store central unificado:** Implementar un estado compartido (ej. Zustand o Redux Toolkit) con la estructura propuesta a continuación para almacenar cliente, productos, configuración comercial y metadatos del flujo. Esto evita duplicar hooks y asegura que todos los flujos consuman el mismo shape.

   ```js
   {
     cliente: { nombre, telefono, email, direccion },
     productos: [
       {
         id,
         nombre,
         ubicacion,
         medidas: { ancho, alto, area, cantidad },
         precios: { unitario, subtotal },
         tecnico: { tipoControl, orientacion, instalacion, ... },
         extras: { motorizado, esToldo, kits, ... }
       }
     ],
     comercial: {
       instalacionEspecial: { activa, tipo, precio },
       descuentos: { activo, tipo, valor },
       facturacion: { requiereFactura, iva },
       tiempos: { entrega, tipo }
     },
     flujo: { tipo, origen }
   }
   ```

2. **Servicios de normalización únicos:** Centralizar en una sola utilidad la conversión entre el formato del store y los payloads de backend (cotización, pedido, PDF). El objetivo es que cada flujo únicamente declare qué campos adicionales necesita y delegue la serialización a la utilidad.

3. **Módulos de cálculo reutilizables:** Extraer `calcularTotales`, instalación especial, descuentos e IVA a un paquete compartido que reciba el estado del store; así se evitan divergencias entre cotizaciones en vivo, tradicionales y directas.

4. **Workflow basado en wizard reutilizable:** Tomar el wizard de cotización directa como base para todos los flujos, permitiendo saltar pasos según el `flujo.tipo` (ej. en levantamiento ocultar precios, en cotización en vivo habilitarlos, en tradicional precargar prospecto existente).

5. **Trazabilidad consistente:** Añadir `flujo.origen` a todos los payloads derivados (cotización, pedido, documentos) para rastrear el flujo que originó la información y facilitar auditoría.

Con estas medidas, la captura técnica rica del levantamiento se convierte en la misma fuente de verdad que alimenta cualquier tipo de cotización, se evita la duplicidad de cálculos y se previene la pérdida de datos al generar documentos.
