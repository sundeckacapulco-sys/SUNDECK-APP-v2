jest.mock('../../services/fabricacionService', () => ({
  obtenerColaFabricacion: jest.fn(),
  obtenerMetricas: jest.fn()
}));

jest.mock('../../services/cotizacionMappingService', () => ({
  generarPayloadUnificado: jest.fn(() => ({ detallesTecnicos: [] }))
}));

jest.mock('../../models/Pedido', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

jest.mock('../../models/OrdenFabricacion', () => {
  const mockSave = jest.fn().mockResolvedValue({ _id: 'orden123' });
  const mockFindOne = jest.fn();
  const mockFindById = jest.fn();
  
  const mockConstructor = jest.fn().mockImplementation(() => ({
    save: mockSave
  }));

  mockConstructor.findOne = mockFindOne;
  mockConstructor.findById = mockFindById;

  return mockConstructor;
});

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const FabricacionService = require('../../services/fabricacionService');
const Pedido = require('../../models/Pedido');
const OrdenFabricacion = require('../../models/OrdenFabricacion');
const logger = require('../../config/logger');

const {
  obtenerColaFabricacion,
  obtenerMetricasFabricacion,
  crearOrdenDesdePedido,
  actualizarEstadoOrden
} = require('../../controllers/fabricacionController');

function crearRespuestaMock() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('fabricacionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería exportar los handlers requeridos', () => {
    expect(typeof obtenerColaFabricacion).toBe('function');
    expect(typeof obtenerMetricasFabricacion).toBe('function');
    expect(typeof crearOrdenDesdePedido).toBe('function');
    expect(typeof actualizarEstadoOrden).toBe('function');
  });

  test('obtenerColaFabricacion responde con los proyectos de la cola', async () => {
    const proyectos = [{ _id: '1' }];
    FabricacionService.obtenerColaFabricacion.mockResolvedValueOnce(proyectos);

    const req = { query: { prioridad: 'alta' } };
    const res = crearRespuestaMock();

    await obtenerColaFabricacion(req, res);

    expect(FabricacionService.obtenerColaFabricacion).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith(proyectos);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cola de fabricación obtenida correctamente'), expect.any(Object));
  });

  test('obtenerColaFabricacion maneja errores del servicio', async () => {
    const error = new Error('fallo');
    FabricacionService.obtenerColaFabricacion.mockRejectedValueOnce(error);

    const req = { query: {} };
    const res = crearRespuestaMock();

    await obtenerColaFabricacion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Error obteniendo cola de fabricación',
      error: error.message
    }));
    expect(logger.error).toHaveBeenCalled();
  });

  test('crearOrdenDesdePedido responde 404 cuando el pedido no existe', async () => {
    Pedido.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValueOnce(null)
    });

    const req = { params: { pedidoId: 'pedido-inexistente' }, body: {}, usuario: { _id: 'usuario' } };
    const res = crearRespuestaMock();

    await crearOrdenDesdePedido(req, res);

    expect(Pedido.findById).toHaveBeenCalledWith('pedido-inexistente');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Pedido no encontrado' });
  });

  test('actualizarEstadoOrden rechaza estados inválidos', async () => {
    const req = { params: { id: 'orden123' }, body: { estado: 'invalido' }, usuario: { _id: 'usuario' } };
    const res = crearRespuestaMock();

    await actualizarEstadoOrden(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Estado no válido')
    }));
    expect(OrdenFabricacion.findById).not.toHaveBeenCalled();
  });
});
