/**
 * Servicio de Sugerencias Inteligentes para Instalaciones
 * 
 * Analiza datos históricos y características del proyecto para generar
 * sugerencias automáticas de programación, cuadrillas y tiempos
 */

const Proyecto = require('../models/Proyecto');
const Usuario = require('../models/Usuario');
const logger = require('../config/logger');

class InstalacionesInteligentesService {

  /**
   * Generar sugerencias inteligentes para una nueva instalación
   */
  static async generarSugerenciasInstalacion(proyectoId) {
    try {
      logger.info('Generando sugerencias inteligentes para instalación', {
        servicio: 'instalacionesInteligentes',
        accion: 'generarSugerenciasInstalacion',
        proyectoId: proyectoId?.toString()
      });

      const proyecto = await Proyecto.findById(proyectoId);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const productosNormalizados = this.obtenerProductosProyecto(proyecto);
      const tiempoModelo = typeof proyecto.calcularTiempoInstalacion === 'function'
        ? proyecto.calcularTiempoInstalacion()
        : null;

      // Análisis paralelo de diferentes aspectos
      const analisisComplejidad = await this.evaluarComplejidadInstalacion(productosNormalizados);

      const [
        sugerenciasTiempo,
        sugerenciasCuadrilla,
        sugerenciasHerramientas,
        sugerenciasFecha,
        recomendacionesPrevias
      ] = await Promise.all([
        this.analizarTiemposOptimos(proyecto, productosNormalizados, tiempoModelo),
        this.sugerirCuadrillaOptima(proyecto, productosNormalizados, analisisComplejidad),
        this.analizarHerramientasNecesarias(productosNormalizados),
        this.sugerirMejorFecha(proyecto, productosNormalizados, tiempoModelo),
        this.obtenerRecomendacionesHistoricas(proyecto, productosNormalizados)
      ]);

      const sugerencias = {
        proyecto: {
          id: proyecto._id,
          numero: proyecto.numero,
          cliente: proyecto.cliente?.nombre,
          productos: productosNormalizados.length
        },

        // Sugerencias de tiempo
        tiempo: sugerenciasTiempo,

        // Sugerencias de cuadrilla
        cuadrilla: sugerenciasCuadrilla,
        
        // Herramientas recomendadas
        herramientas: sugerenciasHerramientas,
        
        // Mejor fecha sugerida
        programacion: sugerenciasFecha,
        
        // Análisis de complejidad
        complejidad: analisisComplejidad,
        
        // Lecciones aprendidas
        historico: recomendacionesPrevias,

        // Puntuación de confianza general
        confianza: this.calcularConfianzaGeneral([
          sugerenciasTiempo.confianza,
          sugerenciasCuadrilla.confianza,
          sugerenciasHerramientas.confianza,
          sugerenciasFecha.confianza
        ]),

        recomendacionesModelo: tiempoModelo?.recomendaciones || [],

        fechaGeneracion: new Date()
      };

      logger.info('Sugerencias inteligentes generadas', {
        servicio: 'instalacionesInteligentes',
        accion: 'generarSugerenciasInstalacion',
        proyectoId: proyecto?._id?.toString(),
        confianza: sugerencias.confianza,
        productos: productosNormalizados.length
      });
      return sugerencias;

    } catch (error) {
      logger.error('Error generando sugerencias inteligentes de instalación', {
        servicio: 'instalacionesInteligentes',
        accion: 'generarSugerenciasInstalacion',
        proyectoId: proyectoId?.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Analizar tiempos óptimos basado en productos y datos históricos
   */
  static async analizarTiemposOptimos(proyecto, productos, tiempoModelo) {
    try {
      const detalleProductos = productos.map(producto => this.analizarTiempoProducto(producto));
      let tiempoEstimado = detalleProductos.reduce((sum, item) => sum + item.tiempo, 0);
      let factorComplejidad = detalleProductos.reduce((max, item) => Math.max(max, item.factorComplejidad), 1);

      // Ajustar con modelo inteligente si está disponible
      const tiempoModeloHoras = tiempoModelo?.tiempoEstimadoMinutos
        ? tiempoModelo.tiempoEstimadoMinutos / 60
        : null;

      if (tiempoModeloHoras) {
        tiempoEstimado = Math.max(tiempoEstimado, tiempoModeloHoras);
        factorComplejidad = Math.max(factorComplejidad, tiempoModelo.factores?.complejidad || 1);
      }

      // Buscar datos históricos similares
      const datosHistoricos = await this.buscarInstalacionesSimilares(proyecto, productos);
      let tiempoHistoricoPromedio = 0;

      if (datosHistoricos.length > 0) {
        tiempoHistoricoPromedio = datosHistoricos.reduce((sum, inst) =>
          sum + (inst.tiempoReal || inst.tiempoEstimado || 0), 0
        ) / datosHistoricos.length;
      }

      // Combinar estimación teórica con datos históricos
      let tiempoFinal = datosHistoricos.length > 0 ?
        (tiempoEstimado * 0.6 + tiempoHistoricoPromedio * 0.4) * factorComplejidad :
        tiempoEstimado * factorComplejidad;

      if (tiempoModeloHoras) {
        tiempoFinal = (tiempoFinal * 0.5) + (tiempoModeloHoras * 0.5);
      }

      const factores = tiempoModelo?.factores || {
        complejidad: factorComplejidad,
        motorizado: detalleProductos.some(p => p.factores.includes('Motorizado (+1.5h)')) ? 1.2 : 1,
        altura: detalleProductos.some(p => p.factores.includes('Medidas especiales (>3m)')) ? 1.3 : 1,
        acceso: 1.0
      };

      return {
        tiempoEstimado: Math.ceil(tiempoFinal),
        tiempoMinimo: Math.ceil(tiempoFinal * 0.8),
        tiempoMaximo: Math.ceil(tiempoFinal * 1.3),
        factorComplejidad,
        detalleProductos,
        datosHistoricos: datosHistoricos.length,
        recomendacion: this.generarRecomendacionTiempo(tiempoFinal, factorComplejidad),
        confianza: this.calcularConfianzaTiempo(datosHistoricos.length, factorComplejidad),
        factores,
        modelo: tiempoModelo || null
      };

    } catch (error) {
      logger.error('Error analizando tiempos de instalación', {
        servicio: 'instalacionesInteligentes',
        accion: 'analizarTiemposOptimos',
        proyectoId: proyecto?._id?.toString(),
        error: error.message,
        stack: error.stack
      });
      return { tiempoEstimado: 4, confianza: 30 };
    }
  }

  /**
   * Analizar tiempo requerido para un producto específico
   */
  static analizarTiempoProducto(producto) {
    let tiempoBase = 2; // horas base por producto
    let factorComplejidad = 1;
    const factores = [];

    // Análisis por tipo de producto
    const tipoProducto = producto.nombre?.toLowerCase() || '';
    
    if (tipoProducto.includes('persiana')) {
      tiempoBase = 1.5;
      factores.push('Persiana estándar');
    } else if (tipoProducto.includes('toldo')) {
      tiempoBase = 3;
      factorComplejidad *= 1.4;
      factores.push('Toldo (mayor complejidad)');
    } else if (tipoProducto.includes('cortina')) {
      tiempoBase = 1;
      factores.push('Cortina tradicional');
    }

    // Análisis por área
    const ancho = producto.medidas?.ancho || producto.ancho || 0;
    const alto = producto.medidas?.alto || producto.alto || 0;
    const area = producto.medidas?.area || (ancho * alto) || 0;
    if (area > 10) {
      factorComplejidad *= 1.3;
      factores.push('Área grande (>10m²)');
    } else if (area > 6) {
      factorComplejidad *= 1.15;
      factores.push('Área media (6-10m²)');
    }

    // Análisis por motorización
    if (producto.motorizado) {
      tiempoBase += 1.5;
      factorComplejidad *= 1.25;
      factores.push('Motorizado (+1.5h)');
    }

    // Análisis por tipo de instalación
    const tipoInstalacion = producto.tipoInstalacion?.toLowerCase() || '';
    if (tipoInstalacion.includes('techo')) {
      factorComplejidad *= 1.2;
      factores.push('Instalación en techo');
    } else if (tipoInstalacion.includes('empotrado')) {
      factorComplejidad *= 1.4;
      factores.push('Instalación empotrada');
    } else if (tipoInstalacion.includes('exterior')) {
      factorComplejidad *= 1.3;
      factores.push('Instalación exterior');
    }

    // Análisis por medidas especiales
    if (ancho > 3 || alto > 3) {
      factorComplejidad *= 1.2;
      factores.push('Medidas especiales (>3m)');
    }

    return {
      producto: producto.nombre,
      tiempo: tiempoBase * factorComplejidad,
      factorComplejidad,
      factores,
      area
    };
  }

  /**
   * Sugerir cuadrilla óptima basada en productos y disponibilidad
   */
  static async sugerirCuadrillaOptima(proyecto, productos, analisisComplejidad) {
    try {
      // Analizar especialidades requeridas
      const especialidadesRequeridas = this.analizarEspecialidadesRequeridas(productos);

      // Obtener instaladores disponibles (mock data por ahora)
      const instaladoresDisponibles = await this.obtenerInstaladoresDisponibles();

      // Algoritmo de asignación óptima
      const cuadrillaOptima = this.calcularCuadrillaOptima(
        especialidadesRequeridas,
        instaladoresDisponibles
      );

      if (analisisComplejidad?.nivel === 'Alta' && cuadrillaOptima.length < 3) {
        const candidatoExtra = instaladoresDisponibles.find(inst => !cuadrillaOptima.includes(inst));
        if (candidatoExtra) {
          cuadrillaOptima.push(candidatoExtra);
        }
      }

      return {
        cuadrillaRecomendada: cuadrillaOptima,
        especialidadesRequeridas,
        tamañoOptimo: cuadrillaOptima.length,
        responsableSugerido: cuadrillaOptima.find(inst => inst.esLider) || cuadrillaOptima[0],
        razonamiento: this.explicarSeleccionCuadrilla(cuadrillaOptima, especialidadesRequeridas),
        confianza: this.calcularConfianzaCuadrilla(cuadrillaOptima, especialidadesRequeridas)
      };

    } catch (error) {
      logger.error('Error sugiriendo cuadrilla:', {
        servicio: 'instalacionesInteligentes',
        accion: 'sugerirCuadrillaOptima',
        proyectoId: proyecto?._id?.toString(),
        error: error.message,
        stack: error.stack
      });
      return { cuadrillaRecomendada: [], confianza: 20 };
    }
  }

  /**
   * Analizar herramientas necesarias basado en productos
   */
  static async analizarHerramientasNecesarias(productos) {
    const herramientasRequeridas = new Set(['Taladro percutor', 'Nivel láser']);
    const herramientasOpcionales = new Set();
    const razonamiento = [];

    for (const producto of productos || []) {
      const tipoProducto = producto.nombre?.toLowerCase() || '';

      if (tipoProducto.includes('toldo')) {
        herramientasRequeridas.add('Escalera extensible');
        herramientasRequeridas.add('Equipo de soldadura');
        herramientasOpcionales.add('Andamio móvil');
        razonamiento.push('Toldo requiere escalera y soldadura');
      }
      
      if (producto.motorizado) {
        herramientasRequeridas.add('Kit de motorización');
        herramientasRequeridas.add('Medidor de tensión');
        razonamiento.push('Motorización requiere herramientas eléctricas');
      }
      
      if (producto.tipoInstalacion?.includes('techo')) {
        herramientasOpcionales.add('Andamio móvil');
        razonamiento.push('Instalación en techo puede requerir andamio');
      }
      
      const area = producto.medidas?.area || 0;
      if (area > 8) {
        herramientasOpcionales.add('Escalera extensible');
        razonamiento.push('Área grande requiere escalera extensible');
      }
    }

    return {
      herramientasRequeridas: Array.from(herramientasRequeridas),
      herramientasOpcionales: Array.from(herramientasOpcionales),
      razonamiento,
      confianza: 85
    };
  }

  /**
   * Sugerir mejor fecha considerando múltiples factores
   */
  static async sugerirMejorFecha(proyecto, productos, tiempoModelo) {
    try {
      const ahora = new Date();
      const fechasDisponibles = [];

      // Generar fechas candidatas (próximos 14 días hábiles)
      for (let i = 1; i <= 14; i++) {
        const fecha = new Date(ahora);
        fecha.setDate(fecha.getDate() + i);
        
        // Solo días hábiles
        if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
          fechasDisponibles.push(fecha);
        }
      }

      // Evaluar cada fecha candidata
      const evaluacionFechas = await Promise.all(
        fechasDisponibles.map(fecha => this.evaluarFecha(fecha, proyecto, productos))
      );

      // Ordenar por puntuación
      evaluacionFechas.sort((a, b) => b.puntuacion - a.puntuacion);
      
      const mejorFecha = evaluacionFechas[0];

      return {
        fechaRecomendada: mejorFecha.fecha,
        horaRecomendada: this.sugerirMejorHora(productos, tiempoModelo),
        alternativas: evaluacionFechas.slice(1, 4),
        razonamiento: mejorFecha.razonamiento,
        factoresConsiderados: [
          'Disponibilidad de cuadrilla',
          'Carga de trabajo',
          'Condiciones climáticas estimadas',
          'Urgencia del proyecto'
        ],
        confianza: mejorFecha.confianza
      };

    } catch (error) {
      logger.error('Error sugiriendo fecha:', {
        servicio: 'instalacionesInteligentes',
        accion: 'sugerirMejorFecha',
        proyectoId: proyecto?._id?.toString(),
        error: error.message,
        stack: error.stack
      });
      const fechaDefault = new Date();
      fechaDefault.setDate(fechaDefault.getDate() + 3);
      return {
        fechaRecomendada: fechaDefault, 
        horaRecomendada: '09:00',
        confianza: 40 
      };
    }
  }

  /**
   * Evaluar complejidad general de la instalación
   */
  static async evaluarComplejidadInstalacion(productos) {
    let puntuacionComplejidad = 0;
    const factores = [];

    // Número de productos
    const numProductos = productos?.length || 0;
    if (numProductos > 5) {
      puntuacionComplejidad += 30;
      factores.push(`Múltiples productos (${numProductos})`);
    } else if (numProductos > 2) {
      puntuacionComplejidad += 15;
      factores.push(`Varios productos (${numProductos})`);
    }

    // Análisis por tipo de productos
    let tieneMotorizados = false;
    let tieneToldos = false;
    let areaTotal = 0;

    for (const producto of productos || []) {
      if (producto.motorizado) tieneMotorizados = true;
      if (producto.nombre?.toLowerCase().includes('toldo')) tieneToldos = true;
      areaTotal += producto.medidas?.area || 0;
    }

    if (tieneMotorizados) {
      puntuacionComplejidad += 25;
      factores.push('Productos motorizados');
    }

    if (tieneToldos) {
      puntuacionComplejidad += 20;
      factores.push('Incluye toldos');
    }

    if (areaTotal > 30) {
      puntuacionComplejidad += 20;
      factores.push(`Área total grande (${areaTotal.toFixed(1)}m²)`);
    }

    // Determinar nivel de complejidad
    let nivel, descripcion, recomendaciones;
    
    if (puntuacionComplejidad <= 20) {
      nivel = 'Baja';
      descripcion = 'Instalación estándar, sin complicaciones especiales';
      recomendaciones = ['Cuadrilla estándar de 2 personas', 'Herramientas básicas'];
    } else if (puntuacionComplejidad <= 50) {
      nivel = 'Media';
      descripcion = 'Instalación con algunos elementos que requieren atención especial';
      recomendaciones = ['Cuadrilla de 2-3 personas', 'Incluir especialista si hay motorización'];
    } else {
      nivel = 'Alta';
      descripcion = 'Instalación compleja que requiere planificación detallada';
      recomendaciones = ['Cuadrilla de 3-4 personas', 'Incluir especialistas', 'Tiempo adicional'];
    }

    return {
      nivel,
      puntuacion: puntuacionComplejidad,
      descripcion,
      factores,
      recomendaciones,
      tiempoAdicionalSugerido: Math.ceil(puntuacionComplejidad / 20),
      confianza: 90
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  static async buscarInstalacionesSimilares(proyecto, productos) {
    try {
      const tiposProducto = (productos || [])
        .map(p => p.nombre?.toLowerCase())
        .filter(Boolean);

      const query = {
        _id: { $ne: proyecto._id },
        'instalacion.estado': { $in: ['completada', 'instalando'] }
      };

      if (tiposProducto.length > 0) {
        query.$or = [
          { 'productos.nombre': { $in: tiposProducto } },
          { 'levantamiento.partidas.producto': { $in: tiposProducto } }
        ];
      }

      const proyectosSimilares = await Proyecto.find(query)
        .sort({ 'cronograma.fechaInstalacionReal': -1 })
        .limit(10)
        .select('instalacion productos cronograma');

      if (!proyectosSimilares.length) {
        return [];
      }

      return proyectosSimilares.map(similar => {
        const tiempoRealHoras = similar.instalacion?.ejecucion?.horasReales || 0;
        const tiempoEstimadoMinutos = similar.instalacion?.programacion?.tiempoEstimado || 0;

        return {
          tiempoReal: tiempoRealHoras || (tiempoEstimadoMinutos / 60),
          tiempoEstimado: tiempoEstimadoMinutos / 60,
          productos: similar.productos?.length || 0
        };
      });
    } catch (error) {
      logger.warn('No fue posible recuperar instalaciones similares, usando datos por defecto', {
        servicio: 'instalacionesInteligentes',
        accion: 'buscarInstalacionesSimilares',
        proyectoId: proyecto?._id?.toString(),
        error: error.message
      });

      return [
        { tiempoReal: 4.5, tiempoEstimado: 4, productos: 2 },
        { tiempoReal: 6.2, tiempoEstimado: 5, productos: 3 }
      ];
    }
  }

  static analizarEspecialidadesRequeridas(productos) {
    const especialidades = new Set();
    
    for (const producto of productos || []) {
      const tipo = producto.nombre?.toLowerCase() || '';
      
      if (tipo.includes('persiana')) especialidades.add('persianas');
      if (tipo.includes('toldo')) especialidades.add('toldos');
      if (tipo.includes('cortina')) especialidades.add('cortinas');
      if (producto.motorizado) especialidades.add('motorización');
    }
    
    return Array.from(especialidades);
  }

  static async obtenerInstaladoresDisponibles() {
    try {
      const usuarios = await Usuario.find({
        rol: { $in: ['instalador', 'coordinador'] },
        activo: true
      }).select('nombre apellido rol permisos configuracion metricas');

      if (!usuarios.length) {
        throw new Error('Sin usuarios instaladores configurados');
      }

      return usuarios.map(usuario => {
        const especialidades = new Set(['persianas']);
        if (usuario.permisos?.some(p => p.modulo === 'fabricacion')) {
          especialidades.add('toldos');
        }
        if (usuario.permisos?.some(p => p.modulo === 'instalaciones')) {
          especialidades.add('motorización');
        }

        const experiencia = usuario.metricas?.ventasCerradas
          ? Math.min(10, Math.max(2, Math.round(usuario.metricas.ventasCerradas / 10)))
          : 3;

        return {
          id: usuario._id.toString(),
          nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
          especialidades: Array.from(especialidades),
          experiencia,
          esLider: usuario.rol === 'coordinador' || experiencia >= 5
        };
      });
    } catch (error) {
      logger.warn('No fue posible obtener instaladores desde la base de datos, usando catálogo estático', {
        servicio: 'instalacionesInteligentes',
        accion: 'obtenerInstaladoresDisponibles',
        error: error.message
      });

      return [
        { id: '1', nombre: 'Roberto Martínez', especialidades: ['persianas', 'motorización'], experiencia: 5, esLider: true },
        { id: '2', nombre: 'Luis Hernández', especialidades: ['toldos'], experiencia: 3, esLider: false },
        { id: '3', nombre: 'Miguel Sánchez', especialidades: ['motorización'], experiencia: 7, esLider: true },
        { id: '4', nombre: 'José Ramírez', especialidades: ['persianas', 'cortinas'], experiencia: 4, esLider: false }
      ];
    }
  }

  static calcularCuadrillaOptima(especialidadesRequeridas, instaladoresDisponibles) {
    const cuadrilla = [];
    const especialidadesCubiertas = new Set();
    
    // Priorizar instaladores con múltiples especialidades
    const instaladoresOrdenados = instaladoresDisponibles.sort((a, b) => {
      const coincidenciasA = a.especialidades.filter(esp => especialidadesRequeridas.includes(esp)).length;
      const coincidenciasB = b.especialidades.filter(esp => especialidadesRequeridas.includes(esp)).length;
      return coincidenciasB - coincidenciasA;
    });
    
    // Seleccionar instaladores
    for (const instalador of instaladoresOrdenados) {
      const especialidadesAportadas = instalador.especialidades.filter(esp => 
        especialidadesRequeridas.includes(esp) && !especialidadesCubiertas.has(esp)
      );
      
      if (especialidadesAportadas.length > 0 || cuadrilla.length < 2) {
        cuadrilla.push(instalador);
        especialidadesAportadas.forEach(esp => especialidadesCubiertas.add(esp));
        
        if (cuadrilla.length >= 4) break; // Máximo 4 personas
      }
    }
    
    return cuadrilla;
  }

  static calcularConfianzaGeneral(confianzas) {
    return Math.round(confianzas.reduce((sum, conf) => sum + conf, 0) / confianzas.length);
  }

  static calcularConfianzaTiempo(datosHistoricos, factorComplejidad) {
    let confianza = 60;
    if (datosHistoricos > 5) confianza += 20;
    if (datosHistoricos > 10) confianza += 10;
    if (factorComplejidad < 1.2) confianza += 10;
    return Math.min(confianza, 95);
  }

  static calcularConfianzaCuadrilla(cuadrilla, especialidadesRequeridas) {
    const especialidadesCubiertas = new Set();
    cuadrilla.forEach(inst => {
      inst.especialidades.forEach(esp => {
        if (especialidadesRequeridas.includes(esp)) {
          especialidadesCubiertas.add(esp);
        }
      });
    });
    
    const cobertura = especialidadesCubiertas.size / especialidadesRequeridas.length;
    return Math.round(cobertura * 80 + 15); // 15-95%
  }

  static async evaluarFecha(fecha, proyecto, productos) {
    let puntuacion = 50; // Base
    const razonamiento = [];

    // Evaluar día de la semana
    const diaSemana = fecha.getDay();
    if (diaSemana === 2 || diaSemana === 3 || diaSemana === 4) { // Mar, Mié, Jue
      puntuacion += 15;
      razonamiento.push('Día óptimo de la semana');
    }
    
    // Evaluar distancia temporal
    const diasDesdeHoy = Math.ceil((fecha - new Date()) / (1000 * 60 * 60 * 24));
    if (diasDesdeHoy >= 3 && diasDesdeHoy <= 7) {
      puntuacion += 20;
      razonamiento.push('Tiempo adecuado para preparación');
    } else if (diasDesdeHoy < 3) {
      puntuacion -= 10;
      razonamiento.push('Poco tiempo para preparación');
    }
    
    // Evitar choque con programación actual
    const fechaProgramadaActual = proyecto.instalacion?.programacion?.fechaProgramada;
    if (fechaProgramadaActual) {
      const diferencia = Math.abs(new Date(fechaProgramadaActual) - fecha) / (1000 * 60 * 60 * 24);
      if (diferencia < 2) {
        puntuacion -= 15;
        razonamiento.push('Fecha cercana a programación actual, considerar reprogramar con margen');
      }
    }

    // Ajustar según complejidad
    if ((productos || []).some(p => p.motorizado)) {
      puntuacion += 5;
      razonamiento.push('Se reserva espacio adicional para productos motorizados');
    }

    return {
      fecha,
      puntuacion,
      razonamiento,
      confianza: 75
    };
  }

  static sugerirMejorHora(productos, tiempoModelo) {
    const numProductos = productos?.length || 0;
    if (tiempoModelo?.tiempoEstimadoHoras) {
      return Number(tiempoModelo.tiempoEstimadoHoras) > 4 ? '08:00' : '09:00';
    }
    return numProductos > 3 ? '08:00' : '09:00';
  }

  static generarRecomendacionTiempo(tiempo, factor) {
    if (factor > 1.5) {
      return 'Instalación compleja - considerar tiempo adicional y cuadrilla especializada';
    } else if (factor > 1.2) {
      return 'Instalación de complejidad media - planificación estándar';
    } else {
      return 'Instalación estándar - tiempo y recursos normales';
    }
  }

  static explicarSeleccionCuadrilla(cuadrilla, especialidades) {
    const explicaciones = [];
    
    explicaciones.push(`Cuadrilla de ${cuadrilla.length} personas seleccionada`);
    
    if (especialidades.includes('motorización')) {
      const especialistaMotor = cuadrilla.find(inst => inst.especialidades.includes('motorización'));
      if (especialistaMotor) {
        explicaciones.push(`${especialistaMotor.nombre} incluido por experiencia en motorización`);
      }
    }
    
    if (especialidades.includes('toldos')) {
      const especialistaToldo = cuadrilla.find(inst => inst.especialidades.includes('toldos'));
      if (especialistaToldo) {
        explicaciones.push(`${especialistaToldo.nombre} incluido por experiencia en toldos`);
      }
    }
    
    const lider = cuadrilla.find(inst => inst.esLider);
    if (lider) {
      explicaciones.push(`${lider.nombre} sugerido como responsable por experiencia de liderazgo`);
    }
    
    return explicaciones;
  }

  /**
   * Obtener recomendaciones basadas en instalaciones históricas similares
   */
  static async obtenerRecomendacionesHistoricas(proyecto, productos) {
    try {
      const instalacionesSimilares = await this.buscarInstalacionesSimilares(proyecto, productos);

      if (!instalacionesSimilares.length) {
        return {
          instalacionesSimilares: 0,
          problemasComunes: [],
          tiempoPromedioReal: 0,
          satisfaccionCliente: 4.5,
          recomendaciones: ['Contactar al cliente 24h antes para confirmar disponibilidad']
        };
      }

      const tiempoPromedioReal = instalacionesSimilares.reduce((sum, inst) => sum + inst.tiempoReal, 0) / instalacionesSimilares.length;

      return {
        instalacionesSimilares: installationsSimilares.length,
        problemasComunes: [
          'Verificar acceso para escalera en instalaciones de techo',
          'Confirmar suministro eléctrico para productos motorizados'
        ],
        tiempoPromedioReal: Number(tiempoPromedioReal.toFixed(1)),
        satisfaccionCliente: 4.6,
        recomendaciones: [
          'Llamar al cliente 24h antes para confirmar',
          'Llevar herramientas de respaldo para motorización',
          'Tomar fotos del progreso para documentación'
        ]
      };
    } catch (error) {
      logger.warn('No fue posible generar recomendaciones históricas, usando valores predeterminados', {
        servicio: 'instalacionesInteligentes',
        accion: 'obtenerRecomendacionesHistoricas',
        proyectoId: proyecto?._id?.toString(),
        error: error.message
      });

      return {
        instalacionesSimilares: 0,
        problemasComunes: [],
        tiempoPromedioReal: 0,
        satisfaccionCliente: 4.5,
        recomendaciones: ['Contactar al cliente 24h antes para confirmar disponibilidad']
      };
    }
  }

  static obtenerProductosProyecto(proyecto) {
    const productos = [];

    if (Array.isArray(proyecto.productos) && proyecto.productos.length > 0) {
      proyecto.productos.forEach(producto => {
        const medidas = Array.isArray(producto.medidas)
          ? producto.medidas[0]
          : producto.medidas || {};

        const ancho = Number(producto.ancho ?? medidas?.ancho ?? 0) || 0;
        const alto = Number(producto.alto ?? medidas?.alto ?? 0) || 0;
        const area = Number(producto.area ?? medidas?.area ?? (ancho * alto)) || 0;

        productos.push({
          nombre: producto.nombre || producto.producto || 'Producto',
          ubicacion: producto.ubicacion || medidas?.producto || 'General',
          medidas: { ancho, alto, area },
          motorizado: Boolean(producto.motorizado || medidas?.modoOperacion === 'motorizado'),
          tipoInstalacion: producto.tipoInstalacion || medidas?.tipoInstalacion || '',
          tipoFijacion: producto.tipoFijacion || medidas?.tipoFijacion || ''
        });
      });
    }

    if (!productos.length && Array.isArray(proyecto.levantamiento?.partidas)) {
      proyecto.levantamiento.partidas.forEach(partida => {
        (partida.medidas || []).forEach((medida, index) => {
          const ancho = Number(medida.ancho || 0);
          const alto = Number(medida.alto || 0);
          const area = Number(medida.area || (ancho * alto)) || 0;

          productos.push({
            nombre: partida.producto || partida.productoLabel || 'Partida',
            ubicacion: medida.producto || `${partida.producto || 'Ubicación'} ${index + 1}`,
            medidas: { ancho, alto, area },
            motorizado: medida.modoOperacion === 'motorizado' || partida.motorizado,
            tipoInstalacion: medida.tipoInstalacion || '',
            tipoFijacion: medida.tipoFijacion || ''
          });
        });
      });
    }

    if (!productos.length && Array.isArray(proyecto.instalacion?.productosInstalar)) {
      proyecto.instalacion.productosInstalar.forEach(producto => {
        const medidas = Array.isArray(producto.medidas) ? producto.medidas[0] : producto.medidas || {};
        productos.push({
          nombre: producto.descripcion || producto.ubicacion || 'Producto instalación',
          ubicacion: producto.ubicacion || producto.descripcion || 'General',
          medidas: {
            ancho: Number(medidas.ancho || 0),
            alto: Number(medidas.alto || 0),
            area: Number(medidas.area || 0)
          },
          motorizado: producto.motorizacion?.activa || false,
          tipoInstalacion: medidas.tipoInstalacion || producto.especificacionesTecnicas?.tipoInstalacion || '',
          tipoFijacion: medidas.tipoFijacion || producto.especificacionesTecnicas?.tipoFijacion || ''
        });
      });
    }

    return productos;
  }
}

module.exports = InstalacionesInteligentesService;
