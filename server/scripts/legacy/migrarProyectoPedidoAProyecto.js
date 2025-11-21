const mongoose = require('mongoose');
require('dotenv').config();
const Proyecto = require('../models/Proyecto');
const ProyectoPedido = require('../models/ProyectoPedido.legacy');
const logger = require('../config/logger');

const ESTADOS_PROYECTO_MAP = {
  cotizado: 'cotizacion',
  confirmado: 'aprobado',
  en_fabricacion: 'fabricacion',
  fabricado: 'fabricacion',
  en_instalacion: 'instalacion',
  completado: 'completado',
  cancelado: 'cancelado'
};

const ESTADOS_INSTALACION_MAP = {
  pendiente: 'programada',
  programada: 'programada',
  en_proceso: 'instalando',
  pausada: 'reprogramada',
  completada: 'completada',
  cancelada: 'cancelada'
};

const ROLES_CUADRILLA_MAP = {
  jefe_cuadrilla: 'lider',
  instalador: 'especialista',
  ayudante: 'ayudante'
};

function mapEstadoProyecto(estado) {
  return ESTADOS_PROYECTO_MAP[estado] || 'levantamiento';
}

function mapEstadoInstalacion(estado) {
  return ESTADOS_INSTALACION_MAP[estado] || 'programada';
}

function formatDireccion(direccion = {}) {
  const partes = [
    direccion.calle,
    direccion.colonia,
    direccion.ciudad,
    direccion.codigoPostal
  ].filter(Boolean);

  if (partes.length === 0) {
    return direccion.referencias || null;
  }

  return partes.join(', ');
}

function mapCliente(cliente = {}) {
  const direccion = cliente.direccion || {};
  return {
    nombre: cliente.nombre || 'Cliente sin nombre',
    telefono: cliente.telefono || '',
    correo: cliente.email || cliente.correo || null,
    direccion: formatDireccion(direccion),
    zona: direccion.colonia || direccion.ciudad || null
  };
}

function mapPagos(pagos = {}) {
  return {
    montoTotal: pagos.montoTotal ?? null,
    subtotal: pagos.subtotal ?? null,
    iva: pagos.iva ?? null,
    descuentos: pagos.descuentos ?? null,
    anticipo: {
      monto: pagos.anticipo?.monto ?? null,
      porcentaje: pagos.anticipo?.porcentaje ?? undefined,
      fechaPago: pagos.anticipo?.fechaPago || null,
      metodoPago: pagos.anticipo?.metodoPago || undefined,
      referencia: pagos.anticipo?.referencia || null,
      comprobante: pagos.anticipo?.comprobante || null,
      pagado: pagos.anticipo?.pagado ?? false
    },
    saldo: {
      monto: pagos.saldo?.monto ?? null,
      porcentaje: pagos.saldo?.porcentaje ?? undefined,
      fechaVencimiento: pagos.saldo?.fechaVencimiento || null,
      fechaPago: pagos.saldo?.fechaPago || null,
      metodoPago: pagos.saldo?.metodoPago || null,
      referencia: pagos.saldo?.referencia || null,
      comprobante: pagos.saldo?.comprobante || null,
      pagado: pagos.saldo?.pagado ?? false
    },
    pagosAdicionales: Array.isArray(pagos.pagosAdicionales) ? pagos.pagosAdicionales : []
  };
}

function mapNotas(notas = []) {
  return notas.map((nota) => {
    const tipoMap = {
      info: 'general',
      alerta: 'cliente',
      problema: 'problema',
      solucion: 'general',
      cambio: 'general'
    };

    const tipo = tipoMap[nota.tipo] || 'general';
    const contenidoBase = nota.contenido || '';
    const prefijoEtapa = nota.etapa ? `[${nota.etapa}] ` : '';

    return {
      fecha: nota.fecha || new Date(),
      usuario: nota.usuario || undefined,
      tipo,
      contenido: `${prefijoEtapa}${contenidoBase}`.trim(),
      importante: Boolean(nota.privada) || nota.tipo === 'alerta' || nota.tipo === 'problema',
      archivosAdjuntos: []
    };
  });
}

