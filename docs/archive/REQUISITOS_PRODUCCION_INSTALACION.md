# 📋 REQUISITOS COMPLETOS: Producción e Instalación

**Fecha:** 31 Octubre 2025  
**Objetivo:** Documentar TODOS los requisitos funcionales  
**Estado:** Requisitos identificados

---

## 🏭 ÓRDENES DE PRODUCCIÓN

### Funcionalidad Requerida

#### 1. **Etiquetas para Empaques de Persianas** ⭐ CRÍTICO

**Propósito:** Cada persiana debe tener una etiqueta imprimible con:

```javascript
etiqueta: {
  // Identificación
  numeroOrden: "PROD-2025-0001",
  numeroPieza: "1/5",
  
  // Cliente
  cliente: {
    nombre: "Juan Pérez",
    telefono: "664-123-4567",
    direccion: "Calle Principal #123, Col. Centro"
  },
  
  // Ubicación específica
  ubicacion: "Sala - Ventana Principal",
  
  // Especificaciones técnicas
  especificaciones: {
    producto: "Persiana Roller Screen",
    medidas: {
      ancho: 2.50,
      alto: 1.80,
      area: 4.50
    },
    color: "Blanco",
    tela: "Screen 5%",
    sistema: "Roller",
    control: "Derecha",
    motorizado: false
  },
  
  // Instalación
  instalacion: {
    tipo: "Muro",
    fijacion: "Concreto",
    observaciones: "Requiere taladro de impacto"
  },
  
  // Código de barras/QR
  codigoQR: "data:image/png;base64...",
  
  // Fechas
  fechaFabricacion: "2025-10-31",
  fechaInstalacionProgramada: "2025-11-05"
}
```

**Formato de impresión:**
```
┌─────────────────────────────────────────┐
│  SUNDECK - Orden de Producción          │
│  PROD-2025-0001 | Pieza 1/5             │
├─────────────────────────────────────────┤
│  Cliente: Juan Pérez                    │
│  Tel: 664-123-4567                      │
│  Ubicación: Sala - Ventana Principal    │
├─────────────────────────────────────────┤
│  Producto: Persiana Roller Screen       │
│  Medidas: 2.50m x 1.80m (4.50 m²)      │
│  Color: Blanco | Tela: Screen 5%        │
│  Control: Derecha | Manual              │
├─────────────────────────────────────────┤
│  Instalación: Muro - Concreto           │
│  Obs: Requiere taladro de impacto       │
├─────────────────────────────────────────┤
│  [QR CODE]    Fecha Inst: 05/11/2025   │
└─────────────────────────────────────────┘
```

**Implementación:**
```javascript
// Método en Proyecto.js
proyectoSchema.methods.generarEtiquetasProduccion = function() {
  const etiquetas = [];
  
  this.productos.forEach((producto, index) => {
    etiquetas.push({
      numeroOrden: this.numero,
      numeroPieza: `${index + 1}/${this.productos.length}`,
      cliente: {
        nombre: this.cliente.nombre,
        telefono: this.cliente.telefono,
        direccion: this.cliente.direccion
      },
      ubicacion: producto.ubicacion,
      especificaciones: {
        producto: producto.nombre,
        medidas: producto.medidas,
        color: producto.color,
        tela: producto.telaMarca,
        sistema: producto.sistema,
        control: producto.tipoControl,
        motorizado: producto.motorizado
      },
      instalacion: {
        tipo: producto.tipoInstalacion,
        fijacion: producto.tipoFijacion,
        observaciones: producto.observacionesTecnicas
      },
      codigoQR: this.generarQR(producto._id),
      fechaFabricacion: this.cronograma.fechaFinFabricacionReal,
      fechaInstalacionProgramada: this.cronograma.fechaInstalacionProgramada
    });
  });
  
  return etiquetas;
};
```

---

## 🔧 ÓRDENES DE INSTALACIÓN

### Funcionalidad Requerida

#### 1. **Orden Completa con Detalles Técnicos** ⭐ CRÍTICO

