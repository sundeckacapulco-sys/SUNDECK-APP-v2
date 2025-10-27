import axiosConfig from '../../../config/axios';

class InstalacionesAPI {

  // Obtener proyectos listos para instalación
  async obtenerProyectosListos(params = {}) {
    try {
      const response = await axiosConfig.get('/proyecto-pedido', {
        params: {
          estado: 'fabricado',
          limit: 100,
          page: 1,
          ...params
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'No se pudieron obtener los proyectos listos para instalación');
      }

      const proyectos = response.data?.data?.docs || [];

      return proyectos.map((proyecto) => {
        const direccionInstalacion = proyecto.entrega?.direccion || proyecto.cliente?.direccion || {};
        const direccion = [
          direccionInstalacion.calle,
          direccionInstalacion.colonia,
          direccionInstalacion.ciudad
        ].filter(Boolean).join(', ');

        return {
          id: proyecto._id,
          numero: proyecto.numero,
          cliente: proyecto.cliente?.nombre || 'Cliente sin nombre',
          direccion: direccion || 'Dirección no disponible',
          productos: Array.isArray(proyecto.productos) ? proyecto.productos.length : 0,
          datosOriginales: proyecto
        };
      });
    } catch (error) {
      console.error('Error obteniendo proyectos listos para instalación:', error);
      throw error;
    }
  }

  // Obtener instaladores activos disponibles
  async obtenerInstaladoresDisponibles(params = {}) {
    try {
      const response = await axiosConfig.get('/usuarios', {
        params: {
          rol: 'instalador',
          activo: true,
          ...params
        }
      });

      const usuarios = Array.isArray(response.data) ? response.data : [];

      return usuarios
        .filter(usuario => usuario?.rol === 'instalador')
        .map((usuario) => ({
          id: usuario._id,
          nombre: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.email,
          especialidad: usuario.especialidad || 'Instalaciones generales',
          experiencia: usuario.experiencia || 'Sin registro',
          telefono: usuario.telefono,
          email: usuario.email,
          datosOriginales: usuario
        }));
    } catch (error) {
      console.error('Error obteniendo instaladores disponibles:', error);
      throw error;
    }
  }

  // Obtener todas las instalaciones con filtros
  async obtenerInstalaciones(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.cuadrilla) params.append('cuadrilla', filtros.cuadrilla);
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);

      const response = await axiosConfig.get(`/instalaciones?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo instalaciones:', error);
      throw error;
    }
  }

  // Obtener instalación por ID
  async obtenerInstalacionPorId(id) {
    try {
      const response = await axiosConfig.get(`/instalaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo instalación:', error);
      throw error;
    }
  }

  // Programar nueva instalación
  async programarInstalacion(datos) {
    try {
      const response = await axiosConfig.post('/instalaciones', datos);
      return response.data;
    } catch (error) {
      console.error('Error programando instalación:', error);
      throw error;
    }
  }

  // Actualizar instalación
  async actualizarInstalacion(id, datos) {
    try {
      const response = await axiosConfig.put(`/instalaciones/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error actualizando instalación:', error);
      throw error;
    }
  }

  // Cambiar estado de instalación
  async cambiarEstado(id, nuevoEstado, observaciones = '') {
    try {
      const response = await axiosConfig.patch(`/instalaciones/${id}/estado`, {
        nuevo_estado: nuevoEstado,
        observaciones
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error;
    }
  }

  // Asignar cuadrilla
  async asignarCuadrilla(id, cuadrilla) {
    try {
      const response = await axiosConfig.patch(`/instalaciones/${id}/cuadrilla`, {
        instaladores: cuadrilla
      });
      return response.data;
    } catch (error) {
      console.error('Error asignando cuadrilla:', error);
      throw error;
    }
  }

  // Subir evidencias
  async subirEvidencias(id, evidencias) {
    try {
      const formData = new FormData();
      evidencias.forEach((archivo, index) => {
        formData.append(`evidencia_${index}`, archivo);
      });

      const response = await axiosConfig.post(`/instalaciones/${id}/evidencias`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error subiendo evidencias:', error);
      throw error;
    }
  }

  // Actualizar checklist
  async actualizarChecklist(id, checklist) {
    try {
      const response = await axiosConfig.patch(`/instalaciones/${id}/checklist`, {
        checklist
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando checklist:', error);
      throw error;
    }
  }

  // Registrar inicio de instalación
  async iniciarInstalacion(id, datos) {
    try {
      const response = await axiosConfig.post(`/instalaciones/${id}/iniciar`, {
        hora_inicio: new Date(),
        instaladores_presentes: datos.instaladores,
        observaciones_inicio: datos.observaciones
      });
      return response.data;
    } catch (error) {
      console.error('Error iniciando instalación:', error);
      throw error;
    }
  }

  // Completar instalación
  async completarInstalacion(id, datos) {
    try {
      const response = await axiosConfig.post(`/instalaciones/${id}/completar`, {
        hora_fin: new Date(),
        conformidad_cliente: datos.conformidad,
        observaciones_finales: datos.observaciones,
        firma_cliente: datos.firma,
        calificacion_cliente: datos.calificacion
      });
      return response.data;
    } catch (error) {
      console.error('Error completando instalación:', error);
      throw error;
    }
  }

  // Obtener calendario de instalaciones
  async obtenerCalendario(mes, año) {
    try {
      const response = await axiosConfig.get(`/instalaciones/calendario`, {
        params: { mes, año }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo calendario:', error);
      throw error;
    }
  }

  // Obtener cuadrillas disponibles
  async obtenerCuadrillasDisponibles(fecha) {
    try {
      const response = await axiosConfig.get(`/instalaciones/cuadrillas-disponibles`, {
        params: { fecha }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cuadrillas:', error);
      throw error;
    }
  }

  // Generar reporte de instalación
  async generarReporte(id, tipo = 'completo') {
    try {
      const response = await axiosConfig.post(`/instalaciones/${id}/reporte`, {
        tipo
      }, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte-Instalacion-${id}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  // Obtener métricas de instalaciones
  async obtenerMetricas(filtros = {}) {
    try {
      const response = await axiosConfig.get('/instalaciones/metricas', {
        params: filtros
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      throw error;
    }
  }

  // Obtener historial de una instalación
  async obtenerHistorial(id) {
    try {
      const response = await axiosConfig.get(`/instalaciones/${id}/historial`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  // Reprogramar instalación
  async reprogramarInstalacion(id, nuevaFecha, motivo) {
    try {
      const response = await axiosConfig.patch(`/instalaciones/${id}/reprogramar`, {
        nueva_fecha: nuevaFecha,
        motivo_reprogramacion: motivo
      });
      return response.data;
    } catch (error) {
      console.error('Error reprogramando instalación:', error);
      throw error;
    }
  }

  // Cancelar instalación
  async cancelarInstalacion(id, motivo) {
    try {
      const response = await axiosConfig.patch(`/instalaciones/${id}/cancelar`, {
        motivo_cancelacion: motivo
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelando instalación:', error);
      throw error;
    }
  }
}

export default new InstalacionesAPI();
