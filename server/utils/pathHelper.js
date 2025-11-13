/**
 * Path Helper - Utilidad para construcción correcta de rutas de archivos
 * 
 * PROBLEMA RESUELTO: Evitar errores de rutas relativas en lectura de archivos
 * 
 * USO:
 *   const { getAbsolutePath, getUploadPath } = require('../utils/pathHelper');
 *   const pdfPath = getAbsolutePath(cotizacion.pdfPath);
 *   const fabricacionPath = getUploadPath('fabricacion', 'etiqueta.pdf');
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Obtiene la ruta absoluta correcta desde una ruta relativa guardada en BD
 * 
 * @param {string} relativePath - Ruta relativa guardada en BD (ej: /uploads/cotizaciones/archivo.pdf)
 * @returns {string} Ruta absoluta correcta
 * 
 * @example
 * // BD guarda: /uploads/cotizaciones/COT-2025-0007.pdf
 * const absolutePath = getAbsolutePath(cotizacion.pdfPath);
 * // Resultado: C:\...\SUNDECK-APP-v2\server\uploads\cotizaciones\COT-2025-0007.pdf
 */
function getAbsolutePath(relativePath) {
  if (!relativePath) {
    throw new Error('relativePath es requerido');
  }

  // Remover slash inicial si existe
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // Construir ruta absoluta desde el directorio server
  // __dirname = C:\...\SUNDECK-APP-v2\server\utils
  // Subimos un nivel para llegar a server/
  const absolutePath = path.join(__dirname, '..', cleanPath);
  
  return absolutePath;
}

/**
 * Construye la ruta absoluta para un archivo en el directorio uploads
 * 
 * @param {string} subdirectory - Subdirectorio dentro de uploads (ej: 'cotizaciones', 'fabricacion')
 * @param {string} filename - Nombre del archivo
 * @returns {string} Ruta absoluta
 * 
 * @example
 * const pdfPath = getUploadPath('cotizaciones', 'COT-2025-0007.pdf');
 * // Resultado: C:\...\SUNDECK-APP-v2\server\uploads\cotizaciones\COT-2025-0007.pdf
 */
function getUploadPath(subdirectory, filename) {
  if (!subdirectory || !filename) {
    throw new Error('subdirectory y filename son requeridos');
  }

  // __dirname = C:\...\SUNDECK-APP-v2\server\utils
  const absolutePath = path.join(__dirname, '..', 'uploads', subdirectory, filename);
  
  return absolutePath;
}

/**
 * Construye la ruta relativa para guardar en BD
 * 
 * @param {string} subdirectory - Subdirectorio dentro de uploads
 * @param {string} filename - Nombre del archivo
 * @returns {string} Ruta relativa para BD
 * 
 * @example
 * const relativePath = getRelativePath('cotizaciones', 'COT-2025-0007.pdf');
 * // Resultado: /uploads/cotizaciones/COT-2025-0007.pdf
 */
function getRelativePath(subdirectory, filename) {
  if (!subdirectory || !filename) {
    throw new Error('subdirectory y filename son requeridos');
  }

  return `/uploads/${subdirectory}/${filename}`;
}

/**
 * Verifica si un archivo existe
 * 
 * @param {string} absolutePath - Ruta absoluta del archivo
 * @returns {Promise<boolean>} true si existe, false si no
 * 
 * @example
 * const exists = await fileExists(pdfPath);
 * if (!exists) {
 *   console.log('Archivo no encontrado');
 * }
 */
async function fileExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Crea el directorio si no existe
 * 
 * @param {string} subdirectory - Subdirectorio dentro de uploads
 * @returns {Promise<string>} Ruta absoluta del directorio creado
 * 
 * @example
 * await ensureUploadDirectory('fabricacion');
 */
async function ensureUploadDirectory(subdirectory) {
  const dirPath = path.join(__dirname, '..', 'uploads', subdirectory);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Obtiene información del archivo
 * 
 * @param {string} absolutePath - Ruta absoluta del archivo
 * @returns {Promise<Object>} Información del archivo (size, mtime, etc.)
 * 
 * @example
 * const info = await getFileInfo(pdfPath);
 * console.log('Tamaño:', info.size, 'bytes');
 */
async function getFileInfo(absolutePath) {
  try {
    const stats = await fs.stat(absolutePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    throw new Error(`No se pudo obtener información del archivo: ${error.message}`);
  }
}

module.exports = {
  getAbsolutePath,
  getUploadPath,
  getRelativePath,
  fileExists,
  ensureUploadDirectory,
  getFileInfo
};
