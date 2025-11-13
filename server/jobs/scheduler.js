/**
 * SCHEDULER - SISTEMA DE AUTOMATIZACIÓN INTELIGENTE
 * Gestiona jobs automáticos para alertas y actualizaciones de estado
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const alertasProspectos = require('./alertasProspectos');
const alertasProyectos = require('./alertasProyectos');
const alertasInstalaciones = require('./alertasInstalaciones');
const actualizacionEstadosAutomatica = require('./actualizacionEstadosAutomatica');

class Scheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Iniciar todos los jobs programados
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler ya está en ejecución', { service: 'scheduler' });
      return;
    }

    logger.info('Iniciando Scheduler de automatización inteligente', {
      service: 'scheduler',
      fecha: new Date()
    });

    // JOB 1: Alertas de prospectos inactivos (diario a las 9:00 AM)
    const jobProspectos = cron.schedule('0 9 * * *', async () => {
      logger.info('Ejecutando job: Alertas de prospectos inactivos', {
        service: 'scheduler',
        job: 'alertasProspectos'
      });

      try {
        const resultado = await alertasProspectos();
        logger.info('Job completado: Alertas de prospectos', {
          service: 'scheduler',
          job: 'alertasProspectos',
          resultado
        });
      } catch (error) {
        logger.error('Error en job de alertas de prospectos', {
          service: 'scheduler',
          job: 'alertasProspectos',
          error: error.message
        });
      }
    });

    // JOB 2: Alertas de proyectos sin movimiento (diario a las 10:00 AM)
    const jobProyectos = cron.schedule('0 10 * * *', async () => {
      logger.info('Ejecutando job: Alertas de proyectos sin movimiento', {
        service: 'scheduler',
        job: 'alertasProyectos'
      });

      try {
        const resultado = await alertasProyectos();
        logger.info('Job completado: Alertas de proyectos', {
          service: 'scheduler',
          job: 'alertasProyectos',
          resultado
        });
      } catch (error) {
        logger.error('Error en job de alertas de proyectos', {
          service: 'scheduler',
          job: 'alertasProyectos',
          error: error.message
        });
      }
    });

    // JOB 3: Alertas de instalaciones retrasadas (diario a las 8:00 AM)
    const jobInstalaciones = cron.schedule('0 8 * * *', async () => {
      logger.info('Ejecutando job: Alertas de instalaciones retrasadas', {
        service: 'scheduler',
        job: 'alertasInstalaciones'
      });

      try {
        const resultado = await alertasInstalaciones();
        logger.info('Job completado: Alertas de instalaciones', {
          service: 'scheduler',
          job: 'alertasInstalaciones',
          resultado
        });
      } catch (error) {
        logger.error('Error en job de alertas de instalaciones', {
          service: 'scheduler',
          job: 'alertasInstalaciones',
          error: error.message
        });
      }
    });

    // JOB 4: Actualización automática de estados (cada 6 horas)
    const jobEstados = cron.schedule('0 */6 * * *', async () => {
      logger.info('Ejecutando job: Actualización automática de estados', {
        service: 'scheduler',
        job: 'actualizacionEstados'
      });

      try {
        const resultado = await actualizacionEstadosAutomatica();
        logger.info('Job completado: Actualización de estados', {
          service: 'scheduler',
          job: 'actualizacionEstados',
          resultado
        });
      } catch (error) {
        logger.error('Error en job de actualización de estados', {
          service: 'scheduler',
          job: 'actualizacionEstados',
          error: error.message
        });
      }
    });

    this.jobs = [
      { name: 'alertasProspectos', cron: jobProspectos, schedule: '0 9 * * *' },
      { name: 'alertasProyectos', cron: jobProyectos, schedule: '0 10 * * *' },
      { name: 'alertasInstalaciones', cron: jobInstalaciones, schedule: '0 8 * * *' },
      { name: 'actualizacionEstados', cron: jobEstados, schedule: '0 */6 * * *' }
    ];

    this.isRunning = true;

    logger.info('Scheduler iniciado exitosamente', {
      service: 'scheduler',
      totalJobs: this.jobs.length,
      jobs: this.jobs.map(j => ({ name: j.name, schedule: j.schedule }))
    });
  }

  /**
   * Detener todos los jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler no está en ejecución', { service: 'scheduler' });
      return;
    }

    logger.info('Deteniendo Scheduler', { service: 'scheduler' });

    this.jobs.forEach(job => {
      job.cron.stop();
      logger.info(`Job detenido: ${job.name}`, { service: 'scheduler' });
    });

    this.jobs = [];
    this.isRunning = false;

    logger.info('Scheduler detenido exitosamente', { service: 'scheduler' });
  }

  /**
   * Obtener estado del scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalJobs: this.jobs.length,
      jobs: this.jobs.map(j => ({
        name: j.name,
        schedule: j.schedule,
        nextExecution: this.getNextExecution(j.schedule)
      }))
    };
  }

  /**
   * Calcular próxima ejecución de un cron
   */
  getNextExecution(cronExpression) {
    try {
      const [minuto, hora] = cronExpression.trim().split(' ');
      const ahora = new Date();
      const proxima = new Date(ahora);
      proxima.setSeconds(0, 0);

      const minutoNumero = Number.parseInt(minuto, 10);
      if (!Number.isFinite(minutoNumero)) {
        throw new Error('Expresión de minuto no soportada');
      }

      proxima.setMinutes(minutoNumero);

      if (hora?.startsWith('*/')) {
        const intervalo = Number.parseInt(hora.replace('*/', ''), 10);
        if (!Number.isFinite(intervalo) || intervalo <= 0) {
          throw new Error('Intervalo de horas inválido');
        }

        let proximaHora = Math.ceil((ahora.getHours() + (ahora.getMinutes() >= minutoNumero ? 0.01 : 0)) / intervalo) * intervalo;
        if (proximaHora === ahora.getHours() && ahora.getMinutes() < minutoNumero) {
          proximaHora = ahora.getHours();
        }

        while (proximaHora <= ahora.getHours() && proxima <= ahora) {
          proximaHora += intervalo;
        }

        while (proximaHora >= 24) {
          proximaHora -= 24;
          proxima.setDate(proxima.getDate() + 1);
        }

        proxima.setHours(proximaHora);
      } else {
        const horaNumero = Number.parseInt(hora, 10);
        if (!Number.isFinite(horaNumero)) {
          throw new Error('Expresión de hora no soportada');
        }

        proxima.setHours(horaNumero);

        if (proxima <= ahora) {
          proxima.setDate(proxima.getDate() + 1);
        }
      }

      return proxima.toISOString();
    } catch (error) {
      logger.warn('No se pudo calcular la siguiente ejecución del cron', {
        service: 'scheduler',
        cronExpression,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Ejecutar un job manualmente (para testing)
   */
  async runJobManually(jobName) {
    logger.info(`Ejecutando job manualmente: ${jobName}`, {
      service: 'scheduler',
      manual: true
    });

    try {
      let resultado;

      switch (jobName) {
        case 'alertasProspectos':
          resultado = await alertasProspectos();
          break;
        case 'alertasProyectos':
          resultado = await alertasProyectos();
          break;
        case 'alertasInstalaciones':
          resultado = await alertasInstalaciones();
          break;
        case 'actualizacionEstados':
          resultado = await actualizacionEstadosAutomatica();
          break;
        default:
          throw new Error(`Job no encontrado: ${jobName}`);
      }

      logger.info(`Job manual completado: ${jobName}`, {
        service: 'scheduler',
        resultado
      });

      return resultado;
    } catch (error) {
      logger.error(`Error en job manual: ${jobName}`, {
        service: 'scheduler',
        error: error.message
      });
      throw error;
    }
  }
}

// Exportar instancia única (singleton)
const scheduler = new Scheduler();

module.exports = scheduler;
