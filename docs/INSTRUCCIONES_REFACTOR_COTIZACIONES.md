# 🔧 INSTRUCCIONES PARA REFACTOR DEL MÓDULO DE COTIZACIONES

**Fecha:** 7 Nov 2025  
**Prioridad:** ALTA  
**Complejidad:** MEDIA-ALTA  
**Tiempo estimado:** 4-6 horas

---

## 🎯 OBJETIVO

Reestructurar, optimizar y limpiar el módulo de cotizaciones para:
1. ✅ Mostrar correctamente el nombre del cliente/prospecto
2. ✅ Importar TODAS las especificaciones técnicas del levantamiento
3. ✅ Simplificar el código eliminando duplicaciones
4. ✅ Mejorar la experiencia de usuario

---

## 🐛 PROBLEMAS ACTUALES

### 1. Cliente no se muestra
**Síntoma:** El dropdown de "Cliente" aparece vacío aunque se importó desde el proyecto.

**Causa probable:**
- El `setValue('prospecto', proyecto.prospecto._id)` no está funcionando
- El prospecto no está en la lista de `prospectos` cargados
- Hay un timing issue entre cargar prospectos y setear el valor

**Ubicación:**
- `CotizacionForm.js` líneas 826-843

### 2. Especificaciones técnicas incompletas
**Síntoma:** Los productos importados solo muestran "Producto" y área, faltan:
- Sistema (Enrollable, Romana, etc.)
- Control (Derecha, Izquierda, etc.)
- Caída (Normal, Invertida, etc.)
- Instalación (Muro, Techo, etc.)
- Galería/Cabezal
- Base/Tabla
- Color
- Modelo

**Causa:**
- La función `importarDesdeProyectoUnificado` no está mapeando todos los campos
- Los campos técnicos no se están guardando en el producto

**Ubicación:**
- `CotizacionForm.js` líneas 748-819

---

## 📋 TAREAS A REALIZAR

### TAREA 1: Arreglar visualización del cliente

**Archivo:** `client/src/components/Cotizaciones/CotizacionForm.js`

**Paso 1.1:** Verificar que el prospecto se carga antes de setearlo
```javascript
// BUSCAR línea ~826
const fetchLevantamientoData = async () => {
  try {
    setLoading(true);
    
    if (proyectoId) {
      console.log('🔍 Buscando levantamiento en proyecto:', proyectoId);
      const { data } = await axiosConfig.get(`/proyectos/${proyectoId}`);
      const proyecto = data.data || data;
      
      // AGREGAR AQUÍ: Asegurar que los prospectos estén cargados
      if (!prospectos || prospectos.length === 0) {
        await fetchProspectos();
      }
      
      // Pre-seleccionar el prospecto del proyecto
      console.log('📋 Datos del proyecto:', proyecto);
      console.log('👤 Prospecto del proyecto:', proyecto.prospecto);
      
      // CAMBIAR ESTO:
      if (proyecto.prospecto?._id) {
        console.log('✅ Pre-seleccionando prospecto:', proyecto.prospecto._id);
        setValue('prospecto', proyecto.prospecto._id);
      } else if (proyecto.prospecto) {
        console.log('✅ Pre-seleccionando prospecto (ID):', proyecto.prospecto);
        setValue('prospecto', proyecto.prospecto);
      }
      
      // POR ESTO:
      const prospectoId = proyecto.prospecto?._id || proyecto.prospecto;
      if (prospectoId) {
        // Esperar un tick para que el Autocomplete se actualice
        setTimeout(() => {
          setValue('prospecto', prospectoId);
          console.log('✅ Prospecto seteado:', prospectoId);
        }, 100);
      }
```

**Paso 1.2:** Agregar un Alert para mostrar el proyecto/cliente
```javascript
// BUSCAR la sección donde se renderiza el formulario (línea ~1800)
// AGREGAR después del Alert de éxito/error:

{proyectoId && proyectoOrigen && (
  <Alert severity="info" sx={{ mb: 2 }}>
    📋 Cotización para proyecto: <strong>{proyectoOrigen.numero}</strong>
    <br />
    👤 Cliente: <strong>{proyectoOrigen.cliente?.nombre}</strong>
  </Alert>
)}
```

