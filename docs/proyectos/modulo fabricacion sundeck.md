
🏭 MÓDULO DE FABRICACIÓN – SUNDECK CRM

Versión: 1.0
Fecha: 13 Nov 2025
Estado: Diseño funcional completado
Responsable: Dirección General · David Rojas
Integrado con: Proyectos, Levantamientos, Cotización, Inventario, Instalaciones

📌 OBJETIVO DEL MÓDULO

Transformar un proyecto aprobado en un producto terminado listo para instalación, controlando:

Materiales

Inventario

Proceso productivo

Costos reales

Trazabilidad por pieza

Sin saturar al usuario y sin procesos innecesarios.

📐 ALCANCE DEL MÓDULO

El módulo cubre 4 áreas fundamentales:

Cálculo de Materiales (Automático — Bill of Materials)

Control de Inventario (Automático)

Fabricación y Avance General (Semi-automático)

Costos Reales y Trazabilidad (Automático)

Además, incluye:

Generación de etiquetas de empaque con QR

Estado operativo del proyecto:

Pendiente

En Fabricación

Listo para Instalar

⛔ LÍMITES DEL MÓDULO

Para evitar confusión o exceso de complejidad:

Este módulo NO:

Solicita capturar etapas por pieza

Lleva control de horas por pieza

Asigna personal de forma individual

Agenda instalaciones

Registra mano de obra por persona

Funciona como sistema de asistencia o RH

Todo eso pertenece a otros módulos.

Este módulo SÍ:

Calcula todo

Controla todo

Registra todo lo necesario

Automatiza procesos internos

Simplifica la operación

Elimina errores humanos

🔷 1. CÁLCULO AUTOMÁTICO DE MATERIALES (BOM)

El sistema genera automáticamente la Bill of Materials por pieza y por proyecto basándose en:

Ancho y alto final

Tipo de tela

Tipo de sistema

Tipo de caída

Tipo de instalación

Traslapes

Motorización

Herramientas necesarias

Merma técnica

Materiales incluidos en el cálculo:

Tela (m² exactos según ancho real + traslape + alto ajustado)

Tubo (38, 43, 50 mm según sistema)

Soportes (izquierdo, derecho, centrales si aplica)

Mecanismos

Galería / Base

Cadena o motor

Controles RF

Tornillería según tipo de instalación

Tapones

Accesorios especiales

Materiales complementarios

El sistema genera:

BOM por pieza

BOM total por proyecto

BOM para compra

🟩 2. CONTROL DE INVENTARIO (AUTOMÁTICO)

Cuando un proyecto pasa a "En Fabricación", el sistema:

✔ Verifica existencias
✔ Identifica faltantes
✔ Genera alertas
✔ Suma consumo total
✔ Descuenta inventario automáticamente
✔ Genera lista de compra si hay faltante
✔ Muestra un semáforo de stock:

🟢 Suficiente

🟡 Bajo

🔴 Insuficiente

Materiales monitoreados:

Telas por color

Tubos por diámetro

Motores

Controles

Mecanismos

Soportes

Tornillería

Galerías/bases

🔶 3. AVANCE GENERAL DE FABRICACIÓN (SEMI-AUTOMÁTICO)

El módulo no pide datos pieza por pieza.
Solo gestiona el avance global del proyecto, con estados:

▶ Estado del Proyecto

Pendiente

En Fabricación

En Ensamble Final

Empaque

Listo para Instalar

▶ El responsable puede actualizar manualmente:

Porcentaje general (ej. 60%)

Notas internas

Material faltante

Problemas encontrados

Fecha estimada de entrega

Esto mantiene el módulo ágil y sin carga excesiva.

🟦 4. COSTOS REALES

El sistema calcula automáticamente:

✔ Costos de materiales

Según BOM + costos actualizados.

✔ Costos de mano de obra estándar

Por tipo de producto:

