/**
 * Servicio del Agente IA Sundeck
 * Integración con OpenAI para asistencia inteligente
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Modelos para consultas
const Proyecto = require('../models/Proyecto');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Instalacion = require('../models/Instalacion');
const Usuario = require('../models/Usuario');

// Inicializar OpenAI (lazy loading para evitar errores si no hay API key)
let openai = null;

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

// Cargar base de conocimiento
let conocimientoBase = '';
const conocimientoPath = path.join(__dirname, '../../docs/Documentos Sundeck/CONOCIMIENTO_AGENTE.md');
const identidadPath = path.join(__dirname, '../../docs/AGENTE_IA_SUNDECK_IDENTIDAD.md');

try {
  if (fs.existsSync(conocimientoPath)) {
    conocimientoBase = fs.readFileSync(conocimientoPath, 'utf8');
    logger.info('Base de conocimiento cargada', { 
      service: 'asistenteService',
      caracteres: conocimientoBase.length 
    });
  }
} catch (error) {
  logger.warn('No se pudo cargar base de conocimiento', { error: error.message });
}

let identidadAgente = '';
try {
  if (fs.existsSync(identidadPath)) {
    identidadAgente = fs.readFileSync(identidadPath, 'utf8');
  }
} catch (error) {
  logger.warn('No se pudo cargar identidad del agente', { error: error.message });
}

// System prompt del agente
const SYSTEM_PROMPT = `${identidadAgente}

---

# CONTEXTO DEL SISTEMA CRM

Tienes acceso a las siguientes funciones para consultar datos del sistema:
- consultarProyectos: Buscar proyectos por estado, cliente, fecha
- consultarProspectos: Buscar prospectos/clientes potenciales
- consultarPendientesHoy: Ver tareas pendientes del día
- consultarKPIs: Ver métricas del negocio
- consultarInstalaciones: Ver instalaciones programadas

Cuando el usuario pregunte sobre datos del sistema, usa las funciones disponibles.
Cuando pregunte sobre procesos, políticas o procedimientos, usa tu conocimiento base.

# REGLAS DE RESPUESTA

1. Sé conciso y directo
2. Usa formato Markdown cuando sea útil
3. Si no tienes información, dilo claramente
4. Nunca inventes datos del sistema
5. Siempre ofrece ayuda adicional al final

# BASE DE CONOCIMIENTO (Documentos Oficiales Sundeck)

${conocimientoBase.substring(0, 50000)}
`;

// Definición de funciones para OpenAI
const FUNCIONES_DISPONIBLES = [
  {
    type: 'function',
    function: {
      name: 'consultarProyectos',
      description: 'Consulta proyectos del CRM. Puede filtrar por estado, cliente o fecha.',
      parameters: {
        type: 'object',
        properties: {
          estado: {
            type: 'string',
            description: 'Estado del proyecto: prospecto, levantamiento, cotizacion, negociacion, pedido, produccion, instalacion, completado, cancelado'
          },
          cliente: {
            type: 'string',
            description: 'Nombre del cliente a buscar'
          },
          limite: {
            type: 'number',
            description: 'Cantidad máxima de resultados (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultarProspectos',
      description: 'Consulta prospectos/clientes potenciales del CRM.',
      parameters: {
        type: 'object',
        properties: {
          etapa: {
            type: 'string',
            description: 'Etapa del prospecto: nuevo, contactado, interesado, cotizado, cerrado, perdido'
          },
          limite: {
            type: 'number',
            description: 'Cantidad máxima de resultados (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultarPendientesHoy',
      description: 'Obtiene las tareas y pendientes del día actual.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultarKPIs',
      description: 'Obtiene métricas y KPIs del negocio.',
      parameters: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Periodo: hoy, semana, mes, año'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consultarInstalaciones',
      description: 'Consulta instalaciones programadas.',
      parameters: {
        type: 'object',
        properties: {
          estado: {
            type: 'string',
            description: 'Estado: pendiente, programada, en_proceso, completada'
          },
          fecha: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analizarLevantamiento',
      description: 'Analiza un levantamiento técnico de un proyecto para detectar errores, datos faltantes y dar sugerencias. Usar cuando el usuario pida revisar o validar un levantamiento.',
      parameters: {
        type: 'object',
        properties: {
          proyectoId: {
            type: 'string',
            description: 'ID del proyecto a analizar'
          },
          numeroProyecto: {
            type: 'string',
            description: 'Número del proyecto (ej: PRY-2024-0001)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'validarCotizacion',
      description: 'Valida una cotización antes de enviarla al cliente. Revisa precios, márgenes y completitud.',
      parameters: {
        type: 'object',
        properties: {
          proyectoId: {
            type: 'string',
            description: 'ID del proyecto con la cotización'
          }
        }
      }
    }
  }
];

// Implementación de funciones
async function consultarProyectos({ estado, cliente, limite = 10 }) {
  try {
    const query = {};
    
    if (estado) {
      query.estado = estado;
    }
    
    if (cliente) {
      query.$or = [
        { 'cliente.nombre': { $regex: cliente, $options: 'i' } },
        { 'prospecto.nombre': { $regex: cliente, $options: 'i' } }
      ];
    }
    
    const proyectos = await Proyecto.find(query)
      .sort({ updatedAt: -1 })
      .limit(limite)
      .select('numero cliente estado total fechaCreacion updatedAt')
      .lean();
    
    return {
      total: proyectos.length,
      proyectos: proyectos.map(p => ({
        numero: p.numero,
        cliente: p.cliente?.nombre || 'Sin nombre',
        estado: p.estado,
        total: p.total || 0,
        ultimaActualizacion: p.updatedAt
      }))
    };
  } catch (error) {
    logger.error('Error consultando proyectos', { error: error.message });
    return { error: 'Error al consultar proyectos' };
  }
}

async function consultarProspectos({ etapa, limite = 10 }) {
  try {
    const query = {};
    
    if (etapa) {
      query.etapa = etapa;
    }
    
    const prospectos = await Prospecto.find(query)
      .sort({ createdAt: -1 })
      .limit(limite)
      .select('nombre telefono etapa fuente createdAt')
      .lean();
    
    return {
      total: prospectos.length,
      prospectos: prospectos.map(p => ({
        nombre: p.nombre,
        telefono: p.telefono,
        etapa: p.etapa,
        fuente: p.fuente,
        fechaCreacion: p.createdAt
      }))
    };
  } catch (error) {
    logger.error('Error consultando prospectos', { error: error.message });
    return { error: 'Error al consultar prospectos' };
  }
}

async function consultarPendientesHoy() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    // Proyectos que necesitan seguimiento
    const proyectosPendientes = await Proyecto.find({
      estado: { $in: ['cotizacion', 'negociacion', 'levantamiento'] },
      updatedAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // Sin actualizar hace 3+ días
    }).limit(5).select('numero cliente estado updatedAt').lean();
    
    // Instalaciones de hoy
    const instalacionesHoy = await Instalacion.find({
      fecha: { $gte: hoy, $lt: manana }
    }).select('proyecto fecha estado').populate('proyecto', 'numero cliente').lean();
    
    // Cotizaciones pendientes de seguimiento
    const cotizacionesPendientes = await Cotizacion.find({
      estado: 'enviada',
      fechaEnvio: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    }).limit(5).select('numero total fechaEnvio').lean();
    
    return {
      fecha: hoy.toLocaleDateString('es-MX'),
      pendientes: {
        proyectosSinSeguimiento: proyectosPendientes.length,
        instalacionesHoy: instalacionesHoy.length,
        cotizacionesPorDarSeguimiento: cotizacionesPendientes.length
      },
      detalle: {
        proyectos: proyectosPendientes.map(p => ({
          numero: p.numero,
          cliente: p.cliente?.nombre,
          estado: p.estado,
          diasSinActualizar: Math.floor((Date.now() - new Date(p.updatedAt)) / (1000 * 60 * 60 * 24))
        })),
        instalaciones: instalacionesHoy.map(i => ({
          proyecto: i.proyecto?.numero,
          cliente: i.proyecto?.cliente?.nombre,
          estado: i.estado
        })),
        cotizaciones: cotizacionesPendientes.map(c => ({
          numero: c.numero,
          total: c.total,
          diasDesdeEnvio: Math.floor((Date.now() - new Date(c.fechaEnvio)) / (1000 * 60 * 60 * 24))
        }))
      }
    };
  } catch (error) {
    logger.error('Error consultando pendientes', { error: error.message });
    return { error: 'Error al consultar pendientes' };
  }
}

async function consultarKPIs({ periodo = 'mes' }) {
  try {
    const ahora = new Date();
    let fechaInicio;
    
    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
        break;
      case 'año':
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default: // mes
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }
    
    const [
      totalProyectos,
      proyectosCompletados,
      totalProspectos,
      totalCotizaciones
    ] = await Promise.all([
      Proyecto.countDocuments({ createdAt: { $gte: fechaInicio } }),
      Proyecto.countDocuments({ estado: 'completado', updatedAt: { $gte: fechaInicio } }),
      Prospecto.countDocuments({ createdAt: { $gte: fechaInicio } }),
      Cotizacion.countDocuments({ createdAt: { $gte: fechaInicio } })
    ]);
    
    // Calcular ventas del periodo
    const ventasPeriodo = await Proyecto.aggregate([
      { $match: { estado: 'completado', updatedAt: { $gte: fechaInicio } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    return {
      periodo,
      fechaInicio: fechaInicio.toLocaleDateString('es-MX'),
      metricas: {
        proyectosNuevos: totalProyectos,
        proyectosCompletados,
        prospectosNuevos: totalProspectos,
        cotizacionesGeneradas: totalCotizaciones,
        ventasTotales: ventasPeriodo[0]?.total || 0,
        tasaConversion: totalProspectos > 0 
          ? ((proyectosCompletados / totalProspectos) * 100).toFixed(1) + '%'
          : '0%'
      }
    };
  } catch (error) {
    logger.error('Error consultando KPIs', { error: error.message });
    return { error: 'Error al consultar KPIs' };
  }
}

async function consultarInstalaciones({ estado, fecha }) {
  try {
    const query = {};
    
    if (estado) {
      query.estado = estado;
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 1);
      query.fecha = { $gte: fechaInicio, $lt: fechaFin };
    }
    
    const instalaciones = await Instalacion.find(query)
      .sort({ fecha: 1 })
      .limit(10)
      .populate('proyecto', 'numero cliente')
      .lean();
    
    return {
      total: instalaciones.length,
      instalaciones: instalaciones.map(i => ({
        proyecto: i.proyecto?.numero,
        cliente: i.proyecto?.cliente?.nombre,
        fecha: i.fecha,
        estado: i.estado,
        direccion: i.direccion
      }))
    };
  } catch (error) {
    logger.error('Error consultando instalaciones', { error: error.message });
    return { error: 'Error al consultar instalaciones' };
  }
}

/**
 * ANÁLISIS INTELIGENTE DE LEVANTAMIENTO
 * Detecta errores, datos faltantes y da sugerencias
 */
