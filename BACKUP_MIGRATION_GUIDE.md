# 🗄️ Guía de Backup y Migración - SUNDECK CRM

## 📋 Resumen

Este documento describe el sistema completo de backup y migración implementado para proteger todos los datos del CRM SUNDECK contra pérdida de información durante mantenimientos, actualizaciones o migraciones.

## 🎯 Funcionalidades Implementadas

### 1. **Sistema de Exportación Completa**
- ✅ Backup completo del sistema (todos los datos)
- ✅ Backup específico de prospectos
- ✅ Exportación en formato JSON y Excel
- ✅ Filtros para incluir/excluir archivados y papelera
- ✅ Metadatos de exportación (fecha, usuario, estadísticas)

### 2. **Sistema de Importación**
- ✅ Restauración completa desde backup
- ✅ Importación selectiva por tipo de datos
- ✅ Opción de sobrescribir datos existentes
- ✅ Validación de archivos de backup

### 3. **Interfaz de Administración**
- ✅ Panel visual para gestión de backups
- ✅ Información del estado del sistema en tiempo real
- ✅ Opciones de configuración de exportación
- ✅ Progreso visual de operaciones

## 🔧 Endpoints Implementados

### Exportación
```
GET /api/backup/export/complete
- Exporta todos los datos del sistema
- Requiere permisos de admin
- Genera archivo JSON con estructura completa

GET /api/backup/export/prospectos?incluirArchivados=false&incluirPapelera=false
- Exporta solo prospectos con filtros
- Requiere permisos de lectura de prospectos
- Genera archivo JSON con prospectos filtrados

GET /api/backup/export/excel
- Exporta prospectos en formato Excel
- Incluye hoja de estadísticas
- Ideal para análisis y reportes
```

### Importación
```
POST /api/backup/import
- Restaura datos desde archivo de backup
- Requiere permisos de admin
- Opciones de importación selectiva

Body:
{
  "backupData": { /* datos del backup */ },
  "options": {
    "importProspectos": true,
    "importPlantillas": true,
    "overwriteExisting": false
  }
}
```

### Información del Sistema
```
GET /api/backup/system-info
- Obtiene estadísticas actuales del sistema
- Contadores por tipo de datos
- Información del servidor
- Estado de la base de datos
```

## 📊 Estructura de Datos de Backup

### Formato JSON Completo
```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "version": "1.0",
    "exportedBy": "user_id",
    "exportedByName": "Juan Pérez",
    "totalRecords": {
      "prospectos": 1250,
      "usuarios": 15,
      "plantillasWhatsApp": 8
    }
  },
  "data": {
    "prospectos": [ /* array de prospectos */ ],
    "usuarios": [ /* array de usuarios (sin passwords) */ ],
    "plantillasWhatsApp": [ /* array de plantillas */ ]
  }
}
```

### Formato Excel
- **Hoja 1**: Datos principales de prospectos
- **Hoja 2**: Estadísticas y resúmenes
- **Columnas**: ID, Nombre, Teléfono, Email, Producto, Etapa, etc.

## 🛡️ Estrategia de Backup Recomendada

### Frecuencias Sugeridas

#### 📅 **Backup Diario** (Automatizado)
```bash
# Prospectos activos únicamente
curl -H "Authorization: Bearer TOKEN" \
     -o "backup_diario_$(date +%Y%m%d).json" \
     "http://localhost:5001/api/backup/export/prospectos"
```

#### 📅 **Backup Semanal** (Completo)
```bash
# Sistema completo
curl -H "Authorization: Bearer TOKEN" \
     -o "backup_completo_$(date +%Y%m%d).json" \
     "http://localhost:5001/api/backup/export/complete"
```

#### 📅 **Backup Mensual** (Con archivados)
```bash
# Incluye archivados y papelera
curl -H "Authorization: Bearer TOKEN" \
     -o "backup_mensual_$(date +%Y%m%d).json" \
     "http://localhost:5001/api/backup/export/prospectos?incluirArchivados=true&incluirPapelera=true"
```

## 🔄 Procedimiento de Migración

### Antes del Mantenimiento

