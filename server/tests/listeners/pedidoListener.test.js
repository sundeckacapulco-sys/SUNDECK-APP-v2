jest.mock('../../models/Pedido', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/Cotizacion', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/Prospecto', () => ({
  findById: jest.fn()
}));

jest.mock('../../services/eventBusService', () => ({
  emit: jest.fn(),
  on: jest.fn()
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const Pedido = require('../../models/Pedido');
const Cotizacion = require('../../models/Cotizacion');
const Prospecto = require('../../models/Prospecto');
const eventBus = require('../../services/eventBusService');
const pedidoListener = require('../../listeners/pedidoListener');

describe('PedidoListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('omite creación si anticipo no está pagado', async () => {
    const resultado = await pedidoListener.handle({
      tipo: 'cotizacion.aprobada',
      datos: {
        cotizacionId: 'cot1',
        prospectoId: 'pros1',
        monto: 1000,
        anticipo: { pagado: false }
      }
    });

    expect(resultado).toEqual({ accion: 'esperando_pago' });
    expect(Pedido.create).not.toHaveBeenCalled();
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  it('crea pedido y emite evento cuando anticipo está pagado', async () => {
    const mockProspecto = {
      _id: 'pros1',
      nombre: 'Cliente',
      telefono: '123',
      etapa: 'cotizacion',
      fechaUltimoContacto: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    const cotizacionDoc = {
      prospecto: mockProspecto,
      total: 1500,
      productos: [{
        nombre: 'Producto',
        descripcion: 'Desc',
        categoria: 'cat',
        material: 'mat',
        color: 'color',
        cristal: 'cristal',
        herrajes: 'herrajes',
        medidas: { ancho: 1, alto: 1 },
        cantidad: 1,
        precioUnitario: 100,
        subtotal: 100,
        requiereR24: false,
        tiempoFabricacion: 10
      }],
      formaPago: { anticipo: { porcentaje: 60 } },
      elaboradaPor: 'user1'
    };

    Cotizacion.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(cotizacionDoc)
      })
    });
    
    Prospecto.findById.mockResolvedValue(mockProspecto);

    Pedido.findOne.mockResolvedValue(null);

    const pedidoCreado = {
      _id: 'pedido1',
      anticipo: { monto: 900, porcentaje: 60 },
      productos: cotizacionDoc.productos
    };

    Pedido.create.mockResolvedValue(pedidoCreado);
    eventBus.emit.mockResolvedValue(undefined);

    const resultado = await pedidoListener.handle({
      tipo: 'cotizacion.aprobada',
      datos: {
        cotizacionId: 'cot1',
        prospectoId: 'pros1',
        monto: 1500,
        anticipo: { porcentaje: 60, monto: 900, pagado: true },
        productos: cotizacionDoc.productos,
        usuarioId: 'user2',
        numero: 'COT-1'
      }
    });

    expect(resultado).toEqual({ accion: 'pedido_creado', pedidoId: 'pedido1' });
    expect(Pedido.create).toHaveBeenCalledWith(expect.objectContaining({
      cotizacion: 'cot1',
      prospecto: 'pros1',
      montoTotal: 1500
    }));
    expect(eventBus.emit).toHaveBeenCalledWith('pedido.creado', expect.objectContaining({
      pedidoId: 'pedido1',
      cotizacionId: 'cot1'
    }), 'PedidoListener');
  });
});