async function analizarLevantamiento({ proyectoId, numeroProyecto }) {
  try {
    // Buscar proyecto por ID o número
    let proyecto;
    if (proyectoId) {
      proyecto = await Proyecto.findById(proyectoId).lean();
    } else if (numeroProyecto) {
      proyecto = await Proyecto.findOne({ numero: numeroProyecto }).lean();
    }
    
    if (!proyecto) {
      return { error: 'Proyecto no encontrado' };
    }
    
    const analisis = {
      proyecto: {
        numero: proyecto.numero,
        cliente: proyecto.cliente?.nombre,
        estado: proyecto.estado
      },
      completo: true,
      errores: [],
      advertencias: [],
      sugerencias: [],
      resumen: {
        totalPartidas: 0,
        totalPiezas: 0,
        totalM2: 0,
        productosUsados: []
      }
    };
    
    // Obtener partidas del levantamiento
    const partidas = proyecto.levantamiento?.partidas || proyecto.medidas || [];
    
    if (!partidas || partidas.length === 0) {
      analisis.completo = false;
      analisis.errores.push('❌ El levantamiento no tiene partidas/medidas registradas');
      return analisis;
    }
    
    analisis.resumen.totalPartidas = partidas.length;
    const productosSet = new Set();
    
    // Analizar cada partida
    for (let i = 0; i < partidas.length; i++) {
      const partida = partidas[i];
      const ubicacion = partida.ubicacion || partida.area || `Partida ${i + 1}`;
      const piezas = partida.piezas || [partida]; // Si no hay piezas, la partida es la pieza
      
      // Validar producto
      if (!partida.producto) {
        analisis.completo = false;
        analisis.errores.push(`❌ ${ubicacion}: Falta especificar el producto`);
      } else {
        productosSet.add(partida.producto);
      }
      
      // Analizar cada pieza
      for (let j = 0; j < piezas.length; j++) {
        const pieza = piezas[j];
        const piezaRef = piezas.length > 1 ? `${ubicacion} (pieza ${j + 1})` : ubicacion;
        
        analisis.resumen.totalPiezas++;
        
        // Validar medidas
        const ancho = pieza.ancho || pieza.width || 0;
        const alto = pieza.alto || pieza.height || 0;
        
        if (!ancho || ancho <= 0) {
          analisis.completo = false;
          analisis.errores.push(`❌ ${piezaRef}: Falta el ancho`);
        } else if (ancho < 0.3) {
          analisis.advertencias.push(`⚠️ ${piezaRef}: Ancho muy pequeño (${ancho}m) - verificar medida`);
        } else if (ancho > 4.0) {
          analisis.advertencias.push(`⚠️ ${piezaRef}: Ancho muy grande (${ancho}m) - puede requerir división`);
        }
        
        if (!alto || alto <= 0) {
          analisis.completo = false;
          analisis.errores.push(`❌ ${piezaRef}: Falta el alto`);
        } else if (alto > 4.0) {
          analisis.advertencias.push(`⚠️ ${piezaRef}: Alto muy grande (${alto}m) - verificar factibilidad`);
        }
        
        // Calcular m2
        if (ancho > 0 && alto > 0) {
          analisis.resumen.totalM2 += ancho * alto;
        }
        
        // Validar color
        if (!pieza.color && !partida.color) {
          analisis.advertencias.push(`⚠️ ${piezaRef}: Falta especificar el color`);
        }
        
        // Validar tipo de instalación
        if (!pieza.instalacion && !pieza.fijacion) {
          analisis.sugerencias.push(`💡 ${piezaRef}: Especificar tipo de instalación (muro/techo)`);
        }
        
        // Validar sistema/control
        if (!pieza.sistema && !pieza.control && !pieza.operacion) {
          analisis.sugerencias.push(`💡 ${piezaRef}: Especificar sistema de operación (cadena/motor/manual)`);
        }
        
        // Validar motorización
        const esMotorizado = pieza.sistema?.toLowerCase().includes('motor') || 
                            pieza.operacion?.toLowerCase().includes('motor') ||
                            partida.motorizacion?.activa;
        
        if (esMotorizado) {
          if (!partida.motorizacion?.modeloMotor && !pieza.tipoMando) {
            analisis.completo = false;
            analisis.errores.push(`❌ ${piezaRef}: Motorizado pero falta modelo de motor`);
            
            // Sugerir motor basado en ancho
            if (ancho > 0) {
              const motorSugerido = ancho <= 2.0 ? 'Somfy 15Nm' : 
                                   ancho <= 3.0 ? 'Somfy 25Nm' : 'Somfy 40Nm';
              analisis.sugerencias.push(`💡 ${piezaRef}: Para ${ancho}m de ancho, se recomienda ${motorSugerido}`);
            }
          }
          
          if (!pieza.tipoMando && !partida.motorizacion?.tipoControl) {
            analisis.advertencias.push(`⚠️ ${piezaRef}: Falta tipo de control (Monocanal/Multicanal/App)`);
          }
        }
        
        // Validar ancho de tela para enrollables
        const producto = (partida.producto || '').toLowerCase();
        if ((producto.includes('screen') || producto.includes('blackout') || producto.includes('enrollable')) && ancho > 2.5) {
          if (!pieza.anchoTela && !pieza.rotadaForzada) {
            analisis.advertencias.push(`⚠️ ${piezaRef}: Ancho ${ancho}m - verificar si requiere tela rotada o ancho especial`);
          }
        }
        
        // Validar galería compartida
        if (pieza.galeriaCompartida && !pieza.grupoGaleria) {
          analisis.advertencias.push(`⚠️ ${piezaRef}: Galería compartida sin grupo asignado`);
        }
      }
    }
    
    analisis.resumen.productosUsados = Array.from(productosSet);
    analisis.resumen.totalM2 = Math.round(analisis.resumen.totalM2 * 100) / 100;
    
    // Agregar sugerencias generales
    if (analisis.resumen.totalM2 > 50) {
      analisis.sugerencias.push(`💡 Proyecto grande (${analisis.resumen.totalM2}m²) - considerar descuento por volumen`);
    }
    
    if (!proyecto.cliente?.direccion?.calle && !proyecto.cliente?.direccion?.linkUbicacion) {
      analisis.advertencias.push('⚠️ Falta dirección completa del cliente para instalación');
    }
    
    // Determinar estado final
    if (analisis.errores.length === 0 && analisis.advertencias.length === 0) {
      analisis.mensaje = '✅ Levantamiento completo y sin errores. Listo para cotizar.';
    } else if (analisis.errores.length === 0) {
      analisis.mensaje = `⚠️ Levantamiento con ${analisis.advertencias.length} advertencia(s). Revisar antes de cotizar.`;
    } else {
      analisis.mensaje = `❌ Levantamiento incompleto. ${analisis.errores.length} error(es) que corregir.`;
    }
    
    return analisis;
    
  } catch (error) {
    logger.error('Error analizando levantamiento', { error: error.message });
    return { error: 'Error al analizar levantamiento: ' + error.message };
  }
}