```javascript
ordenInstalacion: {
  // Identificación
  numeroOrden: "INST-2025-0001",
  proyecto: ObjectId,
  
  // Cliente y ubicación
  cliente: {
    nombre: "Juan Pérez",
    telefono: "664-123-4567",
    telefonoAdicional: "664-987-6543",
    direccion: {
      calle: "Calle Principal #123",
      colonia: "Centro",
      ciudad: "Tijuana",
      codigoPostal: "22000",
      referencias: "Casa azul, portón negro",
      linkMapa: "https://maps.google.com/..."
    }
  },
  
  // Programación
  programacion: {
    fechaProgramada: Date,
    horaInicio: "09:00",
    horaFinEstimada: "12:30",
    tiempoEstimado: 210, // minutos
    
    // Cuadrilla asignada
    cuadrilla: [{
      tecnico: ObjectId,
      nombre: "Carlos Martínez",
      rol: "lider",
      especialidad: "persianas_motorizadas"
    }, {
      tecnico: ObjectId,
      nombre: "Luis García",
      rol: "ayudante",
      especialidad: "instalacion_general"
    }]
  },
  
  // Productos a instalar (con detalles técnicos completos)
  productos: [{
    productoId: ObjectId,
    ubicacion: "Sala - Ventana Principal",
    
    // Especificaciones técnicas
    especificaciones: {
      producto: "Persiana Roller Screen",
      medidas: { ancho: 2.50, alto: 1.80, area: 4.50 },
      color: "Blanco",
      tela: "Screen 5%",
      sistema: "Roller",
      control: "Derecha",
      motorizado: false,
      
      // Detalles de instalación
      tipoInstalacion: "Muro",
      tipoFijacion: "Concreto",
      galeria: "Sin galería",
      baseTabla: "15cm",
      caida: "Normal",
      traslape: "No aplica"
    },
    
    // Herramientas necesarias
    herramientasNecesarias: [
      "Taladro de impacto",
      "Brocas para concreto 6mm y 8mm",
      "Nivel láser",
      "Escalera 2m",
      "Destornilladores"
    ],
    
    // Materiales adicionales
    materialesAdicionales: [
      { nombre: "Taquetes 8mm", cantidad: 6 },
      { nombre: "Tornillos 3\"", cantidad: 6 },
      { nombre: "Silicón transparente", cantidad: 1 }
    ],
    
    // Observaciones técnicas
    observacionesTecnicas: "Requiere taladro de impacto. Muro de concreto sólido.",
    
    // Estado
    instalado: false,
    fechaInstalacion: null
  }],
  
  // Checklist de instalación
  checklist: [
    { item: "Verificar medidas en sitio", completado: false },
    { item: "Verificar nivel de instalación", completado: false },
    { item: "Perforar y colocar taquetes", completado: false },
    { item: "Instalar soportes", completado: false },
    { item: "Montar persiana", completado: false },
    { item: "Verificar funcionamiento", completado: false },
    { item: "Limpiar área de trabajo", completado: false },
    { item: "Obtener firma del cliente", completado: false }
  ],
  
  // Ruta y logística
  ruta: {
    ordenEnRuta: 1, // Primera instalación del día
    ubicacionAnterior: {
      direccion: "Oficina Sundeck",
      coordenadas: { lat: 32.5149, lng: -117.0382 }
    },
    ubicacionActual: {
      direccion: "Calle Principal #123",
      coordenadas: { lat: 32.5250, lng: -117.0450 }
    },
    ubicacionSiguiente: {
      direccion: "Av. Revolución #456",
      coordenadas: { lat: 32.5300, lng: -117.0500 }
    },
    distanciaKm: 5.2,
    tiempoTrasladoMinutos: 15
  },
  
  // Evidencias
  evidencias: {
    fotosAntes: [],
    fotosDurante: [],
    fotosDespues: [],
    firmaCliente: null,
    nombreQuienRecibe: null,
    comentariosCliente: null
  },
  
  // Incidencias
  incidencias: [],
  
  // Garantía
  garantia: {
    vigente: true,
    fechaInicio: Date,
    fechaFin: Date, // +1 año
    terminos: "Garantía de 1 año en instalación y funcionamiento"
  }
}
```

---

## 🤖 ALGORITMO DE CÁLCULO DE TIEMPO DE INSTALACIÓN

### Funcionalidad Requerida

#### 1. **Cálculo Inteligente de Tiempo** ⭐ CRÍTICO

