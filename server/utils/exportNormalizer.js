const Proyecto = require('../models/Proyecto');
const mongoose = require('mongoose');

/**
 * Función principal para obtener datos normalizados de un proyecto para exportación
 * Esta función sirve como fuente única de verdad para PDF y Excel
 */
async function getProyectoExportData(proyectoId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(proyectoId)) {
      throw new Error('ID de proyecto inválido');
    }

    const proyecto = await Proyecto.findById(proyectoId)
      .populate([
        { path: 'creado_por', select: 'nombre email' },
        { path: 'asesor_asignado', select: 'nombre email telefono' },
        { path: 'tecnico_asignado', select: 'nombre email telefono' },
        { path: 'prospecto_original', select: 'nombre telefono email' },
        { path: 'cotizaciones', select: 'numero fecha_creacion subtotal total estado' },
        { path: 'pedidos', select: 'numero fecha_creacion total estado' },
        { path: 'ordenes_fabricacion', select: 'numero fecha_creacion estado' },
        { path: 'instalaciones', select: 'numero fecha_programada estado' }
      ])
      .lean();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    // Normalizar datos del cliente
    const cliente = {
      nombre: proyecto.cliente?.nombre || '',
      telefono: proyecto.cliente?.telefono || '',
      correo: proyecto.cliente?.correo || '',
      direccion: proyecto.cliente?.direccion || '',
      zona: proyecto.cliente?.zona || ''
    };

    // Normalizar medidas con cálculos (proteger contra undefined)
    const medidas = (proyecto.medidas ?? []).map((medida, index) => {
      const area = (medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1);
      
      return {
        id: index + 1,
        ubicacion: medida.ubicacion || '',
        ancho: medida.ancho || 0,
        alto: medida.alto || 0,
        cantidad: medida.cantidad || 1,
        area: parseFloat(area.toFixed(2)),
        producto: medida.producto || '',
        color: medida.color || '',
        observaciones: medida.observaciones || '',
        
        // Campos técnicos
        tipoControl: medida.tipoControl || '',
        orientacion: medida.orientacion || '',
        tipoInstalacion: medida.tipoInstalacion || '',
        eliminacion: medida.eliminacion || '',
        risoAlto: medida.risoAlto || '',
        risoBajo: medida.risoBajo || '',
        sistema: medida.sistema || '',
        telaMarca: medida.telaMarca || '',
        baseTabla: medida.baseTabla || '',
        
        // Información de toldos
        esToldo: medida.esToldo || false,
        tipoToldo: medida.tipoToldo || '',
        kitModelo: medida.kitModelo || '',
        kitPrecio: medida.kitPrecio || 0,
        
        // Información de motorización
        motorizado: medida.motorizado || false,
        motorModelo: medida.motorModelo || '',
        motorPrecio: medida.motorPrecio || 0,
        controlModelo: medida.controlModelo || '',
        controlPrecio: medida.controlPrecio || 0,
        
        // Fotos
        fotoUrls: medida.fotoUrls || []
      };
    });

    // Calcular totales de medidas
    const totalArea = medidas.reduce((sum, medida) => sum + medida.area, 0);
    const totalKits = medidas.reduce((sum, medida) => sum + (medida.kitPrecio || 0), 0);
    const totalMotores = medidas.reduce((sum, medida) => sum + (medida.motorPrecio || 0), 0);
    const totalControles = medidas.reduce((sum, medida) => sum + (medida.controlPrecio || 0), 0);

    // Normalizar productos (proteger contra undefined)
    const productos = (proyecto.productos ?? []).map((producto, index) => ({
      id: index + 1,
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      cantidad: producto.cantidad || 0,
      precio_unitario: producto.precio_unitario || 0,
      subtotal: producto.subtotal || (producto.cantidad * producto.precio_unitario) || 0
    }));

    // Normalizar materiales (proteger contra undefined)
    const materiales = (proyecto.materiales ?? []).map((material, index) => ({
      id: index + 1,
      nombre: material.nombre || '',
      cantidad: material.cantidad || 0,
      unidad: material.unidad || '',
      precio_unitario: material.precio_unitario || 0,
      subtotal: material.subtotal || (material.cantidad * material.precio_unitario) || 0
    }));

    // Calcular totales financieros
    const subtotalProductos = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const subtotalMateriales = materiales.reduce((sum, m) => sum + m.subtotal, 0);
    const subtotalExtras = totalKits + totalMotores + totalControles;
    const subtotalGeneral = subtotalProductos + subtotalMateriales + subtotalExtras;
    
    // Usar coalescencia nula para respetar valores 0 legítimos
    const iva = proyecto.iva ?? (subtotalGeneral * 0.16);
    const total = proyecto.total ?? (subtotalGeneral + iva);

    // Información de responsables
    const responsables = {
      creado_por: proyecto.creado_por?.nombre || proyecto.responsable || '',
      asesor_asignado: proyecto.asesor_asignado?.nombre || '',
      tecnico_asignado: proyecto.tecnico_asignado?.nombre || '',
      asesor_telefono: proyecto.asesor_asignado?.telefono || '',
      tecnico_telefono: proyecto.tecnico_asignado?.telefono || ''
    };

    // Información de fechas
    const fechas = {
      creacion: proyecto.fecha_creacion,
      actualizacion: proyecto.fecha_actualizacion,
      compromiso: proyecto.fecha_compromiso,
      creacion_formateada: formatearFecha(proyecto.fecha_creacion),
      actualizacion_formateada: formatearFecha(proyecto.fecha_actualizacion),
      compromiso_formateada: proyecto.fecha_compromiso ? formatearFecha(proyecto.fecha_compromiso) : ''
    };

    // Información de tiempo de entrega
    const tiempoEntrega = {
      tipo: proyecto.tiempo_entrega?.tipo || 'normal',
      dias_estimados: proyecto.tiempo_entrega?.dias_estimados || 0,
      fecha_estimada: proyecto.tiempo_entrega?.fecha_estimada,
      fecha_estimada_formateada: proyecto.tiempo_entrega?.fecha_estimada ? 
        formatearFecha(proyecto.tiempo_entrega.fecha_estimada) : ''
    };

    // Resumen del proyecto
    const resumen = {
      total_medidas: medidas.length,
      total_area: parseFloat(totalArea.toFixed(2)),
      total_productos: productos.length,
      total_materiales: materiales.length,
      progreso_porcentaje: calcularProgreso(proyecto.estado),
      estado_actual: proyecto.estado,
      tipo_fuente: proyecto.tipo_fuente
    };

    // Objeto normalizado completo
    const datosNormalizados = {
      // Información básica
      id: proyecto._id,
      cliente,
      direccion: cliente.direccion,
      zona: cliente.zona,
      tipo_fuente: proyecto.tipo_fuente,
      estado: proyecto.estado,
      
      // Datos técnicos
      medidas,
      productos,
      materiales,
      observaciones: proyecto.observaciones || '',
      fotos: proyecto.fotos || [],
      
      // Totales y cálculos
      totales: {
        area: totalArea,
        kits: totalKits,
        motores: totalMotores,
        controles: totalControles,
        productos: subtotalProductos,
        materiales: subtotalMateriales,
        extras: subtotalExtras,
        subtotal: subtotalGeneral,
        iva: iva,
        total: total
      },
      
      // Información de fechas
      fechas,
      
      // Responsables
      responsables,
      
      // Configuraciones
      requiere_factura: proyecto.requiere_factura || false,
      metodo_pago_anticipo: proyecto.metodo_pago_anticipo || '',
      tiempo_entrega: tiempoEntrega,
      
      // Referencias
      prospecto_original: proyecto.prospecto_original,
      cotizaciones: proyecto.cotizaciones || [],
      pedidos: proyecto.pedidos || [],
      ordenes_fabricacion: proyecto.ordenes_fabricacion || [],
      instalaciones: proyecto.instalaciones || [],
      
      // Resumen
      resumen
    };

    return datosNormalizados;

  } catch (error) {
    console.error('Error en getProyectoExportData:', error);
    throw error;
  }
}

