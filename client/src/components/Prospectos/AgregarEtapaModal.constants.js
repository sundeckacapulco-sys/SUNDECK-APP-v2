export const etapaOptions = [
  'Visita Inicial / Medición',
  'Seguimiento',
  'Presentación de Propuesta',
  'Negociación',
  'Cierre',
  'Entrega',
  'Postventa'
];

export const productosOptions = [
  { label: 'Persianas Screen 3%', value: 'screen_3' },
  { label: 'Persianas Screen 5%', value: 'screen_5' },
  { label: 'Persianas Screen 10%', value: 'screen_10' },
  { label: 'Persianas Blackout', value: 'blackout' },
  { label: 'Persianas Duo / Sheer Elegance', value: 'duo' },
  { label: 'Toldos Verticales (Screen, Soltis, etc.)', value: 'toldo_vertical' },
  { label: 'Toldos Retráctiles', value: 'toldo_retractil' },
  { label: 'Cortinas Motorizadas', value: 'motorizadas' },
  { label: 'Cortinas Manuales', value: 'manuales' },
  { label: 'Sistemas Antihuracán (paneles, rollos, reforzados)', value: 'antihuracan' },
  { label: 'Pérgolas y Sombras', value: 'pergolas' },
  { label: 'Doble Cortina (2 en 1 ventana)', value: 'doble_cortina' },
  { label: 'Cortina + Screen (combinado)', value: 'cortina_screen' },
  { label: 'Sistema Día/Noche', value: 'dia_noche' },
  { label: 'Cortinas Tradicionales', value: 'cortina_tradicional' },
  { label: '🆕 PRODUCTO PERSONALIZADO', value: 'nuevo' }
];

export const modelosToldos = {
  caida_vertical: [
    { label: 'Padova', value: 'padova' },
    { label: 'Contempo', value: 'contempo' },
    { label: 'Otro (especificar)', value: 'otro_manual' }
  ],
  proyeccion: [
    { label: 'Europa', value: 'europa' },
    { label: 'Cofre', value: 'cofre' },
    { label: 'Sunset', value: 'sunset' },
    { label: 'Otro (especificar)', value: 'otro_manual' }
  ]
};

export const modelosMotores = [
  { label: 'Somfy 25 Nm', value: 'somfy_25nm' },
  { label: 'Somfy 35 Nm', value: 'somfy_35nm' },
  { label: 'Somfy RTS', value: 'somfy_rts' },
  { label: 'Otro (especificar)', value: 'otro_manual' }
];

export const modelosControles = [
  { label: 'Control Monocanal (1 cortina)', value: 'monocanal', canales: 1, esMulticanal: false },
  { label: 'Control 4 Canales', value: 'multicanal_4', canales: 4, esMulticanal: true },
  { label: 'Control 5 Canales', value: 'multicanal_5', canales: 5, esMulticanal: true },
  { label: 'Control 15 Canales', value: 'multicanal_15', canales: 15, esMulticanal: true },
  { label: 'Control Multicanal Genérico', value: 'multicanal', canales: 4, esMulticanal: true },
  { label: 'Otro (especificar)', value: 'otro_manual', canales: 1, esMulticanal: false }
];

export const createEmptyPieza = () => ({
  ubicacion: '',
  cantidad: 1,
  medidas: [
    {
      ancho: '',
      alto: '',
      producto: productosOptions[0].value,
      productoLabel: productosOptions[0].label,
      color: 'Blanco',
      precioM2: '',
      sistema: [],
      sistemaEspecial: []
    }
  ],
  producto: productosOptions[0].value,
  productoLabel: productosOptions[0].label,
  color: 'Blanco',
  precioM2: '',
  observaciones: '',
  fotoUrls: [],
  videoUrl: '',
  esToldo: false,
  tipoToldo: 'caida_vertical',
  kitModelo: '',
  kitModeloManual: '',
  kitPrecio: '',
  motorizado: false,
  motorModelo: '',
  motorModeloManual: '',
  motorPrecio: '',
  controlModelo: '',
  controlModeloManual: '',
  controlPrecio: '',
  sistema: [],
  sistemaEspecial: []
});
