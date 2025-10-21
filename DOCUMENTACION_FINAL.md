# 📋 SUNDECK CRM - DOCUMENTACIÓN FINAL

**Proyecto**: Sistema CRM para Sundeck Cortinas, Persianas y Decoraciones  
**Fecha**: Octubre 2025  
**Estado**: ✅ Funcionando correctamente  

## 🎯 CORRECCIONES IMPLEMENTADAS

### ✅ **PROBLEMA 1: Campo "Persona que realizó visita" repetitivo**
**SOLUCIONADO**:
- Campo global único después del selector de tipo de visita
- Solo visible cuando `tipoVisitaInicial === 'levantamiento'`
- Eliminado de formularios individuales de partidas

### ✅ **PROBLEMA 2: Levantamiento Simple mostrando precios**
**SOLUCIONADO**:
- Todos los campos de precio condicionados con `tipoVisitaInicial === 'cotizacion'`
- Levantamiento Simple sin campos de precios
- Separación clara entre levantamiento técnico y comercial

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Frontend** (`/client`)
- **Framework**: React.js
- **UI**: Material-UI (MUI)
- **Estado**: Context API + Hooks
- **Puerto**: http://localhost:3000

### **Backend** (`/server`)
- **Framework**: Node.js + Express
- **Base de datos**: MongoDB
- **Puerto**: http://localhost:5001
- **API**: REST endpoints

## 🚀 CONFIGURACIÓN E INSTALACIÓN

### **Requisitos**
- Node.js 16+
- MongoDB
- npm o yarn

### **Instalación**
```bash
# Clonar repositorio
git clone [repository-url]
cd SUNDECK-APP-v2

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar desarrollo
npm run dev
```

### **Scripts Disponibles**
```bash
npm run dev        # Iniciar frontend y backend
npm run client     # Solo frontend
npm run server     # Solo backend
npm run build      # Build de producción
```

## 📋 MÓDULOS PRINCIPALES

### **1. Prospectos**
- Gestión de clientes potenciales
- Seguimiento de etapas comerciales
- Historial de interacciones

### **2. Levantamientos Técnicos**
- **Levantamiento Simple**: Sin precios, solo información técnica
- **Cotización en Vivo**: Con precios y cálculos comerciales
- Campo global "Persona que realizó visita"

### **3. Cotizaciones**
- Generación automática desde levantamientos
- Cálculos de precios y descuentos
- Exportación a PDF

### **4. Pedidos**
- Conversión de cotizaciones a pedidos
- Gestión de fabricación
- Seguimiento de entregas

## 🎯 DIFERENCIACIÓN DE TIPOS DE VISITA

| Aspecto | 📋 Levantamiento Simple | 💰 Cotización en Vivo |
|---------|-------------------------|------------------------|
| **Precios** | ❌ Ocultos | ✅ Visibles |
| **Persona Visita** | ✅ Campo global único | ❌ No necesario |
| **Campos Técnicos** | ✅ Completos | ✅ Completos |
| **Medidas** | ✅ Detalladas | ✅ Detalladas |
| **Motorización** | ✅ Sin precios | ✅ Con precios |
| **Objetivo** | Información técnica | Cierre comercial |

## 📝 CREAR LEVANTAMIENTO TÉCNICO

### **Pasos**:
1. Ir a **Prospectos** > Buscar cliente
2. **Agregar Etapa** > "Visita Inicial / Medición"
3. Seleccionar **"📋 Levantamiento Simple"**
4. Llenar **"Persona que realizó visita"** (campo único)
5. Agregar partidas con información técnica
6. **Guardar** levantamiento

### **Validaciones**:
- ✅ Campo "Persona que realizó visita" aparece UNA SOLA VEZ
- ✅ NO aparecen campos de precios
- ✅ Se pueden agregar medidas, fotos y especificaciones técnicas

## 🔧 ESTRUCTURA DE ARCHIVOS

```
SUNDECK-APP-v2/
├── client/                 # Frontend React
│   ├── public/            # Archivos estáticos
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Context API
│   │   ├── services/      # Servicios y API calls
│   │   └── utils/         # Utilidades
│   └── package.json
├── server/                # Backend Node.js
│   ├── controllers/       # Controladores
│   ├── models/           # Modelos de MongoDB
│   ├── routes/           # Rutas de API
│   └── middleware/       # Middlewares
├── .env                  # Variables de entorno
├── package.json          # Dependencias principales
└── README.md            # Documentación
```

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Error de Compilación**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### **Error de Base de Datos**
```bash
# Verificar MongoDB está corriendo
mongod --version
# Verificar conexión en .env
```

### **Puerto Ocupado**
```bash
# Cambiar puertos en package.json o .env
# Frontend: PORT=3001
# Backend: SERVER_PORT=5002
```

## 📊 DATOS DE PRUEBA

### **Cliente de Ejemplo**:
- **Nombre**: SAHID CAMPOS
- **Dirección**: Costa Azul atrás de Carls cond Puerto del Sol depto 402
- **Producto**: Persianas Blackout LONG BEACH IVORY

### **Partidas de Prueba**:
1. **SALA-COMEDOR**: 3 piezas motorizada + traslape
2. **RECÁMARA 1**: 1 pieza manual
3. **RECÁMARA 2**: 1 pieza manual

## 🎉 ESTADO ACTUAL

### **✅ Funcionando Correctamente**:
- ✅ Sistema compilando sin errores
- ✅ Frontend y backend operativos
- ✅ Correcciones implementadas
- ✅ Base de datos conectada
- ✅ Módulos principales funcionando

### **🎯 Próximos Pasos**:
- Validación manual de correcciones
- Pruebas con usuarios reales
- Optimizaciones de rendimiento
- Documentación de usuario final

---

**Desarrollado por**: Equipo Sundeck + Cascade AI Assistant  
**Última actualización**: Octubre 2025  
**Versión**: 2.0 - Correcciones implementadas
