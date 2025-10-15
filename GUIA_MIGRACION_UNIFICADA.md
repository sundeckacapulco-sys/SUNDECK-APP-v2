# Guía de Migración a la Arquitectura Unificada

## 📋 Resumen

Esta guía te ayudará a migrar los componentes existentes a la nueva arquitectura unificada de cotizaciones, eliminando las inconsistencias identificadas en el análisis de flujos.

## 🎯 Objetivos de la Migración

- ✅ **Eliminar código duplicado** en cálculos y validaciones
- ✅ **Unificar estructuras de datos** entre todos los flujos
- ✅ **Centralizar lógica de negocio** en servicios reutilizables
- ✅ **Mantener funcionalidad existente** sin romper la interfaz
- ✅ **Mejorar mantenibilidad** del código

---

## 🗺️ Plan de Migración

### Fase 1: Preparación (Completada ✅)
- [x] Store central unificado (`cotizacionStore.js`)
- [x] Servicios de cálculo (`calculosService.js`, `normalizacionService.js`)
- [x] Servicio integrador (`cotizacionUnificadaService.js`)
- [x] Hooks especializados (`useCotizacionUnificada.js`)

### Fase 2: Migración por Componente
- [ ] **AgregarEtapaModal** → `useLevantamientoTecnico` + `useCotizacionEnVivo`
- [ ] **CotizacionForm** → `useCotizacionTradicional`
- [ ] **CotizacionDirecta** → `useCotizacionDirecta`
- [ ] **Otros componentes** → Hooks apropiados

### Fase 3: Validación y Limpieza
- [ ] Pruebas de regresión
- [ ] Eliminación de código obsoleto
- [ ] Optimizaciones de rendimiento

---

## 🔧 Migración Paso a Paso

### 1. AgregarEtapaModal.js

Este es el componente más complejo ya que maneja 2 flujos diferentes.

#### Antes (Problemático)
```javascript
// Estado fragmentado
const [piezas, setPiezas] = useState([]);
const [precioGeneral, setPrecioGeneral] = useState(750);
const [cobraInstalacion, setCobraInstalacion] = useState(false);
const [precioInstalacion, setPrecioInstalacion] = useState(0);
const [tipoInstalacion, setTipoInstalacion] = useState('');

// Cálculos duplicados
const calcularSubtotalProductos = () => {
  return piezas.reduce((total, pieza) => {
    const area = calcularAreaPieza(pieza);
    const subtotalM2 = area * (pieza.precioM2 || precioGeneral);
    // ... lógica específica del modal
    return total + subtotalM2;
  }, 0);
};

// Payload manual con transformaciones
const handleGenerarCotizacion = async () => {
  const payload = {
    prospectoId,
    piezas: piezas.map((pieza) => {
      // Mapeo manual complejo
      return mapearPiezaParaDocumento(pieza);
    }),
    precioGeneral,
    totalM2: calcularTotalM2(),
    // ... más campos manuales
  };
};
```

