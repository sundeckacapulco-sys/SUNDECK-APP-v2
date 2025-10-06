import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  ArrowBack,
  Comment,
  Email,
  Event,
  LocationOn,
  Phone,
  WhatsApp,
  CheckCircle,
  AttachFile,
  Delete,
  CloudUpload
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosConfig from '../../config/axios';
import AgregarEtapaModal from './AgregarEtapaModal';
import GeneradorWhatsApp from '../WhatsApp/GeneradorWhatsApp';
import TextFieldConDictado from '../Common/TextFieldConDictado';

const etapaLabels = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  cita_agendada: 'Cita agendada',
  cotizacion: 'Cotización',
  pedido: 'Pedido',
  fabricacion: 'Fabricación',
  instalacion: 'Instalación',
  entregado: 'Entregado',
  postventa: 'Postventa',
  perdido: 'Perdido'
};

const etapaColors = {
  nuevo: 'default',
  contactado: 'info',
  cita_agendada: 'secondary',
  cotizacion: 'warning',
  pedido: 'primary',
  fabricacion: 'success',
  instalacion: 'success',
  entregado: 'success',
  postventa: 'success',
  perdido: 'error'
};

const prioridadLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente'
};

const prioridadColors = {
  baja: 'default',
  media: 'info',
  alta: 'warning',
  urgente: 'error'
};

const comentarioCategorias = ['General', 'Puntualidad', 'Calidad', 'Cliente', 'Reagendamiento'];

const tipoProductoLabels = {
  ventana: 'Ventana',
  puerta: 'Puerta',
  cancel: 'Cancel',
  domo: 'Domo',
  otro: 'Otro'
};

const pipelineOrder = [
  'nuevo',
  'contactado',
  'cita_agendada',
  'cotizacion',
  'pedido',
  'fabricacion',
  'instalacion',
  'entregado',
  'postventa',
  'perdido'
];

const timelineSteps = [
  { id: 'visita', label: 'Visita', etapaClave: 'cita_agendada' },
  { id: 'cotizacion', label: 'Cotización', etapaClave: 'cotizacion' },
  { id: 'pedido', label: 'Pedido', etapaClave: 'pedido' },
  { id: 'fabricacion', label: 'Fabricación', etapaClave: 'fabricacion' },
  { id: 'instalacion', label: 'Instalación', etapaClave: 'instalacion' },
  { id: 'postventa', label: 'Postventa', etapaClave: 'postventa' }
];

const ProspectoDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [prospecto, setProspecto] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingProspecto, setLoadingProspecto] = useState(true);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);
  const [error, setError] = useState('');

  const [openComentario, setOpenComentario] = useState(false);
  const [openReagendar, setOpenReagendar] = useState(false);
  const [comentario, setComentario] = useState('');
  const [comentarioCategoria, setComentarioCategoria] = useState('General');
  const [savingComentario, setSavingComentario] = useState(false);
  const [reagendarFecha, setReagendarFecha] = useState('');
  const [reagendarHora, setReagendarHora] = useState('');
  const [motivoReagendamiento, setMotivoReagendamiento] = useState('');
  const [evidenciasReagendamiento, setEvidenciasReagendamiento] = useState([]);
  const [savingReagendar, setSavingReagendar] = useState(false);
  const [openAgregarEtapa, setOpenAgregarEtapa] = useState(false);
  const [mensajeEtapa, setMensajeEtapa] = useState('');
  const [errorEtapa, setErrorEtapa] = useState('');
  const [registrandoVisita, setRegistrandoVisita] = useState(false);
  const [openLevantamientoModal, setOpenLevantamientoModal] = useState(false);
  const [levantamientoSeleccionado, setLevantamientoSeleccionado] = useState(null);
  
  // Estados para WhatsApp
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [contextoWhatsApp, setContextoWhatsApp] = useState('');

  // Estado para modal de imagen
  const [imagenModal, setImagenModal] = useState({
    open: false,
    url: '',
    nombre: '',
    loading: true
  });

  // Comentarios y etapas (timeline)
  const [comentarios, setComentarios] = useState([]);
  const [etapas, setEtapas] = useState([]);
  
  // Función para verificar si el backend está disponible
  const verificarBackend = async () => {
    try {
      const backendUrl = 'http://localhost:5001/api/health';
      console.log('🔍 Verificando backend en:', backendUrl);
      const response = await fetch(backendUrl);
      console.log('🔍 Estado del backend:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.error('❌ Backend no disponible:', error);
      return false;
    }
  };
  
  // Función para debug - listar evidencias disponibles
  const debugEvidencias = async () => {
    try {
      console.log('🔍 Obteniendo lista de evidencias...');
      const response = await axiosConfig.get('/api/debug/evidencias');
      console.log('📁 Evidencias disponibles:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo evidencias:', error);
      return null;
    }
  };
  
  // Función auxiliar para construir URLs completas - FORZAR PUERTO 5001
  const construirUrlCompleta = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    
    // FORZAR siempre el puerto 5001 del backend
    const backendUrl = 'http://localhost:5001';
    const finalUrl = url.startsWith('/') ? `${backendUrl}${url}` : `${backendUrl}/${url}`;
    
    console.log('🔗 URL FORZADA:', {
      original: url,
      backendUrl,
      finalUrl
    });
    
    return finalUrl;
  };
  
  // Función para descargar archivo directamente usando axios (respeta el proxy)
  const descargarEvidencia = async (archivo) => {
    try {
      console.log('💾 Descargando evidencia usando axios:', archivo.url);
      
      // Construir URL correcta (sin /api/ para archivos estáticos)
      const urlCorrecta = archivo.url.replace('/api/uploads/', '/uploads/');
      console.log('🔗 URL corregida para descarga:', urlCorrecta);
      
      // Usar axios que respeta el proxy configurado
      const response = await axiosConfig.get(urlCorrecta, {
        responseType: 'blob',
        timeout: 30000 // 30 segundos de timeout
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = archivo.nombre || `evidencia-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Descarga iniciada exitosamente');
    } catch (error) {
      console.error('❌ Error descargando con axios:', error);
      
      // Fallback: intentar con fetch directo
      try {
        console.log('🔄 Intentando fallback con fetch directo...');
        const fullUrl = construirUrlCompleta(archivo.url);
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = archivo.nombre || `evidencia-${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga fallback exitosa');
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        throw new Error(`No se pudo descargar el archivo: ${error.message}`);
      }
    }
  };
  
  // Función para limpiar errores automáticamente
  const limpiarErrorDespues = (segundos = 5) => {
    setTimeout(() => {
      setError('');
    }, segundos * 1000);
  };
  
  // Función específica para abrir evidencias - SIMPLIFICADA
  const abrirEvidencia = async (archivo) => {
    try {
      console.log('🖼️ Abriendo evidencia:', archivo);
      
      // Construir URL correcta (sin /api/ para archivos estáticos)
      const urlCorrecta = archivo.url.replace('/api/uploads/', '/uploads/');
      
      // Decisión simple basada en tipo de archivo
      if (archivo.tipo?.startsWith('image/')) {
        // Para imágenes: SIEMPRE modal interno (sin intentos de popup)
        console.log('🖼️ Abriendo imagen en modal interno:', urlCorrecta);
        setImagenModal({
          open: true,
          url: urlCorrecta,
          nombre: archivo.nombre || 'Evidencia',
          loading: true
        });
      } else {
        // Para documentos: intentar nueva pestaña, si falla → descargar
        console.log('📄 Abriendo documento:', urlCorrecta);
        const newWindow = window.open(urlCorrecta, '_blank', 'noopener,noreferrer');
        
        // Dar tiempo para que se abra la ventana
        setTimeout(() => {
          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            console.log('📄 Popup bloqueado, iniciando descarga');
            descargarEvidencia(archivo);
          } else {
            console.log('✅ Documento abierto en nueva pestaña');
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Error al abrir evidencia:', error);
      setError(`Error al abrir el archivo: ${error.message}`);
      limpiarErrorDespues();
    }
  };

  const fetchProspecto = useCallback(async () => {
    try {
      setLoadingProspecto(true);
      setError('');
      const { data } = await axiosConfig.get(`/prospectos/${id}`);
      setProspecto(data);
      setReagendarFecha(data.fechaCita ? new Date(data.fechaCita).toISOString().slice(0, 10) : '');
      setReagendarHora(data.horaCita || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el prospecto');
    } finally {
      setLoadingProspecto(false);
    }
  }, [id]);

  const fetchComentarios = useCallback(async () => {
    try {
      const { data } = await axiosConfig.get(`/prospectos/${id}/comentarios`);
      setComentarios(data || []);
    } catch (err) {
      console.error('Error cargando comentarios:', err);
    }
  }, [id]);

  const fetchEtapas = useCallback(async () => {
    try {
      const { data } = await axiosConfig.get(`/etapas?prospectoId=${id}`);
      setEtapas(data.etapas || []);
    } catch (error) {
      console.error('Error cargando etapas:', error);
      setEtapas([]);
    }
  }, [id]);

  const fetchCotizaciones = useCallback(async () => {
    try {
      setLoadingCotizaciones(true);
      const { data } = await axiosConfig.get(`/cotizaciones?prospecto=${id}&page=1&limit=50`);
      setCotizaciones(data.docs || []);
    } catch (err) {
      console.error('Error cargando cotizaciones:', err);
    } finally {
      setLoadingCotizaciones(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProspecto();
    fetchCotizaciones();
    fetchComentarios();
    fetchEtapas();
  }, [id, fetchProspecto, fetchCotizaciones, fetchComentarios, fetchEtapas]);

  const direccionTexto = useMemo(() => {
    if (!prospecto?.direccion) return 'Sin dirección registrada';
    const partes = [
      prospecto.direccion.calle,
      prospecto.direccion.colonia,
      prospecto.direccion.ciudad,
      prospecto.direccion.codigoPostal ? `CP ${prospecto.direccion.codigoPostal}` : null
    ].filter(Boolean);

    return partes.length > 0 ? partes.join(', ') : 'Sin dirección registrada';
  }, [prospecto]);

  const contactoPrincipal = useMemo(() => {
    if (!prospecto) return 'Sin definir';
    if (prospecto.contacto) {
      if (typeof prospecto.contacto === 'string') {
        return prospecto.contacto;
      }
      return prospecto.contacto.nombre || prospecto.contacto.email || 'Sin definir';
    }
    return prospecto.nombre;
  }, [prospecto]);

  const medidasTexto = useMemo(() => {
    if (!prospecto) return 'Sin registrar';
    
    console.log('🔍 DEBUG MEDIDAS - Prospecto completo:', prospecto);
    console.log('🔍 DEBUG MEDIDAS - Etapas:', prospecto.etapas);
    
    // Buscar medidas en etapas de levantamiento (usar el estado etapas en lugar de prospecto.etapas)
    if (Array.isArray(etapas) && etapas.length > 0) {
      console.log('🔍 DEBUG MEDIDAS - Etapas del estado:', etapas);
      const etapaLevantamiento = etapas.find(etapa => 
        etapa.nombreEtapa === 'Visita Inicial / Medición' || 
        etapa.nombreEtapa === 'Levantamiento Técnico' ||
        (etapa.piezas && etapa.piezas.length > 0)
      );
      
      console.log('🔍 DEBUG MEDIDAS - Etapa encontrada:', etapaLevantamiento);
      
      // Usar las piezas directamente de la etapa
      if (etapaLevantamiento?.piezas && etapaLevantamiento.piezas.length > 0) {
        const totalPiezas = etapaLevantamiento.piezas.reduce((total, pieza) => total + (pieza.cantidad || 1), 0);
        const totalM2 = etapaLevantamiento.totalM2 || 0;
        console.log('🔍 DEBUG MEDIDAS - Total piezas:', totalPiezas, 'Total M2:', totalM2);
        return `${totalPiezas} pieza${totalPiezas > 1 ? 's' : ''} - ${totalM2.toFixed(2)} m²`;
      }
    }
    
    // También buscar en etapas normales (no solo levantamiento)
    if (Array.isArray(prospecto.etapas) && prospecto.etapas.length > 0) {
      const etapaConPiezas = prospecto.etapas.find(etapa => 
        etapa.piezas && etapa.piezas.length > 0
      );
      
      if (etapaConPiezas) {
        const totalPiezas = etapaConPiezas.piezas.reduce((total, pieza) => total + (pieza.cantidad || 1), 0);
        const totalM2 = etapaConPiezas.totalM2 || 0;
        return `${totalPiezas} pieza${totalPiezas > 1 ? 's' : ''} - ${totalM2.toFixed(2)} m²`;
      }
    }
    
    // Buscar medidas directas (formato anterior)
    const medidasDirectas = prospecto.medidas || prospecto.detallesProducto?.medidas;

    if (medidasDirectas?.ancho || medidasDirectas?.alto) {
      const ancho = medidasDirectas.ancho ? `${medidasDirectas.ancho}m` : '-';
      const alto = medidasDirectas.alto ? `${medidasDirectas.alto}m` : '-';
      return `${ancho} x ${alto}`;
    }

    if (Array.isArray(prospecto.mediciones) && prospecto.mediciones.length > 0) {
      const medicion = prospecto.mediciones[0];
      const ancho = medicion.ancho || medicion.medidas?.ancho;
      const alto = medicion.alto || medicion.medidas?.alto;
      if (ancho || alto) {
        const anchoTexto = ancho ? `${ancho}m` : '-';
        const altoTexto = alto ? `${alto}m` : '-';
        return `${anchoTexto} x ${altoTexto}`;
      }
    }

    return 'Sin registrar';
  }, [prospecto, etapas]);

  const etapaActualIndex = useMemo(() => {
    if (!prospecto?.etapa) return -1;
    return pipelineOrder.indexOf(prospecto.etapa);
  }, [prospecto]);

  const abrirWhatsApp = () => {
    if (!prospecto?.telefono) {
      setError('El prospecto no tiene un teléfono registrado para WhatsApp');
      return;
    }

    const telefono = prospecto.telefono.replace(/[^0-9]/g, '');
    if (!telefono) {
      setError('El teléfono del prospecto no es válido para WhatsApp');
      return;
    }

    const mensaje = `Hola ${prospecto.nombre}, te saluda el equipo de Sundeck.`;
    const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAgregarComentario = async () => {
    if (!comentario.trim()) return;

    try {
      setSavingComentario(true);
      setError('');
      await axiosConfig.post(`/prospectos/${id}/comentarios`, {
        contenido: comentario,
        categoria: comentarioCategoria
      });
      setComentario('');
      setComentarioCategoria('General');
      setOpenComentario(false);
      fetchComentarios();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar el comentario');
    } finally {
      setSavingComentario(false);
    }
  };

  const handleReagendarCita = async () => {
    try {
      setSavingReagendar(true);
      setError('');
      
      // Validar que se haya proporcionado un motivo
      if (!motivoReagendamiento.trim()) {
        setError('El motivo del reagendamiento es obligatorio');
        return;
      }
      
      const fechaISO = reagendarFecha ? new Date(reagendarFecha).toISOString() : null;
      
      // Crear FormData para enviar archivos si hay evidencias
      const formData = new FormData();
      formData.append('fechaCita', fechaISO || '');
      formData.append('horaCita', reagendarHora);
      formData.append('estadoCita', reagendarFecha ? 'reagendada' : prospecto?.estadoCita);
      formData.append('motivoReagendamiento', motivoReagendamiento);
      
      // Agregar archivos de evidencia
      evidenciasReagendamiento.forEach((archivo, index) => {
        formData.append(`evidencias`, archivo);
      });
      
      const evidenciasPrevias = prospecto?.evidenciasReagendamiento || [];

      const { data: updateResponse } = await axiosConfig.put(`/prospectos/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedProspecto = updateResponse?.prospecto || null;
      if (updatedProspecto) {
        setProspecto(updatedProspecto);
      }

      const evidenciasActuales = updatedProspecto?.evidenciasReagendamiento || [];
      const nuevasEvidencias = evidenciasActuales.filter((archivo) =>
        !evidenciasPrevias.some((prev) => prev.url === archivo.url)
      );

      // Agregar comentario con el motivo del reagendamiento
      await axiosConfig.post(`/prospectos/${id}/comentarios`, {
        contenido: `📅 Cita reagendada - Motivo: ${motivoReagendamiento}`,
        categoria: 'Reagendamiento',
        archivos: nuevasEvidencias
      });

      // Limpiar formulario
      setMotivoReagendamiento('');
      setEvidenciasReagendamiento([]);
      setOpenReagendar(false);
      fetchProspecto();
      fetchComentarios();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reagendar la cita');
    } finally {
      setSavingReagendar(false);
    }
  };
  
  const handleAgregarEvidencia = (event) => {
    const archivos = Array.from(event.target.files);
    setEvidenciasReagendamiento(prev => [...prev, ...archivos]);
  };
  
  const handleEliminarEvidencia = (index) => {
    setEvidenciasReagendamiento(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegistrarVisita = async () => {
    try {
      setRegistrandoVisita(true);
      setError('');
      
      const fechaHoraActual = new Date().toISOString();
      
      // Registrar la visita como una etapa
      await axiosConfig.post(`/prospectos/${id}/etapas`, {
        nombre: 'Visita Registrada',
        fechaHora: fechaHoraActual,
        observaciones: `Asesor llegó al domicilio el ${new Date().toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`
      });

      // Actualizar el estado de la cita a completada
      await axiosConfig.put(`/prospectos/${id}`, {
        estadoCita: 'completada',
        fechaUltimoContacto: fechaHoraActual
      });

      // Agregar comentario automático
      await axiosConfig.post(`/prospectos/${id}/comentarios`, {
        contenido: `✅ Visita registrada automáticamente - Asesor llegó al domicilio`,
        categoria: 'Puntualidad'
      });

      // Refrescar datos
      fetchProspecto();
      fetchComentarios();
      fetchEtapas();
      
      setMensajeEtapa('✅ Visita registrada exitosamente');
      setTimeout(() => setMensajeEtapa(''), 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar la visita');
    } finally {
      setRegistrandoVisita(false);
    }
  };

  const handleDescargarPDFCompleto = async () => {
    console.log('🎯 Iniciando descarga de PDF completo...');
    
    if (!etapas.length) {
      console.warn('⚠️ No hay etapas para generar PDF');
      setError('No hay etapas para generar el PDF');
      return;
    }

    try {
      // Recopilar todas las piezas de todas las etapas
      const todasLasPiezas = etapas.reduce((acc, etapa) => {
        if (etapa.piezas && etapa.piezas.length > 0) {
          const piezasConEtapa = etapa.piezas.map(pieza => ({
            ...pieza,
            etapa: etapa.nombreEtapa,
            fechaEtapa: etapa.creadoEn
          }));
          return [...acc, ...piezasConEtapa];
        }
        return acc;
      }, []);

      if (todasLasPiezas.length === 0) {
        setError('No hay piezas registradas para generar el PDF');
        return;
      }

      // Calcular totales
      const totalM2 = todasLasPiezas.reduce((total, pieza) => {
        const area = (pieza.ancho || 0) * (pieza.alto || 0);
        return total + area;
      }, 0);

      const precioPromedio = etapas.find(e => e.precioGeneral)?.precioGeneral || 750;

      // SOLUCIÓN SIMPLE: Usar window.open() con parámetros en la URL
      const params = new URLSearchParams({
        prospectoId: id,
        piezas: JSON.stringify(todasLasPiezas),
        precioGeneral: precioPromedio,
        totalM2: totalM2,
        unidadMedida: 'm'
      });

      const token = localStorage.getItem('token');
      const url = `http://localhost:5001/api/etapas/levantamiento-pdf?${params.toString()}&token=${token}`;
      
      console.log('🚀 Abriendo PDF directamente...');
      window.open(url, '_blank');
      
      console.log('✅ PDF abierto en nueva pestaña');

    } catch (error) {
      console.error('Error descargando PDF completo:', error);
      setError('Error al generar PDF completo: ' + error.message);
    }
  };

  // Función para crear cotización con datos del levantamiento
  const handleGenerarCotizacion = () => {
    // Navegar a crear nueva cotización pasando el ID del prospecto
    navigate(`/cotizaciones/nueva?prospecto=${prospecto._id}`);
  };

  // Funciones para WhatsApp
  const abrirGeneradorWhatsApp = (contexto) => {
    setContextoWhatsApp(contexto);
    setOpenWhatsApp(true);
  };

  const obtenerContextoPorEtapa = (etapa) => {
    const contextos = {
      'nuevo': 'recontacto',
      'contactado': 'seguimiento_cotizacion',
      'cita_agendada': 'seguimiento_cotizacion',
      'cotizacion': 'cotizacion_enviada',
      'pedido': 'anticipo_confirmado',
      'fabricacion': 'fabricacion_iniciada',
      'instalacion': 'instalacion_programada',
      'entregado': 'post_instalacion',
      'postventa': 'fidelizacion'
    };
    return contextos[etapa] || 'seguimiento_cotizacion';
  };

  const handleMensajeWhatsAppGenerado = (mensaje, plantilla) => {
    console.log('Mensaje WhatsApp generado:', mensaje);
    console.log('Plantilla usada:', plantilla);
    setOpenWhatsApp(false);
  };

  const handleDescargarExcelEtapa = async (etapa) => {
    if (!etapa.piezas || etapa.piezas.length === 0) {
      setError('Esta etapa no tiene piezas registradas');
      return;
    }

    try {
      const totalM2 = etapa.piezas.reduce((total, pieza) => {
        const area = (pieza.ancho || 0) * (pieza.alto || 0);
        return total + area;
      }, 0);

      const precioGeneral = etapa.precioGeneral || 750;

      const payload = {
        prospectoId: id,
        piezas: etapa.piezas,
        precioGeneral,
        totalM2,
        unidadMedida: etapa.unidadMedida || 'm'
      };

      const response = await axiosConfig.post('/etapas/levantamiento-excel', payload, {
        responseType: 'blob'
      });

      // Crear y descargar el archivo
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${etapa.nombreEtapa.replace(/\s+/g, '-')}-${prospecto.nombre.replace(/\s+/g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando Excel de etapa:', error);
      setError('Error al generar el Excel de la etapa');
    }
  };

  if (loadingProspecto) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prospecto) {
    return (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>Prospecto no encontrado</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/prospectos')} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h4" component="h1">
            {prospecto.nombre}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleRegistrarVisita}
            disabled={registrandoVisita || prospecto?.estadoCita === 'completada'}
            sx={{ 
              backgroundColor: '#16a34a', 
              '&:hover': { backgroundColor: '#15803d' },
              '&:disabled': { backgroundColor: '#9ca3af' }
            }}
          >
            {registrandoVisita ? 'Registrando...' : 'Registrar Visita'}
          </Button>
          <Button
            variant="contained"
            startIcon={<WhatsApp />}
            onClick={() => abrirGeneradorWhatsApp(obtenerContextoPorEtapa(prospecto.etapa))}
            sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#128C7E' } }}
          >
            💬 Generar WhatsApp
          </Button>
          <Button
            variant="outlined"
            startIcon={<WhatsApp />}
            onClick={abrirWhatsApp}
            sx={{ borderColor: '#25D366', color: '#25D366', '&:hover': { backgroundColor: '#f0f7ff' } }}
          >
            📱 WhatsApp Directo
          </Button>
          <Button
            variant="contained"
            startIcon={<Event />}
            onClick={() => setOpenReagendar(true)}
            sx={{ backgroundColor: '#0F172A', '&:hover': { backgroundColor: '#0b1220' } }}
          >
            Reagendar
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/prospectos/${id}/editar`)}>
            Editar
          </Button>
        </Box>
      </Box>

      {(error || errorEtapa) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorEtapa || error}
        </Alert>
      )}
      {mensajeEtapa && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMensajeEtapa('')}>
          {mensajeEtapa}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.nombre}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Contacto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {contactoPrincipal}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Email fontSize="small" color="primary" />
                    <Typography variant="body1">
                      {prospecto.email || 'Sin correo registrado'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone fontSize="small" color="primary" />
                    <Typography variant="body1">
                      {prospecto.telefono}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOn fontSize="small" color="primary" sx={{ mt: 0.5 }} />
                    <Typography variant="body1">
                      {direccionTexto}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Producto / Servicio
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.tipoProducto
                      ? tipoProductoLabels[prospecto.tipoProducto] || prospecto.tipoProducto
                      : 'No especificado'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Producto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.producto || 'No especificado'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Variante
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {prospecto.productoVariante || prospecto.detallesProducto?.variante || 'No especificado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medidas
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {medidasTexto}
                  </Typography>
                  
                  {/* Mostrar detalle del levantamiento si existe */}
                  {(() => {
                    // Buscar etapa con piezas en el estado etapas
                    const etapaConPiezas = etapas?.find(etapa => 
                      (etapa.nombreEtapa === 'Visita Inicial / Medición' || 
                       etapa.nombreEtapa === 'Levantamiento Técnico') &&
                      (etapa.piezas && etapa.piezas.length > 0)
                    );
                    
                    const tienePiezas = etapaConPiezas?.piezas?.length > 0;
                    
                    if (tienePiezas) {
                      return (
                        <Box sx={{ mt: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setLevantamientoSeleccionado(etapaConPiezas);
                              setOpenLevantamientoModal(true);
                            }}
                            sx={{ 
                              fontSize: '0.75rem',
                              color: 'primary.main',
                              borderColor: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.50'
                              }
                            }}
                          >
                            📋 Ver Levantamiento Completo
                          </Button>
                        </Box>
                      );
                    }
                    return null;
                  })()}

                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">
                    {prospecto.descripcionNecesidad || prospecto.observaciones || 'Sin observaciones'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Historial de cotizaciones
              </Typography>
              {loadingCotizaciones ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : cotizaciones.length > 0 ? (
                <List>
                  {cotizaciones.map((cotizacion) => (
                    <ListItem
                      key={cotizacion._id}
                      divider
                      secondaryAction={
                        <Button size="small" onClick={() => navigate(`/cotizaciones/${cotizacion._id}`)}>
                          Ver
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`Cotización ${cotizacion.numero}`}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString() : 'Sin fecha'}
                            </Typography>
                            <Typography variant="body2">
                              Estado: {cotizacion.estado}
                            </Typography>
                            {cotizacion.total != null && (
                              <Typography variant="body2">
                                Total: ${cotizacion.total.toLocaleString()}
                              </Typography>
                            )}
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay cotizaciones registradas para este prospecto.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comentarios de supervisión
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  select
                  label="Categoría"
                  size="small"
                  value={comentarioCategoria}
                  onChange={(e) => setComentarioCategoria(e.target.value)}
                  SelectProps={{ native: true }}
                  sx={{ width: 220 }}
                >
                  {comentarioCategorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </TextField>
              </Box>
              {comentarios.length > 0 ? (
                <List>
                  {comentarios.map((nota, index) => (
                    <ListItem key={nota._id || index} divider>
                      <ListItemText
                        primary={nota.contenido}
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {nota.usuario?.nombre ? `${nota.usuario.nombre} ${nota.usuario.apellido || ''}` : 'Sistema'} · {new Date(nota.fecha).toLocaleString()}
                            </Typography>
                            {nota.categoria && (
                              <Chip label={nota.categoria} size="small" sx={{ mt: 0.5 }} />
                            )}
                            {Array.isArray(nota.archivos) && nota.archivos.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}
                                >
                                  Evidencias
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {nota.archivos.map((archivo, archivoIndex) => {
                                    const key = archivo.url || `${nota._id || index}-archivo-${archivoIndex}`;
                                    const esImagen = archivo.tipo?.startsWith('image/');

                                    const handleAbrirArchivo = async (event) => {
                                      event.preventDefault();
                                      event.stopPropagation();

                                      if (archivo.url) {
                                        await abrirEvidencia(archivo);
                                      }
                                    };

                                    if (esImagen) {
                                      return (
                                        <Tooltip 
                                          key={key}
                                          title={`${archivo.nombre || 'Evidencia'} - Clic para ver en nueva pestaña`}
                                          arrow
                                        >
                                          <Box
                                            sx={{
                                              position: 'relative',
                                              width: 100,
                                              height: 72,
                                              borderRadius: 1,
                                              overflow: 'hidden',
                                              border: '1px solid',
                                              borderColor: 'divider',
                                              cursor: 'pointer',
                                              display: 'block',
                                              '&:hover': { 
                                                boxShadow: 3,
                                                '& .download-overlay': {
                                                  opacity: 1
                                                }
                                              }
                                            }}
                                            onClick={handleAbrirArchivo}
                                          >
                                            <img
                                              src={construirUrlCompleta(archivo.url)}
                                              alt={archivo.nombre || `Evidencia ${archivoIndex + 1}`}
                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              onError={(e) => {
                                                console.error('Error cargando imagen:', archivo.url);
                                                e.target.style.display = 'none';
                                              }}
                                            />
                                            {/* Overlay con botón de descarga */}
                                            <Box
                                              className="download-overlay"
                                              sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s'
                                              }}
                                            >
                                              <Button
                                                size="small"
                                                variant="contained"
                                                sx={{ minWidth: 'auto', p: 0.5 }}
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  await descargarEvidencia(archivo);
                                                }}
                                              >
                                                📥
                                              </Button>
                                            </Box>
                                          </Box>
                                        </Tooltip>
                                      );
                                    }

                                    return (
                                      <Button
                                        key={key}
                                        size="small"
                                        variant="outlined"
                                        startIcon={<AttachFile fontSize="small" />}
                                        onClick={handleAbrirArchivo}
                                        sx={{ mr: 1, mb: 1 }}
                                      >
                                        {archivo.nombre || `Archivo ${archivoIndex + 1}`}
                                      </Button>
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay comentarios registrados.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Etapa y prioridad
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Etapa actual
                  </Typography>
                  <Chip
                    label={etapaLabels[prospecto.etapa] || 'Sin etapa'}
                    color={etapaColors[prospecto.etapa] || 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prioridad
                  </Typography>
                  <Chip
                    label={prioridadLabels[prospecto.prioridad] || 'Sin definir'}
                    color={prioridadColors[prospecto.prioridad] || 'default'}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Próxima cita
                  </Typography>
                  <Typography variant="body2">
                    {prospecto.fechaCita
                      ? `${new Date(prospecto.fechaCita).toLocaleDateString()}${prospecto.horaCita ? ` · ${prospecto.horaCita}` : ''}`
                      : 'Sin cita programada'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fuente
                  </Typography>
                  <Typography variant="body2">{prospecto.fuente || 'Sin especificar'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline de etapas
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                {etapas.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDescargarPDFCompleto()}
                    sx={{ color: '#2563EB', borderColor: '#2563EB' }}
                  >
                    📄 PDF Completo
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleGenerarCotizacion}
                  sx={{ backgroundColor: '#16a34a', color: 'white', '&:hover': { backgroundColor: '#15803d' } }}
                  disabled={!prospecto}
                >
                  💰 Crear Cotización
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setErrorEtapa('');
                    setOpenAgregarEtapa(true);
                  }}
                  sx={{ backgroundColor: '#D4AF37', color: '#0F172A', '&:hover': { backgroundColor: '#c39c2f' } }}
                  disabled={!prospecto}
                >
                  + Agregar etapa
                </Button>
              </Box>
              {etapas.length > 0 ? (
                <List>
                  {etapas.map((etapa, idx) => (
                    <ListItem key={etapa._id || idx} alignItems="flex-start" divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {etapa.nombreEtapa}
                              </Typography>
                              {etapa.piezas && etapa.piezas.length > 0 && (() => {
                                // Calcular total de piezas sumando las cantidades
                                console.log('🔍 DEBUG - Piezas de la etapa:', etapa.piezas);
                                const totalPiezas = etapa.piezas.reduce((total, pieza) => {
                                  console.log(`🔍 Pieza: ${pieza.ubicacion}, cantidad: ${pieza.cantidad || 1}`);
                                  return total + (pieza.cantidad || 1);
                                }, 0);
                                console.log('🔍 Total piezas calculado:', totalPiezas);
                                return (
                                  <Chip 
                                    label={`${totalPiezas} pieza${totalPiezas > 1 ? 's' : ''}`} 
                                    size="small" 
                                    color="primary" 
                                  />
                                );
                              })()}
                              {etapa.totalM2 && (
                                <Chip 
                                  label={`${etapa.totalM2.toFixed(2)} m²`} 
                                  size="small" 
                                  color="info" 
                                />
                              )}
                            </Box>
                            {/* Botón de descarga Excel para esta etapa */}
                            {etapa.piezas && etapa.piezas.length > 0 && (
                              <Tooltip title="Descargar Excel de esta etapa" arrow>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleDescargarExcelEtapa(etapa)}
                                  sx={{ 
                                    color: '#16A34A', 
                                    borderColor: '#16A34A',
                                    minWidth: 'auto',
                                    px: 1,
                                    '&:hover': { 
                                      bgcolor: '#16A34A', 
                                      color: 'white' 
                                    }
                                  }}
                                >
                                  📊
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(etapa.creadoEn).toLocaleString()}
                              {etapa.creadoPor?.nombre ? ` · ${etapa.creadoPor.nombre}` : ''}
                            </Typography>
                            {etapa.comentarios && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                💬 {etapa.comentarios}
                              </Typography>
                            )}
                            {etapa.piezas && etapa.piezas.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {(() => {
                                    const totalPiezas = etapa.piezas.reduce((total, pieza) => total + (pieza.cantidad || 1), 0);
                                    return `📋 ${totalPiezas} pieza${totalPiezas > 1 ? 's' : ''} registrada${totalPiezas > 1 ? 's' : ''}`;
                                  })()}
                                  {etapa.totalM2 && ` • Total: ${etapa.totalM2.toFixed(2)} m²`}
                                </Typography>
                                
                                {/* Detalles de cada pieza */}
                                <Box sx={{ ml: 2, borderLeft: '2px solid #e5e7eb', pl: 2 }}>
                                  {etapa.piezas.map((pieza, piezaIdx) => {
                                    const area = (pieza.ancho || 0) * (pieza.alto || 0);
                                    const precio = pieza.precioM2 || etapa.precioGeneral || 750;
                                    const cantidad = pieza.cantidad || 1;
                                    const areaTotal = area * cantidad;
                                    const subtotal = areaTotal * precio;
                                    
                                    return (
                                      <Box key={piezaIdx} sx={{ mb: 1.5, p: 1, bgcolor: '#f9fafb', borderRadius: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                          <Typography variant="body2" fontWeight="medium" color="primary">
                                            📍 {pieza.ubicacion}
                                          </Typography>
                                          {cantidad > 1 && (
                                            <Chip 
                                              label={`${cantidad} piezas`} 
                                              size="small" 
                                              color="primary"
                                            />
                                          )}
                                          <Chip 
                                            label={`${pieza.ancho || 0} × ${pieza.alto || 0} ${etapa.unidadMedida || 'm'}`} 
                                            size="small" 
                                            variant="outlined"
                                          />
                                          <Chip 
                                            label={`${areaTotal.toFixed(2)} m² total`} 
                                            size="small" 
                                            color="info"
                                          />
                                          <Chip 
                                            label={`$${subtotal.toLocaleString()}`} 
                                            size="small" 
                                            color="success"
                                          />
                                        </Box>
                                        
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                          <strong>Producto:</strong> {pieza.productoLabel || pieza.producto || 'No especificado'}
                                        </Typography>
                                        
                                        {pieza.color && (
                                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Color:</strong> {pieza.color}
                                          </Typography>
                                        )}
                                        
                                        {pieza.precioM2 && pieza.precioM2 !== etapa.precioGeneral && (
                                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Precio especial:</strong> ${pieza.precioM2}/m²
                                          </Typography>
                                        )}
                                        
                                        {pieza.observaciones && (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            💬 {pieza.observaciones}
                                          </Typography>
                                        )}
                                        
                                        {pieza.fotoUrls && pieza.fotoUrls.length > 0 && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              📷 {pieza.fotoUrls.length} foto{pieza.fotoUrls.length > 1 ? 's' : ''}
                                            </Typography>
                                            {pieza.fotoUrls.slice(0, 3).map((url, idx) => (
                                              <img 
                                                key={idx}
                                                src={url} 
                                                alt={`Foto ${idx + 1}`}
                                                style={{ 
                                                  width: '30px', 
                                                  height: '24px', 
                                                  objectFit: 'cover', 
                                                  borderRadius: '3px',
                                                  cursor: 'pointer',
                                                  border: '1px solid #e5e7eb'
                                                }}
                                                onClick={() => window.open(url, '_blank')}
                                              />
                                            ))}
                                            {pieza.fotoUrls.length > 3 && (
                                              <Typography variant="caption" color="text.secondary">
                                                +{pieza.fotoUrls.length - 3} más
                                              </Typography>
                                            )}
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                                
                                {/* Resumen de precios si hay más de una pieza */}
                                {etapa.piezas.length > 1 && (
                                  <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f9ff', borderRadius: 1, borderLeft: '3px solid #0ea5e9' }}>
                                    <Typography variant="body2" fontWeight="medium" color="primary">
                                      💰 Resumen: {etapa.piezas.length} piezas • {etapa.totalM2?.toFixed(2) || 0} m² • 
                                      ${etapa.piezas.reduce((total, pieza) => {
                                        const area = (pieza.ancho || 0) * (pieza.alto || 0);
                                        const precio = pieza.precioM2 || etapa.precioGeneral || 750;
                                        return total + (area * precio);
                                      }, 0).toLocaleString()} estimado
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay etapas registradas.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button 
                  variant="contained" 
                  startIcon={<CheckCircle />} 
                  onClick={handleRegistrarVisita}
                  disabled={registrandoVisita || prospecto?.estadoCita === 'completada'}
                  sx={{ 
                    backgroundColor: '#16a34a', 
                    '&:hover': { backgroundColor: '#15803d' },
                    '&:disabled': { backgroundColor: '#9ca3af' }
                  }}
                >
                  {registrandoVisita ? 'Registrando...' : 'Registrar Visita'}
                </Button>
                <Button variant="outlined" startIcon={<Event />} onClick={() => setOpenReagendar(true)}>
                  Reagendar cita
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setErrorEtapa('');
                    setOpenAgregarEtapa(true);
                  }}
                  sx={{
                    backgroundColor: '#D4AF37',
                    color: '#111827',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#b8962d' }
                  }}
                  disabled={!prospecto}
                >
                  Agregar etapa
                </Button>
                <Button
                  variant="contained"
                  startIcon={<WhatsApp />}
                  onClick={() => abrirGeneradorWhatsApp(obtenerContextoPorEtapa(prospecto.etapa))}
                  sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#128C7E' } }}
                >
                  💬 Generar WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<WhatsApp />}
                  onClick={abrirWhatsApp}
                  sx={{ borderColor: '#25D366', color: '#25D366' }}
                >
                  📱 WhatsApp Directo
                </Button>
                <Button variant="outlined" startIcon={<Comment />} onClick={() => setOpenComentario(true)}>
                  Agregar comentario
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openComentario} onClose={() => setOpenComentario(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar comentario</DialogTitle>
        <DialogContent>
          <TextFieldConDictado
            autoFocus
            label="Comentario"
            fullWidth
            rows={4}
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Escribe tu comentario aquí... (puedes usar dictado por voz)"
            sx={{ mt: 1 }}
          />
          <TextField
            select
            margin="dense"
            label="Categoría"
            fullWidth
            value={comentarioCategoria}
            onChange={(e) => setComentarioCategoria(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mt: 2 }}
          >
            {comentarioCategorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComentario(false)}>Cancelar</Button>
          <Button onClick={handleAgregarComentario} disabled={savingComentario || !comentario.trim()}>
            {savingComentario ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog open={openReagendar} onClose={() => setOpenReagendar(false)} fullWidth maxWidth="md">
        <DialogTitle>Reagendar cita</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Fecha"
                type="date"
                fullWidth
                value={reagendarFecha}
                onChange={(event) => setReagendarFecha(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Hora"
                type="time"
                fullWidth
                value={reagendarHora}
                onChange={(event) => setReagendarHora(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextFieldConDictado
                margin="dense"
                label="Motivo del reagendamiento (Requerido)"
                fullWidth
                multiline
                rows={3}
                value={motivoReagendamiento}
                onChange={(event) => setMotivoReagendamiento(event.target.value)}
                placeholder="Especifica el motivo por el cual se reagenda la cita... (puedes usar dictado por voz)"
                required
                error={!motivoReagendamiento.trim() && savingReagendar}
                helperText={!motivoReagendamiento.trim() && savingReagendar ? 'El motivo es obligatorio' : 'Puedes usar el botón de micrófono para dictar el motivo'}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Evidencias del reagendamiento
                </Typography>
                <input
                  accept="image/*,application/pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  id="evidencias-upload"
                  multiple
                  type="file"
                  onChange={handleAgregarEvidencia}
                />
                <label htmlFor="evidencias-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    size="small"
                  >
                    Subir evidencias
                  </Button>
                </label>
              </Box>
              
              {evidenciasReagendamiento.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Archivos seleccionados:
                  </Typography>
                  <List dense>
                    {evidenciasReagendamiento.map((archivo, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleEliminarEvidencia(index)}
                            startIcon={<Delete />}
                          >
                            Eliminar
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={archivo.name}
                          secondary={`${(archivo.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenReagendar(false);
            setMotivoReagendamiento('');
            setEvidenciasReagendamiento([]);
          }}>Cancelar</Button>
          <Button 
            onClick={handleReagendarCita} 
            disabled={savingReagendar || !motivoReagendamiento.trim()}
            variant="contained"
          >
            {savingReagendar ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AgregarEtapaModal
        open={openAgregarEtapa}
        onClose={() => setOpenAgregarEtapa(false)}
        prospectoId={prospecto?._id}
        onSaved={(mensaje) => {
          setMensajeEtapa(mensaje);
          setErrorEtapa('');
          fetchEtapas(); // Actualizar la lista de etapas
          fetchProspecto(); // Actualizar el prospecto por si cambió de etapa
        }}
        onError={(mensaje) => {
          setMensajeEtapa('');
          setErrorEtapa(mensaje);
        }}
      />

      {/* Modal de Detalle del Levantamiento */}
      <Dialog
        open={openLevantamientoModal}
        onClose={() => setOpenLevantamientoModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            📋 Detalle del Levantamiento Técnico
          </Box>
        </DialogTitle>
        <DialogContent>
          {levantamientoSeleccionado && (
            <Box>
              {/* Información General */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📊 Resumen General
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip 
                        label={`${(() => {
                          if (!levantamientoSeleccionado.piezas) return 0;
                          return levantamientoSeleccionado.piezas.reduce((total, pieza) => {
                            if (pieza.medidas && Array.isArray(pieza.medidas)) {
                              return total + pieza.medidas.length;
                            } else {
                              return total + (pieza.cantidad || 1);
                            }
                          }, 0);
                        })()} piezas`}
                        color="primary"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip 
                        label={`${(levantamientoSeleccionado.totalM2 || 0).toFixed(2)} m²`}
                        color="success"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip 
                        label={`$${(levantamientoSeleccionado.subtotalProductos || 0).toLocaleString()}`}
                        color="warning"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip 
                        label={new Date(levantamientoSeleccionado.fechaHora).toLocaleDateString()}
                        color="info"
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Detalle por Pieza */}
              <Typography variant="h6" gutterBottom color="primary">
                🔧 Detalle por Pieza
              </Typography>
              
              {levantamientoSeleccionado.piezas?.map((pieza, index) => (
                <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
                          📍 {pieza.ubicacion || `Área ${index + 1}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6c757d', fontStyle: 'italic' }}>
                          Área de instalación
                        </Typography>
                      </Box>
                      <Chip 
                        label={pieza.productoLabel || pieza.producto || 'Producto no especificado'}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    {/* Medidas Individuales */}
                    {pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          📏 Medidas Individuales:
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          {pieza.medidas.map((medida, medidaIndex) => (
                            <Grid item xs={12} sm={6} md={4} key={medidaIndex}>
                              <Box sx={{ 
                                p: 1.5, 
                                border: '1px solid #e0e0e0', 
                                borderRadius: 1,
                                bgcolor: '#f9f9f9'
                              }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {pieza.medidas.length > 1 ? `Medida ${medidaIndex + 1}` : 'Medidas'}
                                </Typography>
                                <Typography variant="body2">
                                  📐 {medida.ancho || 0} × {medida.alto || 0} m
                                </Typography>
                                <Typography variant="body2">
                                  📊 Área: {((medida.ancho || 0) * (medida.alto || 0)).toFixed(2)} m²
                                </Typography>
                                {medida.productoLabel && (
                                  <Typography variant="body2">
                                    🏷️ {medida.productoLabel}
                                  </Typography>
                                )}
                                {medida.color && (
                                  <Typography variant="body2">
                                    🎨 {medida.color}
                                  </Typography>
                                )}
                                {medida.precioM2 && (
                                  <Typography variant="body2" color="success.main">
                                    💰 ${medida.precioM2}/m²
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      // Formato anterior
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          📏 Medidas:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2">
                              📐 {pieza.ancho || 0} × {pieza.alto || 0} m
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2">
                              📊 Área: {((pieza.ancho || 0) * (pieza.alto || 0) * (pieza.cantidad || 1)).toFixed(2)} m²
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2">
                              🔢 Cantidad: {pieza.cantidad || 1}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Información Adicional */}
                    <Grid container spacing={2}>
                      {pieza.color && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            🎨 <strong>Color:</strong> {pieza.color}
                          </Typography>
                        </Grid>
                      )}
                      {pieza.precioM2 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="success.main">
                            💰 <strong>Precio:</strong> ${pieza.precioM2}/m²
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {/* Observaciones */}
                    {pieza.observaciones && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: '#fff3cd', borderRadius: 1 }}>
                        <Typography variant="body2">
                          💬 <strong>Observaciones:</strong> {pieza.observaciones}
                        </Typography>
                      </Box>
                    )}

                    {/* Fotos */}
                    {pieza.fotoUrls && pieza.fotoUrls.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          📷 Fotos ({pieza.fotoUrls.length}):
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {pieza.fotoUrls.slice(0, 6).map((foto, fotoIndex) => (
                            <Box
                              key={fotoIndex}
                              component="img"
                              src={foto}
                              alt={`Foto ${fotoIndex + 1}`}
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '1px solid #ddd',
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(foto, '_blank')}
                            />
                          ))}
                          {pieza.fotoUrls.length > 6 && (
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#f5f5f5',
                                borderRadius: 1,
                                border: '1px solid #ddd'
                              }}
                            >
                              <Typography variant="caption">
                                +{pieza.fotoUrls.length - 6}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Video */}
                    {pieza.videoUrl && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          🎥 Video:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => window.open(pieza.videoUrl, '_blank')}
                        >
                          Ver Video
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Información Técnica Adicional */}
              {(levantamientoSeleccionado.instalacion || levantamientoSeleccionado.descuento) && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      ⚙️ Información Técnica Adicional
                    </Typography>
                    
                    {levantamientoSeleccionado.instalacion?.cobra && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          🔧 Instalación Especial:
                        </Typography>
                        <Typography variant="body2">
                          Tipo: {levantamientoSeleccionado.instalacion.tipo || 'No especificado'}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Precio: ${(levantamientoSeleccionado.instalacion.precio || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    {levantamientoSeleccionado.descuento?.aplica && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          💸 Descuento Aplicado:
                        </Typography>
                        <Typography variant="body2">
                          Tipo: {levantamientoSeleccionado.descuento.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Descuento: {levantamientoSeleccionado.descuento.tipo === 'porcentaje' 
                            ? `${levantamientoSeleccionado.descuento.valor}%` 
                            : `$${(levantamientoSeleccionado.descuento.valor || 0).toLocaleString()}`}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLevantamientoModal(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Generador WhatsApp */}
      <GeneradorWhatsApp
        open={openWhatsApp}
        onClose={() => setOpenWhatsApp(false)}
        contexto={contextoWhatsApp}
        datosCliente={prospecto}
        onMensajeGenerado={handleMensajeWhatsAppGenerado}
      />

      {/* Modal para visualizar imágenes */}
      <Dialog
        open={imagenModal.open}
        onClose={() => setImagenModal({ open: false, url: '', nombre: '' })}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center' }}>
          {imagenModal.nombre}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, position: 'relative' }}>
          {imagenModal.loading && (
            <Box sx={{ 
              position: 'absolute', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              zIndex: 1
            }}>
              <CircularProgress sx={{ color: 'white' }} />
              <Typography variant="body2" sx={{ color: 'white' }}>
                Cargando imagen...
              </Typography>
            </Box>
          )}
          <img
            src={imagenModal.url}
            alt={imagenModal.nombre}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '8px',
              opacity: imagenModal.loading ? 0.3 : 1,
              transition: 'opacity 0.3s ease'
            }}
            onError={(e) => {
              console.error('❌ Error cargando imagen en modal:', {
                url: imagenModal.url,
                error: e,
                target: e.target
              });
              
              // Intentar con URL completa si no la tiene
              if (!imagenModal.url.startsWith('http')) {
                const urlCompleta = `http://localhost:5001${imagenModal.url}`;
                console.log('🔄 Intentando con URL completa:', urlCompleta);
                e.target.src = urlCompleta;
              } else {
                // Si ya falló con URL completa, mostrar error
                console.error('💥 Imagen no disponible:', imagenModal.url);
                setImagenModal(prev => ({ ...prev, loading: false }));
                setError(`No se pudo cargar la imagen: ${imagenModal.nombre}`);
                limpiarErrorDespues(3);
              }
            }}
            onLoad={() => {
              console.log('✅ Imagen cargada correctamente en modal:', imagenModal.url);
              setImagenModal(prev => ({ ...prev, loading: false }));
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={() => setImagenModal({ open: false, url: '', nombre: '', loading: true })}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: 'grey.200' } }}
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              try {
                // Construir URL completa para evitar redirección al dashboard
                const urlCompleta = imagenModal.url.startsWith('http') 
                  ? imagenModal.url 
                  : `http://localhost:5001${imagenModal.url}`;
                console.log('🔗 Abriendo URL completa en nueva pestaña:', urlCompleta);
                
                const newWindow = window.open(urlCompleta, '_blank', 'noopener,noreferrer');
                if (!newWindow) {
                  console.warn('⚠️ No se pudo abrir nueva pestaña (popup bloqueado)');
                }
              } catch (error) {
                console.error('❌ Error abriendo nueva pestaña:', error);
                // No mostrar error al usuario, es solo un problema técnico
              }
            }}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'grey.300' } }}
          >
            Abrir en nueva pestaña
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProspectoDetalle;
