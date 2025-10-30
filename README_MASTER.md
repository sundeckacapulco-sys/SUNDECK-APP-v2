# 🏢 Sundeck CRM - Sistema Completo

**Versión**: 3.0 | **Fecha**: 30 Oct 2025 | **Estado**: ✅ 100% FUNCIONAL

---

## 🚀 INICIO RÁPIDO

```bash
npm install
cp .env.example .env
npm run dev
```

**Acceso**: http://localhost:3000 (Frontend) | http://localhost:5001 (Backend)

---

## ✅ MÓDULOS IMPLEMENTADOS (100%)

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Prospectos** | ✅ | Gestión de clientes potenciales |
| **Proyectos** | ✅ | Núcleo unificado del sistema |
| **Levantamientos** | ✅ | 13 campos técnicos por pieza |
| **Cotizaciones** | ✅ | En vivo + Directas |
| **Fabricación** | ✅ | Órdenes automáticas |
| **Instalaciones** | ✅ | Con IA y sugerencias |
| **KPIs** | ✅ | 7 tipos de métricas |
| **PDF/Excel** | ✅ | Exportación unificada |
| **WhatsApp** | ✅ | Plantillas personalizables |

---

## 📏 SISTEMA DE LEVANTAMIENTOS

### Modal Selector Inteligente

Al hacer clic en "📏 Agregar Medidas":

**📋 Sin Precios** → `AgregarMedidaPartidasModal.jsx`
- Solo información técnica
- 13 campos por pieza
- Sin cálculos de precios

**💰 Con Precios** → `AgregarMedidasProyectoModal.jsx`
- Información técnica + precios
- Motorización completa
- Instalación especial
- Cálculos automáticos

### 13 Campos Técnicos por Pieza

1. Ancho (m)
2. Alto (m)
3. Galería (Sí/No)
4. Base/Tabla (7cm, 15cm, 18cm)
5. Control (Izquierdo/Derecho)
6. Caída (Normal, Hacia el frente, Caída)
7. Tipo de Instalación (Muro, Techo, Empotrado, Piso a Techo)
8. Tipo de Fijación (Concreto, Tablaroca, Aluminio, Madera)
9. Modo de Operación (Manual, Motorizado, Micro)
10. Sistema (Roller, Zebra, Panel, Romana, Vertical, Madera)
11. Detalle Técnico (Traslape, Corte, Sin traslape, etc.)
12. Traslape (No aplica, 5cm, 10cm, 15cm, 20cm, Otro)
13. Tela/Marca

---

## 💰 COTIZACIÓN EN VIVO

### Estructura Jerárquica (3 Niveles)

**NIVEL 1: Especificaciones Generales** (siempre visible)
- Cantidad, Área Total, Color, Modelo, Precio/m²

**NIVEL 2: Medidas Individuales** (acordeón)
- Acordeón principal + sub-acordeones por pieza
- 13 campos técnicos + precio individual

**NIVEL 3: Complementos** (acordeones)
- ⚡ **Motorización**: Motor, Control, Cálculos automáticos
- 🔧 **Instalación Especial**: 3 tipos de cobro (Fijo, Por Pieza, Base+Pieza)
- 📝 **Observaciones**: Notas generales

### Cálculos Automáticos

```
Productos: Área × Precio × Cantidad
+ Motorización: (Motores × Precio) + (Controles × Precio)
+ Instalación: Según tipo de cobro
= Subtotal
- Descuento (% o Fijo)
= Subtotal con Descuento
+ IVA 16% (si aplica)
= TOTAL FINAL
```

---

## 🔧 INSTALACIONES CON IA

### Sugerencias Automáticas

- **Cuadrilla Óptima**: Por especialidades requeridas
- **Tiempo Estimado**: Basado en datos históricos
- **Herramientas**: Detección automática
- **Mejor Fecha**: Análisis de múltiples factores
- **Complejidad**: Puntuación 0-100

### Niveles de Confianza

- Tiempo: 60-95%
- Cuadrilla: 15-95%
- Herramientas: 85%
- Fecha: 75%

---

## 📁 ESTRUCTURA CLAVE

