import { create } from 'zustand';

const createInitialCliente = () => ({
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
});

const createInitialProducto = (producto = {}) => ({
  id: producto.id ?? null,
  nombre: producto.nombre ?? '',
  ubicacion: producto.ubicacion ?? '',
  medidas: {
    ancho: Number(producto.medidas?.ancho ?? 0),
    alto: Number(producto.medidas?.alto ?? 0),
    area: Number(producto.medidas?.area ?? 0),
    cantidad: Number(producto.medidas?.cantidad ?? 1),
  },
  precios: {
    unitario: Number(producto.precios?.unitario ?? 0),
    subtotal: Number(producto.precios?.subtotal ?? 0),
  },
  tecnico: {
    tipoControl: producto.tecnico?.tipoControl ?? '',
    orientacion: producto.tecnico?.orientacion ?? '',
    instalacion: producto.tecnico?.instalacion ?? '',
    eliminacion: producto.tecnico?.eliminacion ?? '',
    risoAlto: producto.tecnico?.risoAlto ?? '',
    risoBajo: producto.tecnico?.risoBajo ?? '',
    sistema: producto.tecnico?.sistema ?? '',
    telaMarca: producto.tecnico?.telaMarca ?? '',
    baseTabla: producto.tecnico?.baseTabla ?? '',
    observaciones: producto.tecnico?.observaciones ?? '',
  },
  extras: {
    motorizado: Boolean(producto.extras?.motorizado ?? false),
    esToldo: Boolean(producto.extras?.esToldo ?? false),
    kits: producto.extras?.kits ?? [],
    otros: producto.extras?.otros ?? {},
  },
});

const createInitialComercial = (comercial = {}) => ({
  instalacionEspecial: {
    activa: Boolean(comercial.instalacionEspecial?.activa ?? false),
    tipo: comercial.instalacionEspecial?.tipo ?? '',
    precio: Number(comercial.instalacionEspecial?.precio ?? 0),
  },
  descuentos: {
    activo: Boolean(comercial.descuentos?.activo ?? false),
    tipo: comercial.descuentos?.tipo ?? 'porcentaje',
    valor: Number(comercial.descuentos?.valor ?? 0),
  },
  facturacion: {
    requiereFactura: Boolean(comercial.facturacion?.requiereFactura ?? false),
    iva: Number(comercial.facturacion?.iva ?? 0),
  },
  tiempos: {
    entrega: comercial.tiempos?.entrega ?? '',
    tipo: comercial.tiempos?.tipo ?? '',
  },
});

const createInitialFlujo = (flujo = {}) => ({
  tipo: flujo.tipo ?? null,
  origen: flujo.origen ?? null,
});

const createInitialState = (state = {}) => ({
  cliente: createInitialCliente(state.cliente),
  productos: Array.isArray(state.productos)
    ? state.productos.map((producto) => createInitialProducto(producto))
    : [],
  comercial: createInitialComercial(state.comercial),
  flujo: createInitialFlujo(state.flujo),
});

const mergeProducto = (producto, updates = {}) =>
  createInitialProducto({
    ...producto,
    ...updates,
    medidas: {
      ...producto.medidas,
      ...updates.medidas,
    },
    precios: {
      ...producto.precios,
      ...updates.precios,
    },
    tecnico: {
      ...producto.tecnico,
      ...updates.tecnico,
    },
    extras: {
      ...producto.extras,
      ...updates.extras,
    },
  });

export const useCotizacionStore = create((set, get) => ({
  ...createInitialState(),

  /** CLIENTE **/
  setCliente: (cliente) => set(() => ({ cliente: createInitialCliente(cliente) })),
  updateCliente: (updates) =>
    set((state) => ({
      cliente: {
        ...state.cliente,
        ...updates,
      },
    })),

  /** PRODUCTOS **/
  setProductos: (productos) =>
    set(() => ({
      productos: Array.isArray(productos)
        ? productos.map((producto) => createInitialProducto(producto))
        : [],
    })),
  addProducto: (producto) =>
    set((state) => ({
      productos: [...state.productos, createInitialProducto(producto)],
    })),
  updateProducto: (id, updates) =>
    set((state) => ({
      productos: state.productos.map((producto) =>
        (producto.id ?? null) === id ? mergeProducto(producto, updates) : producto
      ),
    })),
  removeProducto: (id) =>
    set((state) => ({
      productos: state.productos.filter((producto) => (producto.id ?? null) !== id),
    })),
  resetProductos: () => set(() => ({ productos: [] })),

  /** COMERCIAL **/
  setComercial: (comercial) =>
    set(() => ({
      comercial: createInitialComercial(comercial),
    })),
  updateComercialSection: (section, updates) =>
    set((state) => ({
      comercial: createInitialComercial({
        ...state.comercial,
        [section]: {
          ...state.comercial?.[section],
          ...updates,
        },
      }),
    })),

  /** FLUJO **/
  setFlujo: (flujo) => set(() => ({ flujo: createInitialFlujo(flujo) })),
  updateFlujo: (updates) =>
    set((state) => ({
      flujo: {
        ...state.flujo,
        ...updates,
      },
    })),

  /** SNAPSHOTS Y RESET **/
  loadSnapshot: (snapshot) => set(() => createInitialState(snapshot)),
  reset: () => set(() => createInitialState()),

  /** SELECTORES **/
  getSnapshot: () => get(),
}));

export const getInitialCotizacionState = () => createInitialState();
export const createProductoBase = (producto) => createInitialProducto(producto);
