/**
 * Script de prueba para optimización de cortes de madera (galería)
 * 
 * Reglas:
 * - Tabla estándar: 2.40m
 * - Sobrante útil mínimo: 0.50m (menor es desperdicio)
 * - Si ancho > 2.40m: se unen tablas
 */

const OptimizadorCortesService = require('../services/optimizadorCortesService');

console.log('🪵 PRUEBA DE OPTIMIZACIÓN DE MADERA (GALERÍA)\n');
console.log('='.repeat(60));

// Caso 1: Pieza simple que deja sobrante útil
console.log('\n📐 CASO 1: Ancho 1.80m (sobrante útil)');
const caso1 = OptimizadorCortesService.calcularCorteMaderaSingle(1.80);
console.log(caso1);

// Caso 2: Pieza simple que deja desperdicio
console.log('\n📐 CASO 2: Ancho 2.10m (desperdicio)');
const caso2 = OptimizadorCortesService.calcularCorteMaderaSingle(2.10);
console.log(caso2);

// Caso 3: Pieza que requiere unión
console.log('\n📐 CASO 3: Ancho 4.00m (unión de tablas)');
const caso3 = OptimizadorCortesService.calcularCorteMaderaSingle(4.00);
console.log(caso3);

// Caso 4: Optimización grupal
console.log('\n' + '='.repeat(60));
console.log('📦 CASO 4: OPTIMIZACIÓN GRUPAL (múltiples piezas)');
console.log('='.repeat(60));

const piezasConGaleria = [
  { numero: 1, ubicacion: 'Sala', ancho: 1.80 },
  { numero: 2, ubicacion: 'Comedor', ancho: 1.50 },
  { numero: 3, ubicacion: 'Recámara', ancho: 4.00 },
  { numero: 4, ubicacion: 'Estudio', ancho: 0.90 }
];

// Sin sobrantes en almacén
console.log('\n🆕 Sin sobrantes en almacén:');
const resultado1 = OptimizadorCortesService.optimizarCortesMadera(piezasConGaleria, []);
console.log('Resumen:', resultado1.resumen);
console.log('Tablas nuevas:', resultado1.tablasNuevas.length);
console.log('Sobrantes generados:', resultado1.sobrantesGenerados);

// Con sobrantes en almacén
console.log('\n♻️ Con sobrantes en almacén (1.60m y 0.80m):');
const sobrantesAlmacen = [
  { id: 'SOB-001', longitud: 1.60 },
  { id: 'SOB-002', longitud: 0.80 }
];
const resultado2 = OptimizadorCortesService.optimizarCortesMadera(piezasConGaleria, sobrantesAlmacen);
console.log('Resumen:', resultado2.resumen);
console.log('Sobrantes usados:', resultado2.sobrantesUsados);
console.log('Tablas nuevas:', resultado2.tablasNuevas.length);

console.log('\n✅ Prueba completada');