```javascript
// Método en Proyecto.js o Service
calcularTiempoInstalacion(productos, direccion) {
  let tiempoTotal = 0;
  const factores = {
    complejidad: 1.0,
    acceso: 1.0,
    motorizado: 1.0,
    altura: 1.0
  };
  
  // 1. Tiempo base por producto
  productos.forEach(producto => {
    let tiempoBase = 30; // minutos base
    
    // Por tipo de producto
    if (producto.sistema === 'Roller') tiempoBase = 30;
    else if (producto.sistema === 'Romana') tiempoBase = 45;
    else if (producto.sistema === 'Panel') tiempoBase = 60;
    else if (producto.sistema === 'Vertical') tiempoBase = 40;
    
    // Por tamaño
    const area = producto.medidas.ancho * producto.medidas.alto;
    if (area > 6) tiempoBase *= 1.3; // +30% para áreas grandes
    if (area > 10) tiempoBase *= 1.5; // +50% para áreas muy grandes
    
    // Por motorización
    if (producto.motorizado) {
      tiempoBase += 20; // +20 min por motorización
      factores.motorizado = 1.2;
    }
    
    // Por tipo de instalación
    if (producto.tipoInstalacion === 'Techo') tiempoBase *= 1.2;
    if (producto.tipoInstalacion === 'Empotrado') tiempoBase *= 1.4;
    if (producto.tipoInstalacion === 'Piso a Techo') tiempoBase *= 1.3;
    
    // Por tipo de fijación
    if (producto.tipoFijacion === 'Concreto') tiempoBase *= 1.2;
    if (producto.tipoFijacion === 'Tablaroca') tiempoBase *= 1.1;
    
    // Por altura
    if (producto.medidas.alto > 2.5) {
      tiempoBase *= 1.3; // +30% por altura
      factores.altura = 1.3;
    }
    
    tiempoTotal += tiempoBase;
  });
  
  // 2. Factores de complejidad del sitio
  
  // Accesibilidad
  if (direccion.pisoAlto && !direccion.tieneElevador) {
    tiempoTotal *= 1.2; // +20% por escaleras
    factores.acceso = 1.2;
  }
  
  // Zona de difícil acceso
  if (direccion.zonaRemota) {
    tiempoTotal *= 1.1;
  }
  
  // 3. Tiempo de preparación y limpieza
  const tiempoPreparacion = 15; // minutos
  const tiempoLimpieza = 10; // minutos
  
  // 4. Buffer de seguridad (10%)
  const buffer = tiempoTotal * 0.1;
  
  // Total
  const tiempoFinal = Math.ceil(
    tiempoPreparacion + 
    tiempoTotal + 
    tiempoLimpieza + 
    buffer
  );
  
  return {
    tiempoEstimadoMinutos: tiempoFinal,
    tiempoEstimadoHoras: (tiempoFinal / 60).toFixed(1),
    desglose: {
      preparacion: tiempoPreparacion,
      instalacion: tiempoTotal,
      limpieza: tiempoLimpieza,
      buffer: buffer
    },
    factores: factores,
    recomendaciones: generarRecomendaciones(factores)
  };
}
```

---

## 🚗 ALGORITMO DE RUTAS Y TIEMPOS DE TRASLADO

### Funcionalidad Requerida

#### 1. **Optimización de Rutas Diarias** ⭐ CRÍTICO

