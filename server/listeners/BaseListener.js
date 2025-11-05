const logger = require('../config/logger');

class BaseListener {
  constructor(nombre) {
    this.nombre = nombre;
  }

  async handle() {
    throw new Error('Método handle() debe ser implementado');
  }

  log(mensaje, datos = {}) {
    logger.info(mensaje, {
      listener: this.nombre,
      ...datos
    });
  }

  logWarn(mensaje, datos = {}) {
    logger.warn(mensaje, {
      listener: this.nombre,
      ...datos
    });
  }

  logError(mensaje, error, datos = {}) {
    logger.error(mensaje, {
      listener: this.nombre,
      error: error.message,
      stack: error.stack,
      ...datos
    });
  }
}

module.exports = BaseListener;