function mapProductos(productos = []) {
  return productos.map((producto) => ({
    nombre: producto.nombre || producto.descripcion || 'Producto',
    descripcion: producto.descripcion || null,
    cantidad: producto.cantidad ?? 1,
    precio_unitario: producto.precioUnitario ?? null,
    subtotal: producto.subtotal ?? null
  }));
}

function mapInstalacion(instalacion = {}) {
  if (!instalacion || Object.keys(instalacion).length === 0) {
    return undefined;
  }

  const cuadrilla = Array.isArray(instalacion.instaladores)
    ? instalacion.instaladores.map((inst) => ({
        tecnico: inst.usuario,
        nombre: inst.nombre || undefined,
        rol: ROLES_CUADRILLA_MAP[inst.rol] || 'especialista',
        especialidad: inst.especialidad || undefined
      }))
    : [];

  const productosInstalar = Array.isArray(instalacion.productosInstalacion)
    ? instalacion.productosInstalacion.map((producto) => ({
        productoId: producto.productoId || undefined,
        ubicacion: producto.ubicacion || undefined,
        especificaciones: {
          producto: producto.nombre || undefined,
          medidas: producto.medidas || undefined,
          color: producto.color || undefined,
          sistema: producto.sistema || undefined,
          control: producto.control || undefined
        },
        herramientasNecesarias: producto.herramientas || [],
        materialesAdicionales: [],
        observacionesTecnicas: Array.isArray(producto.problemas)
          ? producto.problemas.join('; ')
          : producto.observaciones || undefined,
        instalado: producto.estado === 'instalado',
        fechaInstalacion: producto.fechaTermino || producto.fechaInstalacion || null
      }))
    : [];

  const checklist = Array.isArray(instalacion.checklist)
    ? instalacion.checklist.map((item) => ({
        item: item.item,
        completado: item.completado,
        observaciones: item.notas || undefined,
        foto: Array.isArray(item.fotos) && item.fotos.length > 0 ? item.fotos[0] : undefined
      }))
    : [];

  const materialesUsados = Array.isArray(instalacion.materialesUsados)
    ? instalacion.materialesUsados.map((material) => ({
        material: material.nombre,
        cantidad: material.cantidad,
        motivo: material.unidad || undefined,
        costo: material.costo || undefined
      }))
    : [];

  const incidencias = Array.isArray(instalacion.incidencias)
    ? instalacion.incidencias.map((incidencia) => ({
        fecha: incidencia.fecha,
        tipo: incidencia.tipo,
        descripcion: incidencia.descripcion || incidencia.notas || undefined,
        resolucion: Array.isArray(incidencia.solucionProblemas)
          ? incidencia.solucionProblemas.join('; ')
          : incidencia.resolucion || undefined,
        resuelta: incidencia.resuelta ?? incidencia.estado === 'resuelto',
        fotos: incidencia.fotos || []
      }))
    : [];

  const fotos = Array.isArray(instalacion.fotos) ? instalacion.fotos : [];

  return {
    numeroOrden: instalacion.numero || undefined,
    estado: mapEstadoInstalacion(instalacion.estado),
    programacion: {
      fechaProgramada: instalacion.fechaProgramada || undefined,
      horaInicio: instalacion.horarioInicio || instalacion.horaInicio || undefined,
      horaFinEstimada: instalacion.horarioFin || instalacion.horaFin || undefined,
      tiempoEstimado: instalacion.tiempoEstimado || instalacion.tiempos?.tiempoEstimado || undefined,
      cuadrilla
    },
    productosInstalar,
    checklist,
    ruta: instalacion.ruta || undefined,
    ejecucion: {
      fechaInicioReal: instalacion.tiempos?.inicioReal || instalacion.fechaRealizada || undefined,
      fechaFinReal: instalacion.tiempos?.finReal || instalacion.fechaRealizada || undefined,
      horasReales: instalacion.tiempos?.tiempoReal || undefined,
      materialesAdicionalesUsados: materialesUsados,
      incidencias
    },
    evidencias: {
      fotosAntes: fotos.filter((foto) => foto.categoria === 'antes').map((foto) => foto.url),
      fotosDurante: fotos.filter((foto) => foto.categoria === 'proceso').map((foto) => foto.url),
      fotosDespues: fotos
        .filter((foto) => ['terminado', 'solucion'].includes(foto.categoria))
        .map((foto) => foto.url),
      firmaCliente: instalacion.firmaCliente || undefined,
      nombreQuienRecibe: instalacion.contactoSitio?.nombre || undefined,
      comentariosCliente: instalacion.comentariosCliente || undefined
    },
    garantia: instalacion.garantia || undefined,
    costos: instalacion.costos || undefined
  };
}