```javascript
// Service: instalacionesInteligentesService.js

async optimizarRutaDiaria(instalaciones, fecha) {
  // 1. Obtener instalaciones del día
  const instalacionesDelDia = instalaciones.filter(i => 
    i.programacion.fechaProgramada.toDateString() === fecha.toDateString()
  );
  
  // 2. Punto de inicio (oficina/bodega)
  const puntoInicio = {
    nombre: "Oficina Sundeck",
    coordenadas: { lat: 32.5149, lng: -117.0382 }
  };
  
  // 3. Calcular matriz de distancias
  const matrizDistancias = await calcularMatrizDistancias(
    puntoInicio,
    instalacionesDelDia
  );
  
  // 4. Algoritmo de optimización (Nearest Neighbor)
  const rutaOptimizada = optimizarRutaNearestNeighbor(
    puntoInicio,
    instalacionesDelDia,
    matrizDistancias
  );
  
  // 5. Calcular horarios
  let horaActual = new Date(fecha);
  horaActual.setHours(8, 0, 0); // Inicio a las 8:00 AM
  
  const horarios = rutaOptimizada.map((instalacion, index) => {
    // Tiempo de traslado desde ubicación anterior
    const tiempoTraslado = index === 0 
      ? matrizDistancias[0][instalacion.index].tiempoMinutos
      : matrizDistancias[rutaOptimizada[index-1].index][instalacion.index].tiempoMinutos;
    
    // Hora de llegada
    const horaLlegada = new Date(horaActual.getTime() + tiempoTraslado * 60000);
    
    // Tiempo de instalación
    const tiempoInstalacion = instalacion.programacion.tiempoEstimado;
    
    // Hora de salida
    const horaSalida = new Date(horaLlegada.getTime() + tiempoInstalacion * 60000);
    
    // Actualizar hora actual para siguiente iteración
    horaActual = horaSalida;
    
    return {
      ordenEnRuta: index + 1,
      instalacionId: instalacion._id,
      cliente: instalacion.cliente.nombre,
      direccion: instalacion.cliente.direccion.calle,
      
      // Tiempos
      horaLlegadaEstimada: horaLlegada,
      horaSalidaEstimada: horaSalida,
      tiempoInstalacionMinutos: tiempoInstalacion,
      tiempoTrasladoMinutos: tiempoTraslado,
      
      // Distancia
      distanciaKm: index === 0
        ? matrizDistancias[0][instalacion.index].distanciaKm
        : matrizDistancias[rutaOptimizada[index-1].index][instalacion.index].distanciaKm,
      
      // Ubicaciones
      ubicacionAnterior: index === 0 
        ? puntoInicio.nombre
        : rutaOptimizada[index-1].cliente.nombre,
      ubicacionSiguiente: index < rutaOptimizada.length - 1
        ? rutaOptimizada[index+1].cliente.nombre
        : "Fin de ruta"
    };
  });
  
  // 6. Resumen de la ruta
  const resumen = {
    totalInstalaciones: horarios.length,
    horaInicio: horarios[0].horaLlegadaEstimada,
    horaFin: horarios[horarios.length - 1].horaSalidaEstimada,
    tiempoTotalMinutos: horarios.reduce((sum, h) => 
      sum + h.tiempoInstalacionMinutos + h.tiempoTrasladoMinutos, 0
    ),
    distanciaTotalKm: horarios.reduce((sum, h) => sum + h.distanciaKm, 0),
    eficiencia: calcularEficiencia(horarios)
  };
  
  return {
    fecha: fecha,
    ruta: horarios,
    resumen: resumen,
    recomendaciones: generarRecomendacionesRuta(horarios, resumen)
  };
}

// Algoritmo Nearest Neighbor (vecino más cercano)
function optimizarRutaNearestNeighbor(inicio, instalaciones, matrizDistancias) {
  const rutaOptimizada = [];
  const visitados = new Set();
  let ubicacionActual = 0; // Índice del punto de inicio
  
  while (rutaOptimizada.length < instalaciones.length) {
    let distanciaMinima = Infinity;
    let siguienteInstalacion = null;
    let siguienteIndex = null;
    
    // Buscar la instalación más cercana no visitada
    instalaciones.forEach((instalacion, index) => {
      if (!visitados.has(index)) {
        const distancia = matrizDistancias[ubicacionActual][index + 1].distanciaKm;
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          siguienteInstalacion = instalacion;
          siguienteIndex = index;
        }
      }
    });
    
    if (siguienteInstalacion) {
      rutaOptimizada.push({
        ...siguienteInstalacion,
        index: siguienteIndex + 1
      });
      visitados.add(siguienteIndex);
      ubicacionActual = siguienteIndex + 1;
    }
  }
  
  return rutaOptimizada;
}

// Calcular matriz de distancias (usando Google Maps API o similar)
async function calcularMatrizDistancias(inicio, instalaciones) {
  const ubicaciones = [inicio, ...instalaciones.map(i => ({
    coordenadas: i.cliente.direccion.coordenadas
  }))];
  
  const matriz = [];
  
  for (let i = 0; i < ubicaciones.length; i++) {
    matriz[i] = [];
    for (let j = 0; j < ubicaciones.length; j++) {
      if (i === j) {
        matriz[i][j] = { distanciaKm: 0, tiempoMinutos: 0 };
      } else {
        // Aquí iría la llamada a Google Maps Distance Matrix API
        // Por ahora, cálculo aproximado usando fórmula de Haversine
        const distancia = calcularDistanciaHaversine(
          ubicaciones[i].coordenadas,
          ubicaciones[j].coordenadas
        );
        const tiempo = Math.ceil(distancia / 0.5); // ~30 km/h promedio en ciudad
        
        matriz[i][j] = {
          distanciaKm: distancia,
          tiempoMinutos: tiempo
        };
      }
    }
  }
  
  return matriz;
}

// Fórmula de Haversine para calcular distancia entre coordenadas
function calcularDistanciaHaversine(coord1, coord2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * 
    Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  
  return Math.round(distancia * 10) / 10; // Redondear a 1 decimal
}
```

