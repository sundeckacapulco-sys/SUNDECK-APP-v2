import axiosConfig from '../../../config/axios';

class ProyectosAPI {
  
  // Obtener todos los proyectos con filtros
  async obtenerProyectos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.tipo_fuente) params.append('tipo_fuente', filtros.tipo_fuente);
      if (filtros.asesor_asignado) params.append('asesor_asignado', filtros.asesor_asignado);
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);

      const response = await axiosConfig.get(`/proyectos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      throw error;
    }
  }

  // Obtener proyecto por ID
  async obtenerProyectoPorId(id) {
    try {
      const response = await axiosConfig.get(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo proyecto:', error);
      throw error;
    }
  }

  // Crear nuevo proyecto
  async crearProyecto(datos) {
    try {
      const response = await axiosConfig.post('/proyectos', datos);
      return response.data;
    } catch (error) {
      console.error('Error creando proyecto:', error);
      throw error;
    }
  }

  // Actualizar proyecto
  async actualizarProyecto(id, datos) {
    try {
      const response = await axiosConfig.put(`/proyectos/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      throw error;
    }
  }

  // Cambiar estado del proyecto
  async cambiarEstado(id, nuevoEstado, observaciones = '') {
    try {
      const response = await axiosConfig.patch(`/proyectos/${id}/estado`, {
        nuevo_estado: nuevoEstado,
        observaciones
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error;
    }
  }

  // Eliminar proyecto
  async eliminarProyecto(id) {
    try {
      const response = await axiosConfig.delete(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      throw error;
    }
  }

  // Crear proyecto desde prospecto
  async crearDesdeProspecto(prospectoId, tipoFuente = 'formal') {
    try {
      const response = await axiosConfig.post(`/proyectos/desde-prospecto/${prospectoId}`, {
        tipo_fuente: tipoFuente
      });
      return response.data;
    } catch (error) {
      console.error('Error creando proyecto desde prospecto:', error);
      throw error;
    }
  }

  // Sincronizar proyecto
  async sincronizarProyecto(id) {
    try {
      const response = await axiosConfig.post(`/proyectos/${id}/sincronizar`);
      return response.data;
    } catch (error) {
      console.error('Error sincronizando proyecto:', error);
      throw error;
    }
  }

  // Obtener estadísticas del proyecto
  async obtenerEstadisticas(id) {
    try {
      const response = await axiosConfig.get(`/proyectos/${id}/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtener transiciones válidas para un estado
  async obtenerTransicionesValidas(estado) {
    try {
      const response = await axiosConfig.get(`/proyectos/transiciones/${estado}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo transiciones:', error);
      throw error;
    }
  }

  // Generar PDF del proyecto (usando exportación unificada)
  async generarPDF(id) {
    try {
      const response = await axiosConfig.post(`/exportacion/${id}/pdf`, {}, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proyecto-Sundeck-${id}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'PDF descargado exitosamente' };
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  // Generar Excel del proyecto (usando exportación unificada)
  async generarExcel(id) {
    try {
      const response = await axiosConfig.post(`/exportacion/${id}/excel`, {}, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proyecto-Sundeck-${id}-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Excel descargado exitosamente' };
    } catch (error) {
      console.error('Error generando Excel:', error);
      throw error;
    }
  }

  // Generar paquete completo (PDF + Excel en ZIP)
  async generarPaqueteCompleto(id) {
    try {
      const response = await axiosConfig.post(`/exportacion/${id}/completo`, {}, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proyecto-Sundeck-${id}-Completo-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Paquete completo descargado exitosamente' };
    } catch (error) {
      console.error('Error generando paquete completo:', error);
      throw error;
    }
  }

  // Obtener vista previa de exportación
  async obtenerVistaPrevia(id) {
    try {
      const response = await axiosConfig.get(`/exportacion/${id}/vista-previa`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo vista previa:', error);
      throw error;
    }
  }

  // Validar datos para exportación
  async validarExportacion(id) {
    try {
      const response = await axiosConfig.get(`/exportacion/${id}/validar`);
      return response.data;
    } catch (error) {
      console.error('Error validando exportación:', error);
      throw error;
    }
  }

  // Obtener formatos disponibles
  async obtenerFormatosDisponibles() {
    try {
      const response = await axiosConfig.get('/exportacion/formatos');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo formatos:', error);
      throw error;
    }
  }

  // Obtener datos para exportación
  async obtenerDatosExportacion(id) {
    try {
      const response = await axiosConfig.get(`/proyectos/${id}/exportacion`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos de exportación:', error);
      throw error;
    }
  }
}

export default new ProyectosAPI();
