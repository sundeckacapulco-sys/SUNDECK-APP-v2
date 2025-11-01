# 🚀 CONTINUAR AQUÍ - Día 3: Migración de Datos

**Última actualización:** 31 Octubre 2025 - 16:24  
**Estado:** Fase 1 EN PROGRESO (80%)  
**Próxima tarea:** Migrar datos de ProyectoPedido a Proyecto

---

## ✅ LO COMPLETADO HASTA AHORA

### Día 0: Modelo Unificado ✅
- ✅ `Proyecto.js` con 5 secciones nuevas
- ✅ 4 métodos inteligentes implementados

### Día 1: Endpoints ✅
- ✅ 3 endpoints funcionales
- ✅ QR Generator resiliente

### Día 2: Services Actualizados ✅
- ✅ `FabricacionService` migrado a `Proyecto`
- ✅ `InstalacionesInteligentesService` reescrito
- ✅ Endpoint de sugerencias inteligentes

**Progreso:** 80% de Fase 1 completado

---

## 📋 PRÓXIMA SESIÓN: Día 3 - Migración de Datos

### Objetivo
Migrar datos existentes de `ProyectoPedido` al modelo unificado `Proyecto` preservando 100% de la información.

---

## 🔍 PASO 1: Análisis Previo

### Verificar datos existentes

```bash
# Conectar a MongoDB
mongo sundeck_crm

# Contar documentos
db.proyectopedidos.count()
db.proyectos.count()

# Ver estructura de ProyectoPedido
db.proyectopedidos.findOne()

# Ver estructura de Proyecto
db.proyectos.findOne()
```

### Identificar campos a migrar

**De `ProyectoPedido` a `Proyecto`:**

```javascript
// Campos que ya existen en Proyecto (preservar)
- cliente
- estado
- productos
- total, subtotal, iva
- anticipo, saldo_pendiente

// Campos nuevos a migrar
- cronograma.* → cronograma.*
- fabricacion.* → fabricacion.*
- instalacion.* → instalacion.* (si existe)
- pagos.* → pagos.*
- notas[] → notas[]
```

---

## 📝 PASO 2: Crear Script de Migración

### Archivo: `server/scripts/migrarProyectoPedidoAProyecto.js`

