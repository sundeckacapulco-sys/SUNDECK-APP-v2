import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Fab,
  Paper,
  Chip
} from '@mui/material';
import {
  Close,
  Search,
  ContentCopy,
  Code
} from '@mui/icons-material';
import { useSoporte } from './ModuloSoporte';

// Función global para cancelar inspección
window.cancelarInspectorGlobal = () => {
  document.body.style.cursor = 'default';
  document.documentElement.style.cursor = 'default';
  
  // Remover listeners si existen
  const existingHandlers = window.inspectorHandlers;
  if (existingHandlers) {
    document.removeEventListener('click', existingHandlers.click, { capture: true });
    document.removeEventListener('mouseover', existingHandlers.mouseover, { capture: true });
  }
  
  // Remover estilos
  const style = document.getElementById('inspector-styles');
  if (style) style.remove();
  document.querySelectorAll('.inspector-hover').forEach(el => {
    el.classList.remove('inspector-hover');
  });
  
  // Remover botón de cancelar
  const cancelBtn = document.getElementById('inspector-cancel-btn');
  if (cancelBtn) cancelBtn.remove();
  
  // Cancelar timeout si existe
  if (window.inspectorTimeout) {
    clearTimeout(window.inspectorTimeout);
    window.inspectorTimeout = null;
  }
};

