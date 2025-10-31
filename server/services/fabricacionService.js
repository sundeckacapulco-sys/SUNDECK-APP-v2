const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

class FabricacionService {
  
  /**
   * Iniciar proceso de fabricación para un proyecto
   */
  static async iniciarFabricacion(proyectoId, datosIniciales = {}) {
    try {
      const proyecto = await Proyecto.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Verificar que el proyecto esté listo para iniciar fabricación
      if (!['aprobado', 'fabricacion'].includes(proyecto.estado)) {
        throw new Error('El proyecto debe estar aprobado para iniciar fabricación');
      }

      // Normalizar productos para cálculos posteriores
      const productosNormalizados = this.obtenerProductosNormalizados(proyecto);

      // Calcular materiales necesarios automáticamente
      const materialesCalculados = this.calcularMaterialesNecesarios(productosNormalizados);

      // Generar procesos de fabricación según tipo de productos
      const procesosGenerados = this.generarProcesosFabricacion(productosNormalizados);

      // Actualizar proyecto con información de fabricación
      proyecto.estado = 'fabricacion';
      proyecto.cronograma = proyecto.cronograma || {};
      proyecto.cronograma.fechaInicioFabricacion = new Date();
      proyecto.cronograma.fechaFinFabricacionEstimada = this.calcularFechaEstimada(productosNormalizados);
      
      proyecto.fabricacion = {
        estado: 'materiales_pedidos',
        asignadoA: datosIniciales.asignadoA,
        prioridad: datosIniciales.prioridad || 'media',
        materiales: materialesCalculados,
        procesos: procesosGenerados,
        controlCalidad: {
          realizado: false
        },
        empaque: {
          realizado: false
        },
        costos: {
          materiales: 0,
          manoObra: 0,
          overhead: 0,
          total: 0
        },
        progreso: 0
      };

      await proyecto.save();
      
      return {
        success: true,
        message: 'Fabricación iniciada exitosamente',
        proyecto
      };
    } catch (error) {
      logger.error('Error iniciando proceso de fabricación', {
        servicio: 'fabricacionService',
        accion: 'iniciarFabricacion',
        proyectoId: proyectoId?.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Actualizar progreso de fabricación
   */
  static async actualizarProgreso(proyectoId, datosProgreso) {
    try {
      const proyecto = await Proyecto.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const { procesoId, estado, tiempoReal, observaciones, evidenciasFotos } = datosProgreso;

      if (!proyecto.fabricacion || !Array.isArray(proyecto.fabricacion.procesos)) {
        throw new Error('El proyecto no tiene procesos de fabricación configurados');
      }

      // Encontrar el proceso específico
      const proceso = proyecto.fabricacion.procesos.id(procesoId);
      if (!proceso) {
        throw new Error('Proceso no encontrado');
      }

      // Actualizar proceso
      proceso.estado = estado;
      if (tiempoReal) proceso.tiempoReal = tiempoReal;
      if (observaciones) proceso.observaciones = observaciones;
      if (evidenciasFotos) proceso.evidenciasFotos.push(...evidenciasFotos);

      if (estado === 'completado' && !proceso.fechaFin) {
        proceso.fechaFin = new Date();
      }

      // Recalcular progreso general
      proyecto.fabricacion.progreso = this.calcularProgresoGeneral(proyecto.fabricacion.procesos);

      // Verificar si todos los procesos están completados
      const todosCompletados = proyecto.fabricacion.procesos.every(p => p.estado === 'completado');
      if (todosCompletados && proyecto.fabricacion.estado !== 'control_calidad') {
        proyecto.fabricacion.estado = 'control_calidad';
      }

      await proyecto.save();
      
      return {
        success: true,
        message: 'Progreso actualizado exitosamente',
        progreso: proyecto.fabricacion.progreso
      };
    } catch (error) {
      logger.error('Error actualizando progreso de fabricación', {
        servicio: 'fabricacionService',
        accion: 'actualizarProgreso',
        proyectoId: proyectoId?.toString(),
        procesoId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Realizar control de calidad
   */
  static async realizarControlCalidad(proyectoId, datosCalidad) {
    try {
      const proyecto = await Proyecto.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const { resultado, observaciones, defectos, evidenciasFotos, revisadoPor } = datosCalidad;

      proyecto.fabricacion.controlCalidad = {
        realizado: true,
        fechaRevision: new Date(),
        revisadoPor,
        resultado,
        observaciones,
        evidenciasFotos: evidenciasFotos || [],
        defectosEncontrados: defectos || []
      };

      // Actualizar estado según resultado
      if (resultado === 'aprobado') {
        proyecto.fabricacion.estado = 'terminado';
        proyecto.cronograma.fechaFinFabricacionReal = new Date();
        proyecto.fabricacion.progreso = 100;
      } else if (resultado === 'rechazado' || resultado === 'requiere_ajustes') {
        proyecto.fabricacion.estado = 'en_proceso';
        // Reactivar procesos que necesiten corrección
        defectos?.forEach(defecto => {
          if (!defecto.corregido) {
            // Lógica para reactivar procesos relacionados
          }
        });
      }

      await proyecto.save();
      
      return {
        success: true,
        message: 'Control de calidad registrado exitosamente',
        resultado
      };
    } catch (error) {
      logger.error('Error registrando control de calidad', {
        servicio: 'fabricacionService',
        accion: 'realizarControlCalidad',
        proyectoId: proyectoId?.toString(),
        resultado: datosCalidad?.resultado,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Completar empaque
   */
  static async completarEmpaque(proyectoId, datosEmpaque) {
    try {
      const proyecto = await Proyecto.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const { tipoEmpaque, observaciones, evidenciasFotos, responsable } = datosEmpaque;

      proyecto.fabricacion.empaque = {
        realizado: true,
        fechaEmpaque: new Date(),
        responsable,
        tipoEmpaque,
        observaciones,
        evidenciasFotos: evidenciasFotos || []
      };

      proyecto.cronograma = proyecto.cronograma || {};
      proyecto.fabricacion.estado = 'empacado';
      proyecto.cronograma.fechaFinFabricacionReal = proyecto.cronograma.fechaFinFabricacionReal || new Date();
      proyecto.fabricacion.progreso = 100;
      proyecto.estado = 'instalacion'; // Estado general del proyecto

      await proyecto.save();
      
      return {
        success: true,
        message: 'Empaque completado exitosamente',
        proyecto
      };
    } catch (error) {
      logger.error('Error completando empaque de proyecto', {
        servicio: 'fabricacionService',
        accion: 'completarEmpaque',
        proyectoId: proyectoId?.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Obtener cola de fabricación
   */
  static async obtenerColaFabricacion(filtros = {}) {
    try {
      let query = {
        // Proyectos listos o en proceso de fabricación bajo el nuevo flujo
        estado: { $in: ['aprobado', 'fabricacion'] }
      };

      // Aplicar filtros
      if (filtros.asignadoA) {
        query['fabricacion.asignadoA'] = filtros.asignadoA;
      }
      if (filtros.prioridad) {
        query['fabricacion.prioridad'] = filtros.prioridad;
      }
      if (filtros.estadoFabricacion) {
        query['fabricacion.estado'] = filtros.estadoFabricacion;
      }

      logger.info('Consultando cola de fabricación', {
        servicio: 'fabricacionService',
        accion: 'obtenerColaFabricacion',
        filtros,
        query
      });
      
      const proyectos = await Proyecto.find(query)
        .populate('fabricacion.asignadoA', 'nombre email')
        .populate('responsables.vendedor', 'nombre')
        .sort({ 
          'fabricacion.prioridad': -1, // urgente primero
          'cronograma.fechaFinFabricacionEstimada': 1 // fecha más próxima primero
        });

      logger.info('Proyectos recuperados para cola de fabricación', {
        servicio: 'fabricacionService',
        accion: 'obtenerColaFabricacion',
        total: proyectos.length
      });
      proyectos.forEach(p => {
        logger.debug('Detalle de proyecto en cola de fabricación', {
          servicio: 'fabricacionService',
          accion: 'obtenerColaFabricacion',
          proyectoId: p._id?.toString(),
          numero: p.numero,
          estado: p.estado,
          estadoFabricacion: p.fabricacion?.estado || 'sin fabricacion'
        });
      });

      return proyectos;
    } catch (error) {
      logger.error('Error obteniendo cola de fabricación', {
        servicio: 'fabricacionService',
        accion: 'obtenerColaFabricacion',
        filtros,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Obtener métricas de fabricación
   */
  static async obtenerMetricas(fechaInicio, fechaFin) {
    try {
      logger.info('Calculando métricas de fabricación en rango de fechas', {
        servicio: 'fabricacionService',
        accion: 'obtenerMetricas',
        fechaInicio,
        fechaFin
      });
      
      // Buscar todos los proyectos primero para debug
      const todosLosProyectos = await Proyecto.find({});
      logger.debug('Total de proyectos disponibles para métricas de fabricación', {
        servicio: 'fabricacionService',
        accion: 'obtenerMetricas',
        totalProyectos: todosLosProyectos.length
      });
      
      const proyectos = await Proyecto.find({
        'cronograma.fechaInicioFabricacion': {
          $gte: fechaInicio,
          $lte: fechaFin
        }
      });
      
      logger.info('Proyectos con fabricación en el rango solicitado', {
        servicio: 'fabricacionService',
        accion: 'obtenerMetricas',
        proyectosEnRango: proyectos.length
      });

      const metricas = {
        totalProyectos: proyectos.length,
        enProceso: proyectos.filter(p => p.fabricacion?.estado === 'en_proceso').length,
        terminados: proyectos.filter(p => p.fabricacion?.estado === 'terminado').length,
        empacados: proyectos.filter(p => p.fabricacion?.estado === 'empacado').length,
        
        // Tiempos promedio
        tiempoPromedioFabricacion: this.calcularTiempoPromedio(proyectos),
        
        // Eficiencia
        proyectosATiempo: proyectos.filter(p => 
          p.cronograma.fechaFinFabricacionReal && 
          p.cronograma.fechaFinFabricacionReal <= p.cronograma.fechaFinFabricacionEstimada
        ).length,
        
        // Costos
        costoTotalMateriales: proyectos.reduce((sum, p) => sum + (p.fabricacion?.costos?.materiales || 0), 0),
        costoTotalManoObra: proyectos.reduce((sum, p) => sum + (p.fabricacion?.costos?.manoObra || 0), 0)
      };

      metricas.eficiencia = metricas.totalProyectos > 0 ? 
        (metricas.proyectosATiempo / metricas.totalProyectos) * 100 : 0;

      return metricas;
    } catch (error) {
      logger.error('Error obteniendo métricas de fabricación', {
        servicio: 'fabricacionService',
        accion: 'obtenerMetricas',
        fechaInicio,
        fechaFin,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  static calcularMaterialesNecesarios(productos) {
    const materiales = [];

    productos.forEach(producto => {
      // Lógica específica según tipo de producto
      const nombreNormalizado = (producto.nombre || '').toLowerCase();

      if (nombreNormalizado.includes('persiana')) {
        materiales.push(
          { nombre: 'Tela Screen', cantidad: (producto.medidas.area || 0) * 1.1, unidad: 'm2', disponible: false },
          { nombre: 'Perfil Aluminio', cantidad: ((producto.medidas.ancho || 0) + (producto.medidas.alto || 0)) * 2, unidad: 'ml', disponible: false },
          { nombre: 'Mecanismo', cantidad: 1, unidad: 'pza', disponible: false }
        );
      } else if (nombreNormalizado.includes('toldo')) {
        materiales.push(
          { nombre: 'Lona Acrílica', cantidad: (producto.medidas.area || 0) * 1.2, unidad: 'm2', disponible: false },
          { nombre: 'Estructura Metálica', cantidad: 1, unidad: 'kit', disponible: false },
          { nombre: 'Herrajes', cantidad: 1, unidad: 'kit', disponible: false }
        );
      }
      // Agregar más tipos según necesidad
    });

    return materiales;
  }

  static generarProcesosFabricacion(productos) {
    const procesos = [];

    productos.forEach((producto, index) => {
      const nombreNormalizado = (producto.nombre || '').toLowerCase();

      if (nombreNormalizado.includes('persiana')) {
        procesos.push(
          { nombre: 'Corte de tela', descripcion: `Cortar tela para ${producto.ubicacion}`, orden: index * 10 + 1, tiempoEstimado: 2, estado: 'pendiente' },
          { nombre: 'Armado de mecanismo', descripcion: `Armar mecanismo para ${producto.ubicacion}`, orden: index * 10 + 2, tiempoEstimado: 4, estado: 'pendiente' },
          { nombre: 'Ensamble final', descripcion: `Ensamblar persiana ${producto.ubicacion}`, orden: index * 10 + 3, tiempoEstimado: 3, estado: 'pendiente' }
        );
      } else if (nombreNormalizado.includes('toldo')) {
        procesos.push(
          { nombre: 'Corte de lona', descripcion: `Cortar lona para ${producto.ubicacion}`, orden: index * 10 + 1, tiempoEstimado: 3, estado: 'pendiente' },
          { nombre: 'Soldadura de estructura', descripcion: `Soldar estructura para ${producto.ubicacion}`, orden: index * 10 + 2, tiempoEstimado: 6, estado: 'pendiente' },
          { nombre: 'Montaje final', descripcion: `Montar toldo ${producto.ubicacion}`, orden: index * 10 + 3, tiempoEstimado: 4, estado: 'pendiente' }
        );
      }
    });

    return procesos.sort((a, b) => a.orden - b.orden);
  }

  static calcularFechaEstimada(productos) {
    let diasMaximos = 0;

    productos.forEach(producto => {
      let diasProducto = 15; // Default

      const nombreNormalizado = (producto.nombre || '').toLowerCase();

      if (nombreNormalizado.includes('persiana')) {
        diasProducto = (producto.medidas.ancho || 0) > 2.5 ? 20 : 15;
      } else if (nombreNormalizado.includes('toldo')) {
        diasProducto = 25;
      } else if (nombreNormalizado.includes('cortina')) {
        diasProducto = 10;
      }
      
      if (diasProducto > diasMaximos) {
        diasMaximos = diasProducto;
      }
    });

    const fechaEstimada = new Date();
    fechaEstimada.setDate(fechaEstimada.getDate() + diasMaximos);
    return fechaEstimada;
  }

  static calcularProgresoGeneral(procesos) {
    if (!procesos || procesos.length === 0) return 0;

    const completados = procesos.filter(p => p.estado === 'completado').length;
    return Math.round((completados / procesos.length) * 100);
  }

  static obtenerProductosNormalizados(proyecto) {
    const productosNormalizados = [];

    if (Array.isArray(proyecto.productos) && proyecto.productos.length > 0) {
      proyecto.productos.forEach(producto => {
        const medidas = Array.isArray(producto.medidas)
          ? producto.medidas[0]
          : producto.medidas || {};

        const ancho = Number(producto.ancho ?? medidas?.ancho ?? 0) || 0;
        const alto = Number(producto.alto ?? medidas?.alto ?? 0) || 0;
        const area = Number(producto.area ?? medidas?.area ?? (ancho * alto)) || 0;

        productosNormalizados.push({
          nombre: producto.nombre || producto.producto || 'Producto sin nombre',
          ubicacion: producto.ubicacion || producto.descripcion || medidas?.producto || 'General',
          medidas: {
            ancho,
            alto,
            area
          },
          motorizado: Boolean(producto.motorizado || medidas?.modoOperacion === 'motorizado'),
          tipoInstalacion: producto.tipoInstalacion || medidas?.tipoInstalacion || '',
          tipoFijacion: producto.tipoFijacion || medidas?.tipoFijacion || '',
        });
      });
    }

    if (productosNormalizados.length === 0 && Array.isArray(proyecto.levantamiento?.partidas)) {
      proyecto.levantamiento.partidas.forEach(partida => {
        const nombreBase = partida.producto || partida.productoLabel || partida.nombre || 'Partida';
        const ubicacionBase = partida.ubicacion || partida.producto || 'General';

        (partida.medidas || []).forEach((medida, index) => {
          const ancho = Number(medida.ancho || 0);
          const alto = Number(medida.alto || 0);
          const area = Number(medida.area || (ancho * alto)) || 0;

          productosNormalizados.push({
            nombre: nombreBase,
            ubicacion: medida.producto || `${ubicacionBase} ${index + 1}`,
            medidas: { ancho, alto, area },
            motorizado: medida.modoOperacion === 'motorizado' || partida.motorizado,
            tipoInstalacion: medida.tipoInstalacion || '',
            tipoFijacion: medida.tipoFijacion || '',
          });
        });
      });
    }

    return productosNormalizados;
  }

  static calcularTiempoPromedio(proyectos) {
    const proyectosConTiempo = proyectos.filter(p =>
      p.cronograma.fechaInicioFabricacion && p.cronograma.fechaFinFabricacionReal
    );
    
    if (proyectosConTiempo.length === 0) return 0;
    
    const tiempoTotal = proyectosConTiempo.reduce((sum, p) => {
      const inicio = new Date(p.cronograma.fechaInicioFabricacion);
      const fin = new Date(p.cronograma.fechaFinFabricacionReal);
      return sum + (fin - inicio) / (1000 * 60 * 60 * 24); // días
    }, 0);
    
    return Math.round(tiempoTotal / proyectosConTiempo.length);
  }
}

module.exports = FabricacionService;
