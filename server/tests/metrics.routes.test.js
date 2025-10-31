const express = require('express');
const request = require('supertest');

jest.mock('../models/Metric', () => ({
  find: jest.fn(),
  obtenerEstadisticas: jest.fn(),
  aggregate: jest.fn()
}));

const Metric = require('../models/Metric');
const metricsRouter = require('../routes/metrics');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/metrics', metricsRouter);
  return app;
};

describe('Rutas de métricas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/metrics debe listar métricas con filtros', async () => {
    const metricas = [
      { tipo: 'performance', valor: 120 },
      { tipo: 'performance', valor: 95 }
    ];

    Metric.find.mockResolvedValueOnce(metricas);

    const response = await request(buildApp()).get(
      '/api/metrics?tipo=performance&endpoint=%2Fapi%2Fproyectos&metodo=GET&statusCode=200&desde=2024-01-01&hasta=2024-02-01&limit=10&skip=5'
    );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(metricas.length);
    expect(response.body.data).toEqual(metricas);

    const [filtros, , opciones] = Metric.find.mock.calls[0];
    expect(filtros).toMatchObject({
      tipo: 'performance',
      endpoint: '/api/proyectos',
      metodo: 'GET',
      statusCode: 200
    });
    expect(filtros.timestamp.$gte).toBeInstanceOf(Date);
    expect(filtros.timestamp.$lte).toBeInstanceOf(Date);
    expect(opciones).toMatchObject({
      sort: { timestamp: -1 },
      limit: 10,
      skip: 5
    });
  });

  test('GET /api/metrics/stats debe devolver estadísticas agregadas', async () => {
    const estadisticas = [
      { _id: 'performance', promedio: 120, minimo: 80, maximo: 200, total: 5 }
    ];

    Metric.obtenerEstadisticas.mockResolvedValueOnce(estadisticas);

    const response = await request(buildApp()).get('/api/metrics/stats');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(estadisticas);
    expect(Metric.obtenerEstadisticas).toHaveBeenCalled();
  });

  test('GET /api/metrics/performance debe agregar por endpoint con filtro y límite', async () => {
    const resultados = [
      { _id: '/api/proyectos', promedio: 150, minimo: 120, maximo: 200, total: 3 }
    ];

    Metric.aggregate.mockResolvedValueOnce(resultados);

    const response = await request(buildApp()).get('/api/metrics/performance?endpoint=%2Fapi%2Fproyectos&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(resultados);

    const pipeline = Metric.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({
      $match: { tipo: 'performance', endpoint: '/api/proyectos' }
    });
    expect(pipeline[1]).toEqual({
      $group: {
        _id: '$endpoint',
        promedio: { $avg: '$valor' },
        minimo: { $min: '$valor' },
        maximo: { $max: '$valor' },
        total: { $sum: 1 }
      }
    });
    expect(pipeline[2]).toEqual({ $sort: { promedio: -1 } });
    expect(pipeline[3]).toEqual({ $limit: 2 });
  });

  test('GET /api/metrics/errors debe devolver métricas de error con límite', async () => {
    const metricas = [
      { tipo: 'error', valor: 1 },
      { tipo: 'error', valor: 2 }
    ];

    Metric.find.mockResolvedValueOnce(metricas);

    const response = await request(buildApp()).get('/api/metrics/errors?endpoint=%2Fapi%2Fproyectos&limit=5');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(metricas.length);
    expect(response.body.data).toEqual(metricas);

    const [filtros, , opciones] = Metric.find.mock.calls[0];
    expect(filtros).toEqual({ tipo: 'error', endpoint: '/api/proyectos' });
    expect(opciones).toMatchObject({
      sort: { timestamp: -1 },
      limit: 5
    });
  });

  test('Las rutas deben manejar errores inesperados', async () => {
    Metric.obtenerEstadisticas.mockRejectedValueOnce(new Error('Fallo de base de datos'));

    const response = await request(buildApp()).get('/api/metrics/stats');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      message: 'Error obteniendo estadísticas de métricas'
    });
  });
});
