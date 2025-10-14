# Sundeck CRM - Sistema de Gestión Completo

Sistema CRM diseñado específicamente para empresas de fabricación e instalación, con seguimiento completo desde prospecto hasta postventa.

## 🚀 Características Principales

### Fase 1 - Base del Sistema
- ✅ Estructura de datos MongoDB
- ✅ Registro de prospectos con catálogo dinámico
- ✅ Embudo Kanban (Prospectos → Cotizaciones → Pedido → Fabricación → Instalación → Entrega → Postventa)
- ✅ Dashboard con contadores y búsqueda

### Fase 2 - Operación Completa
- 📊 Timeline de etapas por cliente
- 📏 Sistema de medición y cotización (m², precios, fotos)
- 💰 Gestión de pedidos con anticipos y formas de pago
- 🏭 Seguimiento de fabricación con reglas automáticas
- 🔧 Módulo de instalación con fotos y checklist
- ✅ Entrega con evidencias y conformidad
- 📞 Postventa con encuestas y garantías
- 📈 Métricas y reportes avanzados
- ⚠️ Sistema de escalaciones automáticas

### Fase 3 - Integración AI
- 🤖 Recordatorios inteligentes
- 💬 Plantillas dinámicas con GPT
- 🎯 Sugerencias de acción automáticas
- 📚 Aprendizaje continuo

### Fase 4 - Capacitación
- 📖 Módulo de capacitación interna
- 📱 Plantillas para WhatsApp/Instagram
- 📊 Seguimiento de progreso

## 🛠️ Tecnologías

- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT
- **Almacenamiento**: Cloudinary (imágenes)
- **Notificaciones**: Nodemailer

## 📦 Instalación

1. Clona el repositorio
2. Instala dependencias: `npm run install-all`
3. Copia `.env.example` a `.env` y configura las variables
4. Inicia el desarrollo: `npm run dev`

## 🗄️ Estructura de Base de Datos

### Colecciones Principales:
- `prospectos` - Información de clientes potenciales
- `cotizaciones` - Presupuestos y mediciones
- `pedidos` - Órdenes confirmadas con pagos
- `fabricacion` - Seguimiento de producción
- `instalaciones` - Proceso de instalación
- `postventa` - Seguimiento post-entrega
- `usuarios` - Gestión de equipo
- `recordatorios` - Sistema de notificaciones

## 🔄 Flujo de Trabajo

1. **Prospecto Nuevo** → Registro inicial con datos básicos
2. **Cotización Activa** → Medición, fotos, presupuesto
3. **Pedido** → Confirmación con anticipo
4. **Fabricación** → Producción con materiales y reglas
5. **Instalación** → Proceso con checklist y fotos
6. **Entrega** → Conformidad y evidencias
7. **Postventa** → Seguimiento, garantía, referidos

## 📊 Métricas Clave

- Tasa de conversión por etapa
- Tiempo promedio de cierre
- Satisfacción del cliente
- Eficiencia del equipo
- Análisis de pérdidas

## 🚨 Sistema de Escalaciones

- **Normal** (1-2 días) → Vendedor
- **Urgente** (3-6 días) → Coordinadora
- **Crítico** (7+ días) → CEO

## 🔧 Módulo de Soporte Técnico

### Configuración y Acceso

**IMPORTANTE**: El módulo de soporte técnico está protegido y solo disponible para administradores.

#### 🔐 Control de Acceso
- **Ubicación**: Menú del usuario (clic en avatar) → "🔒 Soporte Técnico"
- **Requisito**: Usuario con `role === 'admin'`
- **Contraseña**: `soporte2025` (cambiar en producción)
- **Sesión**: Se desactiva automáticamente al cerrar navegador

#### 🛠️ Herramientas Disponibles

Cuando el módulo está **ACTIVO**, aparecen 4 botones flotantes:

1. **🟣 Captura de Pantalla** (Botón morado)
   - Captura pantallas completas o elementos específicos
   - Descarga automática en formato PNG
   - Útil para reportar bugs visuales

2. **🔵 Inspector Simple** (Botón azul)
   - Inspector básico de elementos HTML
   - Información de estilos y propiedades
   - Modal con datos organizados

3. **🔴 DevTools Inspector** (Botón rojo)
   - Inspector avanzado tipo Chrome DevTools
   - Información completa del elemento
   - Selectores CSS automáticos
   - Datos de contexto (padre, hijos, atributos)

4. **🟢 Selector Directo** (Botón verde)
   - Selección directa y automática
   - Abre ventana con información formateada
   - Copia automática al portapapeles
   - **Ideal para soporte**: Un clic → información lista para enviar

#### 📁 Archivos del Sistema

```
client/src/components/Common/
├── ModuloSoporte.js          # Módulo principal y autenticación
├── CapturaModal.js           # Herramienta de capturas
├── InspectorSimple.js        # Inspector básico
├── DevToolsInspector.js      # Inspector avanzado
├── InspectorDirecto.js       # Selector directo
└── ConfiguracionCaptura.js   # Configuración de herramientas
```

#### 🔄 Integración en el Sistema

1. **Layout.js**: Proveedor del contexto y modal principal
2. **Dashboard.js**: Configuración (solo para admins)
3. **Todos los botones**: Verifican `soporteActivo` antes de mostrarse

#### 🚨 Seguridad

- **Frontend**: Verificación de rol de usuario
- **Contraseña**: Protección adicional con `soporte2025`
- **Sesión temporal**: Se desactiva al cerrar navegador
- **Ocultación completa**: Usuarios normales no ven ninguna herramienta

#### 💡 Uso Recomendado

1. **Para Reportar Bugs**:
   - Usar **Selector Directo** (verde) para elementos problemáticos
   - Usar **Captura** (morado) para problemas visuales

2. **Para Desarrollo**:
   - Usar **DevTools Inspector** (rojo) para análisis profundo
   - Usar **Inspector Simple** (azul) para verificaciones rápidas

#### ⚙️ Configuración para Desarrolladores

```javascript
// Cambiar contraseña en ModuloSoporte.js línea ~25
const passwordCorrecta = 'nueva_contraseña_aqui';

// Agregar más roles autorizados en Layout.js línea ~244
{user && (user.role === 'admin' || user.role === 'developer') && (
```

---

## 📱 Integraciones Futuras

- WhatsApp Business API
- Instagram Business
- Google Calendar
- Sistemas de pago (Stripe, PayPal)
- Herramientas de medición AR
