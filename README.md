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

## 📱 Integraciones Futuras

- WhatsApp Business API
- Instagram Business
- Google Calendar
- Sistemas de pago (Stripe, PayPal)
- Herramientas de medición AR
