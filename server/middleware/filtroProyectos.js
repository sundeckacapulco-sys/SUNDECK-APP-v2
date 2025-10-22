// Middleware para filtrar proyectos según el rol del usuario
const filtrarProyectosPorRol = (req, res, next) => {
  const { rol, id: usuarioId } = req.usuario;
  
  // Si es admin o gerente, puede ver todos los proyectos
  if (rol === 'admin' || rol === 'gerente') {
    return next();
  }
  
  // Para otros roles, filtrar según su función
  const filtrosOriginales = req.query;
  
  switch (rol) {
    case 'vendedor':
      // Los vendedores solo ven sus proyectos asignados
      req.query = {
        ...filtrosOriginales,
        vendedor: usuarioId
      };
      break;
      
    case 'fabricante':
      // Los fabricantes solo ven proyectos en fabricación asignados a ellos
      req.query = {
        ...filtrosOriginales,
        fabricante: usuarioId,
        estado: 'en_fabricacion'
      };
      break;
      
    case 'instalador':
      // Los instaladores ven proyectos fabricados y en instalación asignados a ellos
      req.query = {
        ...filtrosOriginales,
        instalador: usuarioId,
        estado: 'fabricado,en_instalacion'
      };
      break;
      
    case 'coordinador':
      // Los coordinadores pueden ver todos los proyectos activos
      req.query = {
        ...filtrosOriginales,
        estado: 'confirmado,en_fabricacion,fabricado,en_instalacion'
      };
      break;
      
    default:
      // Por defecto, solo proyectos donde el usuario esté involucrado
      req.query = {
        ...filtrosOriginales,
        usuario: usuarioId
      };
      break;
  }
  
  next();
};

module.exports = {
  filtrarProyectosPorRol
};
