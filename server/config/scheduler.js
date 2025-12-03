const cron = require('node-cron');
const logger = require('./logger');
const generarSnapshotKPIs = require('../scripts/generarSnapshotKPIs');

const initScheduledJobs = () => {
  // Tarea programada para ejecutarse todos los días a las 23:55
  // Formato cron: (minutos horas día-del-mes mes día-de-la-semana)
  const schedule = '55 23 * * *';

  logger.info(`⏰ Tarea programada de snapshot de KPIs configurada para ejecutarse diariamente a las ${schedule}.`);

  cron.schedule(schedule, async () => {
    logger.info('Activando tarea programada: generando snapshot de KPIs...', { 
      script: 'scheduler.js', 
      timestamp: new Date().toISOString() 
    });
    
    try {
      // No es necesario esperar (await) aquí, ya que el script se ejecuta en segundo plano.
      // Si se necesita un manejo más complejo (ej. evitar ejecuciones simultáneas), se puede añadir.
      generarSnapshotKPIs();
    } catch (error) {
      logger.error('La tarea programada de snapshot de KPIs falló al iniciar.', {
        script: 'scheduler.js',
        error: error.message,
        stack: error.stack,
      });
    }
  }, {
    scheduled: true,
    timezone: "America/Mexico_City" // Asegura que se ejecute en la zona horaria correcta
  });
};

module.exports = { initScheduledJobs };
