# 📝 Guía de Uso del Logger Estructurado

**Versión:** 1.0  
**Fecha:** 31 de Octubre, 2025  
**Sistema:** Winston Logger con rotación diaria

---

## 🎯 Objetivo

Proporcionar un sistema de logging estructurado, centralizado y con rotación automática para mejorar la observabilidad y debugging del sistema Sundeck CRM.

---

## 📦 Instalación

El logger ya está instalado y configurado. Las dependencias son:

```json
{
  "winston": "^3.x",
  "winston-daily-rotate-file": "^5.x"
}
```

---

## 🚀 Uso Básico

### Importar el Logger

```javascript
const logger = require('./config/logger');
// o desde subdirectorios:
const logger = require('../config/logger');
```

### Niveles de Log

El logger soporta 5 niveles de severidad:

```javascript
// 1. ERROR - Errores críticos que requieren atención inmediata
logger.error('Error crítico en la base de datos', { 
  error: err.message,
  stack: err.stack 
});

// 2. WARN - Advertencias que no detienen la ejecución
logger.warn('Request lento detectado', { 
  duration: '3500ms',
  endpoint: '/api/proyectos' 
});

// 3. INFO - Información general del flujo de la aplicación
logger.info('Usuario autenticado exitosamente', { 
  userId: user.id,
  email: user.email 
});

// 4. HTTP - Requests HTTP (automático con middleware)
logger.http('Request completado', {
  method: 'POST',
  url: '/api/cotizaciones',
  statusCode: 201
});

// 5. DEBUG - Información detallada para debugging
logger.debug('Calculando totales de cotización', {
  subtotal: 10000,
  iva: 1600,
  total: 11600
});
```

---

## 🎨 Métodos de Conveniencia

### logRequest - Para logging de requests

```javascript
// En un controlador o middleware
logger.logRequest(req, 'Cotización creada exitosamente', {
  cotizacionId: cotizacion._id,
  total: cotizacion.total
});

// Genera automáticamente:
// - method: req.method
// - url: req.originalUrl
// - ip: req.ip
// - userId: req.user?.id
```

### logError - Para logging de errores

```javascript
try {
  // ... código
} catch (error) {
  logger.logError(error, {
    context: 'Crear cotización',
    userId: req.user?.id,
    data: req.body
  });
  
  res.status(500).json({ message: 'Error interno' });
}
```

### logPerformance - Para métricas de performance

```javascript
const startTime = Date.now();

// ... operación costosa

const duration = Date.now() - startTime;
logger.logPerformance('Generar PDF', duration, {
  cotizacionId: id,
  pageCount: 5
});

// Si duration > 1000ms, se registra como WARN automáticamente
```

---

## 📁 Estructura de Archivos de Log

```
logs/
├── combined-2025-10-31.log    # Todos los logs del día
├── error-2025-10-31.log       # Solo errores
├── combined-2025-11-01.log    # Rotación automática diaria
└── error-2025-11-01.log
```

### Configuración de Rotación

- **Archivos combinados**: Retención de 14 días
- **Archivos de errores**: Retención de 30 días
- **Tamaño máximo**: 20MB por archivo
- **Formato**: JSON estructurado

---

## 🔍 Formato de Logs

### Formato en Archivo (JSON)

```json
{
  "level": "info",
  "message": "Cotización creada exitosamente",
  "service": "sundeck-crm",
  "timestamp": "2025-10-31 10:30:45",
  "method": "POST",
  "url": "/api/cotizaciones",
  "userId": "507f1f77bcf86cd799439011",
  "cotizacionId": "507f191e810c19729de860ea",
  "total": 15000
}
```

### Formato en Consola (Desarrollo)

```
10:30:45 [info]: Cotización creada exitosamente {"method":"POST","url":"/api/cotizaciones","userId":"507f..."}
```

---

## 📋 Ejemplos por Módulo

### Controladores

```javascript
const logger = require('../config/logger');

const crearCotizacion = async (req, res) => {
  try {
    logger.info('Iniciando creación de cotización', {
      userId: req.user?.id,
      prospectoId: req.body.prospectoId
    });

    const cotizacion = await Cotizacion.create(req.body);

    logger.info('Cotización creada exitosamente', {
      cotizacionId: cotizacion._id,
      numero: cotizacion.numero,
      total: cotizacion.total
    });

    res.status(201).json(cotizacion);
  } catch (error) {
    logger.logError(error, {
      context: 'crearCotizacion',
      userId: req.user?.id,
      body: req.body
    });

    res.status(500).json({ message: 'Error al crear cotización' });
  }
};
```

### Servicios

```javascript
const logger = require('../config/logger');

class PdfService {
  async generarPDF(cotizacion) {
    const startTime = Date.now();

    try {
      logger.info('Generando PDF', {
        cotizacionId: cotizacion._id,
        numero: cotizacion.numero
      });

      // ... lógica de generación

      const duration = Date.now() - startTime;
      logger.logPerformance('Generar PDF', duration, {
        cotizacionId: cotizacion._id,
        fileSize: pdfBuffer.length
      });

      return pdfBuffer;
    } catch (error) {
      logger.logError(error, {
        context: 'generarPDF',
        cotizacionId: cotizacion._id
      });
      throw error;
    }
  }
}
```

