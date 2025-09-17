const express = require('express');
const Producto = require('../models/Producto');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener catálogo de productos
router.get('/', async (req, res) => {
  try {
    const { categoria, activo = true, disponible = true } = req.query;
    
    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (activo !== undefined) filtros.activo = activo === 'true';
    if (disponible !== undefined) filtros.disponible = disponible === 'true';

    const productos = await Producto.find(filtros)
      .sort({ popularidad: -1, nombre: 1 })
      .select('nombre codigo descripcion categoria material precioBase unidadMedida imagenes activo disponible');

    res.json(productos);
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
    
    if (!medidas || !medidas.ancho || !medidas.alto) {
      return res.status(400).json({ message: 'Medidas requeridas (ancho y alto)' });
    }

    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const precio = producto.calcularPrecio(medidas, opciones);
    const tiempoFabricacion = producto.calcularTiempoFabricacion(medidas);
    const area = medidas.ancho * medidas.alto;

    res.json({
      precio,
      tiempoFabricacion,
      area,
      precioM2: precio / area,
      requiereR24: medidas.alto > 2.5 || medidas.ancho > 2.5
    });
  } catch (error) {
    console.error('Error calculando precio:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear producto (solo admin)
router.post('/', auth, verificarPermiso('productos', 'crear'), async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden crear productos' });
    }

    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();

    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: nuevoProducto
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar producto
router.put('/:id', auth, verificarPermiso('productos', 'actualizar'), async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    { value: 'accesorio', label: 'Accesorios' }
  ];
  
  res.json(categorias);
});

module.exports = router;