/**
 * VALIDACIÓN DE COTIZACIÓN
 * Revisa precios, márgenes y completitud antes de enviar
 */
async function validarCotizacion({ proyectoId }) {
  try {
    const proyecto = await Proyecto.findById(proyectoId)
      .populate('cotizacionActual.cotizacion')
      .lean();
    
    if (!proyecto) {
      return { error: 'Proyecto no encontrado' };
    }
    
    const cotizacion = proyecto.cotizacionActual?.cotizacion || proyecto;
    
    const validacion = {
      proyecto: {
        numero: proyecto.numero,
        cliente: proyecto.cliente?.nombre,
        total: proyecto.total || cotizacion.total || 0
      },
      valida: true,
      errores: [],
      advertencias: [],
      sugerencias: [],
      analisisPrecios: {
        subtotal: 0,
        descuento: 0,
        iva: 0,
        total: 0,
        margenEstimado: 0
      }
    };
    
    const partidas = proyecto.levantamiento?.partidas || proyecto.medidas || [];
    
    if (partidas.length === 0) {
      validacion.valida = false;
      validacion.errores.push('❌ No hay partidas en la cotización');
      return validacion;
    }
    
    let subtotal = 0;
    let costoEstimado = 0;
    
    for (const partida of partidas) {
      const piezas = partida.piezas || [partida];
      
      for (const pieza of piezas) {
        const ancho = pieza.ancho || 0;
        const alto = pieza.alto || 0;
        const m2 = ancho * alto;
        const precioM2 = pieza.precioM2 || partida.precioM2 || 0;
        
        if (precioM2 <= 0) {
          validacion.advertencias.push(`⚠️ ${partida.ubicacion || 'Partida'}: Sin precio por m²`);
        } else {
          subtotal += m2 * precioM2;
          // Estimar costo (40% del precio como referencia)
          costoEstimado += m2 * precioM2 * 0.4;
        }
        
        // Validar precios muy bajos
        if (precioM2 > 0 && precioM2 < 500) {
          validacion.advertencias.push(`⚠️ ${partida.ubicacion || 'Partida'}: Precio muy bajo ($${precioM2}/m²)`);
        }
      }
      
      // Agregar motorización
      if (partida.motorizacion?.activa) {
        const costoMotor = partida.motorizacion.precioMotor || 0;
        const costoControl = partida.motorizacion.precioControl || 0;
        subtotal += costoMotor + costoControl;
        costoEstimado += (costoMotor + costoControl) * 0.6;
      }
    }
    
    // Calcular totales
    const descuentoPct = proyecto.descuento || cotizacion.descuento || 0;
    const descuento = subtotal * (descuentoPct / 100);
    const subtotalConDescuento = subtotal - descuento;
    const iva = subtotalConDescuento * 0.16;
    const total = subtotalConDescuento + iva;
    
    validacion.analisisPrecios = {
      subtotal: Math.round(subtotal),
      descuento: Math.round(descuento),
      descuentoPct,
      iva: Math.round(iva),
      total: Math.round(total),
      margenEstimado: subtotal > 0 ? Math.round(((subtotal - costoEstimado) / subtotal) * 100) : 0
    };
    
    // Validar margen
    if (validacion.analisisPrecios.margenEstimado < 30) {
      validacion.advertencias.push(`⚠️ Margen estimado bajo (${validacion.analisisPrecios.margenEstimado}%) - revisar precios`);
    }
    
    // Validar descuento excesivo
    if (descuentoPct > 15) {
      validacion.advertencias.push(`⚠️ Descuento alto (${descuentoPct}%) - requiere autorización`);
    }
    
    // Validar datos del cliente
    if (!proyecto.cliente?.telefono) {
      validacion.errores.push('❌ Falta teléfono del cliente');
      validacion.valida = false;
    }
    
    if (!proyecto.cliente?.correo) {
      validacion.sugerencias.push('💡 Agregar correo del cliente para envío de cotización');
    }
    
    // Mensaje final
    if (validacion.errores.length === 0 && validacion.advertencias.length === 0) {
      validacion.mensaje = `✅ Cotización válida. Total: $${validacion.analisisPrecios.total.toLocaleString()} MXN`;
    } else if (validacion.errores.length === 0) {
      validacion.mensaje = `⚠️ Cotización con ${validacion.advertencias.length} advertencia(s). Total: $${validacion.analisisPrecios.total.toLocaleString()} MXN`;
    } else {
      validacion.mensaje = `❌ Cotización con errores. Corregir antes de enviar.`;
    }
    
    return validacion;
    
  } catch (error) {
    logger.error('Error validando cotización', { error: error.message });
    return { error: 'Error al validar cotización: ' + error.message };
  }
}

