# 🤖 AGENTE IA SUNDECK - Análisis Técnico e Implementación

**Fecha:** 5 Dic 2025  
**Estado:** 📋 ANÁLISIS COMPLETADO  
**API:** OpenAI GPT-4o-mini ✅ Conectada y funcionando  
**Identidad:** Ver `AGENTE_IA_SUNDECK_IDENTIDAD.md`

---

## 🎯 IDENTIDAD DEL AGENTE (Resumen)

| Aspecto | Valor |
|---------|-------|
| **Nombre** | AGENTE_IA_SUNDECK |
| **Rol** | Asistente interno para Ventas, Instalaciones y Dirección |
| **Tono** | Profesional, claro, respetuoso, enfocado en solución |
| **Regla de Oro** | "Un asesor no vende persianas. Vende confianza, paz y solución." |
| **Regla CRM** | "Si no está en el CRM, no existe." |

### Usuarios del Agente

| Usuario | Estilo de Respuesta |
|---------|---------------------|
| **Instaladores** | Directo, simple, práctico, cero rodeos |
| **Asesores/Promotores** | Explicativo + práctico + mensajes listos |
| **Dirección** | Resúmenes ejecutivos, capacitaciones, KPIs |

### Modos de Respuesta

1. **Modo Proceso** → Pasos numerados
2. **Modo Mensaje Listo** → Texto para cliente (3-6 líneas)
3. **Modo Capacitación** → Explicaciones + ejemplos
4. **Modo Política** → Referencia a manuales oficiales
5. **Modo Advertencia** → Cuando se salta el proceso

---

## 📊 ANÁLISIS DEL SISTEMA ACTUAL

