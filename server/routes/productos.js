const express = require('express');
const Producto = require('../models/Producto');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener catálogo de productos
router.get('/', async (req, res) => {
  try {
    const { 
      categoria, 
      unidadMedida, 
      activo, 
      disponible, 
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (unidadMedida) filtros.unidadMedida = unidadMedida;
    if (activo !== undefined) filtros.activo = activo === 'true';
    if (disponible !== undefined) filtros.disponible = disponible === 'true';
    
    // Búsqueda por texto
    if (search) {
      filtros.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } }
      ];
    }

    const productos = await Producto.find(filtros)
      .sort({ popularidad: -1, nombre: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('nombre codigo descripcion categoria subcategoria material precioBase unidadMedida configuracionUnidad coloresDisponibles activo disponible createdAt');

    const total = await Producto.countDocuments(filtros);

    res.json({
      docs: productos,
      totalDocs: total,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener producto por ID con detalles completos
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Calcular precio de producto
router.post('/:id/calcular-precio', async (req, res) => {
  try {
    const { medidas, opciones = {} } = req.body;
    
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Validar medidas según el tipo de producto
    if (producto.requiereMedidas()) {
      if (!medidas || (!medidas.ancho && !medidas.metrosLineales)) {
        return res.status(400).json({ 
          message: 'Medidas requeridas para este tipo de producto' 
        });
      }
    }

    const precio = producto.calcularPrecio(medidas, opciones);
    const tiempoFabricacion = producto.calcularTiempoFabricacion(medidas);
    
    let resultado = {
      precio,
      tiempoFabricacion,
      unidadMedida: producto.unidadMedida,
      etiquetaUnidad: producto.getEtiquetaUnidad()
    };

    // Agregar cálculos específicos según unidad de medida
    switch (producto.unidadMedida) {
      case 'm2':
        const area = medidas.ancho * medidas.alto;
        resultado.area = area;
        resultado.precioM2 = precio / area;
        resultado.requiereR24 = medidas.alto > 2.5 || medidas.ancho > 2.5;
        break;
      case 'ml':
      case 'metro':
        const metros = medidas.ancho || medidas.metrosLineales || 1;
        resultado.metrosLineales = metros;
        resultado.precioMetro = precio / metros;
        break;
      case 'pieza':
      case 'par':
      case 'juego':
      case 'kit':
        const cantidad = medidas.cantidad || 1;
        resultado.cantidad = cantidad;
        resultado.precioPieza = precio / cantidad;
        break;
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error calculando precio:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear producto
router.post('/', auth, async (req, res) => {
  try {
    // Verificar que el código no exista
    const existeProducto = await Producto.findOne({ codigo: req.body.codigo });
    if (existeProducto) {
      return res.status(400).json({ message: 'Ya existe un producto con ese código' });
    }

    const nuevoProducto = new Producto({
      ...req.body,
      // Asegurar configuración por defecto según unidad de medida
      configuracionUnidad: {
        requiereMedidas: ['m2', 'ml', 'metro'].includes(req.body.unidadMedida),
        calculoPorArea: req.body.unidadMedida === 'm2',
        minimoVenta: req.body.unidadMedida === 'pieza' ? 1 : 0.1,
        incremento: req.body.unidadMedida === 'pieza' ? 1 : 0.1,
        ...req.body.configuracionUnidad
      }
    });
    
    await nuevoProducto.save();

    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: nuevoProducto
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'El código del producto ya existe' });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
});

// Actualizar producto
router.put('/:id', auth, async (req, res) => {
  try {
    // Si se está cambiando el código, verificar que no exista
    if (req.body.codigo) {
      const existeProducto = await Producto.findOne({ 
        codigo: req.body.codigo, 
        _id: { $ne: req.params.id } 
      });
      if (existeProducto) {
        return res.status(400).json({ message: 'Ya existe un producto con ese código' });
      }
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        // Actualizar configuración según unidad de medida si cambió
        configuracionUnidad: {
          requiereMedidas: ['m2', 'ml', 'metro'].includes(req.body.unidadMedida),
          calculoPorArea: req.body.unidadMedida === 'm2',
          minimoVenta: req.body.unidadMedida === 'pieza' ? 1 : 0.1,
          incremento: req.body.unidadMedida === 'pieza' ? 1 : 0.1,
          ...req.body.configuracionUnidad
        }
      },
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto actualizado exitosamente',
      producto
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'El código del producto ya existe' });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
});

// Eliminar producto
router.delete('/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener categorías disponibles
router.get('/meta/categorias', (req, res) => {
  const categorias = [
    { value: 'ventana', label: 'Ventanas' },
    { value: 'puerta', label: 'Puertas' },
    { value: 'cancel', label: 'Canceles' },
    { value: 'domo', label: 'Domos' },
    { value: 'accesorio', label: 'Accesorios' },
    { value: 'motor', label: 'Motores' },
    { value: 'control', label: 'Controles' },
    { value: 'kit', label: 'Kits' },
    { value: 'galeria', label: 'Galerías' },
    { value: 'canaleta', label: 'Canaletas' },
    { value: 'herraje', label: 'Herrajes' },
    { value: 'repuesto', label: 'Repuestos' }
  ];
  
  res.json(categorias);
});

// Obtener unidades de medida disponibles
router.get('/meta/unidades', (req, res) => {
  const unidades = [
    { value: 'm2', label: 'm² (Metro cuadrado)', requiereMedidas: true, calculoPorArea: true },
    { value: 'ml', label: 'm.l. (Metro lineal)', requiereMedidas: true, calculoPorArea: false },
    { value: 'metro', label: 'm (Metro)', requiereMedidas: true, calculoPorArea: false },
    { value: 'pieza', label: 'Pieza', requiereMedidas: false, calculoPorArea: false },
    { value: 'par', label: 'Par', requiereMedidas: false, calculoPorArea: false },
    { value: 'juego', label: 'Juego', requiereMedidas: false, calculoPorArea: false },
    { value: 'kit', label: 'Kit', requiereMedidas: false, calculoPorArea: false }
  ];
  
  res.json(unidades);
});

// Buscar productos por texto
router.get('/buscar/:texto', async (req, res) => {
  try {
    const { texto } = req.params;
    const { limit = 10 } = req.query;
    
    const productos = await Producto.find({
      $and: [
        { activo: true, disponible: true },
        {
          $or: [
            { nombre: { $regex: texto, $options: 'i' } },
            { descripcion: { $regex: texto, $options: 'i' } },
            { codigo: { $regex: texto, $options: 'i' } }
          ]
        }
      ]
    })
    .limit(parseInt(limit))
    .select('nombre codigo descripcion categoria unidadMedida precioBase configuracionUnidad')
    .sort({ popularidad: -1, nombre: 1 });

    res.json(productos);
  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
