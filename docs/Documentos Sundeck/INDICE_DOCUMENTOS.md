# 📚 ÍNDICE DE DOCUMENTOS SUNDECK
**Base de Conocimiento para AGENTE_IA_SUNDECK**  
**Última actualización:** 05.Dic.2025

---

## 🎯 PROPÓSITO

Esta carpeta contiene los **documentos oficiales** que el agente IA debe usar como fuente de verdad.
Cualquier respuesta del agente debe fundamentarse en estos materiales.

---

## 📋 CATÁLOGO DE DOCUMENTOS

### 🔵 VENTAS Y COMERCIAL

| # | Documento | Descripción | Uso Principal |
|---|-----------|-------------|---------------|
| 1 | `2 Manual procedimiento ventas.pdf` | Proceso completo de ventas Sundeck | Asesores - Flujo de trabajo |
| 2 | `Capacitación de ventas.pdf` | SPIN, objeciones, cierres, buyer persona | Asesores - Técnicas |
| 3 | `Guia de Preguntas Spin.pdf` | Preguntas SPIN detalladas | Asesores - Descubrimiento |
| 4 | `Métodos y técnicas de venta.pdf` | Técnicas avanzadas de cierre | Asesores - Cierres |
| 5 | `Ejemplos de Guiones_.pdf` | Scripts para llamadas y WhatsApp | Asesores - Mensajes |
| 6 | `Guion de Cobranza.pdf` | Scripts para cobro de saldos | Asesores - Cobranza |

### 🟢 PROMOTORÍA

| # | Documento | Descripción | Uso Principal |
|---|-----------|-------------|---------------|
| 7 | `Manual Promotoria de ventas.pdf` | Captación y prospección | Promotores - Proceso |

### 🟡 INSTALACIONES

| # | Documento | Descripción | Uso Principal |
|---|-----------|-------------|---------------|
| 8 | `Protocolo de comunicación Instalaciones.pdf` | Comunicación con cliente | Instaladores - Mensajes |
| 9 | `Puntos Clave para una instalación_.pdf` | Checklist de instalación perfecta | Instaladores - Calidad |
| 10 | `Área de instalaciones_.pdf` | 8 puntos + Plan + Bonos | Instaladores - Reglas |
| 11 | `Manual para tomar medidas.pdf` | Cómo medir correctamente | Asesores/Instaladores |

### 🟣 ESTRATEGIA Y DIRECCIÓN

| # | Documento | Descripción | Uso Principal |
|---|-----------|-------------|---------------|
| 12 | `1 Plan de desarrollo de mercado_.pdf` | Estrategia de expansión | Dirección - Planeación |
| 13 | `Plan estratégico Anual.pdf` | Metas y objetivos anuales | Dirección - KPIs |
| 14 | `Entrenamiento Liderazgo Ventas.pdf` | Desarrollo de líderes | Dirección - Capacitación |
| 15 | `Estrategia Redes Sociales.pdf` | Marketing digital | Marketing - Contenido |

---

## 🔗 MAPEO DOCUMENTO → USUARIO

```
INSTALADORES
├── Protocolo de comunicación Instalaciones.pdf
├── Puntos Clave para una instalación_.pdf
├── Área de instalaciones_.pdf
└── Manual para tomar medidas.pdf

ASESORES / PROMOTORES
├── Manual procedimiento ventas.pdf
├── Capacitación de ventas.pdf
├── Guia de Preguntas Spin.pdf
├── Métodos y técnicas de venta.pdf
├── Ejemplos de Guiones_.pdf
├── Guion de Cobranza.pdf
├── Manual Promotoria de ventas.pdf
└── Manual para tomar medidas.pdf

DIRECCIÓN
├── Plan de desarrollo de mercado_.pdf
├── Plan estratégico Anual.pdf
├── Entrenamiento Liderazgo Ventas.pdf
└── Estrategia Redes Sociales.pdf
```

---

## 🤖 USO POR EL AGENTE

El agente debe:

1. **Referenciar** el documento específico cuando responda
2. **Citar** secciones relevantes cuando sea posible
3. **No inventar** información que no esté en estos documentos
4. **Indicar** cuando algo requiere revisión de Dirección

### Ejemplo de Respuesta del Agente

```
📖 Según el "Manual procedimiento ventas.pdf":

El proceso de seguimiento debe realizarse:
- 24 horas después de enviar cotización
- 72 horas si no hay respuesta
- Máximo 3 intentos antes de clasificar como "frío"

¿Necesitas el mensaje de seguimiento listo para enviar?
```

---

## 📝 NOTAS TÉCNICAS

### Para Implementación del Agente

Los PDFs están en formato binario. Para que el agente los lea, hay dos opciones:

**Opción A: Extracción previa (Recomendada)**
- Extraer texto de cada PDF a archivos `.txt` o `.md`
- Cargar el texto en el contexto del agente
- Más rápido y económico en tokens

**Opción B: Lectura en tiempo real**
- Usar librería como `pdf-parse` para leer PDFs
- Extraer texto cuando se necesite
- Más flexible pero más lento

### Estructura Sugerida para Extracción

```
docs/Documentos Sundeck/
├── PDFs/                    # Archivos originales
│   ├── ventas/
│   ├── instalaciones/
│   └── direccion/
├── TXT/                     # Texto extraído
│   ├── ventas/
│   ├── instalaciones/
│   └── direccion/
└── INDICE_DOCUMENTOS.md     # Este archivo
```

---

## ✅ VALIDACIÓN

- [ ] Todos los PDFs son legibles
- [ ] Contenido actualizado (2024-2025)
- [ ] Sin información contradictoria
- [ ] Aprobado por Dirección

---

## 📊 ESTADÍSTICAS DE EXTRACCIÓN

**Última extracción:** 05.Dic.2025

| Métrica | Valor |
|---------|-------|
| PDFs procesados | 15/15 ✅ |
| Total palabras | ~118,000 |
| Total caracteres | ~285,000 |
| Archivo consolidado | `CONOCIMIENTO_AGENTE.md` |

**Archivos generados:**
- `TXT/` - Texto extraído de cada PDF individualmente
- `CONOCIMIENTO_AGENTE.md` - Archivo consolidado para el agente

**Script de extracción:** `server/scripts/extraerTextosPDF.js`

---

_Índice generado el 05.Dic.2025_
_Para uso exclusivo de AGENTE_IA_SUNDECK_