### Arquitectura Existente

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUNDECK CRM                               │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND (React)           │  BACKEND (Node.js/Express)        │
│  ├── /proyectos             │  ├── /api/proyectos               │
│  ├── /prospectos            │  ├── /api/prospectos              │
│  ├── /cotizaciones          │  ├── /api/cotizaciones            │
│  ├── /fabricacion           │  ├── /api/fabricacion             │
│  ├── /instalaciones         │  ├── /api/instalaciones           │
│  ├── /almacen               │  ├── /api/almacen                 │
│  ├── /caja                  │  ├── /api/caja                    │
│  └── /reporteria            │  └── /api/kpis                    │
├─────────────────────────────────────────────────────────────────┤
│                        MONGODB                                   │
│  Proyecto, Prospecto, Cotizacion, Pedido, Instalacion,          │
│  Almacen, Caja, Usuario, Producto, etc.                         │
└─────────────────────────────────────────────────────────────────┘
```

### Modelos de Datos (25 colecciones)

| Modelo | Descripción | Campos Clave |
|--------|-------------|--------------|
| **Proyecto** | Entidad central unificada | cliente, estado, medidas, cotizaciones, pagos |
| **Prospecto** | Clientes potenciales | nombre, telefono, fuente, etapa |
| **Cotizacion** | Propuestas de precio | productos, total, estado, prospecto |
| **Pedido** | Órdenes confirmadas | productos, fechas, estado, pagos |
| **Instalacion** | Programación técnica | fecha, cuadrilla, estado, checklist |
| **Almacen** | Inventario de materiales | codigo, cantidad, stockMinimo |
| **Caja** | Control de efectivo | movimientos, apertura, cierre |
| **Usuario** | Empleados del sistema | rol, permisos, nombre |

### Servicios Existentes (30 servicios)

| Servicio | Función |
|----------|---------|
| `fabricacionService` | Gestión de producción |
| `instalacionesInteligentesService` | IA para instalaciones |
| `calculadoraMaterialesService` | Cálculo de materiales |
| `optimizadorCortesService` | Optimización de telas |
| `pdfService` | Generación de PDFs |
| `excelService` | Exportación a Excel |
| `notificacionService` | Alertas y notificaciones |
| `pendientesService` | Tareas del día |
| `aiService` | **PLACEHOLDER** - Sin implementar |

### Endpoints Disponibles (40+ rutas)

**Proyectos:**
- `GET /api/proyectos` - Listar proyectos
- `GET /api/proyectos/:id` - Detalle de proyecto
- `POST /api/proyectos` - Crear proyecto
- `PATCH /api/proyectos/:id/estado` - Cambiar estado
- `POST /api/proyectos/:id/generar-pedido` - Generar pedido
- `GET /api/proyectos/:id/generar-pdf` - Generar PDF
- `GET /api/proyectos/:id/generar-excel` - Generar Excel

**Prospectos:**
- `GET /api/prospectos` - Listar prospectos
- `POST /api/prospectos` - Crear prospecto
- `PUT /api/prospectos/:id` - Actualizar prospecto

**Cotizaciones:**
- `GET /api/cotizaciones` - Listar cotizaciones
- `POST /api/cotizaciones` - Crear cotización
- `POST /api/cotizaciones/desde-visita` - Desde levantamiento

**Instalaciones:**
- `GET /api/instalaciones` - Listar instalaciones
- `POST /api/instalaciones/programar` - Programar instalación
- `POST /api/instalaciones/sugerencias` - Sugerencias IA

**KPIs y Reportes:**
- `GET /api/kpis/dashboard` - Dashboard principal
- `GET /api/kpis/comerciales` - KPIs comerciales
- `GET /api/pendientes/hoy` - Pendientes del día

---

## 🎯 PROPUESTA: AGENTE IA SUNDECK

### Concepto

Un asistente inteligente que:
1. **Entiende** el contexto del negocio (persianas, cortinas, toldos)
2. **Consulta** la base de datos en tiempo real
3. **Ejecuta** acciones en el sistema
4. **Aprende** de las interacciones

### Niveles de Capacidad

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTE IA SUNDECK                             │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 1: CONSULTAS (Solo lectura)                              │
│  ├── "¿Cuántos proyectos hay en fabricación?"                   │
│  ├── "¿Qué pendientes tengo hoy?"                               │
│  ├── "¿Cuál es el estado del proyecto Huerta?"                  │
│  └── "¿Qué materiales necesito para esta semana?"               │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 2: ANÁLISIS (Lectura + Razonamiento)                     │
│  ├── "¿Qué le falta al levantamiento de Sala?"                  │
│  ├── "¿Esta cotización tiene errores?"                          │
│  ├── "¿Qué proyectos están en riesgo de retraso?"               │
│  └── "¿Cuál es el mejor horario para instalar?"                 │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 3: ACCIONES (Lectura + Escritura)                        │
│  ├── "Crea un proyecto para Juan Pérez con 3 persianas"         │
│  ├── "Agenda instalación del proyecto Huerta para el viernes"   │
│  ├── "Genera la cotización del proyecto actual"                 │
│  └── "Envía recordatorio al cliente por WhatsApp"               │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 4: AUTOMATIZACIÓN (Proactivo)                            │
│  ├── Alertar cuando un proyecto lleva mucho tiempo sin avance   │
│  ├── Sugerir seguimiento a prospectos fríos                     │
│  ├── Detectar inconsistencias en datos                          │
│  └── Optimizar rutas de instalación automáticamente             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ FUNCIONES DEL AGENTE

### Nivel 1: Consultas

| Función | Descripción | Endpoint que usa |
|---------|-------------|------------------|
| `consultarProyectos` | Buscar proyectos por filtros | `GET /api/proyectos` |
| `consultarProspecto` | Información de un cliente | `GET /api/prospectos/:id` |
| `consultarPendientes` | Tareas del día | `GET /api/pendientes/hoy` |
| `consultarKPIs` | Métricas del negocio | `GET /api/kpis/dashboard` |
| `consultarInventario` | Stock de materiales | `GET /api/almacen` |
| `consultarCaja` | Estado de caja | `GET /api/caja/actual` |

### Nivel 2: Análisis

| Función | Descripción | Lógica |
|---------|-------------|--------|
| `analizarLevantamiento` | Validar datos de medición | Reglas de negocio + IA |
| `analizarCotizacion` | Revisar precios y cálculos | Validación matemática |
| `analizarRiesgos` | Proyectos en peligro | Fechas + estados |
| `sugerirCuadrilla` | Mejor equipo para instalación | Algoritmo existente |
| `sugerirMateriales` | Qué comprar | Cálculo de necesidades |

### Nivel 3: Acciones

| Función | Descripción | Endpoint que usa |
|---------|-------------|------------------|
| `crearProyecto` | Nuevo proyecto con datos | `POST /api/proyectos` |
| `crearProspecto` | Nuevo cliente potencial | `POST /api/prospectos` |
| `agregarMedidas` | Guardar levantamiento | `PATCH /api/proyectos/:id/levantamiento` |
| `generarCotizacion` | Crear cotización | `POST /api/proyectos/:id/cotizaciones` |
| `generarPedido` | Confirmar venta | `POST /api/proyectos/:id/generar-pedido` |
| `agendarInstalacion` | Programar instalación | `POST /api/instalaciones/programar` |
| `cambiarEstado` | Actualizar estado | `PATCH /api/proyectos/:id/estado` |
| `generarPDF` | Crear documento | `GET /api/proyectos/:id/generar-pdf` |
| `enviarWhatsApp` | Mensaje al cliente | Integración WhatsApp |

### Nivel 4: Automatización (Futuro)

| Función | Trigger | Acción |
|---------|---------|--------|
| `alertaProyectoEstancado` | Proyecto sin cambios 7+ días | Notificar responsable |
| `alertaStockBajo` | Material bajo mínimo | Sugerir compra |
| `alertaCobrosPendientes` | Saldo vencido | Recordar cobro |
| `optimizarRutaDiaria` | Cada mañana | Sugerir orden de visitas |

---

## 🏗️ ARQUITECTURA TÉCNICA

### Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ChatAsistente.jsx                           │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  💬 Historial de mensajes                       │    │    │
│  │  │  ├── Usuario: "¿Qué pendientes tengo hoy?"     │    │    │
│  │  │  └── IA: "Tienes 3 pendientes: ..."            │    │    │
│  │  ├─────────────────────────────────────────────────┤    │    │
│  │  │  [Escribe tu mensaje...]              [Enviar] │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              /api/asistente/chat                         │    │
│  │  1. Recibe mensaje del usuario                          │    │
│  │  2. Envía a OpenAI con contexto del sistema             │    │
│  │  3. OpenAI decide qué función ejecutar                  │    │
│  │  4. Ejecuta función y obtiene datos                     │    │
│  │  5. OpenAI genera respuesta natural                     │    │
│  │  6. Retorna respuesta al frontend                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           asistenteService.js                            │    │
│  │  ├── procesarMensaje(mensaje, contexto)                 │    │
│  │  ├── ejecutarFuncion(nombre, parametros)                │    │
│  │  └── generarRespuesta(datos, pregunta)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Funciones Disponibles                          │    │
│  │  ├── consultarProyectos()                               │    │
│  │  ├── consultarPendientes()                              │    │
│  │  ├── analizarLevantamiento()                            │    │
│  │  ├── crearProyecto()                                    │    │
│  │  └── ... (20+ funciones)                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         OPENAI API                               │
│  Modelo: gpt-4o-mini                                            │
│  Costo: ~$0.001 por consulta                                    │
│  Funciones: Function Calling para ejecutar acciones             │
└─────────────────────────────────────────────────────────────────┘
```

