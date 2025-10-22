const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const { filtrarProyectosPorRol } = require('../middleware/filtroProyectos');
const {
  crearDesdeCotzacion,
  obtenerProyectos,
  obtenerProyectoPorId,
  cambiarEstado,
  agregarNota,
  registrarPago,
  asignarResponsable,
  obtenerEstadisticas,
  actualizarProducto
} = require('../controllers/proyectoPedidoController');

const router = express.Router();

// ===== RUTAS PRINCIPALES =====

// GET /api/proyecto-pedido - Obtener todos los proyectos con filtros
router.get('/', 
  auth, 
  verificarPermiso('proyectos', 'leer'),
  filtrarProyectosPorRol,
  obtenerProyectos
);

// GET /api/proyecto-pedido/estadisticas - Obtener estadísticas generales
router.get('/estadisticas', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerEstadisticas
);

// GET /api/proyecto-pedido/:id - Obtener proyecto específico por ID
router.get('/:id', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerProyectoPorId
);

// POST /api/proyecto-pedido/desde-cotizacion/:cotizacionId - Crear proyecto desde cotización
router.post('/desde-cotizacion/:cotizacionId', 
  auth, 
  verificarPermiso('proyectos', 'crear'), 
  crearDesdeCotzacion
);

// ===== RUTAS DE GESTIÓN =====

// PATCH /api/proyecto-pedido/:id/estado - Cambiar estado del proyecto
router.patch('/:id/estado', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  cambiarEstado
);

// POST /api/proyecto-pedido/:id/notas - Agregar nota al proyecto
router.post('/:id/notas', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  agregarNota
);

// POST /api/proyecto-pedido/:id/pagos - Registrar pago
router.post('/:id/pagos', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  registrarPago
);

// PATCH /api/proyecto-pedido/:id/responsables - Asignar responsable
router.patch('/:id/responsables', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  asignarResponsable
);

// PATCH /api/proyecto-pedido/:id/productos/:productoIndex - Actualizar producto individual
router.patch('/:id/productos/:productoIndex', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  actualizarProducto
);

module.exports = router;