```javascript
const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const ProyectoPedido = require('../models/ProyectoPedido');
const logger = require('../config/logger');
require('dotenv').config();

/**
 * Script de migración: ProyectoPedido → Proyecto
 * 
 * Migra datos de ProyectoPedido al modelo unificado Proyecto
 * preservando toda la información existente.
 */

async function migrarProyectoPedidoAProyecto() {
  try {
    logger.info('Iniciando migración de ProyectoPedido a Proyecto', {
      script: 'migrarProyectoPedidoAProyecto'
    });

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Conexión a MongoDB establecida');

    // Obtener todos los ProyectoPedido
    const proyectosPedido = await ProyectoPedido.find({});
    
    logger.info(`Encontrados ${proyectosPedido.length} ProyectoPedido para migrar`);

    let migrados = 0;
    let errores = 0;
    let omitidos = 0;

    for (const pp of proyectosPedido) {
      try {
        // Verificar si ya existe en Proyecto
        const existente = await Proyecto.findOne({
          numero: pp.numero,
          'cliente.nombre': pp.cliente?.nombre
        });

        if (existente) {
          logger.warn('Proyecto ya existe, omitiendo', {
            numero: pp.numero,
            proyectoId: existente._id
          });
          omitidos++;
          continue;
        }

        // Crear nuevo Proyecto con datos migrados
        const nuevoProyecto = new Proyecto({
          // Campos básicos
          numero: pp.numero,
          cliente: pp.cliente,
          estado: pp.estado,
          
          // Productos
          productos: pp.productos || [],
          
          // Financiero
          monto_estimado: pp.montoTotal || pp.total || 0,
          subtotal: pp.subtotal || 0,
          iva: pp.iva || 0,
          total: pp.total || 0,
          anticipo: pp.anticipo || 0,
          saldo_pendiente: pp.saldoPendiente || pp.saldo || 0,
          
          // Cronograma (NUEVO)
          cronograma: {
            fechaPedido: pp.fechaCreacion || pp.createdAt,
            fechaInicioFabricacion: pp.cronograma?.fechaInicioFabricacion,
            fechaFinFabricacionEstimada: pp.cronograma?.fechaFinFabricacionEstimada,
            fechaFinFabricacionReal: pp.cronograma?.fechaFinFabricacionReal,
            fechaInstalacionProgramada: pp.cronograma?.fechaInstalacionProgramada,
            fechaInstalacionReal: pp.cronograma?.fechaInstalacionReal,
            fechaEntrega: pp.cronograma?.fechaEntrega,
            fechaCompletado: pp.cronograma?.fechaCompletado
          },
          
          // Fabricación (NUEVO)
          fabricacion: pp.fabricacion ? {
            estado: pp.fabricacion.estado || 'pendiente',
            asignadoA: pp.fabricacion.asignadoA,
            prioridad: pp.fabricacion.prioridad || 'media',
            materiales: pp.fabricacion.materiales || [],
            procesos: pp.fabricacion.procesos || [],
            controlCalidad: pp.fabricacion.controlCalidad || {},
            empaque: pp.fabricacion.empaque || {},
            costos: pp.fabricacion.costos || {},
            progreso: pp.fabricacion.progreso || 0,
            etiquetas: [] // Se generarán después si es necesario
          } : undefined,
          
          // Instalación (NUEVO)
          instalacion: pp.instalacion ? {
            numeroOrden: pp.instalacion.numeroOrden,
            estado: pp.instalacion.estado || 'pendiente',
            programacion: pp.instalacion.programacion || {},
            productosInstalar: pp.instalacion.productosInstalar || [],
            checklist: pp.instalacion.checklist || [],
            ruta: pp.instalacion.ruta || {},
            ejecucion: pp.instalacion.ejecucion || {},
            evidencias: pp.instalacion.evidencias || {},
            garantia: pp.instalacion.garantia || {},
            costos: pp.instalacion.costos || {}
          } : undefined,
          
          // Pagos (NUEVO)
          pagos: {
            montoTotal: pp.total || 0,
            subtotal: pp.subtotal || 0,
            iva: pp.iva || 0,
            descuentos: pp.descuentos || 0,
            anticipo: pp.pagos?.anticipo || {
              monto: pp.anticipo || 0,
              porcentaje: pp.anticipo ? (pp.anticipo / pp.total * 100) : 0,
              pagado: pp.anticipo > 0
            },
            saldo: pp.pagos?.saldo || {
              monto: pp.saldoPendiente || pp.saldo || 0,
              porcentaje: pp.saldoPendiente ? (pp.saldoPendiente / pp.total * 100) : 0,
              pagado: (pp.saldoPendiente || 0) === 0
            },
            pagosAdicionales: pp.pagos?.pagosAdicionales || []
          },
          
          // Notas (NUEVO)
          notas: pp.notas || [],
          
          // Metadata
          creado_por: pp.creadoPor || pp.creado_por,
          asesor_asignado: pp.asesorAsignado || pp.asesor_asignado,
          prospecto_original: pp.prospectoOriginal || pp.prospecto_original,
          
          // Fechas
          fecha_creacion: pp.fechaCreacion || pp.createdAt,
          fecha_actualizacion: pp.fechaActualizacion || pp.updatedAt
        });

        await nuevoProyecto.save();
        
        logger.info('Proyecto migrado exitosamente', {
          numero: pp.numero,
          proyectoId: nuevoProyecto._id,
          cliente: pp.cliente?.nombre
        });
        
        migrados++;

      } catch (error) {
        logger.error('Error migrando proyecto individual', {
          numero: pp.numero,
          error: error.message,
          stack: error.stack
        });
        errores++;
      }
    }

    logger.info('Migración completada', {
      total: proyectosPedido.length,
      migrados,
      omitidos,
      errores
    });

    // Cerrar conexión
    await mongoose.connection.close();
    
    return {
      total: proyectosPedido.length,
      migrados,
      omitidos,
      errores
    };

  } catch (error) {
    logger.error('Error en migración de ProyectoPedido', {
      script: 'migrarProyectoPedidoAProyecto',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrarProyectoPedidoAProyecto()
    .then(resultado => {
      console.log('\n✅ Migración completada:');
      console.log(`   Total: ${resultado.total}`);
      console.log(`   Migrados: ${resultado.migrados}`);
      console.log(`   Omitidos: ${resultado.omitidos}`);
      console.log(`   Errores: ${resultado.errores}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en migración:', error.message);
      process.exit(1);
    });
}

module.exports = { migrarProyectoPedidoAProyecto };
```

---

## 🔧 PASO 3: Crear Backup

### Antes de ejecutar la migración

```bash
# Backup de la base de datos
mongodump --db sundeck_crm --out ./backup_$(date +%Y%m%d_%H%M%S)