**Paso 1.3:** Guardar el proyecto origen en el estado
```javascript
// BUSCAR línea ~822 donde se obtiene el proyecto
const { data } = await axiosConfig.get(`/proyectos/${proyectoId}`);
const proyecto = data.data || data;

// AGREGAR:
setProyectoOrigen(proyecto); // Necesitas agregar este estado al inicio del componente
```

---

### TAREA 2: Importar todas las especificaciones técnicas

**Archivo:** `client/src/components/Cotizaciones/CotizacionForm.js`

**Paso 2.1:** Reemplazar la función `importarDesdeProyectoUnificado` (líneas 748-819)

```javascript
// REEMPLAZAR TODA LA FUNCIÓN POR ESTA VERSIÓN MEJORADA:

const importarDesdeProyectoUnificado = (proyecto) => {
  console.log('📥 Importando desde proyecto unificado:', proyecto);
  
  // Usar medidas si existen, sino usar levantamiento.partidas
  const levantamiento = proyecto.medidas && proyecto.medidas.length > 0 
    ? proyecto.medidas[0] 
    : proyecto.levantamiento;
  
  if (!levantamiento) {
    setError('No hay levantamiento para importar');
    return;
  }
  
  const piezas = levantamiento.piezas || levantamiento.partidas || [];
  console.log('📦 Piezas a importar:', piezas.length);
  
  if (piezas.length === 0) {
    setError('El levantamiento no tiene partidas');
    return;
  }
  
  const productos = [];
  
  piezas.forEach((pieza, index) => {
    console.log(`📦 Procesando pieza ${index + 1}:`, pieza);
    
    // Obtener medidas individuales
    const medidasIndividuales = pieza.medidas || [];
    const areaTotal = pieza.areaTotal || medidasIndividuales.reduce((sum, m) => sum + (m.area || 0), 0);
    
    // Construir descripción detallada con TODAS las especificaciones
    const especificaciones = [];
    
    // Ubicación
    if (pieza.ubicacion) {
      especificaciones.push(`📍 ${pieza.ubicacion}`);
    }
    
    // Producto y modelo
    if (pieza.productoLabel || pieza.producto) {
      especificaciones.push(`🏷️ ${pieza.productoLabel || pieza.producto}`);
    }
    if (pieza.modeloCodigo) {
      especificaciones.push(`🔖 Modelo: ${pieza.modeloCodigo}`);
    }
    if (pieza.color) {
      especificaciones.push(`🎨 Color: ${pieza.color}`);
    }
    
    // Especificaciones técnicas de las medidas individuales
    if (medidasIndividuales.length > 0) {
      especificaciones.push(`\n📏 Medidas (${medidasIndividuales.length} piezas):`);
      
      medidasIndividuales.forEach((medida, idx) => {
        const specs = [];
        
        // Dimensiones
        specs.push(`${medida.ancho}m × ${medida.alto}m (${medida.area?.toFixed(2) || 0}m²)`);
        
        // Sistema
        if (medida.sistema) {
          specs.push(`Sistema: ${medida.sistema}`);
        }
        
        // Control
        if (medida.tipoControl) {
          specs.push(`Control: ${medida.tipoControl}`);
        }
        
        // Caída
        if (medida.caida) {
          specs.push(`Caída: ${medida.caida}`);
        }
        
        // Instalación
        if (medida.tipoInstalacion) {
          specs.push(`Instalación: ${medida.tipoInstalacion}`);
        }
        
        // Fijación
        if (medida.tipoFijacion) {
          specs.push(`Fijación: ${medida.tipoFijacion}`);
        }
        
        // Galería/Cabezal
        if (medida.galeria) {
          specs.push(`Galería: ${medida.galeria}`);
        }
        
        // Base/Tabla
        if (medida.baseTabla) {
          specs.push(`Base: ${medida.baseTabla}`);
        }
        
        // Operación
        if (medida.modoOperacion) {
          specs.push(`Operación: ${medida.modoOperacion}`);
        }
        
        // Tela/Marca
        if (medida.telaMarca) {
          specs.push(`Tela: ${medida.telaMarca}`);
        }
        
        // Observaciones técnicas
        if (medida.observacionesTecnicas) {
          specs.push(`Obs: ${medida.observacionesTecnicas}`);
        }
        
        especificaciones.push(`  ${idx + 1}. ${specs.join(' • ')}`);
      });
    }
    
    // Observaciones de la partida
    if (pieza.observaciones) {
      especificaciones.push(`\n💬 ${pieza.observaciones}`);
    }
    
    // Crear producto con TODAS las especificaciones
    productos.push({
      nombre: pieza.productoLabel || pieza.producto || 'Producto',
      descripcion: especificaciones.join('\n'),
      categoria: 'ventana',
      material: pieza.modeloCodigo || '',
      color: pieza.color || '',
      medidas: {
        ancho: medidasIndividuales[0]?.ancho || 0,
        alto: medidasIndividuales[0]?.alto || 0,
        area: areaTotal
      },
      cantidad: pieza.cantidad || 1,
      precioUnitario: 0,
      unidadMedida: 'm2',
      subtotal: 0,
      // Guardar datos originales para referencia
      _datosOriginales: {
        ubicacion: pieza.ubicacion,
        modeloCodigo: pieza.modeloCodigo,
        color: pieza.color,
        medidas: medidasIndividuales
      }
    });
  });
  
  console.log('✅ Productos construidos:', productos);
  setValue('productos', productos);
  setSuccess(`✅ Se importaron ${productos.length} productos con todas sus especificaciones técnicas`);
};
```

