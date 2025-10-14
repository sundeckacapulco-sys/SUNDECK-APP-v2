export const esProductoToldo = (producto) => {
  if (!producto) return false;
  return producto.includes('toldo') || producto === 'toldo_vertical' || producto === 'toldo_retractil';
};

export const esProductoMotorizable = (producto) => {
  const productosMotorizables = [
    'toldo_vertical',
    'toldo_retractil',
    'screen_3',
    'screen_5',
    'screen_10',
    'blackout',
    'duo',
    'motorizadas',
    'cortina_tradicional'
  ];
  return producto ? productosMotorizables.includes(producto) : false;
};