### Archivos a Crear

```
server/
├── services/
│   └── asistenteService.js          # Lógica principal del agente
├── controllers/
│   └── asistenteController.js       # Endpoints del asistente
├── routes/
│   └── asistente.js                 # Rutas /api/asistente/*
└── config/
    └── asistenteFunciones.js        # Definición de funciones para OpenAI

client/src/
├── components/
│   └── Asistente/
│       ├── ChatAsistente.jsx        # Componente principal del chat
│       ├── MensajeChat.jsx          # Burbuja de mensaje
│       └── AccionSugerida.jsx       # Botones de acción rápida
└── contexts/
    └── AsistenteContext.jsx         # Estado global del asistente
```

---

## 💬 EJEMPLOS DE INTERACCIÓN

### Ejemplo 1: Consulta Simple

```
👤 Usuario: ¿Cuántos proyectos tengo en fabricación?

🤖 Asistente: Tienes 3 proyectos en fabricación:

   1. Arq. Hector Huerta - 6 persianas Screen
      Estado: En proceso | Fecha compromiso: 10 Dic
      
   2. Luis Bello - 4 persianas Blackout
      Estado: Pendiente material | Fecha compromiso: 12 Dic
      
   3. García Residence - 8 cortinas
      Estado: Control de calidad | Fecha compromiso: 8 Dic

   ⚠️ El proyecto García está próximo a su fecha de entrega.
   ¿Quieres que revise el avance detallado?
```

