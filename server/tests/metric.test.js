const mongoose = require('mongoose');
const Metric = require('../models/Metric');

const TEST_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/sundeck-test';

describe('Modelo Metric', () => {
  beforeAll(async () => {
    mongoose.set('strictQuery', false);
    await mongoose.connect(TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    await Metric.deleteMany({});
  });

  afterAll(async () => {
    await Metric.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Metric.deleteMany({});
  });

  test('Debe crear una métrica correctamente', async () => {
    const metric = await Metric.registrar('performance', 150, {
      endpoint: '/api/prospectos',
      metodo: 'GET'
    });

    expect(metric).toBeDefined();
    expect(metric.tipo).toBe('performance');
    expect(metric.valor).toBe(150);
    expect(metric.metadata.endpoint).toBe('/api/prospectos');
    expect(metric.endpoint).toBe('/api/prospectos');
    expect(metric.metodo).toBe('GET');
  });

  test('Debe obtener métricas por período', async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    await Metric.create([
      { tipo: 'performance', valor: 100, timestamp: startOfMonth },
      { tipo: 'performance', valor: 120, timestamp: endOfMonth },
      { tipo: 'error', valor: 1, timestamp: new Date(now.getFullYear(), now.getMonth() - 1, 15) }
    ]);

    const metricas = await Metric.obtenerPorPeriodo(startOfMonth, endOfMonth);

    expect(Array.isArray(metricas)).toBe(true);
    expect(metricas.length).toBe(2);
    expect(metricas[0].timestamp.getTime()).toBeGreaterThanOrEqual(startOfMonth.getTime());
    expect(metricas[0].timestamp.getTime()).toBeLessThanOrEqual(endOfMonth.getTime());
  });

  test('Debe agregar métricas por tipo', async () => {
    await Metric.create([
      { tipo: 'performance', valor: 100, timestamp: new Date('2025-10-29T08:00:00Z') },
      { tipo: 'performance', valor: 200, timestamp: new Date('2025-10-29T09:00:00Z') },
      { tipo: 'performance', valor: 150, timestamp: new Date('2025-10-30T10:00:00Z') }
    ]);

    const agregadas = await Metric.agregarPorTipo('performance', 'dia');

    expect(Array.isArray(agregadas)).toBe(true);
    expect(agregadas.length).toBeGreaterThan(0);
    expect(agregadas[0]).toHaveProperty('promedio');
    expect(agregadas[0]).toHaveProperty('minimo');
    expect(agregadas[0]).toHaveProperty('maximo');
    expect(agregadas[0]).toHaveProperty('total');
  });
});