#### Después (Unificado)
```javascript
import { useLevantamientoTecnico, useCotizacionEnVivo } from '../hooks/useCotizacionUnificada';

const AgregarEtapaModal = ({ prospectoId, tipoVisitaInicial, onClose }) => {
  // Hook dinámico según el tipo
  const cotizacion = tipoVisitaInicial === 'levantamiento' 
    ? useLevantamientoTecnico(prospectoId)
    : useCotizacionEnVivo(prospectoId);

  // Estado reactivo automático
  const { productos, totales, validacion, configuracionFlujo } = cotizacion;

  // Acciones simplificadas
  const handleAgregarProducto = (productoData) => {
    cotizacion.addProducto({
      nombre: productoData.producto,
      ubicacion: productoData.ubicacion,
      medidas: {
        ancho: productoData.ancho,
        alto: productoData.alto,
        area: productoData.ancho * productoData.alto,
        cantidad: productoData.cantidad
      },
      precios: configuracionFlujo.mostrarPrecios ? {
        unitario: productoData.precioM2,
        subtotal: (productoData.ancho * productoData.alto) * productoData.precioM2
      } : { unitario: 0, subtotal: 0 },
      tecnico: {
        color: productoData.color,
        observaciones: productoData.observaciones,
        // Campos técnicos del levantamiento
        tipoControl: productoData.tipoControl,
        orientacion: productoData.orientacion,
        instalacion: productoData.tipoInstalacion
      },
      extras: {
        motorizado: productoData.motorizado,
        esToldo: productoData.esToldo,
        // ... otros extras
      }
    });
  };

  // Instalación especial simplificada
  const handleInstalacionChange = (instalacion) => {
    cotizacion.updateInstalacionEspecial(instalacion);
  };

  // Payload automático
  const handleGenerarCotizacion = async () => {
    if (!validacion.valido) {
      alert(`Errores: ${validacion.errores.join(', ')}`);
      return;
    }

    try {
      const payload = cotizacion.generarPayload();
      const response = await axios.post('/cotizaciones/desde-visita', payload);
      onClose(response.data);
    } catch (error) {
      console.error('Error al generar cotización:', error);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      {/* Interfaz existente - solo cambiar la lógica interna */}
      
      {/* Resumen automático */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="h6">
          📊 Resumen: {productos.length} productos - {totales.totalArea.toFixed(2)} m²
        </Typography>
        <Typography variant="body2">
          💰 Total: ${totales.total.toLocaleString()}
        </Typography>
      </Box>

      {/* Botones con validación automática */}
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          variant="contained" 
          onClick={handleGenerarCotizacion}
          disabled={!validacion.valido}
        >
          {tipoVisitaInicial === 'levantamiento' ? 'Guardar Levantamiento' : 'Generar Cotización'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

#### Pasos de Migración para AgregarEtapaModal

1. **Reemplazar imports**:
```javascript
// Agregar
import { useLevantamientoTecnico, useCotizacionEnVivo } from '../hooks/useCotizacionUnificada';
```

2. **Reemplazar useState con hooks**:
```javascript
// Eliminar
const [piezas, setPiezas] = useState([]);
const [precioGeneral, setPrecioGeneral] = useState(750);
// ... otros useState

// Agregar
const cotizacion = tipoVisitaInicial === 'levantamiento' 
  ? useLevantamientoTecnico(prospectoId)
  : useCotizacionEnVivo(prospectoId);
```

3. **Actualizar funciones de cálculo**:
```javascript
// Eliminar funciones manuales
const calcularSubtotalProductos = () => { ... };
const calcularTotalM2 = () => { ... };

// Usar valores reactivos
const { totales } = cotizacion;
// totales.subtotalProductos, totales.totalArea están disponibles automáticamente
```

4. **Simplificar validaciones**:
```javascript
// Eliminar validaciones manuales
const validarFormulario = () => { ... };

// Usar validación automática
const { validacion } = cotizacion;
if (!validacion.valido) {
  // Mostrar errores: validacion.errores
}
```

### 2. CotizacionForm.js

#### Antes (Problemático)
```javascript
const [productos, setProductos] = useState([]);
const [cliente, setCliente] = useState({});
const [descuento, setDescuento] = useState(0);

const calcularTotales = () => {
  // Lógica específica del formulario
  const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0);
  const descuentoMonto = subtotal * (descuento / 100);
  return { subtotal, descuentoMonto, total: subtotal - descuentoMonto };
};

const handleImportarLevantamiento = async () => {
  // Lógica compleja de importación con múltiples transformaciones
  const response = await fetch(`/prospectos/${prospectoId}/etapas`);
  const etapas = await response.json();
  // ... mapeos manuales complejos
};
```

#### Después (Unificado)
```javascript
import { useCotizacionTradicional } from '../hooks/useCotizacionUnificada';