function mapFabricacion(fabricacion = {}) {
  if (!fabricacion || Object.keys(fabricacion).length === 0) {
    return undefined;
  }

  return {
    estado: fabricacion.estado || 'pendiente',
    asignadoA: fabricacion.asignadoA || undefined,
    prioridad: fabricacion.prioridad || 'media',
    materiales: Array.isArray(fabricacion.materiales) ? fabricacion.materiales : [],
    procesos: Array.isArray(fabricacion.procesos) ? fabricacion.procesos : [],
    controlCalidad: fabricacion.controlCalidad || {},
    empaque: fabricacion.empaque || {},
    costos: fabricacion.costos || {},
    observaciones: fabricacion.observaciones || undefined,
    progreso: fabricacion.progreso ?? 0,
    checklist: Array.isArray(fabricacion.checklist) ? fabricacion.checklist : [],
    logistica: fabricacion.logistica || undefined,
    tareas: Array.isArray(fabricacion.tareas) ? fabricacion.tareas : [],
    etiquetas: Array.isArray(fabricacion.etiquetas) ? fabricacion.etiquetas : []
  };
}

function mapMontoBase(pagos = {}) {
  const total = pagos.montoTotal ?? 0;
  const subtotal = pagos.subtotal ?? 0;
  const iva = pagos.iva ?? 0;
  const anticipo = pagos.anticipo?.monto ?? 0;
  const saldo = pagos.saldo?.monto ?? 0;

  return {
    monto_estimado: total,
    subtotal,
    iva,
    total,
    anticipo,
    saldo_pendiente: saldo
  };
}

function mergeObjectIdArrays(actual = [], nuevos = []) {
  const set = new Set((actual || []).map((id) => id.toString()));
  (nuevos || []).forEach((id) => {
    if (!id) return;
    set.add(id.toString());
  });
  return Array.from(set);
}

async function conectarDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
  await mongoose.connect(mongoUri);
  logger.info('Conexión a MongoDB establecida para migración ProyectoPedido → Proyecto', {
    script: 'migrarProyectoPedidoAProyecto',
    mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
  });
}