# O backup solo de ProyectoPedido
mongodump --db sundeck_crm --collection proyectopedidos --out ./backup_proyectopedidos
```

---

## ▶️ PASO 4: Ejecutar Migración

### En entorno de desarrollo

```bash
# Ejecutar script
node server/scripts/migrarProyectoPedidoAProyecto.js

# Verificar resultados
mongo sundeck_crm
db.proyectos.count()  # Debe aumentar
db.proyectos.find().limit(5)  # Verificar estructura
```

---

## ✅ PASO 5: Validación

### Script de validación

```javascript
// server/scripts/validarMigracion.js
const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const ProyectoPedido = require('../models/ProyectoPedido');
const logger = require('../config/logger');

async function validarMigracion() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const totalPP = await ProyectoPedido.countDocuments();
  const totalP = await Proyecto.countDocuments();
  
  logger.info('Validación de migración', {
    proyectoPedidos: totalPP,
    proyectos: totalP
  });
  
  // Validar campos críticos
  const proyectos = await Proyecto.find({});
  
  let errores = 0;
  for (const p of proyectos) {
    if (!p.total || p.total === 0) {
      logger.warn('Proyecto sin total', { numero: p.numero });
      errores++;
    }
    if (!p.cliente || !p.cliente.nombre) {
      logger.warn('Proyecto sin cliente', { numero: p.numero });
      errores++;
    }
  }
  
  logger.info('Validación completada', { errores });
  
  await mongoose.connection.close();
  return { errores };
}

if (require.main === module) {
  validarMigracion()
    .then(r => {
      console.log(`\n✅ Validación: ${r.errores} errores encontrados`);
      process.exit(r.errores > 0 ? 1 : 0);
    });
}

module.exports = { validarMigracion };
```

---

## 📋 Checklist de Tareas

- [ ] **Tarea 1:** Análisis previo
  - [ ] Conectar a MongoDB
  - [ ] Contar documentos existentes
  - [ ] Analizar estructura de datos

- [ ] **Tarea 2:** Crear script de migración
  - [ ] Crear `migrarProyectoPedidoAProyecto.js`
  - [ ] Mapear todos los campos
  - [ ] Agregar logging completo

- [ ] **Tarea 3:** Crear backup
  - [ ] Backup completo de base de datos
  - [ ] Verificar backup exitoso

- [ ] **Tarea 4:** Ejecutar migración
  - [ ] Ejecutar en desarrollo
  - [ ] Verificar logs
  - [ ] Revisar resultados

- [ ] **Tarea 5:** Validar migración
  - [ ] Crear script de validación
  - [ ] Ejecutar validación
  - [ ] Corregir errores si existen

- [ ] **Tarea 6:** Documentar resultados
  - [ ] Crear reporte de migración
  - [ ] Documentar problemas encontrados
  - [ ] Actualizar AGENTS.md

---

## ⚠️ IMPORTANTE

### NO EJECUTAR EN PRODUCCIÓN sin:
1. ✅ Backup completo verificado
2. ✅ Pruebas exitosas en desarrollo
3. ✅ Validación de integridad de datos
4. ✅ Plan de rollback documentado

### Campos Críticos a Preservar
- `total`, `anticipo`, `saldo_pendiente`
- `cliente.*`
- `productos[]`
- `estado`
- Todas las fechas del cronograma

---

## 📚 DOCUMENTOS DE REFERENCIA

- `server/models/Proyecto.js` - Modelo destino
- `server/models/ProyectoPedido.js` - Modelo origen
- `docschecklists/FASE_1_UNIFICACION_MODELOS.md` - Plan de unificación

---

## 📊 PROGRESO FASE 1

```
Día 0: Modelo Unificado        ████████████████████ 100% ✅
Día 1: Endpoints               ████████████████████ 100% ✅
Día 2: Actualizar Services     ████████████████████ 100% ✅
Día 3: Migración de Datos      ░░░░░░░░░░░░░░░░░░░░   0% ⬅️ AQUÍ
Día 4: Deprecación             ░░░░░░░░░░░░░░░░░░░░   0%
Día 5: Validación Final        ░░░░░░░░░░░░░░░░░░░░   0%

Total: ████████████████░░░░ 80%
```

---

**Responsable:** Próximo Agente  
**Duración estimada:** 2-3 horas  
**Complejidad:** Alta (requiere cuidado con datos)  
**Riesgo:** Medio (backup obligatorio)

**¡Listo para migración de datos!** 🚀