const CotizacionForm = ({ prospectoId }) => {
  const cotizacion = useCotizacionTradicional();
  
  // Configurar prospecto si existe
  useEffect(() => {
    if (prospectoId) {
      cotizacion.setProspectoId(prospectoId);
    }
  }, [prospectoId]);

  // Estado reactivo
  const { productos, cliente, totales, validacion } = cotizacion;

  // Importación simplificada
  const handleImportarLevantamiento = async () => {
    try {
      const response = await fetch(`/prospectos/${prospectoId}/etapas`);
      const etapas = await response.json();
      
      // Buscar levantamiento
      const levantamiento = etapas.find(e => 
        e.nombre.includes('Levantamiento') || e.nombre.includes('Medición')
      );
      
      if (levantamiento?.piezas) {
        const resultado = await cotizacion.importarDesdelevantamiento(
          levantamiento.piezas, 
          prospectoId
        );
        
        if (resultado.exito) {
          alert(resultado.mensaje);
        }
      }
    } catch (error) {
      alert('Error al importar levantamiento');
    }
  };

  // Guardar simplificado
  const handleGuardar = async () => {
    if (!validacion.valido) {
      alert(`Errores: ${validacion.errores.join(', ')}`);
      return;
    }

    const payload = cotizacion.generarPayload();
    // Enviar al backend
  };

  return (
    <Box>
      {/* Interfaz existente */}
      
      {/* Totales automáticos */}
      <Typography variant="h6">
        Total: ${totales.total.toLocaleString()}
      </Typography>
      
      <Button onClick={handleImportarLevantamiento}>
        📋 Importar Levantamiento
      </Button>
      
      <Button 
        onClick={handleGuardar}
        disabled={!validacion.valido}
      >
        Guardar Cotización
      </Button>
    </Box>
  );
};
```

### 3. CotizacionDirecta.js

#### Antes (Problemático)
```javascript
const [paso, setPaso] = useState(1);
const [cliente, setCliente] = useState({});
const [productos, setProductos] = useState([]);

const calcularTotales = () => {
  // Otra implementación de cálculos
  return productos.reduce((total, producto) => {
    return total + (producto.medidas.area * producto.precioUnitario * producto.cantidad);
  }, 0);
};

const handleCrearCotizacion = async () => {
  // Crear prospecto primero
  const prospectoResponse = await axios.post('/prospectos', {
    ...cliente,
    fuente: 'cotizacion_directa'
  });
  
  // Luego crear cotización
  const cotizacionResponse = await axios.post('/cotizaciones', {
    prospectoId: prospectoResponse.data._id,
    productos: productos.map(p => ({
      // Mapeo manual específico
      nombre: p.nombre,
      subtotal: p.medidas.area * p.precioUnitario * p.cantidad
    })),
    origen: 'directa'
  });
};
```

#### Después (Unificado)
```javascript
import { useCotizacionDirecta } from '../hooks/useCotizacionUnificada';

const CotizacionDirecta = () => {
  const [paso, setPaso] = useState(1);
  const cotizacion = useCotizacionDirecta();
  
  const { cliente, productos, totales, validacion } = cotizacion;

  const handleCrearCotizacion = async () => {
    // Validación automática
    const validacionCompleta = cotizacion.validarParaCreacion();
    if (!validacionCompleta.valido) {
      alert(`Errores: ${validacionCompleta.errores.join(', ')}`);
      return;
    }

    try {
      // Payload unificado que crea prospecto y cotización automáticamente
      const payload = cotizacion.generarPayload({
        fechaValidez: '2024-12-31',
        condiciones: { anticipo: 60, saldo: 40 }
      });
      
      const response = await axios.post('/cotizaciones/directa', payload);
      // El backend maneja la creación del prospecto automáticamente
      
      alert('Cotización creada exitosamente');
    } catch (error) {
      alert('Error al crear cotización');
    }
  };

  return (
    <Box>
      {paso === 1 && (
        <ClienteForm 
          cliente={cliente}
          onChange={cotizacion.updateCliente}
        />
      )}
      
      {paso === 2 && (
        <ProductosForm
          productos={productos}
          onAdd={cotizacion.addProducto}
          onUpdate={cotizacion.updateProducto}
          onRemove={cotizacion.removeProducto}
        />
      )}
      
      {paso === 3 && (
        <ResumenForm
          totales={totales}
          onUpdateDescuento={cotizacion.updateDescuentos}
          onUpdateFacturacion={cotizacion.updateFacturacion}
        />
      )}
      
      {/* Navegación con validación automática */}
      <Button 
        onClick={handleCrearCotizacion}
        disabled={!validacion.valido}
      >
        Crear Cotización
      </Button>
    </Box>
  );
};
```

---

## 🔄 Patrón de Migración General

### 1. Identificar el Tipo de Flujo
```javascript
// Determinar qué hook usar
const determinarHook = (componente, props) => {
  if (componente === 'AgregarEtapaModal') {
    return props.tipoVisitaInicial === 'levantamiento' 
      ? useLevantamientoTecnico 
      : useCotizacionEnVivo;
  }
  
  if (componente === 'CotizacionForm') {
    return useCotizacionTradicional;
  }
  
  if (componente === 'CotizacionDirecta') {
    return useCotizacionDirecta;
  }
};
```

### 2. Reemplazar Estado Local
```javascript
// ❌ Antes: Estado fragmentado
const [piezas, setPiezas] = useState([]);
const [cliente, setCliente] = useState({});
const [totales, setTotales] = useState({});

