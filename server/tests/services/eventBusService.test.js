jest.mock('../../models/Event', () => ({
  create: jest.fn(),
  find: jest.fn(() => ({ sort: jest.fn(() => ({ limit: jest.fn(() => ({ lean: jest.fn() })) })) })),
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const Event = require('../../models/Event');
const eventBus = require('../../services/eventBusService');

describe('EventBusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventBus.listeners.clear();
  });

  it('registra listeners correctamente', () => {
    const listener = { handle: jest.fn() };
    eventBus.on('test.evento', listener);

    const registrados = eventBus.listeners.get('test.evento');
    expect(registrados).toBeDefined();
    expect(registrados).toContain(listener);
  });

  it('emite eventos y ejecuta listeners', async () => {
    const listener = { handle: jest.fn().mockResolvedValue('ok') };
    eventBus.on('test.evento', listener);

    const fakeEvent = {
      _id: 'evt123',
      listeners: [],
      save: jest.fn().mockResolvedValue(undefined),
      marcarProcesado: jest.fn().mockResolvedValue(undefined),
      datos: { payload: true }
    };

    Event.create.mockResolvedValue(fakeEvent);

    const data = { mensaje: 'hola' };
    const resultado = await eventBus.emit('test.evento', data, 'TestSuite', 'usuario1');

    expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'test.evento',
      datos: data,
      origen: 'TestSuite',
      usuario: 'usuario1'
    }));
    expect(listener.handle).toHaveBeenCalledWith(fakeEvent);
    expect(fakeEvent.marcarProcesado).toHaveBeenCalled();
    expect(resultado).toBe(fakeEvent);
  });
});