// Mapa de funciones
const FUNCIONES_MAP = {
  consultarProyectos,
  consultarProspectos,
  consultarPendientesHoy,
  consultarKPIs,
  consultarInstalaciones,
  analizarLevantamiento,
  validarCotizacion
};

/**
 * Procesa un mensaje del usuario y genera respuesta
 * @param {string} mensaje - Mensaje del usuario
 * @param {Array} historial - Historial de conversación
 * @param {Object} contexto - Contexto adicional (usuario, rol, etc.)
 * @returns {Promise<Object>} - Respuesta del agente
 */
async function procesarMensaje(mensaje, historial = [], contexto = {}) {
  const startTime = Date.now();
  
  try {
    logger.info('Procesando mensaje del asistente', {
      service: 'asistenteService',
      mensajeLength: mensaje.length,
      historialLength: historial.length,
      usuario: contexto.usuario
    });
    
    // Construir mensajes para OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historial.slice(-10), // Últimos 10 mensajes del historial
      { role: 'user', content: mensaje }
    ];
    
    // Primera llamada a OpenAI
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: FUNCIONES_DISPONIBLES,
      tool_choice: 'auto',
      max_tokens: 1000,
      temperature: 0.7
    });
    
    let respuestaFinal = response.choices[0].message;
    
    // Si hay llamadas a funciones, ejecutarlas
    if (respuestaFinal.tool_calls && respuestaFinal.tool_calls.length > 0) {
      const toolMessages = [respuestaFinal];
      
      for (const toolCall of respuestaFinal.tool_calls) {
        const funcionNombre = toolCall.function.name;
        const funcionArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        logger.info('Ejecutando función del asistente', {
          service: 'asistenteService',
          funcion: funcionNombre,
          args: funcionArgs
        });
        
        // Ejecutar función
        const funcionImpl = FUNCIONES_MAP[funcionNombre];
        let resultado;
        
        if (funcionImpl) {
          resultado = await funcionImpl(funcionArgs);
        } else {
          resultado = { error: `Función ${funcionNombre} no implementada` };
        }
        
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultado)
        });
      }
      
      // Segunda llamada con resultados de funciones
      const responseConDatos = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...messages, ...toolMessages],
        max_tokens: 1000,
        temperature: 0.7
      });
      
      respuestaFinal = responseConDatos.choices[0].message;
    }
    
    const tiempoRespuesta = Date.now() - startTime;
    
    logger.info('Respuesta del asistente generada', {
      service: 'asistenteService',
      tiempoMs: tiempoRespuesta,
      tokensUsados: response.usage?.total_tokens
    });
    
    return {
      success: true,
      respuesta: respuestaFinal.content,
      tiempoMs: tiempoRespuesta,
      tokensUsados: response.usage?.total_tokens
    };
    
  } catch (error) {
    logger.error('Error procesando mensaje del asistente', {
      service: 'asistenteService',
      error: error.message,
      stack: error.stack
    });
    
    // Respuesta de fallback
    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        respuesta: 'El servicio de IA no está disponible en este momento (cuota excedida). Por favor, contacta a Dirección.',
        error: 'QUOTA_EXCEEDED'
      };
    }
    
    return {
      success: false,
      respuesta: 'Hubo un error procesando tu mensaje. Por favor, intenta de nuevo.',
      error: error.message
    };
  }
}