// ✅ Después: Hook unificado
const cotizacion = useHookApropiado();
const { productos, cliente, totales } = cotizacion;
```

### 3. Eliminar Cálculos Duplicados
```javascript
// ❌ Antes: Cálculos manuales
const calcularSubtotal = () => {
  return productos.reduce((sum, p) => sum + p.subtotal, 0);
};

// ✅ Después: Cálculos reactivos
const { totales } = cotizacion;
// totales.subtotalProductos disponible automáticamente
```

### 4. Simplificar Validaciones
```javascript
// ❌ Antes: Validaciones manuales
const validarFormulario = () => {
  const errores = [];
  if (productos.length === 0) errores.push('Agregar productos');
  if (!cliente.nombre) errores.push('Nombre requerido');
  return errores;
};

// ✅ Después: Validación automática
const { validacion } = cotizacion;
if (!validacion.valido) {
  // validacion.errores contiene todos los errores
}
```

### 5. Unificar Payloads
```javascript
// ❌ Antes: Payload manual específico
const payload = {
  prospectoId,
  piezas: piezas.map(p => mapearManualmente(p)),
  totales: calcularTotalesManualmente(),
  // ... campos específicos del componente
};

// ✅ Después: Payload automático
const payload = cotizacion.generarPayload(opciones);
// Estructura optimizada para el endpoint correspondiente
```

---

## 🧪 Testing Durante la Migración

### 1. Pruebas de Equivalencia
```javascript
// Comparar resultados antes y después
const testEquivalencia = () => {
  // Datos de entrada idénticos
  const datosEntrada = { /* ... */ };
  
  // Resultado anterior
  const resultadoAnterior = componenteAnterior(datosEntrada);
  
  // Resultado nuevo
  const resultadoNuevo = componenteNuevo(datosEntrada);
  
  // Verificar equivalencia
  expect(resultadoNuevo.totales.total).toBe(resultadoAnterior.total);
  expect(resultadoNuevo.payload.piezas.length).toBe(resultadoAnterior.piezas.length);
};
```

### 2. Casos de Prueba Críticos
```javascript
const casosPrueba = [
  {
    nombre: 'Levantamiento técnico completo',
    datos: {
      productos: [
        {
          nombre: 'Toldo Vertical Motorizado',
          medidas: { ancho: 4.0, alto: 3.5 },
          extras: { esToldo: true, motorizado: true }
        }
      ]
    },
    esperado: {
      totalArea: 14.0,
      incluyeKit: true,
      incluyeMotor: true
    }
  },
  {
    nombre: 'Cotización con instalación especial',
    datos: {
      productos: [{ /* ... */ }],
      instalacion: { activa: true, precio: 5000 }
    },
    esperado: {
      instalacionIncluida: 5000,
      totalConInstalacion: true
    }
  }
];
```

### 3. Validación de Regresión
```javascript
// Verificar que la funcionalidad existente no se rompa
const validarRegresion = async () => {
  // Casos existentes que deben seguir funcionando
  const casosExistentes = await cargarCasosProduccion();
  
  for (const caso of casosExistentes) {
    const resultado = await procesarConNuevaArquitectura(caso);
    expect(resultado.exito).toBe(true);
    expect(resultado.total).toBeCloseTo(caso.totalEsperado, 2);
  }
};
```

---

## 📋 Checklist de Migración

### Por Componente

#### AgregarEtapaModal
- [ ] Reemplazar useState con `useLevantamientoTecnico`/`useCotizacionEnVivo`
- [ ] Eliminar funciones de cálculo manual
- [ ] Actualizar `handleAgregarPieza` para usar `addProducto`
- [ ] Simplificar `handleGenerarCotizacion` con `generarPayload`
- [ ] Probar ambos flujos (levantamiento y cotización vivo)
- [ ] Verificar que instalación especial funciona correctamente
- [ ] Validar que no se pierden datos técnicos

#### CotizacionForm
- [ ] Reemplazar useState con `useCotizacionTradicional`
- [ ] Simplificar `handleImportarLevantamiento`
- [ ] Actualizar tabla de productos para usar store
- [ ] Reemplazar `calcularTotales` con totales reactivos
- [ ] Probar importación desde levantamientos existentes
- [ ] Verificar cálculos de descuentos e IVA

#### CotizacionDirecta
- [ ] Reemplazar useState con `useCotizacionDirecta`
- [ ] Simplificar wizard con validaciones automáticas
- [ ] Actualizar `handleCrearCotizacion` con payload unificado
- [ ] Probar creación de prospecto automática
- [ ] Verificar flujo completo de 3 pasos

### General
- [ ] Eliminar archivos obsoletos
- [ ] Actualizar imports en componentes relacionados
- [ ] Ejecutar pruebas de regresión
- [ ] Validar rendimiento
- [ ] Actualizar documentación

---

## 🚨 Puntos Críticos de Atención

### 1. Preservar Funcionalidad Existente
```javascript
// ⚠️ CRÍTICO: No cambiar la interfaz pública
// Los props y eventos deben mantenerse iguales

