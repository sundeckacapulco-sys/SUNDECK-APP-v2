const Proyecto = require('../models/Proyecto');
const sincronizacionService = require('../services/sincronizacionService');

/**
 * Middleware para sincronización automática Prospecto → Proyecto
 * Se ejecuta después de guardar/actualizar un Prospecto
 */
class ProyectoSyncMiddleware {
  
  /**
   * Crear o actualizar Proyecto desde Prospecto
   */
  static async sincronizarProspecto(prospecto, operacion = 'create') {
    try {
      console.log(`🔄 Sincronizando prospecto ${prospecto._id} → Proyecto (${operacion})`);

      // Buscar si ya existe un proyecto para este prospecto
      let proyecto = await Proyecto.findOne({ prospecto_original: prospecto._id });

      if (!proyecto && operacion === 'create') {
        // Crear nuevo proyecto
        proyecto = await this.crearProyectoDesdeProspecto(prospecto);
      } else if (proyecto && operacion === 'update') {
        // Actualizar proyecto existente
        proyecto = await this.actualizarProyectoDesdeProspecto(proyecto, prospecto);
      }

      return proyecto;

    } catch (error) {
      console.error('❌ Error en sincronización Prospecto → Proyecto:', error);
      // No lanzar error para no interrumpir el flujo principal
      return null;
    }
  }

  /**
   * Crear nuevo Proyecto desde Prospecto
   */
  static async crearProyectoDesdeProspecto(prospecto) {
    try {
      console.log(`📋 Creando nuevo proyecto desde prospecto ${prospecto._id}`);

      // Determinar tipo de fuente
      const tipo_fuente = this.determinarTipoFuente(prospecto);

      // Crear el proyecto
      const nuevoProyecto = new Proyecto({
        cliente: {
          nombre: prospecto.nombre,
          telefono: prospecto.telefono,
          correo: prospecto.email,
          direccion: this.formatearDireccion(prospecto.direccion),
          zona: prospecto.direccion?.colonia || ''
        },
        tipo_fuente,
        estado: this.mapearEtapaAEstado(prospecto.etapa),
        observaciones: prospecto.descripcionNecesidad || '',
        medidas: [], // Se llenarán desde las etapas
        materiales: [],
        productos: [],
        fotos: prospecto.archivos?.map(arch => arch.url) || [],
        responsable: prospecto.vendedorAsignado?.toString() || '',
        monto_estimado: prospecto.presupuestoEstimado || 0,
        prospecto_original: prospecto._id,
        fecha_compromiso: prospecto.fechaCita,
        
        // Campos adicionales del sistema actual
        creado_por: prospecto.vendedorAsignado,
        asesor_asignado: prospecto.vendedorAsignado,
        requiere_factura: false,
        metodo_pago_anticipo: 'transferencia'
      });

      await nuevoProyecto.save();
      console.log(`✅ Proyecto ${nuevoProyecto._id} creado exitosamente`);

      return nuevoProyecto;

    } catch (error) {
      console.error('❌ Error creando proyecto desde prospecto:', error);
      throw error;
    }
  }

  /**
   * Actualizar Proyecto existente desde Prospecto
   */
  static async actualizarProyectoDesdeProspecto(proyecto, prospecto) {
    try {
      console.log(`🔄 Actualizando proyecto ${proyecto._id} desde prospecto ${prospecto._id}`);

      // Actualizar campos básicos
      proyecto.cliente.nombre = prospecto.nombre;
      proyecto.cliente.telefono = prospecto.telefono;
      proyecto.cliente.correo = prospecto.email;
      proyecto.cliente.direccion = this.formatearDireccion(prospecto.direccion);
      proyecto.cliente.zona = prospecto.direccion?.colonia || '';
      
      proyecto.estado = this.mapearEtapaAEstado(prospecto.etapa);
      proyecto.observaciones = prospecto.descripcionNecesidad || '';
      proyecto.monto_estimado = prospecto.presupuestoEstimado || 0;
      proyecto.fecha_compromiso = prospecto.fechaCita;
      proyecto.fecha_actualizacion = new Date();

      await proyecto.save();
      console.log(`✅ Proyecto ${proyecto._id} actualizado exitosamente`);

      return proyecto;

    } catch (error) {
      console.error('❌ Error actualizando proyecto:', error);
      throw error;
    }
  }

