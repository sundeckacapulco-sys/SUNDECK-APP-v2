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
  console.log('🔧 downloadFileFromBlob iniciado');
  console.log('📊 Blob size:', blob.size, 'bytes');
  console.log('📋 Response headers:', responseHeaders);
  console.log('📁 Fallback name:', fallbackName);
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Obtener el nombre del archivo desde el header Content-Disposition del servidor
  const contentDisposition = responseHeaders['content-disposition'];
  let fileName = fallbackName;
  
  console.log('📄 Content-Disposition header:', contentDisposition);
  
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1].replace(/['"]/g, '');
      console.log('✅ Nombre extraído del servidor:', fileName);
    } else {
      console.log('⚠️ No se pudo extraer nombre del header, usando fallback');
    }
  } else {
    console.log('⚠️ No hay Content-Disposition header, usando fallback');
  }
  
  console.log('📁 Nombre final del archivo:', fileName);
  
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  console.log('✅ Descarga iniciada');
};

/**
 * Genera un nombre de archivo consistente basado en contenido
 * @param {string} prefix - Prefijo del archivo (ej: "Levantamiento", "Cotizacion")
 * @param {string} clientName - Nombre del cliente
 * @param {string} extension - Extensión del archivo (ej: "pdf", "xlsx")
 * @param {string} identifier - Identificador único del documento (ID, número, etc.)
 * @param {Date} baseDate - Fecha base del documento (opcional)
 * @returns {string} Nombre de archivo consistente
 */
export const generateConsistentFileName = (prefix, clientName, extension, identifier = '', baseDate = null) => {
  const cleanClientName = (clientName || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
  const dateFormatted = baseDate ? baseDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  // Generar hash simple basado en el identificador
  let hash = '';
  if (identifier) {
    hash = identifier.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
    }, 0).toString(16).substring(0, 8);
  }
  
  const parts = [prefix, cleanClientName, dateFormatted];
  if (hash) {
    parts.push(hash);
  }
  
  return `${parts.join('-')}.${extension}`;
};

/**
 * Genera un nombre de archivo único con timestamp (para casos donde se necesite unicidad temporal)
 * @param {string} prefix - Prefijo del archivo
 * @param {string} clientName - Nombre del cliente
 * @param {string} extension - Extensión del archivo
 * @returns {string} Nombre de archivo único
 */
export const generateUniqueFileName = (prefix, clientName, extension) => {
  const now = new Date();
  const timeFormatted = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  const uniqueId = Math.random().toString(36).substr(2, 6);
  
  return generateConsistentFileName(prefix, clientName, extension, `${timeFormatted}-${milliseconds}-${uniqueId}`, now);
};
