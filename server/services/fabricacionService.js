const ProyectoPedido = require('../models/ProyectoPedido');

class FabricacionService {
  
  /**
   * Iniciar proceso de fabricación para un proyecto
   */
  static async iniciarFabricacion(proyectoId, datosIniciales = {}) {
    try {
      const proyecto = await ProyectoPedido.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Verificar que el proyecto esté en estado confirmado
      if (proyecto.estado !== 'confirmado') {
        throw new Error('El proyecto debe estar confirmado para iniciar fabricación');
      }

      // Calcular materiales necesarios automáticamente
      const materialesCalculados = this.calcularMaterialesNecesarios(proyecto.productos);
      
      // Generar procesos de fabricación según tipo de productos
      const procesosGenerados = this.generarProcesosFabricacion(proyecto.productos);

      // Actualizar proyecto con información de fabricación
      proyecto.estado = 'en_fabricacion';
      proyecto.cronograma.fechaInicioFabricacion = new Date();
      proyecto.cronograma.fechaFinFabricacionEstimada = this.calcularFechaEstimada(proyecto.productos);
      
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
      console.error('Error iniciando fabricación:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso de fabricación
   */
  static async actualizarProgreso(proyectoId, datosProgreso) {
    try {
      const proyecto = await ProyectoPedido.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const { procesoId, estado, tiempoReal, observaciones, evidenciasFotos } = datosProgreso;
      
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
      console.error('Error actualizando progreso:', error);
      throw error;
    }
  }

  /**
   * Realizar control de calidad
   */
  static async realizarControlCalidad(proyectoId, datosCalidad) {
    try {
      const proyecto = await ProyectoPedido.findById(proyectoId);
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
      console.error('Error en control de calidad:', error);
      throw error;
    }
  }

  /**
   * Completar empaque
   */
  static async completarEmpaque(proyectoId, datosEmpaque) {
    try {
      const proyecto = await ProyectoPedido.findById(proyectoId);
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

      proyecto.fabricacion.estado = 'empacado';
      proyecto.estado = 'fabricado'; // Estado general del proyecto

      await proyecto.save();
      
      return {
        success: true,
        message: 'Empaque completado exitosamente',
        proyecto
      };
    } catch (error) {
      console.error('Error completando empaque:', error);
      throw error;
    }
  }

  /**
   * Obtener cola de fabricación
   */
  static async obtenerColaFabricacion(filtros = {}) {
    try {
      let query = {
        // Temporalmente mostrar todos los proyectos para debug
        estado: { $in: ['confirmado', 'en_fabricacion', 'fabricado'] }
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

      console.log('🔍 [FABRICACION] Query:', JSON.stringify(query, null, 2));
      
      const proyectos = await ProyectoPedido.find(query)
        .populate('fabricacion.asignadoA', 'nombre email')
        .populate('responsables.vendedor', 'nombre')
        .sort({ 
          'fabricacion.prioridad': -1, // urgente primero
          'cronograma.fechaFinFabricacionEstimada': 1 // fecha más próxima primero
        });

      console.log(`📊 [FABRICACION] Encontrados ${proyectos.length} proyectos`);
      proyectos.forEach(p => {
        console.log(`   - ${p.numero}: ${p.estado} (fabricacion: ${p.fabricacion?.estado || 'sin fabricacion'})`);
      });

      return proyectos;
    } catch (error) {
      console.error('Error obteniendo cola de fabricación:', error);
      throw error;
    }
  }

  /**
   * Obtener métricas de fabricación
   */
  static async obtenerMetricas(fechaInicio, fechaFin) {
    try {
      console.log(`📈 [METRICAS] Buscando proyectos entre ${fechaInicio} y ${fechaFin}`);
      
      // Buscar todos los proyectos primero para debug
      const todosLosProyectos = await ProyectoPedido.find({});
      console.log(`📊 [METRICAS] Total proyectos en DB: ${todosLosProyectos.length}`);
      
      const proyectos = await ProyectoPedido.find({
        'cronograma.fechaInicioFabricacion': {
          $gte: fechaInicio,
          $lte: fechaFin
        }
      });
      
      console.log(`📊 [METRICAS] Proyectos con fabricación en rango: ${proyectos.length}`);

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
      console.error('Error obteniendo métricas:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  static calcularMaterialesNecesarios(productos) {
    const materiales = [];
    
    productos.forEach(producto => {
      // Lógica específica según tipo de producto
      if (producto.nombre.toLowerCase().includes('persiana')) {
        materiales.push(
          { nombre: 'Tela Screen', cantidad: producto.medidas.area * 1.1, unidad: 'm2', disponible: false },
          { nombre: 'Perfil Aluminio', cantidad: (producto.medidas.ancho + producto.medidas.alto) * 2, unidad: 'ml', disponible: false },
          { nombre: 'Mecanismo', cantidad: 1, unidad: 'pza', disponible: false }
        );
      } else if (producto.nombre.toLowerCase().includes('toldo')) {
        materiales.push(
          { nombre: 'Lona Acrílica', cantidad: producto.medidas.area * 1.2, unidad: 'm2', disponible: false },
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
      if (producto.nombre.toLowerCase().includes('persiana')) {
        procesos.push(
          { nombre: 'Corte de tela', descripcion: `Cortar tela para ${producto.ubicacion}`, orden: index * 10 + 1, tiempoEstimado: 2, estado: 'pendiente' },
          { nombre: 'Armado de mecanismo', descripcion: `Armar mecanismo para ${producto.ubicacion}`, orden: index * 10 + 2, tiempoEstimado: 4, estado: 'pendiente' },
          { nombre: 'Ensamble final', descripcion: `Ensamblar persiana ${producto.ubicacion}`, orden: index * 10 + 3, tiempoEstimado: 3, estado: 'pendiente' }
        );
      } else if (producto.nombre.toLowerCase().includes('toldo')) {
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
      
      if (producto.nombre.toLowerCase().includes('persiana')) {
        diasProducto = producto.medidas.ancho > 2.5 ? 20 : 15;
      } else if (producto.nombre.toLowerCase().includes('toldo')) {
        diasProducto = 25;
      } else if (producto.nombre.toLowerCase().includes('cortina')) {
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
