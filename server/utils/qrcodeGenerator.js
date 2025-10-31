const logger = require('../config/logger');

let qrLibrary;

try {
  // Intentar cargar la librería oficial si está disponible en el entorno
  // Permite que entornos con acceso a npm utilicen la implementación completa
  // sin impedir que otros entornos funcionen con el fallback.
  // eslint-disable-next-line global-require
  qrLibrary = require('qrcode');
} catch (error) {
  logger.warn('Librería qrcode no disponible, se utilizará generador base64', {
    context: 'qrcodeGenerator',
    error: error.message
  });
}

const buildFallbackDataUrl = text => {
  const payload = Buffer.from(String(text), 'utf8').toString('base64');
  return `data:text/plain;base64,${payload}`;
};

async function toDataURL(text) {
  if (qrLibrary && typeof qrLibrary.toDataURL === 'function') {
    return qrLibrary.toDataURL(text);
  }

  return buildFallbackDataUrl(text);
}

module.exports = {
  toDataURL
};