// Función global para activar inspección
window.activarInspectorGlobal = () => {
  // Cambiar cursor de toda la página
  document.body.style.cursor = 'crosshair';
  document.documentElement.style.cursor = 'crosshair';
  
  // Función para obtener info del elemento
  const obtenerInfoElemento = (elemento) => {
    const rect = elemento.getBoundingClientRect();
    const estilos = window.getComputedStyle(elemento);
    
    return {
      tagName: elemento.tagName.toLowerCase(),
      id: elemento.id || 'sin-id',
      classes: Array.from(elemento.classList).join(' ') || 'sin-clases',
      innerHTML: elemento.innerHTML.substring(0, 500),
      outerHTML: elemento.outerHTML.substring(0, 1000),
      texto: elemento.textContent?.substring(0, 200) || 'sin-texto',
      posicion: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      estilos: {
        display: estilos.display,
        position: estilos.position,
        backgroundColor: estilos.backgroundColor,
        color: estilos.color
      }
    };
  };
  
  // Agregar estilos para resaltar elementos
  const agregarEstilosInspeccion = () => {
    const style = document.createElement('style');
    style.id = 'inspector-styles';
    style.textContent = `
      .inspector-hover {
        outline: 2px solid #2196F3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  };
  
  // Remover estilos
  const removerEstilosInspeccion = () => {
    const style = document.getElementById('inspector-styles');
    if (style) style.remove();
    document.querySelectorAll('.inspector-hover').forEach(el => {
      el.classList.remove('inspector-hover');
    });
  };
  
  // Manejar hover
  const handleMouseOver = (event) => {
    const elemento = event.target;
    if (elemento.closest('.inspector-ignore') || 
        elemento.classList.contains('captura-ignore')) {
      return;
    }
    
    // Remover hover anterior
    document.querySelectorAll('.inspector-hover').forEach(el => {
      el.classList.remove('inspector-hover');
    });
    
    // Agregar hover actual
    elemento.classList.add('inspector-hover');
  };
  
  // Manejar clic en cualquier elemento
  const handleClick = (event) => {
    const elemento = event.target;
    
    // Verificar si es un elemento que queremos inspeccionar
    if (elemento.closest('.inspector-ignore') || 
        elemento.classList.contains('captura-ignore')) {
      return;
    }
    
    // Solo interceptar si es clic izquierdo
    if (event.button !== 0) {
      return;
    }
    
    // Prevenir el comportamiento por defecto SOLO después de confirmar que queremos inspeccionar
    event.preventDefault();
    event.stopPropagation();
    
    const info = obtenerInfoElemento(elemento);
    
    // Limpiar modo inspección
    window.cancelarInspectorGlobal();
    
    // Disparar evento con la información
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('elementoCapturado', { detail: info }));
    }, 100);
  };
  
  // Agregar estilos y listeners
  agregarEstilosInspeccion();
  
  // Usar addEventListener con opciones específicas
  document.addEventListener('click', handleClick, { capture: true, passive: false });
  document.addEventListener('mouseover', handleMouseOver, { capture: true, passive: true });
  
  // Guardar handlers para poder removerlos
  window.inspectorHandlers = { click: handleClick, mouseover: handleMouseOver };
  
  // Crear botón de cancelar
  const cancelBtn = document.createElement('div');
  cancelBtn.id = 'inspector-cancel-btn';
  cancelBtn.innerHTML = '❌ Cancelar Inspección';
  cancelBtn.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: #f44336 !important;
    color: white !important;
    padding: 10px 20px !important;
    border-radius: 5px !important;
    cursor: pointer !important;
    z-index: 99999 !important;
    font-family: Arial, sans-serif !important;
    font-size: 14px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
  `;
  
  cancelBtn.onclick = () => {
    window.cancelarInspectorGlobal();
  };
  
  document.body.appendChild(cancelBtn);
  
  // Auto-remover después de 30 segundos
  const timeoutId = setTimeout(() => {
    window.cancelarInspectorGlobal();
  }, 30000);
  
  // Guardar timeout para poder cancelarlo
  window.inspectorTimeout = timeoutId;
};

const InspectorSimple = ({ open, onClose }) => {
  const [infoElemento, setInfoElemento] = useState(null);
  const [mensaje, setMensaje] = useState('');

  // Escuchar eventos de captura
  React.useEffect(() => {
    const handleElementoCapturado = (event) => {
      setInfoElemento(event.detail);
      setMensaje('✅ Elemento capturado correctamente');
    };

    window.addEventListener('elementoCapturado', handleElementoCapturado);
    return () => window.removeEventListener('elementoCapturado', handleElementoCapturado);
  }, []);

  // Activar inspección
  const activarInspeccion = () => {
    onClose(); // Cerrar modal
    setTimeout(() => {
      window.activarInspectorGlobal();
      setMensaje('🔍 Haz clic en cualquier elemento para inspeccionarlo');
    }, 100);
  };

  // Copiar información
  const copiarInfo = async (tipo) => {
    if (!infoElemento) return;

    let texto = '';
    
    switch (tipo) {
      case 'completo':
        texto = `ELEMENTO INSPECCIONADO:
Tag: ${infoElemento.tagName}
ID: ${infoElemento.id}
Clases: ${infoElemento.classes}
Posición: ${infoElemento.posicion.x}, ${infoElemento.posicion.y}
Tamaño: ${infoElemento.posicion.width} x ${infoElemento.posicion.height}
Texto: ${infoElemento.texto}

ESTILOS:
Display: ${infoElemento.estilos.display}
Position: ${infoElemento.estilos.position}
Background: ${infoElemento.estilos.backgroundColor}
Color: ${infoElemento.estilos.color}

HTML:
${infoElemento.outerHTML}`;
        break;
      case 'html':
        texto = infoElemento.outerHTML;
        break;
    }

    try {
      await navigator.clipboard.writeText(texto);
      setMensaje(`✅ ${tipo} copiado al portapapeles`);
    } catch (error) {
      setMensaje(`❌ Error al copiar: ${error.message}`);
    }
  };

  const handleClose = () => {
    setInfoElemento(null);
    setMensaje('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="inspector-ignore"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search color="primary" />
        Inspector de Elementos
        <IconButton onClick={handleClose} sx={{ ml: 'auto' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {mensaje && (
          <Alert 
            severity={mensaje.includes('❌') ? 'error' : 'success'} 
            sx={{ mb: 2 }}
          >
            {mensaje}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={activarInspeccion}
            startIcon={<Search />}
            size="large"
            fullWidth
          >
            🔍 Activar Inspección de Elementos
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Se cerrará este modal y podrás hacer clic en cualquier elemento
          </Typography>
        </Box>

        {infoElemento && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              📋 Elemento Capturado: <code>{infoElemento.tagName}</code>
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip label={`ID: ${infoElemento.id}`} sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${infoElemento.posicion.width}x${infoElemento.posicion.height}px`} sx={{ mr: 1, mb: 1 }} />
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              📝 Texto del elemento:
            </Typography>
            <Paper sx={{ p: 1, mb: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body2">{infoElemento.texto}</Typography>
            </Paper>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => copiarInfo('html')}
                startIcon={<Code />}
              >
                Copiar HTML
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => copiarInfo('completo')}
                startIcon={<ContentCopy />}
              >
                Copiar Info Completa
              </Button>
            </Box>
          </Paper>
        )}

        {!infoElemento && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Haz clic en "Activar Inspección" y luego en cualquier elemento de la página 
              para obtener su información técnica.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// Botón flotante simplificado
export const BotonInspectorSimple = () => {
  const { soporteActivo } = useSoporte();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [inspectorHabilitado, setInspectorHabilitado] = useState(true);

  React.useEffect(() => {
    const configuracion = localStorage.getItem('sundeck_inspector_habilitado');
    if (configuracion !== null) {
      setInspectorHabilitado(JSON.parse(configuracion));
    }
  }, []);

  if (!inspectorHabilitado || !soporteActivo) {
    return null;
  }

  return (
    <>
      <Tooltip title="Inspector de elementos (versión simple)" placement="left">
        <Fab
          color="info"
          onClick={() => setModalAbierto(true)}
          className="inspector-ignore captura-ignore"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 9999,
          }}
        >
          <Search />
        </Fab>
      </Tooltip>

      <InspectorSimple
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </>
  );
};

export default InspectorSimple;