async function migrar() {
  const estadisticas = {
    procesados: 0,
    actualizados: 0,
    creados: 0,
    omitidosSinCreador: 0,
    errores: 0
  };

  const proyectosPedido = await ProyectoPedido.find({}).lean();
  logger.info('ProyectoPedido recuperados para migración', {
    script: 'migrarProyectoPedidoAProyecto',
    total: proyectosPedido.length
  });

  for (const proyectoPedido of proyectosPedido) {
    estadisticas.procesados += 1;

    try {
      const creadoPor = proyectoPedido.creado_por || proyectoPedido.actualizado_por;

      if (!creadoPor) {
        estadisticas.omitidosSinCreador += 1;
        logger.warn('ProyectoPedido omitido por carecer de usuario creador', {
          script: 'migrarProyectoPedidoAProyecto',
          proyectoPedidoId: proyectoPedido._id,
          numero: proyectoPedido.numero
        });
        continue;
      }

      const datosPagos = mapPagos(proyectoPedido.pagos || {});
      const datosCliente = mapCliente(proyectoPedido.cliente || {});
      const notasMigradas = mapNotas(proyectoPedido.notas || []);
      const productosSimplificados = mapProductos(proyectoPedido.productos || []);
      const fabricacion = mapFabricacion(proyectoPedido.fabricacion || {});
      const instalacion = mapInstalacion(proyectoPedido.instalacion || {});
      const montos = mapMontoBase(proyectoPedido.pagos || {});

      const proyectoExistente = await Proyecto.findOne({ numero: proyectoPedido.numero });

      if (proyectoExistente) {
        proyectoExistente.set({
          cliente: datosCliente,
          estado: mapEstadoProyecto(proyectoPedido.estado),
          cronograma: proyectoPedido.cronograma || proyectoExistente.cronograma,
          fabricacion: fabricacion || proyectoExistente.fabricacion,
          instalacion: instalacion || proyectoExistente.instalacion,
          pagos: datosPagos,
          notas: [...(proyectoExistente.notas || []), ...notasMigradas],
          prospecto_original: proyectoExistente.prospecto_original || proyectoPedido.prospecto,
          actualizado_por: proyectoPedido.actualizado_por || proyectoExistente.actualizado_por,
          fecha_actualizacion: proyectoPedido.updatedAt || new Date(),
          numero: proyectoExistente.numero || proyectoPedido.numero,
          ...montos
        });

        proyectoExistente.productos = productosSimplificados;
        proyectoExistente.cotizaciones = mergeObjectIdArrays(
          proyectoExistente.cotizaciones,
          [proyectoPedido.cotizacion]
        );
        proyectoExistente.markModified('cliente');
        proyectoExistente.markModified('cronograma');
        proyectoExistente.markModified('fabricacion');
        proyectoExistente.markModified('instalacion');
        proyectoExistente.markModified('pagos');
        proyectoExistente.markModified('notas');
        proyectoExistente.markModified('productos');

        await proyectoExistente.save();

        estadisticas.actualizados += 1;
        logger.info('Proyecto actualizado desde ProyectoPedido', {
          script: 'migrarProyectoPedidoAProyecto',
          proyectoId: proyectoExistente._id,
          proyectoPedidoId: proyectoPedido._id,
          numero: proyectoPedido.numero
        });
      } else {
        const proyecto = new Proyecto({
          numero: proyectoPedido.numero,
          tipo_fuente: 'formal',
          estado: mapEstadoProyecto(proyectoPedido.estado),
          cliente: datosCliente,
          observaciones: proyectoPedido.observaciones || undefined,
          cronograma: proyectoPedido.cronograma || {},
          fabricacion,
          instalacion,
          pagos: datosPagos,
          notas: notasMigradas,
          productos: productosSimplificados,
          prospecto_original: proyectoPedido.prospecto || undefined,
          cotizaciones: proyectoPedido.cotizacion ? [proyectoPedido.cotizacion] : [],
          pedidos: [],
          creado_por: creadoPor,
          actualizado_por: proyectoPedido.actualizado_por || undefined,
          fecha_creacion: proyectoPedido.createdAt || new Date(),
          fecha_actualizacion: proyectoPedido.updatedAt || new Date(),
          fecha_compromiso: proyectoPedido.cronograma?.fechaEntrega || undefined,
          asesor_asignado: proyectoPedido.responsables?.vendedor || undefined,
          tecnico_asignado: proyectoPedido.responsables?.instalador || undefined,
          ...montos
        });

        await proyecto.save();

        estadisticas.creados += 1;
        logger.info('Proyecto creado desde ProyectoPedido', {
          script: 'migrarProyectoPedidoAProyecto',
          proyectoId: proyecto._id,
          proyectoPedidoId: proyectoPedido._id,
          numero: proyectoPedido.numero
        });
      }
    } catch (error) {
      estadisticas.errores += 1;
      logger.error('Error migrando ProyectoPedido', {
        script: 'migrarProyectoPedidoAProyecto',
        proyectoPedidoId: proyectoPedido._id,
        numero: proyectoPedido.numero,
        error: error.message,
        stack: error.stack
      });
    }
  }

  logger.info('Migración ProyectoPedido → Proyecto finalizada', {
    script: 'migrarProyectoPedidoAProyecto',
    ...estadisticas
  });
}

async function main() {
  try {
    await conectarDB();
    await migrar();
  } catch (error) {
    logger.error('Error general en migración ProyectoPedido → Proyecto', {
      script: 'migrarProyectoPedidoAProyecto',
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Conexión a MongoDB cerrada tras migración ProyectoPedido → Proyecto', {
      script: 'migrarProyectoPedidoAProyecto'
    });
    process.exit(0);
  }
}

main();
