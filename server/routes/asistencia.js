const express = require('express');
const Proyecto = require('../models/Proyecto');
const { auth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Calcular distancia entre dos coordenadas (fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

// POST /api/asistencia/check-in/:proyectoId
router.post('/check-in/:proyectoId', auth, async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const { ubicacion, foto, observaciones } = req.body;

    // Validaciones
    if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
      return res.status(400).json({ 
        message: 'Se requiere la ubicación (latitud y longitud)' 
      });
    }

    // Buscar proyecto
    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Verificar que no haya check-in previo sin check-out
    if (proyecto.instalacion?.ejecucion?.checkIn?.fecha && 
        !proyecto.instalacion?.ejecucion?.checkOut?.fecha) {
      return res.status(400).json({ 
        message: 'Ya existe un check-in activo. Debe hacer check-out primero.' 
      });
    }

    // Calcular distancia al sitio del cliente
    let distanciaAlSitio = null;
    let enSitio = false;
    
    if (proyecto.cliente?.direccion?.coordenadas?.lat && 
        proyecto.cliente?.direccion?.coordenadas?.lng) {
      distanciaAlSitio = calcularDistancia(
        ubicacion.lat,
        ubicacion.lng,
        proyecto.cliente.direccion.coordenadas.lat,
        proyecto.cliente.direccion.coordenadas.lng
      );
      enSitio = distanciaAlSitio <= 100; // Dentro de 100 metros
    }

    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    // Registrar check-in
    if (!proyecto.instalacion) {
      proyecto.instalacion = {};
    }
    if (!proyecto.instalacion.ejecucion) {
      proyecto.instalacion.ejecucion = {};
    }

    proyecto.instalacion.ejecucion.checkIn = {
      fecha: ahora,
      hora: horaActual,
      usuario: req.usuario._id,
      nombreUsuario: req.usuario.nombre,
      ubicacion: {
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        precision: ubicacion.precision || null,
        direccion: ubicacion.direccion || null
      },
      distanciaAlSitio,
      enSitio,
      foto: foto || null,
      observaciones: observaciones || null
    };

    // Actualizar estado de instalación
    if (proyecto.instalacion.estado === 'programada') {
      proyecto.instalacion.estado = 'en_ruta';
    }

    // Calcular puntualidad
    if (proyecto.instalacion?.programacion?.horaInicio) {
      const horaProgramada = proyecto.instalacion.programacion.horaInicio;
      const [horaP, minP] = horaProgramada.split(':').map(Number);
      const [horaR, minR] = horaActual.split(':').map(Number);
      
      const minutosProgramados = horaP * 60 + minP;
      const minutosReales = horaR * 60 + minR;
      const diferencia = minutosReales - minutosProgramados;

      if (!proyecto.instalacion.ejecucion.metricas) {
        proyecto.instalacion.ejecucion.metricas = {};
      }
      proyecto.instalacion.ejecucion.metricas.puntualidad = diferencia;
      proyecto.instalacion.ejecucion.metricas.fueronPuntuales = Math.abs(diferencia) <= 15; // ±15 min
    }

    proyecto.actualizado_por = req.usuario._id;
    await proyecto.save();

    logger.info('Check-in registrado exitosamente', {
      proyectoId,
      usuario: req.usuario.nombre,
      ubicacion: `${ubicacion.lat}, ${ubicacion.lng}`,
      distanciaAlSitio,
      enSitio,
      hora: horaActual
    });

    res.json({
      message: 'Check-in registrado exitosamente',
      checkIn: proyecto.instalacion.ejecucion.checkIn,
      enSitio,
      distanciaAlSitio: distanciaAlSitio ? Math.round(distanciaAlSitio) : null,
      alertas: !enSitio && distanciaAlSitio > 100 ? 
        [`Estás a ${Math.round(distanciaAlSitio)}m del sitio`] : []
    });

  } catch (error) {
    logger.error('Error en check-in', {
      error: error.message,
      stack: error.stack,
      proyectoId: req.params.proyectoId,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({ 
      message: 'Error al registrar check-in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/asistencia/check-out/:proyectoId
router.post('/check-out/:proyectoId', auth, async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const { ubicacion, foto, observaciones, trabajoCompletado } = req.body;

    // Validaciones
    if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
      return res.status(400).json({ 
        message: 'Se requiere la ubicación (latitud y longitud)' 
      });
    }

    // Buscar proyecto
    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Verificar que exista check-in
    if (!proyecto.instalacion?.ejecucion?.checkIn?.fecha) {
      return res.status(400).json({ 
        message: 'No existe check-in registrado. Debe hacer check-in primero.' 
      });
    }

    // Verificar que no haya check-out previo
    if (proyecto.instalacion?.ejecucion?.checkOut?.fecha) {
      return res.status(400).json({ 
        message: 'Ya existe un check-out registrado para este check-in.' 
      });
    }

    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    // Calcular tiempo total en sitio
    const checkInDate = new Date(proyecto.instalacion.ejecucion.checkIn.fecha);
    const tiempoTotal = Math.round((ahora - checkInDate) / 60000); // minutos

    // Registrar check-out
    proyecto.instalacion.ejecucion.checkOut = {
      fecha: ahora,
      hora: horaActual,
      usuario: req.usuario._id,
      nombreUsuario: req.usuario.nombre,
      ubicacion: {
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        precision: ubicacion.precision || null,
        direccion: ubicacion.direccion || null
      },
      tiempoTotal,
      trabajoCompletado: trabajoCompletado !== false, // default true
      foto: foto || null,
      observaciones: observaciones || null
    };

    // Actualizar fechas de ejecución
    proyecto.instalacion.ejecucion.fechaInicioReal = checkInDate;
    proyecto.instalacion.ejecucion.fechaFinReal = ahora;
    proyecto.instalacion.ejecucion.horasReales = (tiempoTotal / 60).toFixed(2);

    // Calcular métricas de eficiencia
    if (!proyecto.instalacion.ejecucion.metricas) {
      proyecto.instalacion.ejecucion.metricas = {};
    }
    
    proyecto.instalacion.ejecucion.metricas.tiempoEnSitio = tiempoTotal;

    if (proyecto.instalacion?.programacion?.tiempoEstimado) {
      const tiempoEstimado = proyecto.instalacion.programacion.tiempoEstimado;
      const eficiencia = ((tiempoEstimado / tiempoTotal) * 100).toFixed(1);
      proyecto.instalacion.ejecucion.metricas.eficiencia = parseFloat(eficiencia);
      proyecto.instalacion.ejecucion.metricas.fueronEficientes = eficiencia >= 80; // 80% o más
    }

    // Actualizar estado de instalación
    if (trabajoCompletado !== false) {
      proyecto.instalacion.estado = 'completada';
      proyecto.estadoComercial = 'completado';
    }

    proyecto.actualizado_por = req.usuario._id;
    await proyecto.save();

    logger.info('Check-out registrado exitosamente', {
      proyectoId,
      usuario: req.usuario.nombre,
      tiempoTotal,
      trabajoCompletado,
      eficiencia: proyecto.instalacion.ejecucion.metricas.eficiencia,
      puntualidad: proyecto.instalacion.ejecucion.metricas.puntualidad
    });

    res.json({
      message: 'Check-out registrado exitosamente',
      checkOut: proyecto.instalacion.ejecucion.checkOut,
      metricas: proyecto.instalacion.ejecucion.metricas,
      resumen: {
        tiempoTotal: `${Math.floor(tiempoTotal / 60)}h ${tiempoTotal % 60}m`,
        eficiencia: proyecto.instalacion.ejecucion.metricas.eficiencia 
          ? `${proyecto.instalacion.ejecucion.metricas.eficiencia}%` 
          : 'N/A',
        puntualidad: proyecto.instalacion.ejecucion.metricas.puntualidad 
          ? `${proyecto.instalacion.ejecucion.metricas.puntualidad > 0 ? '+' : ''}${proyecto.instalacion.ejecucion.metricas.puntualidad} min` 
          : 'N/A'
      }
    });

  } catch (error) {
    logger.error('Error en check-out', {
      error: error.message,
      stack: error.stack,
      proyectoId: req.params.proyectoId,
      usuario: req.usuario?.nombre
    });
    res.status(500).json({ 
      message: 'Error al registrar check-out',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/asistencia/estado/:proyectoId
router.get('/estado/:proyectoId', auth, async (req, res) => {
  try {
    const { proyectoId } = req.params;

    const proyecto = await Proyecto.findById(proyectoId)
      .select('instalacion.ejecucion.checkIn instalacion.ejecucion.checkOut instalacion.ejecucion.metricas instalacion.programacion');

    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const checkIn = proyecto.instalacion?.ejecucion?.checkIn;
    const checkOut = proyecto.instalacion?.ejecucion?.checkOut;
    const metricas = proyecto.instalacion?.ejecucion?.metricas;

    res.json({
      tieneCheckIn: !!checkIn?.fecha,
      tieneCheckOut: !!checkOut?.fecha,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      metricas: metricas || null,
      estado: !checkIn?.fecha ? 'sin_iniciar' : 
              (checkIn?.fecha && !checkOut?.fecha) ? 'en_curso' : 'completado'
    });

  } catch (error) {
    logger.error('Error obteniendo estado de asistencia', {
      error: error.message,
      proyectoId: req.params.proyectoId
    });
    res.status(500).json({ message: 'Error al obtener estado' });
  }
});

// GET /api/asistencia/reporte-diario/:fecha
router.get('/reporte-diario/:fecha', auth, async (req, res) => {
  try {
    const { fecha } = req.params;
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    const proyectos = await Proyecto.find({
      'instalacion.ejecucion.checkIn.fecha': {
        $gte: fechaInicio,
        $lte: fechaFin
      }
    }).select('numero cliente instalacion.ejecucion instalacion.programacion');

    const reporte = proyectos.map(p => ({
      proyectoId: p._id,
      numero: p.numero,
      cliente: p.cliente?.nombre,
      checkIn: p.instalacion?.ejecucion?.checkIn,
      checkOut: p.instalacion?.ejecucion?.checkOut,
      metricas: p.instalacion?.ejecucion?.metricas,
      programacion: p.instalacion?.programacion
    }));

    // Calcular estadísticas
    const stats = {
      total: reporte.length,
      completados: reporte.filter(r => r.checkOut?.fecha).length,
      enCurso: reporte.filter(r => r.checkIn?.fecha && !r.checkOut?.fecha).length,
      puntuales: reporte.filter(r => r.metricas?.fueronPuntuales).length,
      eficientes: reporte.filter(r => r.metricas?.fueronEficientes).length,
      promedioTiempo: reporte.reduce((sum, r) => sum + (r.metricas?.tiempoEnSitio || 0), 0) / reporte.length || 0
    };

    res.json({
      fecha,
      reporte,
      estadisticas: stats
    });

  } catch (error) {
    logger.error('Error generando reporte diario', {
      error: error.message,
      fecha: req.params.fecha
    });
    res.status(500).json({ message: 'Error al generar reporte' });
  }
});

module.exports = router;