  /**
   * Sincronizar medidas desde Etapas al Proyecto
   */
  static async sincronizarMedidasDesdeEtapas(proyectoId, prospectoId) {
    try {
      const Etapa = require('../models/Etapa');
      
      // Obtener todas las etapas del prospecto
      const etapas = await Etapa.find({ prospectoId }).sort({ creadoEn: 1 });
      
      if (etapas.length === 0) return;

      // Extraer todas las medidas de todas las etapas
      const medidasUnificadas = [];
      
      etapas.forEach(etapa => {
        if (etapa.piezas && etapa.piezas.length > 0) {
          etapa.piezas.forEach(pieza => {
            if (pieza.medidas && pieza.medidas.length > 0) {
              // Medidas individuales
              pieza.medidas.forEach(medida => {
                medidasUnificadas.push({
                  ubicacion: pieza.ubicacion,
                  ancho: medida.ancho,
                  alto: medida.alto,
                  cantidad: 1,
                  producto: pieza.producto || pieza.productoLabel,
                  color: pieza.color,
                  observaciones: pieza.observaciones,
                  
                  // Campos técnicos
                  tipoControl: pieza.tipoControl,
                  orientacion: pieza.orientacion,
                  tipoInstalacion: pieza.tipoInstalacion,
                  eliminacion: pieza.eliminacion,
                  risoAlto: pieza.risoAlto,
                  risoBajo: pieza.risoBajo,
                  sistema: pieza.sistema,
                  telaMarca: pieza.telaMarca,
                  baseTabla: pieza.baseTabla,
                  
                  // Información de toldos
                  esToldo: pieza.esToldo,
                  tipoToldo: pieza.tipoToldo,
                  kitModelo: pieza.kitModelo,
                  kitPrecio: pieza.kitPrecio,
                  
                  // Información de motorización
                  motorizado: pieza.motorizado,
                  motorModelo: pieza.motorModelo,
                  motorPrecio: pieza.motorPrecio,
                  controlModelo: pieza.controlModelo,
                  controlPrecio: pieza.controlPrecio,
                  
                  // Fotos
                  fotoUrls: pieza.fotoUrls || []
                });
              });
            } else {
              // Medida única
              medidasUnificadas.push({
                ubicacion: pieza.ubicacion,
                ancho: pieza.ancho,
                alto: pieza.alto,
                cantidad: pieza.cantidad || 1,
                producto: pieza.producto || pieza.productoLabel,
                color: pieza.color,
                observaciones: pieza.observaciones,
                
                // Campos técnicos
                tipoControl: pieza.tipoControl,
                orientacion: pieza.orientacion,
                tipoInstalacion: pieza.tipoInstalacion,
                eliminacion: pieza.eliminacion,
                risoAlto: pieza.risoAlto,
                risoBajo: pieza.risoBajo,
                sistema: pieza.sistema,
                telaMarca: pieza.telaMarca,
                baseTabla: pieza.baseTabla,
                
                // Información de toldos
                esToldo: pieza.esToldo,
                tipoToldo: pieza.tipoToldo,
                kitModelo: pieza.kitModelo,
                kitPrecio: pieza.kitPrecio,
                
                // Información de motorización
                motorizado: pieza.motorizado,
                motorModelo: pieza.motorModelo,
                motorPrecio: pieza.motorPrecio,
                controlModelo: pieza.controlModelo,
                controlPrecio: pieza.controlPrecio,
                
                // Fotos
                fotoUrls: pieza.fotoUrls || []
              });
            }
          });
        }
      });

      // Actualizar proyecto con las medidas unificadas
      await Proyecto.findByIdAndUpdate(proyectoId, {
        medidas: medidasUnificadas,
        fecha_actualizacion: new Date()
      });

      console.log(`✅ Sincronizadas ${medidasUnificadas.length} medidas al proyecto ${proyectoId}`);

    } catch (error) {
      console.error('❌ Error sincronizando medidas:', error);
    }
  }

  /**
   * Ejecutar triggers de sincronización automática
   */
  static async ejecutarTriggers(proyecto, estadoAnterior, nuevoEstado, usuarioId) {
    try {
      await sincronizacionService.ejecutarTriggersEstado(
        proyecto, 
        estadoAnterior, 
        nuevoEstado, 
        usuarioId
      );
    } catch (error) {
      console.error('❌ Error ejecutando triggers:', error);
    }
  }

  // Funciones auxiliares

  static determinarTipoFuente(prospecto) {
    if (prospecto.fuente === 'cotizacion_directa') return 'directo';
    if (prospecto.tipoProducto === 'cotizacion') return 'en_vivo';
    if (prospecto.tipoProducto === 'toma_medidas') return 'formal';
    return 'simple';
  }

  static mapearEtapaAEstado(etapaProspecto) {
    const mapeo = {
      'nuevo': 'levantamiento',
      'contactado': 'levantamiento',
      'cita_agendada': 'levantamiento',
      'cotizacion': 'cotizacion',
      'venta_cerrada': 'aprobado',
      'pedido': 'aprobado',
      'fabricacion': 'fabricacion',
      'instalacion': 'instalacion',
      'entregado': 'completado',
      'postventa': 'completado',
      'perdido': 'cancelado'
    };
    
    return mapeo[etapaProspecto] || 'levantamiento';
  }

  static formatearDireccion(direccion) {
    if (!direccion) return '';
    
    const partes = [
      direccion.calle,
      direccion.colonia,
      direccion.ciudad,
      direccion.codigoPostal
    ].filter(Boolean);
    
    return partes.join(', ');
  }
}

module.exports = ProyectoSyncMiddleware;
