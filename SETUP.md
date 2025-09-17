# Sundeck CRM - Guía de Instalación

## Prerrequisitos

Antes de instalar el sistema, asegúrate de tener instalado:

1. **Node.js** (versión 16 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación: `node --version`

2. **MongoDB** (versión 5.0 o superior)
   - Opción 1: MongoDB local - https://www.mongodb.com/try/download/community
   - Opción 2: MongoDB Atlas (recomendado) - https://www.mongodb.com/atlas

3. **Git** (para clonar el repositorio)
   - Descarga desde: https://git-scm.com/

## Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd SUNDECK-APP-v2
```

### 2. Instalar dependencias del servidor
```bash
npm install
```

### 3. Instalar dependencias del cliente
```bash
cd client
npm install
cd ..
```

### 4. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus configuraciones
```

### 5. Configurar MongoDB

#### Opción A: MongoDB Local
1. Instala MongoDB Community Edition
2. Inicia el servicio de MongoDB
3. La URI por defecto es: `mongodb://localhost:27017/sundeck-crm`

#### Opción B: MongoDB Atlas (Recomendado)
1. Crea una cuenta en MongoDB Atlas
2. Crea un nuevo cluster
3. Obtén la URI de conexión
4. Actualiza `MONGODB_URI` en el archivo `.env`

### 6. Configurar Cloudinary (Opcional)
Para subir imágenes y archivos:
1. Crea una cuenta en Cloudinary
2. Obtén tus credenciales
3. Actualiza las variables en `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=tu-cloud-name
   CLOUDINARY_API_KEY=tu-api-key
   CLOUDINARY_API_SECRET=tu-api-secret
   ```

## Ejecución

### Desarrollo
```bash
# Ejecutar servidor y cliente simultáneamente
npm run dev

# O ejecutar por separado:
# Terminal 1 - Servidor
npm run server

# Terminal 2 - Cliente
npm run client
```

### Producción
```bash
# Construir el cliente
npm run build

# Ejecutar servidor
npm start
```

## Acceso al Sistema

1. **URL**: http://localhost:3000
2. **Usuario por defecto**: Se debe crear desde la base de datos o API

### Crear Usuario Administrador

Ejecuta este script en MongoDB o usa MongoDB Compass:

```javascript
use sundeck-crm

// Crear usuario administrador
db.usuarios.insertOne({
  nombre: "Administrador",
  apellido: "Sistema",
  email: "admin@sundeck.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  rol: "admin",
  activo: true,
  permisos: [
    {
      modulo: "prospectos",
      acciones: ["crear", "leer", "actualizar", "eliminar"]
    },
    {
      modulo: "cotizaciones", 
      acciones: ["crear", "leer", "actualizar", "eliminar"]
    },
    {
      modulo: "pedidos",
      acciones: ["crear", "leer", "actualizar", "eliminar"]
    },
    {
      modulo: "reportes",
      acciones: ["leer", "exportar"]
    }
  ],
  configuracion: {
    notificaciones: {
      email: true,
      whatsapp: true,
      push: true
    },
    horarioTrabajo: {
      inicio: "09:00",
      fin: "18:00",
      diasSemana: [1, 2, 3, 4, 5]
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Credenciales por defecto:**
- Email: `admin@sundeck.com`
- Password: `password`

## Datos de Ejemplo

### Productos de Ejemplo
```javascript
db.productos.insertMany([
  {
    nombre: "Ventana Corrediza Aluminio",
    codigo: "VCA-001",
    descripcion: "Ventana corrediza de aluminio con cristal claro",
    categoria: "ventana",
    material: "aluminio",
    coloresDisponibles: ["blanco", "negro", "café", "natural"],
    tiposCristal: ["claro", "bronce", "azul"],
    precioBase: 1200,
    unidadMedida: "m2",
    tiempoFabricacion: {
      base: 10,
      porM2Adicional: 2
    },
    reglas: [
      {
        condicion: "alto > 2.5",
        accion: "requiere_refuerzo_R24",
        costoAdicional: 200,
        tiempoAdicional: 2
      }
    ],
    garantia: {
      fabricacion: 12,
      instalacion: 6
    },
    activo: true,
    disponible: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    nombre: "Puerta Abatible Aluminio",
    codigo: "PAA-001", 
    descripcion: "Puerta abatible de aluminio con cristal templado",
    categoria: "puerta",
    material: "aluminio",
    coloresDisponibles: ["blanco", "negro", "café"],
    tiposCristal: ["templado", "laminado"],
    precioBase: 2500,
    unidadMedida: "pieza",
    tiempoFabricacion: {
      base: 15,
      porM2Adicional: 0
    },
    garantia: {
      fabricacion: 12,
      instalacion: 6
    },
    activo: true,
    disponible: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

## Estructura del Proyecto

```
SUNDECK-APP-v2/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # Modelos de MongoDB
│   ├── routes/            # Rutas de la API
│   ├── middleware/        # Middleware personalizado
│   └── index.js          # Servidor principal
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # Context API
│   │   └── App.js       # Aplicación principal
│   └── public/          # Archivos estáticos
├── package.json          # Dependencias del servidor
└── README.md            # Documentación
```

## Funcionalidades Implementadas (Fase 1)

✅ **Sistema Base**
- Autenticación y autorización
- Dashboard con métricas
- Gestión de usuarios y permisos

✅ **Gestión de Prospectos**
- Registro completo de prospectos
- Búsqueda y filtros avanzados
- Sistema de notas y seguimiento
- Cambio de etapas

✅ **Pipeline Kanban**
- Visualización del embudo de ventas
- Drag & drop para cambiar etapas
- Métricas por etapa

✅ **Sistema de Cotizaciones**
- Creación de cotizaciones
- Cálculo automático de precios
- Gestión de productos

## Próximas Fases

🔄 **Fase 2 - Operación Completa**
- Sistema de pedidos con pagos
- Módulo de fabricación
- Gestión de instalaciones
- Postventa y garantías

🤖 **Fase 3 - Integración AI**
- Recordatorios inteligentes
- Plantillas dinámicas
- Sugerencias automáticas

📚 **Fase 4 - Capacitación**
- Módulo de entrenamiento
- Biblioteca de recursos
- Seguimiento de progreso

## Soporte

Para soporte técnico o preguntas:
- Email: soporte@sundeck.com
- Documentación: [Link a documentación]
- Issues: [Link a repositorio]

## Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.