### Ejemplo 2: Análisis de Levantamiento

```
👤 Usuario: Revisa el levantamiento que acabo de capturar

🤖 Asistente: Revisé el levantamiento de "Sala Principal":

   ✅ Medidas correctas: 2.50m x 3.00m
   ✅ Producto seleccionado: Screen 3%
   ✅ Color especificado: Blanco
   
   ⚠️ Observaciones:
   • Marcaste "Motorizado" pero no seleccionaste el modelo de motor
   • Falta especificar el tipo de instalación (muro/techo)
   • Recomiendo agregar marca de tela para el pedido
   
   💡 Sugerencia: Para 2.50m de ancho, el motor Somfy 25Nm 
      es suficiente. ¿Lo agrego automáticamente?
      
   [Agregar Somfy 25Nm] [Ignorar]
```

### Ejemplo 3: Crear Proyecto por Comando

```
👤 Usuario: Crea un proyecto para María López, teléfono 744-555-1234,
            quiere 2 persianas screen para recámara de 1.80x2.20 cada una

🤖 Asistente: Perfecto, voy a crear el proyecto:

   📋 Resumen:
   • Cliente: María López
   • Teléfono: 744-555-1234
   • Productos: 2 persianas Screen
   • Ubicación: Recámara
   • Medidas: 1.80m x 2.20m c/u
   • Área total: 7.92 m²
   
   ¿Confirmo la creación? [Crear Proyecto] [Modificar]

👤 Usuario: Crear Proyecto

🤖 Asistente: ✅ Proyecto creado exitosamente

   • Número: PRY-2024-0089
   • Estado: Levantamiento
   • Asesor: David (tú)
   
   ¿Qué deseas hacer ahora?
   [Ver Proyecto] [Generar Cotización] [Agendar Visita]
```

### Ejemplo 4: Resumen del Día

```
👤 Usuario: ¿Qué tengo que hacer hoy?

🤖 Asistente: Buenos días David, aquí está tu agenda para hoy:

   📅 PENDIENTES HOY (5 Dic 2025)
   
   🔴 URGENTE:
   • Cobrar saldo proyecto García - $18,500 (vence hoy)
   
   🟡 IMPORTANTE:
   • Llamar a prospecto Ramírez - Seguimiento cotización
   • Confirmar instalación Huerta - Viernes 10am
   
   🟢 NORMAL:
   • Revisar levantamiento pendiente - López
   • Actualizar inventario de telas Screen
   
   💰 CAJA:
   • Fondo actual: $5,200
   • Ingresos esperados: $18,500 (si cobra García)
   
   ¿Quieres que te ayude con alguna de estas tareas?
```

---

## 📈 PLAN DE IMPLEMENTACIÓN

### Fase 1: Base ✅ COMPLETADA (5 Dic 2025)
- [x] Crear `asistenteService.js` con conexión a OpenAI
- [x] Implementar endpoint `/api/asistente/chat`
- [x] Definir 5 funciones básicas de consulta
- [x] Crear componente `ChatAsistente.jsx` básico
- [x] Integrar chat flotante en toda la app

**Archivos creados:**
- `server/services/asistenteService.js` (920+ líneas)
- `server/controllers/asistenteController.js` (260 líneas)
- `server/routes/asistente.js` (35 líneas)
- `client/src/components/Asistente/ChatAsistente.jsx` (380 líneas)

