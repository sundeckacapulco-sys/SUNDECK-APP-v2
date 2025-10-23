const mongoose = require('mongoose');
const Prospecto = require('../models/Prospecto');
const Etapa = require('../models/Etapa');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const ProyectoPedido = require('../models/ProyectoPedido');
require('dotenv').config();

/**
 * Script de migración completa del sistema tradicional al sistema unificado
 * 
 * FLUJO DE MIGRACIÓN:
 * 1. Prospectos → Información del cliente
 * 2. Etapas → Levantamientos y medidas técnicas
 * 3. Cotizaciones → Precios y cálculos
 * 4. Pedidos → Confirmaciones y pagos
 * 
 * RESULTADO: ProyectoPedido unificado con toda la información
 */

class MigradorProyectos {
  constructor() {
    this.estadisticas = {
      prospectos: 0,
      etapas: 0,
      cotizaciones: 0,
      pedidos: 0,
      proyectosCreados: 0,
      errores: []
    };
  }

  async conectarDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
      console.log('✅ Conectado a MongoDB');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      process.exit(1);
    }
  }

  async migrarTodo() {
    console.log('🚀 INICIANDO MIGRACIÓN COMPLETA AL SISTEMA UNIFICADO');
    console.log('=' .repeat(60));

    await this.conectarDB();

    // Obtener todos los prospectos con sus relaciones
    const prospectos = await Prospecto.find({}).lean();
    console.log(`📋 Encontrados ${prospectos.length} prospectos`);

    for (const prospecto of prospectos) {
      try {
        await this.migrarProspecto(prospecto);
        this.estadisticas.prospectos++;
      } catch (error) {
        console.error(`❌ Error migrando prospecto ${prospecto._id}:`, error.message);
        this.estadisticas.errores.push({
          tipo: 'prospecto',
          id: prospecto._id,
          error: error.message
        });
      }
    }

    await this.mostrarEstadisticas();
    await mongoose.disconnect();
  }

  async migrarProspecto(prospecto) {
    console.log(`\n🔄 Migrando prospecto: ${prospecto.nombre}`);

    // 1. Buscar etapas relacionadas
    const etapas = await Etapa.find({ prospectoId: prospecto._id }).lean();
    console.log(`  📝 Encontradas ${etapas.length} etapas`);

    // 2. Buscar cotizaciones relacionadas
    const cotizaciones = await Cotizacion.find({ prospecto: prospecto._id }).lean();
    console.log(`  💰 Encontradas ${cotizaciones.length} cotizaciones`);

    // 3. Buscar pedidos relacionados
    const pedidos = await Pedido.find({ prospecto: prospecto._id }).lean();
    console.log(`  📦 Encontrados ${pedidos.length} pedidos`);

    // 4. Determinar el estado del proyecto
    const estado = this.determinarEstado(etapas, cotizaciones, pedidos);

    // 5. Consolidar productos y medidas
    const productos = this.consolidarProductos(etapas, cotizaciones, pedidos);

    // 6. Consolidar información financiera
    const informacionFinanciera = this.consolidarFinanzas(cotizaciones, pedidos);

    // 7. Crear proyecto unificado
    const proyectoData = {
      // Referencias originales
      prospecto: prospecto._id,
      cotizacion: cotizaciones.length > 0 ? cotizaciones[0]._id : null,

      // Número único del proyecto
      numero: await this.generarNumeroProyecto(),

      // Información del cliente unificada
      cliente: {
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        email: prospecto.email,
        direccion: prospecto.direccion || {}
      },

      // Estado unificado
      estado: estado,

      // Productos y medidas consolidados
      productos: productos,

      // Información financiera
      ...informacionFinanciera,

      // Fechas importantes
      fechaCreacion: prospecto.fechaCreacion || new Date(),
      fechaActualizacion: new Date(),

      // Observaciones consolidadas
      observaciones: this.consolidarObservaciones(etapas, cotizaciones, pedidos),

      // Historial de cambios
      historial: this.crearHistorial(etapas, cotizaciones, pedidos),

      // Metadatos de migración
      migracion: {
        fechaMigracion: new Date(),
        origenProspecto: prospecto._id,
        origenEtapas: etapas.map(e => e._id),
        origenCotizaciones: cotizaciones.map(c => c._id),
        origenPedidos: pedidos.map(p => p._id)
      }
    };

    // Crear el proyecto unificado
    const proyecto = new ProyectoPedido(proyectoData);
    await proyecto.save();

    console.log(`  ✅ Proyecto creado: ${proyecto.numero}`);
    this.estadisticas.proyectosCreados++;

    return proyecto;
  }

  determinarEstado(etapas, cotizaciones, pedidos) {
    // Lógica para determinar el estado actual del proyecto
    if (pedidos.some(p => p.estado === 'completado')) return 'completado';
    if (pedidos.some(p => p.estado === 'en_instalacion')) return 'en_instalacion';
    if (pedidos.some(p => p.estado === 'fabricado')) return 'fabricado';
    if (pedidos.some(p => p.estado === 'en_fabricacion')) return 'en_fabricacion';
    if (pedidos.some(p => p.estado === 'confirmado')) return 'confirmado';
    if (cotizaciones.some(c => c.estado === 'aprobada')) return 'aprobado';
    if (cotizaciones.length > 0) return 'cotizacion';
    if (etapas.some(e => e.nombreEtapa === 'Levantamiento')) return 'levantamiento';
    return 'cotizado';
  }

  consolidarProductos(etapas, cotizaciones, pedidos) {
    const productos = [];

    // Priorizar información de pedidos (más actualizada)
    for (const pedido of pedidos) {
      if (pedido.productos && pedido.productos.length > 0) {
        productos.push(...pedido.productos.map(p => ({
          ...p,
          origen: 'pedido',
          origenId: pedido._id
        })));
      }
    }

    // Si no hay productos de pedidos, usar cotizaciones
    if (productos.length === 0) {
      for (const cotizacion of cotizaciones) {
        if (cotizacion.productos && cotizacion.productos.length > 0) {
          productos.push(...cotizacion.productos.map(p => ({
            ...p,
            origen: 'cotizacion',
            origenId: cotizacion._id
          })));
        }
      }
    }

    // Si no hay productos de cotizaciones, usar etapas
    if (productos.length === 0) {
      for (const etapa of etapas) {
        if (etapa.piezas && etapa.piezas.length > 0) {
          productos.push(...etapa.piezas.map(p => ({
            nombre: p.producto || 'Producto sin especificar',
            descripcion: p.ubicacion || '',
            medidas: {
              ancho: p.ancho || p.medidas?.[0]?.ancho || 0,
              alto: p.alto || p.medidas?.[0]?.alto || 0,
              area: (p.ancho || p.medidas?.[0]?.ancho || 0) * (p.alto || p.medidas?.[0]?.alto || 0)
            },
            cantidad: p.cantidad || 1,
            color: p.color || '',
            ubicacion: p.ubicacion || '',
            origen: 'etapa',
            origenId: etapa._id
          })));
        }
      }
    }

    return productos;
  }

  consolidarFinanzas(cotizaciones, pedidos) {
    // Priorizar información financiera de pedidos
    if (pedidos.length > 0) {
      const pedido = pedidos[pedidos.length - 1]; // Último pedido
      return {
        precios: {
          subtotal: pedido.subtotal || 0,
          descuento: pedido.descuento || 0,
          iva: pedido.iva || 0,
          total: pedido.total || 0
        },
        pagos: {
          anticipo: pedido.anticipo || 0,
          saldo: pedido.saldo || 0,
          metodoPago: pedido.metodoPago || 'efectivo'
        }
      };
    }

    // Si no hay pedidos, usar cotizaciones
    if (cotizaciones.length > 0) {
      const cotizacion = cotizaciones[cotizaciones.length - 1]; // Última cotización
      return {
        precios: {
          subtotal: cotizacion.subtotal || 0,
          descuento: cotizacion.descuento || 0,
          iva: cotizacion.iva || 0,
          total: cotizacion.total || 0
        },
        pagos: {
          anticipo: (cotizacion.total || 0) * 0.6, // 60% por defecto
          saldo: (cotizacion.total || 0) * 0.4,    // 40% por defecto
          metodoPago: 'por_definir'
        }
      };
    }

    return {
      precios: { subtotal: 0, descuento: 0, iva: 0, total: 0 },
      pagos: { anticipo: 0, saldo: 0, metodoPago: 'por_definir' }
    };
  }

  consolidarObservaciones(etapas, cotizaciones, pedidos) {
    const observaciones = [];

    etapas.forEach(e => {
      if (e.observacionesGenerales) {
        observaciones.push(`[Etapa ${e.nombreEtapa}] ${e.observacionesGenerales}`);
      }
    });

    cotizaciones.forEach(c => {
      if (c.observaciones) {
        observaciones.push(`[Cotización] ${c.observaciones}`);
      }
    });

    pedidos.forEach(p => {
      if (p.observaciones) {
        observaciones.push(`[Pedido] ${p.observaciones}`);
      }
    });

    return observaciones.join('\n\n');
  }

  crearHistorial(etapas, cotizaciones, pedidos) {
    const eventos = [];

    // Eventos de etapas
    etapas.forEach(e => {
      eventos.push({
        fecha: e.fechaEtapa || e.createdAt,
        tipo: 'etapa',
        descripcion: `${e.nombreEtapa} - ${e.tipoVisita || 'Visita'}`,
        datos: e
      });
    });

    // Eventos de cotizaciones
    cotizaciones.forEach(c => {
      eventos.push({
        fecha: c.fecha || c.createdAt,
        tipo: 'cotizacion',
        descripcion: `Cotización ${c.numero} - ${c.estado || 'Creada'}`,
        datos: c
      });
    });

    // Eventos de pedidos
    pedidos.forEach(p => {
      eventos.push({
        fecha: p.fechaPedido || p.createdAt,
        tipo: 'pedido',
        descripcion: `Pedido confirmado - ${p.estado || 'Activo'}`,
        datos: p
      });
    });

    // Ordenar por fecha
    return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  async generarNumeroProyecto() {
    const año = new Date().getFullYear();
    const ultimoProyecto = await ProyectoPedido.findOne({
      numero: new RegExp(`^PROY-${año}-`)
    }).sort({ numero: -1 });

    let siguienteNumero = 1;
    if (ultimoProyecto) {
      const match = ultimoProyecto.numero.match(/PROY-\d{4}-(\d+)/);
      if (match) {
        siguienteNumero = parseInt(match[1]) + 1;
      }
    }

    return `PROY-${año}-${siguienteNumero.toString().padStart(4, '0')}`;
  }

  async mostrarEstadisticas() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ESTADÍSTICAS DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Prospectos migrados: ${this.estadisticas.prospectos}`);
    console.log(`🎯 Proyectos creados: ${this.estadisticas.proyectosCreados}`);
    console.log(`❌ Errores: ${this.estadisticas.errores.length}`);

    if (this.estadisticas.errores.length > 0) {
      console.log('\n🚨 ERRORES ENCONTRADOS:');
      this.estadisticas.errores.forEach((error, index) => {
        console.log(`${index + 1}. [${error.tipo}] ${error.id}: ${error.error}`);
      });
    }

    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log('🎉 El sistema unificado está listo para usar');
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  const migrador = new MigradorProyectos();
  migrador.migrarTodo().catch(console.error);
}

module.exports = MigradorProyectos;