/**
 * Función específica para obtener datos optimizados para PDF
 */
async function getProyectoDataForPDF(proyectoId) {
  const datos = await getProyectoExportData(proyectoId);
  
  // Optimizaciones específicas para PDF
  return {
    ...datos,
    // Formatear medidas para tabla PDF
    medidas_tabla: datos.medidas.map(m => ({
      ubicacion: m.ubicacion,
      dimensiones: `${m.ancho} × ${m.alto} m`,
      cantidad: m.cantidad,
      area: `${m.area} m²`,
      producto: m.producto,
      color: m.color
    })),
    
    // Formatear totales para PDF
    totales_formateados: {
      subtotal: formatearMoneda(datos.totales.subtotal),
      iva: formatearMoneda(datos.totales.iva),
      total: formatearMoneda(datos.totales.total)
    }
  };
}

/**
 * Función específica para obtener datos optimizados para Excel
 */
async function getProyectoDataForExcel(proyectoId) {
  const datos = await getProyectoExportData(proyectoId);
  
  // Optimizaciones específicas para Excel
  return {
    ...datos,
    // Hoja de medidas para Excel
    hoja_medidas: datos.medidas.map(m => ({
      'Ubicación': m.ubicacion,
      'Ancho (m)': m.ancho,
      'Alto (m)': m.alto,
      'Cantidad': m.cantidad,
      'Área (m²)': m.area,
      'Producto': m.producto,
      'Color': m.color,
      'Kit': m.kitPrecio,
      'Motor': m.motorPrecio,
      'Control': m.controlPrecio,
      'Observaciones': m.observaciones
    })),
    
    // Hoja de resumen para Excel
    hoja_resumen: [
      { 'Concepto': 'Subtotal Productos', 'Importe': datos.totales.productos },
      { 'Concepto': 'Subtotal Materiales', 'Importe': datos.totales.materiales },
      { 'Concepto': 'Extras (Kits/Motores)', 'Importe': datos.totales.extras },
      { 'Concepto': 'Subtotal', 'Importe': datos.totales.subtotal },
      { 'Concepto': 'IVA (16%)', 'Importe': datos.totales.iva },
      { 'Concepto': 'Total', 'Importe': datos.totales.total }
    ]
  };
}

// Funciones auxiliares

function formatearFecha(fecha) {
  if (!fecha) return '';
  
  const opciones = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City'
  };
  
  return new Date(fecha).toLocaleDateString('es-MX', opciones);
}

function formatearMoneda(cantidad) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(cantidad || 0);
}

function calcularProgreso(estado) {
  const estados = ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado'];
  const indice = estados.indexOf(estado);
  return indice >= 0 ? Math.round((indice / (estados.length - 1)) * 100) : 0;
}

module.exports = {
  getProyectoExportData,
  getProyectoDataForPDF,
  getProyectoDataForExcel
};