/**
 * Genera un mensaje rápido sin historial (para sugerencias)
 */
async function generarSugerencia(tipo, datos) {
  try {
    const prompts = {
      seguimiento: `Genera un mensaje corto y profesional de seguimiento para el cliente ${datos.nombre} sobre su cotización de ${datos.producto}. Máximo 3 líneas.`,
      confirmacion: `Genera un mensaje de confirmación de instalación para ${datos.nombre}, fecha ${datos.fecha}, dirección ${datos.direccion}. Máximo 4 líneas.`,
      cobranza: `Genera un mensaje amable de recordatorio de pago para ${datos.nombre}, monto $${datos.monto}. Máximo 3 líneas.`
    };
    
    const prompt = prompts[tipo];
    if (!prompt) {
      return { success: false, error: 'Tipo de sugerencia no válido' };
    }
    
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un asistente de Sundeck Persianas. Genera mensajes profesionales y amables para WhatsApp.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    return {
      success: true,
      mensaje: response.choices[0].message.content
    };
    
  } catch (error) {
    logger.error('Error generando sugerencia', { error: error.message });
    return { success: false, error: error.message };
  }
}

module.exports = {
  procesarMensaje,
  generarSugerencia,
  // Exportar funciones individuales para testing y uso directo
  consultarProyectos,
  consultarProspectos,
  consultarPendientesHoy,
  consultarKPIs,
  consultarInstalaciones,
  // Análisis inteligentes
  analizarLevantamiento,
  validarCotizacion
};