---

### TAREA 3: Agregar estado para proyecto origen

**Archivo:** `client/src/components/Cotizaciones/CotizacionForm.js`

**Ubicación:** Línea ~450 (donde se declaran los estados)

```javascript
// BUSCAR la sección de estados
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
// ... otros estados ...

// AGREGAR:
const [proyectoOrigen, setProyectoOrigen] = useState(null);
```

---

### TAREA 4: Mejorar el renderizado de productos

**Archivo:** `client/src/components/Cotizaciones/CotizacionForm.js`

**Ubicación:** Buscar donde se renderizan los productos en la tabla

**Cambio:** Asegurar que la descripción se muestre con saltos de línea

```javascript
// BUSCAR la celda de descripción en la tabla
<TableCell>
  <Typography variant="body2" color="text.secondary">
    {producto.descripcion || '-'}
  </Typography>
</TableCell>

// CAMBIAR POR:
<TableCell>
  <Typography 
    variant="body2" 
    color="text.secondary"
    sx={{ 
      whiteSpace: 'pre-line',  // Respetar saltos de línea
      fontSize: '0.85rem'
    }}
  >
    {producto.descripcion || '-'}
  </Typography>
</TableCell>
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de implementar los cambios, verificar:

- [ ] El nombre del cliente/prospecto aparece en el dropdown
- [ ] Se muestra un Alert con el proyecto y cliente
- [ ] Los productos importados muestran:
  - [ ] Ubicación
  - [ ] Producto y modelo
  - [ ] Color
  - [ ] Todas las medidas individuales
  - [ ] Sistema, control, caída, instalación
  - [ ] Galería, base, operación
  - [ ] Observaciones técnicas
- [ ] La descripción se muestra con formato legible
- [ ] El área total es correcta
- [ ] Se pueden agregar precios manualmente
- [ ] Se puede guardar la cotización

---

## 🧪 PRUEBAS

### Caso de Prueba 1: Importar desde proyecto
1. Ir a un proyecto con levantamiento
2. Click en "Nueva Cotización"
3. Verificar que:
   - Cliente aparece seleccionado
   - Alert muestra proyecto y cliente
   - Productos tienen todas las especificaciones
   - Áreas son correctas

### Caso de Prueba 2: Editar precios
1. Agregar precio a un producto
2. Verificar que el subtotal se calcula correctamente
3. Guardar cotización
4. Verificar que se guardó correctamente

---

## 📝 NOTAS IMPORTANTES

1. **No eliminar código legacy** hasta confirmar que todo funciona
2. **Agregar logs** en cada paso para debugging
3. **Probar con diferentes proyectos** (con 1 partida, con múltiples partidas)
4. **Verificar que funciona tanto con `proyecto.medidas` como con `proyecto.levantamiento`**

---

## 🚀 DESPUÉS DEL REFACTOR

Crear un documento de pruebas con:
- Screenshots del antes y después
- Lista de bugs corregidos
- Mejoras implementadas
- Casos de prueba ejecutados

---

**Documento creado:** 7 Nov 2025 17:50 hrs  
**Autor:** Sistema Sundeck CRM  
**Versión:** 1.0