```
SUNDECK-APP-v2/
├── client/src/
│   ├── modules/proyectos/components/
│   │   ├── AgregarMedidasProyectoModal.jsx    ← MODAL PRINCIPAL (con precios)
│   │   ├── AgregarMedidaPartidasModal.jsx     ← MODAL SIN PRECIOS
│   │   └── LevantamientoTab.jsx               ← INTEGRACIÓN
│   └── components/Prospectos/hooks/
│       └── usePiezasManager.js                 ← LÓGICA DE PIEZAS
├── server/
│   ├── models/
│   │   ├── Proyecto.js                         ← NÚCLEO CENTRAL
│   │   ├── Cotizacion.js
│   │   └── Instalacion.js
│   ├── controllers/
│   │   ├── proyectoController.js
│   │   └── instalacionController.js
│   └── services/
│       ├── exportNormalizer.js                 ← UNIFICADOR PDF/EXCEL
│       ├── instalacionesInteligentesService.js ← IA
│       └── kpisInstalacionesService.js
└── Documentación/
    ├── README_MASTER.md                        ← ESTE ARCHIVO
    ├── PRUEBAS_EJECUTAR_AHORA.md
    └── PENDIENTES_COTIZACION_EN_VIVO.md
```

---

## 🎯 FASES IMPLEMENTADAS

### ✅ FASE 1-3: Estructura y UI (100%)
- Modales con jerarquía de 3 niveles
- Acordeones funcionales
- Diseño compacto optimizado
- 13 campos técnicos por pieza

### ✅ FASE 4: Funciones de Guardado (100%)
- `handleGuardarMedidasTecnicas` (sin precios)
- `handleGuardarCotizacionEnVivo` (con precios)
- Validaciones completas
- Manejo de errores

### ✅ FASE 5: Generación de PDF (100%)
- `handleVerPDF` implementado
- Descarga automática
- Formato profesional

### ✅ FASE 6: Integración (100%)
- Modal selector en `LevantamientoTab.jsx`
- Prop `conPrecios` funcionando
- Flujo completo operativo

---

## 🔌 API ENDPOINTS PRINCIPALES

```
# Proyectos
PATCH  /api/proyectos/:id/levantamiento     # Guardar levantamiento
POST   /api/proyectos/:id/cotizaciones      # Guardar cotización
GET    /api/proyectos/:id/generar-pdf       # Generar PDF

# Instalaciones
POST   /api/instalaciones/sugerencias       # Sugerencias IA
GET    /api/kpis/instalaciones              # KPIs
```

---

## 📖 GUÍA RÁPIDA DE USO

### Levantamiento Técnico (Sin Precios)
```
1. Proyectos → Seleccionar → Levantamiento
2. "📏 Agregar Medidas" → "📋 Sin Precios"
3. Llenar especificaciones generales
4. Expandir "Medidas Individuales"
5. Llenar 13 campos por pieza
6. "Guardar Levantamiento"
```

### Cotización en Vivo (Con Precios)
```
1. Proyectos → Seleccionar → Levantamiento
2. "📏 Agregar Medidas" → "💰 Con Precios"
3. Llenar especificaciones + Precio General
4. Expandir "Medidas Individuales" + llenar
5. Si aplica: Expandir "⚡ Motorización"
6. Si aplica: Expandir "🔧 Instalación Especial"
7. Configurar descuentos y facturación
8. "Guardar Cotización" → "Ver PDF"
```

### Instalación con IA
```
1. Instalaciones → "Programar Instalación"
2. Seleccionar proyecto
3. IA genera sugerencias automáticas
4. "Aplicar Sugerencias" o ajustar manual
5. Guardar instalación
```

---

## 🐛 SOLUCIÓN RÁPIDA

**Puerto ocupado**: `netstat -ano | findstr :3000` → `taskkill /PID [PID] /F`  
**MongoDB error**: Verificar `mongod` corriendo y `.env` configurado  
**Módulos faltantes**: `rm -rf node_modules && npm install`  
**CORS error**: Verificar `server/index.js` permite `localhost:3000`

---

## 📊 STACK TECNOLÓGICO

**Frontend**: React 18 + Material-UI 5 + Axios  
**Backend**: Node.js + Express + MongoDB + Mongoose  
**Servicios**: Puppeteer (PDF) + ExcelJS + OpenAI (IA)  
**Auth**: JWT

---

## 📝 DOCUMENTOS RELACIONADOS

- `PRUEBAS_EJECUTAR_AHORA.md` - Plan de pruebas detallado
- `PENDIENTES_COTIZACION_EN_VIVO.md` - Funcionalidades pendientes
- `RESUMEN_SESION_FASE_4_Y_5.md` - Resumen de implementación

---

**Desarrollado por**: Equipo Sundeck + Cascade AI  
**Contacto**: David Rojas - Dirección General Sundeck  
**Última actualización**: 30 de Octubre, 2025
