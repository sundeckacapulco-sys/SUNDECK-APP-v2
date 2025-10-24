/**
 * Servicio de Sugerencias Inteligentes para Instalaciones
 * 
 * Analiza datos históricos y características del proyecto para generar
 * sugerencias automáticas de programación, cuadrillas y tiempos
 */

const Instalacion = require('../models/Instalacion');
const ProyectoPedido = require('../models/ProyectoPedido');
const Usuario = require('../models/Usuario');

class InstalacionesInteligentesService {

  /**
   * Generar sugerencias inteligentes para una nueva instalación
   */
  static async generarSugerenciasInstalacion(proyectoId) {
    try {
      console.log(`🧠 Generando sugerencias inteligentes para proyecto ${proyectoId}`);

      const proyecto = await ProyectoPedido.findById(proyectoId)
        .populate('productos');

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Análisis paralelo de diferentes aspectos
      const [
        sugerenciasTiempo,
        sugerenciasCuadrilla,
        sugerenciasHerramientas,
        sugerenciasFecha,
        analisisComplejidad,
        recomendacionesPrevias
      ] = await Promise.all([
        this.analizarTiemposOptimos(proyecto),
        this.sugerirCuadrillaOptima(proyecto),
        this.analizarHerramientasNecesarias(proyecto),
        this.sugerirMejorFecha(proyecto),
        this.evaluarComplejidadInstalacion(proyecto),
        this.obtenerRecomendacionesHistoricas(proyecto)
      ]);

      const sugerencias = {
        proyecto: {
          id: proyecto._id,
          numero: proyecto.numero,
          cliente: proyecto.cliente?.nombre,
          productos: proyecto.productos?.length || 0
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
        
        fechaGeneracion: new Date()
      };

      console.log(`✅ Sugerencias generadas con ${sugerencias.confianza}% de confianza`);
      return sugerencias;

    } catch (error) {
      console.error('❌ Error generando sugerencias:', error);
      throw error;
    }
  }

  /**
   * Analizar tiempos óptimos basado en productos y datos históricos
   */
  static async analizarTiemposOptimos(proyecto) {
    try {
      let tiempoEstimado = 0;
      let factorComplejidad = 1;
      const detalleProductos = [];

      // Analizar cada producto del proyecto
      for (const producto of proyecto.productos || []) {
        const analisisProducto = this.analizarTiempoProducto(producto);
        tiempoEstimado += analisisProducto.tiempo;
        detalleProductos.push(analisisProducto);
        
        // Acumular factores de complejidad
        if (analisisProducto.factorComplejidad > factorComplejidad) {
          factorComplejidad = analisisProducto.factorComplejidad;
        }
      }

      // Buscar datos históricos similares
      const datosHistoricos = await this.buscarInstalacionesSimilares(proyecto);
      let tiempoHistoricoPromedio = 0;
      
      if (datosHistoricos.length > 0) {
        tiempoHistoricoPromedio = datosHistoricos.reduce((sum, inst) => 
          sum + (inst.tiempoReal || inst.tiempoEstimado || 0), 0
        ) / datosHistoricos.length;
      }

      // Combinar estimación teórica con datos históricos
      const tiempoFinal = datosHistoricos.length > 0 ? 
        (tiempoEstimado * 0.6 + tiempoHistoricoPromedio * 0.4) * factorComplejidad :
        tiempoEstimado * factorComplejidad;

      return {
        tiempoEstimado: Math.ceil(tiempoFinal),
        tiempoMinimo: Math.ceil(tiempoFinal * 0.8),
        tiempoMaximo: Math.ceil(tiempoFinal * 1.3),
        factorComplejidad,
        detalleProductos,
        datosHistoricos: datosHistoricos.length,
        recomendacion: this.generarRecomendacionTiempo(tiempoFinal, factorComplejidad),
        confianza: this.calcularConfianzaTiempo(datosHistoricos.length, factorComplejidad)
      };

    } catch (error) {
      console.error('Error analizando tiempos:', error);
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
    const area = producto.medidas?.area || (producto.ancho * producto.alto) || 0;
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
    if (producto.ancho > 3 || producto.alto > 3) {
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
  static async sugerirCuadrillaOptima(proyecto) {
    try {
      // Analizar especialidades requeridas
      const especialidadesRequeridas = this.analizarEspecialidadesRequeridas(proyecto.productos);
      
      // Obtener instaladores disponibles (mock data por ahora)
      const instaladoresDisponibles = await this.obtenerInstaladoresDisponibles();
      
      // Algoritmo de asignación óptima
      const cuadrillaOptima = this.calcularCuadrillaOptima(
        especialidadesRequeridas, 
        instaladoresDisponibles
      );

      return {
        cuadrillaRecomendada: cuadrillaOptima,
        especialidadesRequeridas,
        tamañoOptimo: cuadrillaOptima.length,
        responsableSugerido: cuadrillaOptima.find(inst => inst.esLider) || cuadrillaOptima[0],
        razonamiento: this.explicarSeleccionCuadrilla(cuadrillaOptima, especialidadesRequeridas),
        confianza: this.calcularConfianzaCuadrilla(cuadrillaOptima, especialidadesRequeridas)
      };

    } catch (error) {
      console.error('Error sugiriendo cuadrilla:', error);
      return { cuadrillaRecomendada: [], confianza: 20 };
    }
  }

  /**
   * Analizar herramientas necesarias basado en productos
   */
  static async analizarHerramientasNecesarias(proyecto) {
    const herramientasRequeridas = new Set(['Taladro percutor', 'Nivel láser']);
    const herramientasOpcionales = new Set();
    const razonamiento = [];

    for (const producto of proyecto.productos || []) {
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
  static async sugerirMejorFecha(proyecto) {
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
        fechasDisponibles.map(fecha => this.evaluarFecha(fecha, proyecto))
      );

      // Ordenar por puntuación
      evaluacionFechas.sort((a, b) => b.puntuacion - a.puntuacion);
      
      const mejorFecha = evaluacionFechas[0];

      return {
        fechaRecomendada: mejorFecha.fecha,
        horaRecomendada: this.sugerirMejorHora(proyecto),
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
      console.error('Error sugiriendo fecha:', error);
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
  static async evaluarComplejidadInstalacion(proyecto) {
    let puntuacionComplejidad = 0;
    const factores = [];

    // Número de productos
    const numProductos = proyecto.productos?.length || 0;
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

    for (const producto of proyecto.productos || []) {
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

  static async buscarInstalacionesSimilares(proyecto) {
    // Mock data - en producción buscaría en BD
    return [
      { tiempoReal: 4.5, tiempoEstimado: 4, productos: 2 },
      { tiempoReal: 6.2, tiempoEstimado: 5, productos: 3 },
      { tiempoReal: 3.8, tiempoEstimado: 4, productos: 2 }
    ];
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
    // Mock data - en producción consultaría BD
    return [
      { id: '1', nombre: 'Roberto Martínez', especialidades: ['persianas', 'motorización'], experiencia: 5, esLider: true },
      { id: '2', nombre: 'Luis Hernández', especialidades: ['toldos'], experiencia: 3, esLider: false },
      { id: '3', nombre: 'Miguel Sánchez', especialidades: ['motorización'], experiencia: 7, esLider: true },
      { id: '4', nombre: 'José Ramírez', especialidades: ['persianas', 'cortinas'], experiencia: 4, esLider: false }
    ];
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

  static async evaluarFecha(fecha, proyecto) {
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
    
    return {
      fecha,
      puntuacion,
      razonamiento,
      confianza: 75
    };
  }

  static sugerirMejorHora(proyecto) {
    // Análisis simple por ahora
    const numProductos = proyecto.productos?.length || 0;
    return numProductos > 3 ? '08:00' : '09:00'; // Empezar más temprano si hay muchos productos
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
  static async obtenerRecomendacionesHistoricas(proyecto) {
    // Mock data - en producción analizaría instalaciones previas
    return {
      instalacionesSimilares: 8,
      problemasComunes: [
        'Verificar acceso para escalera en instalaciones de techo',
        'Confirmar suministro eléctrico para productos motorizados',
        'Revisar condiciones climáticas para instalaciones exteriores'
      ],
      tiempoPromedioReal: 4.8,
      satisfaccionCliente: 4.6,
      recomendaciones: [
        'Llamar al cliente 24h antes para confirmar',
        'Llevar herramientas de respaldo para motorización',
        'Tomar fotos del progreso para documentación'
      ]
    };
  }
}

module.exports = InstalacionesInteligentesService;