### Middleware

```javascript
const logger = require('../config/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      logger.warn('Request sin token de autenticación', {
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(401).json({ message: 'No autorizado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    logger.debug('Usuario autenticado', {
      userId: decoded.id,
      url: req.originalUrl
    });

    next();
  } catch (error) {
    logger.error('Error en autenticación', {
      error: error.message,
      url: req.originalUrl
    });
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

---

## 🎯 Mejores Prácticas

### ✅ DO - Hacer

1. **Usar niveles apropiados**
   ```javascript
   logger.error() // Solo para errores críticos
   logger.warn()  // Para situaciones anormales pero no críticas
   logger.info()  // Para flujo normal de la aplicación
   logger.debug() // Para debugging detallado
   ```

2. **Incluir contexto relevante**
   ```javascript
   logger.info('Operación completada', {
     userId: user.id,
     operation: 'createOrder',
     duration: '250ms',
     result: 'success'
   });
   ```

3. **Loggear errores con stack trace**
   ```javascript
   logger.logError(error, {
     context: 'Nombre de la función',
     additionalData: { ... }
   });
   ```

4. **Usar métodos de conveniencia**
   ```javascript
   logger.logRequest(req, 'Mensaje', { data });
   logger.logPerformance('Operación', duration, { data });
   ```

### ❌ DON'T - No hacer

1. **No usar console.log**
   ```javascript
   // ❌ MAL
   console.log('Usuario creado');
   
   // ✅ BIEN
   logger.info('Usuario creado', { userId: user.id });
   ```

2. **No loggear información sensible**
   ```javascript
   // ❌ MAL
   logger.info('Login', { password: user.password });
   
   // ✅ BIEN
   logger.info('Login exitoso', { userId: user.id });
   ```

3. **No loggear objetos completos grandes**
   ```javascript
   // ❌ MAL
   logger.info('Request', { body: req.body }); // Puede ser enorme
   
   // ✅ BIEN
   logger.info('Request', { 
     bodyKeys: Object.keys(req.body),
     size: JSON.stringify(req.body).length 
   });
   ```

4. **No usar logs excesivos en loops**
   ```javascript
   // ❌ MAL
   items.forEach(item => {
     logger.debug('Procesando item', { item }); // 1000+ logs
   });
   
   // ✅ BIEN
   logger.info('Procesando items', { count: items.length });
   // ... proceso
   logger.info('Items procesados', { 
     count: items.length,
     duration: '500ms' 
   });
   ```

---

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# .env
LOG_LEVEL=info          # Nivel mínimo de logs (error, warn, info, http, debug)
NODE_ENV=development    # Afecta formato de logs en consola
```

### Niveles por Ambiente

- **Desarrollo**: `debug` - Todos los logs visibles
- **Staging**: `info` - Info, warnings y errors
- **Producción**: `warn` - Solo warnings y errors

---

## 📊 Análisis de Logs

### Buscar errores del día

```bash
# Windows PowerShell
Get-Content logs/error-2025-10-31.log | ConvertFrom-Json | Format-Table

# Linux/Mac
cat logs/error-2025-10-31.log | jq '.'
```

### Filtrar por usuario

```bash
# Windows PowerShell
Get-Content logs/combined-2025-10-31.log | Select-String "userId.*507f1f77"

# Linux/Mac
grep "userId.*507f1f77" logs/combined-2025-10-31.log | jq '.'
```

### Contar logs por nivel

```bash
# Windows PowerShell
Get-Content logs/combined-2025-10-31.log | ConvertFrom-Json | Group-Object level | Select-Object Name, Count

# Linux/Mac
cat logs/combined-2025-10-31.log | jq -r '.level' | sort | uniq -c
```

---

## 🚨 Troubleshooting

### Logs no se generan

1. Verificar que la carpeta `logs/` existe
2. Verificar permisos de escritura
3. Verificar que el logger está importado correctamente

### Logs muy grandes

1. Ajustar `maxSize` en `server/config/logger.js`
2. Reducir retención de días
3. Aumentar nivel mínimo de log (ej: de `debug` a `info`)

### Performance degradado

1. Evitar logs en loops intensivos
2. Usar `logger.debug()` solo en desarrollo
3. Configurar `LOG_LEVEL=warn` en producción

---

## 📚 Referencias

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)

---

## 🔄 Changelog

### v1.0 - 31 de Octubre, 2025
- ✅ Implementación inicial con Winston
- ✅ Rotación diaria de archivos
- ✅ 5 niveles de log
- ✅ Métodos de conveniencia
- ✅ Middleware de requests
- ✅ Formato JSON estructurado

---

**Responsable:** Equipo Desarrollo Sundeck CRM  
**Última actualización:** 31 de Octubre, 2025
