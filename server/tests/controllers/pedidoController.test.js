jest.mock('../../models/ProyectoPedido.legacy', () => {
  const mockConstructor = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    notas: [],
    pagos: { anticipo: {}, saldo: {} },
    cronograma: {},
    cambiarEstado: jest.fn().mockResolvedValue(undefined)
  }));

  mockConstructor.findById = jest.fn();
  mockConstructor.findOne = jest.fn();
  mockConstructor.aggregate = jest.fn();
  mockConstructor.countDocuments = jest.fn();
  mockConstructor.find = jest.fn();
  mockConstructor.updateOne = jest.fn();

  return mockConstructor;
});

jest.mock('../../models/Prospecto', () => ({}));

jest.mock('../../models/Cotizacion', () => ({
  findById: jest.fn()
}));

const ProyectoPedido = require('../../models/ProyectoPedido.legacy');

const pedidoController = require('../../controllers/proyectoPedidoController');

function crearRespuestaMock() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('pedidoController.cambiarEstado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('responde 404 cuando el proyecto no existe', async () => {
    ProyectoPedido.findById.mockResolvedValueOnce(null);

    const req = { params: { id: 'inexistente' }, body: { nuevoEstado: 'confirmado' }, usuario: { id: 'usuario1' } };
    const res = crearRespuestaMock();

    await pedidoController.cambiarEstado(req, res);

    expect(ProyectoPedido.findById).toHaveBeenCalledWith('inexistente');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('rechaza transiciones de estado inválidas', async () => {
    const proyecto = {
      estado: 'cotizado',
      cronograma: {},
      cambiarEstado: jest.fn()
    };

    ProyectoPedido.findById.mockResolvedValueOnce(proyecto);

    const req = {
      params: { id: 'proyecto123' },
      body: { nuevoEstado: 'completado', nota: 'salto ilegal' },
      usuario: { id: 'usuario1' }
    };
    const res = crearRespuestaMock();

    await pedidoController.cambiarEstado(req, res);

    expect(proyecto.cambiarEstado).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('actualiza el estado cuando la transición es válida', async () => {
    const proyecto = {
      estado: 'cotizado',
      cronograma: {},
      cambiarEstado: jest.fn().mockResolvedValue(undefined)
    };

    const proyectoActualizado = { _id: 'proyecto123', estado: 'confirmado' };

    const populateChain = {
      populate: jest.fn(),
      then: (resolve) => Promise.resolve(proyectoActualizado).then(resolve)
    };
    populateChain.populate.mockReturnValue(populateChain);

    ProyectoPedido.findById
      .mockResolvedValueOnce(proyecto)
      .mockReturnValueOnce(populateChain);

    const req = {
      params: { id: 'proyecto123' },
      body: { nuevoEstado: 'confirmado', nota: 'todo listo' },
      usuario: { id: 'usuario1' }
    };
    const res = crearRespuestaMock();

    await pedidoController.cambiarEstado(req, res);

    expect(proyecto.cambiarEstado).toHaveBeenCalledWith('confirmado', 'usuario1', 'todo listo');
    expect(populateChain.populate).toHaveBeenCalledTimes(3);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: proyectoActualizado
    }));
  });
});