// ✅ Correcto
const AgregarEtapaModal = ({ prospectoId, tipoVisitaInicial, onClose }) => {
  // Lógica interna cambia, interfaz se mantiene
};

// ❌ Incorrecto
const AgregarEtapaModal = ({ cotizacionConfig, onSave }) => {
  // Cambiar props rompe componentes padre
};
```

### 2. Migración de Datos Existentes
```javascript
// Manejar formatos anteriores durante la transición
const normalizarDatosExistentes = (datos) => {
  if (datos.piezas) {
    // Formato anterior del modal
    return datos.piezas.map(pieza => piezaAProducto(pieza));
  }
  
  if (datos.productos) {
    // Formato de cotización tradicional
    return datos.productos;
  }
  
  return [];
};
```

### 3. Validar Cálculos Críticos
```javascript
// ⚠️ CRÍTICO: Verificar que los totales coinciden
const validarCalculos = (anterior, nuevo) => {
  const diferencia = Math.abs(anterior.total - nuevo.total);
  if (diferencia > 0.01) {
    console.error('❌ Diferencia en cálculos:', { anterior, nuevo, diferencia });
    throw new Error('Los cálculos no coinciden');
  }
};
```

### 4. Manejo de Errores
```javascript
// Fallback a lógica anterior en caso de error
const conFallback = (nuevaLogica, logicaAnterior) => {
  try {
    return nuevaLogica();
  } catch (error) {
    console.warn('Fallback a lógica anterior:', error);
    return logicaAnterior();
  }
};
```

---

## 📊 Métricas de Éxito

### Antes vs Después de la Migración

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Líneas de código** | -50% | Contar LOC en componentes |
| **Funciones duplicadas** | 0 | Buscar `calcularTotales`, `validar` |
| **Tiempo de carga** | <2s | Performance testing |
| **Bugs de inconsistencia** | 0 | Testing de regresión |
| **Tiempo de desarrollo** | -70% | Medir tiempo para nuevas features |

### Validación Continua
```javascript
// Script de validación automática
const validarMigracion = async () => {
  const resultados = {
    calculosConsistentes: await validarCalculos(),
    datosPreservados: await validarIntegridad(),
    rendimientoOptimo: await medirRendimiento(),
    funcionesEliminadas: await buscarDuplicados()
  };
  
  console.log('📊 Resultados de migración:', resultados);
  return resultados;
};
```

---

## 🎯 Próximos Pasos

1. **Comenzar con AgregarEtapaModal** (componente más crítico)
2. **Migrar CotizacionForm** (más usado)
3. **Actualizar CotizacionDirecta** (más simple)
4. **Validar con casos reales** de producción
5. **Eliminar código obsoleto** gradualmente
6. **Optimizar rendimiento** si es necesario

La migración debe ser **gradual y validada** en cada paso para asegurar que no se rompa la funcionalidad existente mientras se obtienen los beneficios de la arquitectura unificada.