1. **Crear Backup Completo**
   ```bash
   # Acceder al panel de administración
   http://localhost:3000/admin/backups
   
   # O usar endpoint directo
   GET /api/backup/export/complete
   ```

2. **Verificar Integridad**
   - Verificar que el archivo se descargó completamente
   - Validar estructura JSON
   - Confirmar contadores en metadata

3. **Backup de Seguridad Adicional**
   ```bash
   # Backup de base de datos MongoDB directamente
   mongodump --host localhost --port 27017 --db sundeck_crm --out ./mongo_backup_$(date +%Y%m%d)
   ```

### Durante el Mantenimiento

1. **Mantener Backups Seguros**
   - Copiar archivos a ubicación externa
   - Verificar accesibilidad de backups
   - Documentar cambios realizados

2. **Probar Restauración (Opcional)**
   - En ambiente de prueba
   - Validar que la importación funciona
   - Verificar integridad de datos restaurados

### Después del Mantenimiento

1. **Verificar Sistema**
   ```bash
   # Verificar estado del sistema
   GET /api/backup/system-info
   ```

2. **Restaurar si es Necesario**
   ```bash
   # Usar panel de administración
   http://localhost:3000/admin/backups
   
   # Seleccionar archivo de backup
   # Configurar opciones de importación
   # Ejecutar restauración
   ```

## 🚨 Procedimiento de Emergencia

### Si se Pierden Datos

1. **Detener Sistema Inmediatamente**
   ```bash
   # Detener servidor
   pm2 stop sundeck-api
   # O Ctrl+C si está en desarrollo
   ```

2. **Restaurar desde Backup Más Reciente**
   - Acceder a `/admin/backups`
   - Seleccionar backup más reciente
   - Configurar importación completa
   - Ejecutar restauración

3. **Verificar Restauración**
   - Revisar contadores de datos
   - Probar funcionalidades críticas
   - Validar integridad de prospectos

4. **Comunicar a Usuarios**
   - Informar sobre restauración
   - Explicar posible pérdida de datos recientes
   - Solicitar verificación de información crítica

## 📁 Ubicaciones de Archivos

### Backend
```
server/routes/backup.js          # Endpoints de backup
server/models/                   # Modelos de datos a respaldar
```

### Frontend
```
client/src/components/Admin/BackupManager.js  # Interfaz de administración
```

### Archivos de Backup
```
downloads/
├── sundeck_backup_completo_YYYYMMDD_timestamp.json
├── prospectos_backup_YYYYMMDD_timestamp.json
├── sundeck_prospectos_YYYYMMDD.xlsx
└── mongo_backup_YYYYMMDD/
```

## 🔐 Seguridad y Permisos

### Permisos Requeridos
- **Backup Completo**: Rol `admin`
- **Backup Prospectos**: Permiso `prospectos:leer`
- **Importación**: Rol `admin`
- **Info Sistema**: Rol `admin`

### Datos Sensibles
- ❌ **Passwords de usuarios**: Excluidos automáticamente
- ✅ **Datos de prospectos**: Incluidos (necesarios para operación)
- ✅ **Configuraciones**: Incluidas
- ⚠️ **Archivos subidos**: No incluidos (backup manual requerido)

## 🧪 Pruebas Recomendadas

### Pruebas Mensuales
1. **Exportar backup completo**
2. **Crear base de datos de prueba**
3. **Importar backup en BD de prueba**
4. **Verificar integridad de datos**
5. **Probar funcionalidades principales**

### Validaciones
- Contadores de registros coinciden
- Relaciones entre datos intactas
- Fechas y timestamps preservados
- Archivos referenciados accesibles

## 📞 Contacto de Soporte

En caso de problemas con backups o migraciones:

1. **Revisar logs del servidor**
2. **Verificar permisos de archivos**
3. **Consultar esta documentación**
4. **Contactar al administrador del sistema**

## 📝 Registro de Cambios

- **v1.0** (2024-01-15): Implementación inicial del sistema de backup
- Exportación completa y por prospectos
- Importación con opciones configurables
- Interfaz de administración completa
- Documentación de procedimientos

---

**⚠️ IMPORTANTE**: Mantén siempre backups actualizados y prueba regularmente el proceso de restauración. La pérdida de datos puede ser crítica para el negocio.
