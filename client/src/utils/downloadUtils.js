/**
 * Utilidades para manejo de descargas de archivos
 */

/**
 * Descarga un archivo blob usando el nombre especificado en el header Content-Disposition
 * @param {Blob} blob - El blob del archivo a descargar
 * @param {Object} responseHeaders - Headers de la respuesta HTTP
 * @param {string} fallbackName - Nombre de archivo por defecto si no se encuentra en headers
 */
export const downloadFileFromBlob = (blob, responseHeaders, fallbackName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Obtener el nombre del archivo desde el header Content-Disposition del servidor
  const contentDisposition = responseHeaders['content-disposition'];
  let fileName = fallbackName;
  
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1].replace(/['"]/g, '');
    }
  }
  
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Genera un nombre de archivo único con timestamp y ID aleatorio
 * @param {string} prefix - Prefijo del archivo (ej: "Levantamiento", "Cotizacion")
 * @param {string} clientName - Nombre del cliente
 * @param {string} extension - Extensión del archivo (ej: "pdf", "xlsx")
 * @param {string} additionalInfo - Información adicional opcional
 * @returns {string} Nombre de archivo único
 */
export const generateUniqueFileName = (prefix, clientName, extension, additionalInfo = '') => {
  const now = new Date();
  const dateFormatted = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeFormatted = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  const uniqueId = Math.random().toString(36).substr(2, 6); // ID aleatorio de 6 caracteres
  const cleanClientName = (clientName || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
  
  const parts = [prefix, cleanClientName];
  if (additionalInfo) {
    parts.push(additionalInfo);
  }
  parts.push(dateFormatted, timeFormatted, milliseconds, uniqueId);
  
  return `${parts.join('-')}.${extension}`;
};
