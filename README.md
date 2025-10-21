# 🏢 Sundeck CRM - Sistema de Gestión Comercial

Sistema integral de gestión comercial para Sundeck Cortinas, Persianas y Decoraciones.

## ✅ Estado Actual
- **Versión**: 2.0 - Correcciones implementadas
- **Estado**: ✅ Funcionando correctamente
- **Última actualización**: Octubre 2025

## 🚀 Instalación Rápida

```bash
# Clonar e instalar
git clone [repository-url]
cd SUNDECK-APP-v2
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar aplicación
npm run dev
```

## 🌐 Acceso al Sistema
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001/api

## 🎯 Características Principales

### ✅ **Correcciones Implementadas**
- **Campo único**: "Persona que realizó visita" ahora es global
- **Levantamiento Simple**: Sin campos de precios (solo técnico)
- **Separación clara**: Levantamiento técnico vs comercial

### 📋 **Módulos**
- **Prospectos**: Gestión de clientes potenciales
- **Levantamientos**: Captura técnica sin precios
- **Cotizaciones**: Generación comercial con precios
- **Pedidos**: Gestión de fabricación y entrega

## 🛠️ Tecnologías
- **Frontend**: React.js + Material-UI
- **Backend**: Node.js + Express + MongoDB
- **Autenticación**: JWT

## 📁 Estructura
```
SUNDECK-APP-v2/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── .env            # Variables de entorno
└── package.json    # Dependencias
```

## 🔧 Scripts
```bash
npm run dev      # Desarrollo (frontend + backend)
npm run client   # Solo frontend
npm run server   # Solo backend
npm run build    # Build producción
```

## 📋 Documentación Completa
Ver `DOCUMENTACION_FINAL.md` para información detallada.

---
**Sundeck Cortinas, Persianas y Decoraciones** | Octubre 2025
