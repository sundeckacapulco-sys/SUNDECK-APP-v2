jest.mock('../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../models/Metric', () => ({
  create: jest.fn()
}));

const logger = require('../config/logger');
const Metric = require('../models/Metric');
const metricsMiddleware = require('../middleware/metricsMiddleware');

describe('Middleware de Métricas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Metric.create.mockResolvedValue({});
  });

  const runMiddleware = async ({
    method = 'GET',
    path = '/api/test',
    originalUrl,
    statusCode = 200,
    user
  } = {}) => {
    const finishHandlers = [];
    const req = {
      method,
      path,
      originalUrl: originalUrl ?? path,
      user
    };

    const res = {
      statusCode,
      on: (event, handler) => {
        if (event === 'finish') {
          finishHandlers.push(handler);
        }
      }
    };

    const next = jest.fn();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();

    await Promise.all(finishHandlers.map(handler => handler()));

    return { req, res };
  };

  test('registra métricas de performance al finalizar la respuesta', async () => {
    await runMiddleware({
      path: '/api/proyectos/test',
      statusCode: 201
    });

    expect(Metric.create).toHaveBeenCalledTimes(1);
    const [payload] = Metric.create.mock.calls[0];

    expect(payload.tipo).toBe('performance');
    expect(typeof payload.valor).toBe('number');
    expect(payload.valor).toBeGreaterThanOrEqual(0);
    expect(payload.endpoint).toBe('/api/proyectos/test');
    expect(payload.metodo).toBe('GET');
    expect(payload.statusCode).toBe(201);
    expect(payload.duracion).toBeGreaterThanOrEqual(0);
    expect(payload.metadata).toMatchObject({
      endpoint: '/api/proyectos/test',
      metodo: 'GET',
      statusCode: 201,
      duracion: payload.duracion
    });
    expect(payload.timestamp).toBeInstanceOf(Date);
  });

  test('incluye el identificador de usuario cuando está disponible', async () => {
    await runMiddleware({
      path: '/api/cotizaciones/demo',
      user: { _id: 'user-123' }
    });

    expect(Metric.create).toHaveBeenCalledTimes(1);
    const [payload] = Metric.create.mock.calls[0];
    expect(payload.metadata.userId).toBe('user-123');
  });

  test('registra errores en el logger cuando la inserción falla', async () => {
    Metric.create.mockRejectedValueOnce(new Error('DB error'));

    await runMiddleware({ path: '/api/instalaciones' });

    expect(logger.error).toHaveBeenCalledWith(
      'Error guardando métrica',
      expect.objectContaining({
        error: 'DB error',
        statusCode: 200,
        endpoint: '/api/instalaciones',
        method: 'GET'
      })
    );
  });
});