---

## 📊 ESTRUCTURA COMPLETA EN `Proyecto.js`

```javascript
const proyectoSchema = new mongoose.Schema({
  // ... campos comerciales existentes ...
  
  // CRONOGRAMA UNIFICADO
  cronograma: {
    fechaPedido: Date,
    fechaInicioFabricacion: Date,
    fechaFinFabricacionEstimada: Date,
    fechaFinFabricacionReal: Date,
    fechaInstalacionProgramada: Date,
    fechaInstalacionReal: Date,
    fechaEntrega: Date,
    fechaCompletado: Date
  },
  
  // FABRICACIÓN DETALLADA
  fabricacion: {
    estado: String,
    asignadoA: ObjectId,
    prioridad: String,
    materiales: [],
    procesos: [],
    controlCalidad: {},
    empaque: {},
    costos: {},
    progreso: Number,
    
    // ETIQUETAS DE PRODUCCIÓN
    etiquetas: [{
      numeroOrden: String,
      numeroPieza: String,
      cliente: {},
      ubicacion: String,
      especificaciones: {},
      instalacion: {},
      codigoQR: String,
      fechas: {}
    }]
  },
  
  // INSTALACIÓN COMPLETA
  instalacion: {
    numeroOrden: String,
    estado: String,
    
    // Programación con algoritmo inteligente
    programacion: {
      fechaProgramada: Date,
      horaInicio: String,
      horaFinEstimada: String,
      tiempoEstimado: Number, // Calculado por algoritmo
      cuadrilla: []
    },
    
    // Productos con detalles técnicos completos
    productos: [{
      ubicacion: String,
      especificaciones: {},
      herramientasNecesarias: [],
      materialesAdicionales: [],
      observacionesTecnicas: String,
      instalado: Boolean
    }],
    
    // Checklist
    checklist: [],
    
    // Ruta optimizada
    ruta: {
      ordenEnRuta: Number,
      ubicacionAnterior: {},
      ubicacionActual: {},
      ubicacionSiguiente: {},
      distanciaKm: Number,
      tiempoTrasladoMinutos: Number
    },
    
    // Evidencias
    evidencias: {},
    
    // Incidencias
    incidencias: [],
    
    // Garantía
    garantia: {}
  }
});

// MÉTODOS

// Generar etiquetas de producción
proyectoSchema.methods.generarEtiquetasProduccion = function() { ... };

// Calcular tiempo de instalación
proyectoSchema.methods.calcularTiempoInstalacion = function() { ... };

// Optimizar ruta de instalación
proyectoSchema.statics.optimizarRutaDiaria = async function(fecha) { ... };
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Producción
- [ ] Agregar campo `fabricacion.etiquetas[]` a `Proyecto.js`
- [ ] Crear método `generarEtiquetasProduccion()`
- [ ] Crear endpoint `POST /api/proyectos/:id/etiquetas-produccion`
- [ ] Crear template de impresión de etiquetas (PDF)
- [ ] Generar códigos QR para cada producto

### Instalación
- [ ] Agregar campo `instalacion` completo a `Proyecto.js`
- [ ] Crear método `calcularTiempoInstalacion()`
- [ ] Crear método estático `optimizarRutaDiaria()`
- [ ] Implementar algoritmo Nearest Neighbor
- [ ] Integrar Google Maps Distance Matrix API (opcional)
- [ ] Crear endpoint `POST /api/instalaciones/optimizar-ruta`
- [ ] Crear endpoint `GET /api/instalaciones/ruta-diaria/:fecha`

### Algoritmos
- [ ] Implementar cálculo inteligente de tiempo de instalación
- [ ] Implementar optimización de rutas
- [ ] Implementar cálculo de distancias (Haversine)
- [ ] Crear sistema de recomendaciones inteligentes

---

**Responsable:** Equipo Desarrollo CRM Sundeck  
**Fecha:** 31 Octubre 2025  
**Estado:** ✅ Requisitos documentados - Listo para implementar