Roller: tiempo estándar por pieza

Sheer: tiempo estándar por pieza

Toldo vertical: tiempo estándar

Motorización: tiempo estándar
(La industria usa “tiempos promedio” estándar)

✔ Merma

Por tela y corte.

✔ Overhead

% definido por la empresa:
(luz, renta, desgaste, amortización)

✔ Costo por pieza

Material + MO + Overhead + Motor (si aplica)

✔ Costo por proyecto

Sumatoria total del proyecto.

✔ Margen real

Venta – costo real.

🟪 5. ETIQUETAS DE EMPAQUE – ESTÁNDAR INDUSTRIAL

Cada pieza genera una etiqueta automática:

Información incluida:

Cliente

Proyecto

Pieza (1/7, 2/7, etc.)

Ubicación exacta

Tipo de producto

Tela

Color

Ancho final

Alto final

Control / Motor

Fecha de fabricación

Responsable

QR con ficha completa del producto

Formatos:

10×7 cm (estándar)

Termal o láser

🟧 6. TRAZABILIDAD POR PIEZA (QR)

Al escanear el QR se muestra:

Datos completos de la pieza

Materiales usados

Avance

Fecha de fabricación

Responsable del taller

Estado actual

Observaciones internas

Error o retrabajo (si hubo)

Permite que:

Instalación

Coordinación

Dirección

puedan ver la pieza sin consultar a nadie.

🟫 7. REPORTE DEL RESPONSABLE DE FABRICACIÓN (HUMANO)

EL CRM SOLO REGISTRA UN CAMPO:

“Reporte General de Fabricación”

Este reporte lo llena el responsable:

Contenido del reporte:

Proyecto

Piezas fabricadas hoy

Avance general (%)

Estado actual (cortes, ensamble, empaque)

Material faltante

Problemas detectados

Retrabajos

Estimación de entrega

Observaciones

📊 8. DASHBOARD DE FABRICACIÓN (INDICADORES CLAVE)

KPIs incluidos:

Eficiencia

Piezas fabricadas por día

Tiempo promedio por pieza

Proyectos completados hoy

Proyectos retrasados

Calidad

Retrabajos por mes

Material desperdiciado (merma)

Proyectos sin errores

Costos

Costo real vs costo proyectado

Costo por m²

Merma por tela

Variación mensual

🧭 9. FLUJO OPERATIVO COMPLETO

Proyecto aprobado

Módulo calcula materiales

Inventario verifica y descuenta

Se activa “En Fabricación”

Taller comienza producción

Responsable reporta diario

Sistema genera etiquetas

Empaque finalizado

Sistema marca “Listo para Instalar”

Se habilita agendar instalación

🧱 10. ESTRUCTURA TÉCNICA SUGERIDA (para el dev)

(No incluyo código para que no se pierda claridad)

Backend:

calculoMaterialesService

inventarioService

fabricacionService

costosService

Modelos:

Fabricacion

BOM

Inventario

Pieza

ReporteFabricacion

Frontend:

FabricacionTab

BOMList

CostoCard

QRGenerator

EstadoFabricacionCard

ReporteGeneral

🟣 11. COMPATIBILIDAD CON INDUSTRIA (VERIFICADO)

Este módulo ya está alineado con:

✔ Fabricación de persianas y toldos (México/LatAm)
✔ Sistemas LEAN / Kanban simplificado
✔ Estándar de producción ligera
✔ Trazabilidad por lote / QR
✔ Norma interna de manufactura ligera (no ISO, pero compatible)
✔ Sistemas modernos de producción textil/mecánico
🏁 CONCLUSIÓN

El Módulo de Fabricación convierte tu CRM en una plataforma industrial real capaz de:

Controlar materiales

Evitar errores en taller

Ahorrar tiempo

Reducir mermas

Aumentar márgenes

Trazar cada pieza

Profesionalizar la operación

Es simple, potente y escalable.