**Funciones implementadas:**
- `consultarProyectos` - Buscar proyectos por estado/cliente
- `consultarProspectos` - Buscar prospectos por etapa
- `consultarPendientesHoy` - Tareas del día
- `consultarKPIs` - Métricas del negocio
- `consultarInstalaciones` - Instalaciones programadas

### Fase 2: Análisis Inteligentes ✅ COMPLETADA (5 Dic 2025)
- [x] Implementar análisis de levantamiento
- [x] Implementar validación de cotizaciones
- [x] Agregar sugerencias inteligentes
- [x] Endpoints directos para análisis

**Funciones de análisis:**
- `analizarLevantamiento` - Detecta errores, faltantes, sugiere motores
- `validarCotizacion` - Revisa precios, márgenes, datos cliente

**Endpoints agregados:**
- `POST /api/asistente/analizar-levantamiento`
- `POST /api/asistente/validar-cotizacion`

**Validaciones implementadas:**
- ❌ Errores: Medidas faltantes, motor sin especificar, producto vacío
- ⚠️ Advertencias: Medidas extremas, color faltante, tela rotada
- 💡 Sugerencias: Motor recomendado, tipo instalación, descuento volumen

### Fase 3: Mejoras UI (Pendiente)
- [ ] Agregar contexto del usuario actual
- [ ] Mejorar UI del chat (markdown rendering)
- [ ] Agregar acciones rápidas sugeridas
- [ ] Botón de análisis en modal de levantamiento

### Fase 4: Acciones (Pendiente)
- [ ] Implementar creación de proyectos
- [ ] Implementar generación de cotizaciones
- [ ] Implementar agendado de instalaciones

### Fase 5: Refinamiento (Pendiente)
- [ ] Optimizar prompts para mejor precisión
- [ ] Agregar memoria de conversación persistente
- [ ] Testing y ajustes

---

## 💰 ESTIMACIÓN DE COSTOS

### OpenAI API

| Escenario | Consultas/día | Costo/día | Costo/mes |
|-----------|---------------|-----------|-----------|
| Bajo | 20 | $0.02 | $0.60 |
| Normal | 50 | $0.05 | $1.50 |
| Alto | 100 | $0.10 | $3.00 |
| Intensivo | 200 | $0.20 | $6.00 |

**Nota:** Con gpt-4o-mini, el costo es mínimo (~$0.001 por consulta).

### Comparación con Alternativas

| Opción | Costo | Calidad | Latencia |
|--------|-------|---------|----------|
| GPT-4o-mini | $0.001/consulta | Alta | 1-2 seg |
| GPT-4o | $0.01/consulta | Muy alta | 2-3 seg |
| Claude Haiku | $0.0008/consulta | Alta | 1-2 seg |
| Llama local | $0 | Media | Variable |

**Recomendación:** GPT-4o-mini ofrece el mejor balance costo/calidad.

---

## ✅ DECISIONES PENDIENTES

1. **Nombre del asistente:**
   - [ ] SunBot
   - [ ] Sunny
   - [ ] Asistente Sundeck
   - [ ] Otro: ___________

2. **Ubicación del chat:**
   - [ ] Flotante global (siempre visible)
   - [ ] En sidebar
   - [ ] Solo en ciertas páginas
   - [ ] Combinación

3. **Nivel inicial:**
   - [ ] Solo consultas (Nivel 1)
   - [ ] Consultas + Análisis (Nivel 1-2)
   - [ ] Todo excepto automatización (Nivel 1-3)

4. **Prioridad de funciones:**
   - [ ] Análisis de levantamiento
   - [ ] Resumen del día
   - [ ] Creación de proyectos
   - [ ] Otra: ___________

---

## 🚀 SIGUIENTE PASO

Una vez que revises este documento y tomes las decisiones pendientes, 
puedo comenzar la implementación de la Fase 1.

**Tiempo estimado total:** 10-15 días para implementación completa.
**Tiempo Fase 1:** 1-2 días para tener un prototipo funcional.

---

*Documento generado el 5 Dic 2025*
*Sistema: Sundeck CRM v2*
*API: OpenAI GPT-4o-mini ✅*
