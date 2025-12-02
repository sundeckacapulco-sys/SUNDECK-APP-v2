/**
 * REGLA DE NEGOCIO: Mínimo cobrable = 1 m² por dimensión
 * 
 * Si una dimensión (ancho o alto) es menor a 1m, se cobra como si fuera 1m.
 * Esto aplica para cotizaciones y cálculos de precio.
 * 
 * Ejemplos:
 * - 0.72 × 2.34 = 1.68 m² real → se cobra como 1.00 × 2.34 = 2.34 m²
 * - 0.50 × 0.80 = 0.40 m² real → se cobra como 1.00 × 1.00 = 1.00 m²
 * - 1.50 × 2.00 = 3.00 m² real → se cobra como 1.50 × 2.00 = 3.00 m² (sin cambio)
 */

const MINIMO_DIMENSION_METROS = 1.0;

/**
 * Aplica el mínimo de 1m a una dimensión
 * @param {number} dimension - Dimensión en metros
 * @returns {number} - Dimensión ajustada (mínimo 1m)
 */
export const aplicarMinimoDimension = (dimension) => {
  const valor = parseFloat(dimension) || 0;
  return Math.max(valor, MINIMO_DIMENSION_METROS);
};

/**
 * Calcula el área cobrable aplicando el mínimo de 1m por dimensión
 * @param {number} ancho - Ancho en metros
 * @param {number} alto - Alto en metros
 * @returns {object} - { areaReal, areaCobrable, anchoAjustado, altoAjustado }
 */
export const calcularAreaCobrable = (ancho, alto) => {
  const anchoReal = parseFloat(ancho) || 0;
  const altoReal = parseFloat(alto) || 0;
  
  const anchoAjustado = aplicarMinimoDimension(anchoReal);
  const altoAjustado = aplicarMinimoDimension(altoReal);
  
  const areaReal = anchoReal * altoReal;
  const areaCobrable = anchoAjustado * altoAjustado;
  
  return {
    areaReal: parseFloat(areaReal.toFixed(4)),
    areaCobrable: parseFloat(areaCobrable.toFixed(4)),
    anchoReal,
    altoReal,
    anchoAjustado,
    altoAjustado,
    tieneAjuste: areaReal !== areaCobrable
  };
};

/**
 * Calcula el área cobrable simple (solo retorna el número)
 * @param {number} ancho - Ancho en metros
 * @param {number} alto - Alto en metros
 * @returns {number} - Área cobrable en m²
 */
export const calcularAreaCobrableSimple = (ancho, alto) => {
  const anchoAjustado = aplicarMinimoDimension(parseFloat(ancho) || 0);
  const altoAjustado = aplicarMinimoDimension(parseFloat(alto) || 0);
  return anchoAjustado * altoAjustado;
};

/**
 * Formatea el texto de área mostrando real vs cobrable si hay diferencia
 * @param {number} ancho - Ancho en metros
 * @param {number} alto - Alto en metros
 * @returns {string} - Texto formateado
 */
export const formatearAreaConMinimo = (ancho, alto) => {
  const { areaReal, areaCobrable, tieneAjuste } = calcularAreaCobrable(ancho, alto);
  
  if (tieneAjuste) {
    return `${areaReal.toFixed(2)} m² → ${areaCobrable.toFixed(2)} m² (mín. 1m)`;
  }
  
  return `${areaReal.toFixed(2)} m²`;
};

export default {
  aplicarMinimoDimension,
  calcularAreaCobrable,
  calcularAreaCobrableSimple,
  formatearAreaConMinimo,
  MINIMO_DIMENSION_METROS
};
