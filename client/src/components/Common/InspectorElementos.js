import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Divider
} from '@mui/material';
import {
  Close,
  Search,
  Code,
  ContentCopy,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const InspectorElementos = ({ open, onClose, elementoInicial = null }) => {
  const [modoInspeccion, setModoInspeccion] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [infoElemento, setInfoElemento] = useState(elementoInicial);
  const [mensaje, setMensaje] = useState('');
  
  // Actualizar info cuando se recibe elemento inicial
  React.useEffect(() => {
    if (elementoInicial) {
      setInfoElemento(elementoInicial);
      setMensaje('✅ Elemento capturado correctamente');
    }
  }, [elementoInicial]);

  // Estilos para el overlay de inspección
  const overlayStyles = `
    .inspector-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 123, 255, 0.1) !important;
      z-index: 9999 !important;
      cursor: crosshair !important;
      pointer-events: all !important;
    }
    
    .inspector-highlight {
      outline: 2px solid #007bff !important;
      outline-offset: 2px !important;
      background-color: rgba(0, 123, 255, 0.1) !important;
      position: relative !important;
    }
    
    .inspector-tooltip {
      position: absolute !important;
      background: #333 !important;
      color: white !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      z-index: 10000 !important;
      pointer-events: none !important;
      white-space: nowrap !important;
    }
  `;

  // Función para obtener información detallada del elemento
  const obtenerInfoElemento = (elemento) => {
    const rect = elemento.getBoundingClientRect();
    const estilos = window.getComputedStyle(elemento);
    
    return {
      tagName: elemento.tagName.toLowerCase(),
      id: elemento.id || 'sin-id',
      classes: Array.from(elemento.classList).join(' ') || 'sin-clases',
      innerHTML: elemento.innerHTML.substring(0, 500) + (elemento.innerHTML.length > 500 ? '...' : ''),
      outerHTML: elemento.outerHTML.substring(0, 1000) + (elemento.outerHTML.length > 1000 ? '...' : ''),
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
        zIndex: estilos.zIndex,
        backgroundColor: estilos.backgroundColor,
        color: estilos.color,
        fontSize: estilos.fontSize,
        fontFamily: estilos.fontFamily
      },
      atributos: Array.from(elemento.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}),
      path: obtenerSelectorCSS(elemento)
    };
  };

  // Función para obtener el selector CSS del elemento
  const obtenerSelectorCSS = (elemento) => {
    if (elemento.id) {
      return `#${elemento.id}`;
    }
    
    let selector = elemento.tagName.toLowerCase();
    
    if (elemento.className) {
      const clases = Array.from(elemento.classList)
        .filter(clase => !clase.startsWith('Mui') && !clase.startsWith('css-'))
        .slice(0, 2);
      if (clases.length > 0) {
        selector += '.' + clases.join('.');
      }
    }
    
    // Agregar posición si hay hermanos del mismo tipo
    const hermanos = Array.from(elemento.parentElement?.children || [])
      .filter(el => el.tagName === elemento.tagName);
    
    if (hermanos.length > 1) {
      const indice = hermanos.indexOf(elemento) + 1;
      selector += `:nth-child(${indice})`;
    }
    
    return selector;
  };

  // Manejar hover sobre elementos
  const handleMouseOver = useCallback((event) => {
    if (!modoInspeccion) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const elemento = event.target;
    
    // Limpiar highlights anteriores
    document.querySelectorAll('.inspector-highlight').forEach(el => {
      el.classList.remove('inspector-highlight');
    });
    
    // Agregar highlight al elemento actual
    elemento.classList.add('inspector-highlight');
    
    // Crear tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'inspector-tooltip';
    tooltip.textContent = `${elemento.tagName.toLowerCase()}${elemento.id ? '#' + elemento.id : ''}${elemento.className ? '.' + Array.from(elemento.classList).slice(0, 2).join('.') : ''}`;
    
    const rect = elemento.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.top - 25}px`;
    
    document.body.appendChild(tooltip);
    
    // Limpiar tooltip anterior
    setTimeout(() => {
      const tooltips = document.querySelectorAll('.inspector-tooltip');
      tooltips.forEach((t, index) => {
        if (index < tooltips.length - 1) {
          t.remove();
        }
      });
    }, 100);
  }, [modoInspeccion]);

  // Manejar clic en elemento
  const handleClick = useCallback((event) => {
    if (!modoInspeccion) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const elemento = event.target;
    
    // Obtener información del elemento
    const info = obtenerInfoElemento(elemento);
    setInfoElemento(info);
    setElementoSeleccionado(elemento);
    
    // Desactivar modo inspección
    setModoInspeccion(false);
    
    // Mostrar modal con la información capturada
    setTimeout(() => {
      // Reabrir el modal del inspector con la información
      window.inspectorInfo = info;
      window.dispatchEvent(new CustomEvent('elementoInspeccionado', { detail: info }));
    }, 100);
    
    setMensaje('✅ Elemento capturado correctamente');
  }, [modoInspeccion]);

  // Activar/desactivar modo inspección
  const toggleModoInspeccion = () => {
    const nuevoModo = !modoInspeccion;
    setModoInspeccion(nuevoModo);
    
    if (nuevoModo) {
      setMensaje('🔍 Haz clic en cualquier elemento para inspeccionarlo');
      // Cerrar el modal del inspector para permitir inspección
      onClose();
    } else {
      setMensaje('');
    }
  };

  // Efectos para agregar/quitar event listeners
  useEffect(() => {
    if (!open) return;

    // Agregar estilos CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = overlayStyles;
    document.head.appendChild(styleElement);

    return () => {
      // Limpiar estilos
      document.head.removeChild(styleElement);
    };
  }, [open]);

  useEffect(() => {
    if (modoInspeccion) {
      document.addEventListener('mouseover', handleMouseOver, true);
      document.addEventListener('click', handleClick, true);
      document.body.style.cursor = 'crosshair';
    } else {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('click', handleClick, true);
      document.body.style.cursor = 'default';
      
      // Limpiar highlights y tooltips
      document.querySelectorAll('.inspector-highlight').forEach(el => {
        el.classList.remove('inspector-highlight');
      });
      document.querySelectorAll('.inspector-tooltip').forEach(el => {
        el.remove();
      });
    }

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('click', handleClick, true);
      document.body.style.cursor = 'default';
    };
  }, [modoInspeccion, handleMouseOver, handleClick]);

  // Copiar información al portapapeles
  const copiarInfo = async (tipo) => {
    if (!infoElemento) return;

    let texto = '';
    
    switch (tipo) {
      case 'html':
        texto = infoElemento.outerHTML;
        break;
      case 'selector':
        texto = infoElemento.path;
        break;
      case 'completo':
        texto = `ELEMENTO INSPECCIONADO:
Tag: ${infoElemento.tagName}
ID: ${infoElemento.id}
Clases: ${infoElemento.classes}
Selector: ${infoElemento.path}
Posición: ${infoElemento.posicion.x}, ${infoElemento.posicion.y}
Tamaño: ${infoElemento.posicion.width} x ${infoElemento.posicion.height}
Texto: ${infoElemento.texto}

ESTILOS PRINCIPALES:
Display: ${infoElemento.estilos.display}
Position: ${infoElemento.estilos.position}
Background: ${infoElemento.estilos.backgroundColor}
Color: ${infoElemento.estilos.color}

HTML:
${infoElemento.outerHTML}`;
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
    setModoInspeccion(false);
    setElementoSeleccionado(null);
    setInfoElemento(null);
    setMensaje('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      className="captura-ignore"
      data-html2canvas-ignore="true"
      sx={{
        zIndex: 10000 // Por encima de otros modales pero permite interacción
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search color="primary" />
        Inspector de Elementos
        <IconButton 
          onClick={handleClose} 
          sx={{ ml: 'auto' }}
          className="captura-ignore"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {mensaje && (
          <Alert 
            severity={mensaje.includes('❌') ? 'error' : 'success'} 
            sx={{ mb: 2 }}
            className="captura-ignore"
          >
            {mensaje}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant={modoInspeccion ? "contained" : "outlined"}
            color={modoInspeccion ? "secondary" : "primary"}
            onClick={toggleModoInspeccion}
            startIcon={modoInspeccion ? <VisibilityOff /> : <Visibility />}
            size="large"
            fullWidth
          >
            {modoInspeccion ? '🔍 Modo Inspección ACTIVO - Haz clic en un elemento' : '🔍 Activar Modo Inspección'}
          </Button>
        </Box>

        {infoElemento && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              📋 Elemento Seleccionado: <code>{infoElemento.tagName}</code>
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip label={`ID: ${infoElemento.id}`} sx={{ mr: 1, mb: 1 }} />
              <Chip label={`Clases: ${infoElemento.classes}`} sx={{ mr: 1, mb: 1 }} />
              <Chip label={`${infoElemento.posicion.width}x${infoElemento.posicion.height}px`} sx={{ mr: 1, mb: 1 }} />
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              🎯 Selector CSS:
            </Typography>
            <Paper sx={{ p: 1, mb: 2, bgcolor: 'grey.100' }}>
              <code>{infoElemento.path}</code>
            </Paper>

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
                onClick={() => copiarInfo('selector')}
                startIcon={<ContentCopy />}
              >
                Copiar Selector
              </Button>
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

            <Divider sx={{ my: 2 }} />

            <Alert severity="info">
              <Typography variant="body2">
                💡 <strong>Para soporte:</strong> Usa "Copiar Info Completa" para enviar toda la información 
                del elemento problemático. Incluye HTML, estilos, posición y selector CSS.
              </Typography>
            </Alert>
          </Paper>
        )}

        {!infoElemento && !modoInspeccion && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Inspector de Elementos para Soporte
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activa el modo inspección y haz clic en cualquier elemento de la página 
              para obtener información detallada que puedes enviar a soporte técnico.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions className="captura-ignore">
        <Button onClick={handleClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente del botón flotante para inspector
export const BotonInspectorFlotante = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [inspectorHabilitado, setInspectorHabilitado] = useState(true);
  const [infoElemento, setInfoElemento] = useState(null);

  // Verificar configuración al montar el componente
  React.useEffect(() => {
    const configuracion = localStorage.getItem('sundeck_inspector_habilitado');
    if (configuracion !== null) {
      setInspectorHabilitado(JSON.parse(configuracion));
    }

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      const nuevaConfiguracion = localStorage.getItem('sundeck_inspector_habilitado');
      if (nuevaConfiguracion !== null) {
        setInspectorHabilitado(JSON.parse(nuevaConfiguracion));
      }
    };

    // Escuchar eventos de inspección
    const handleElementoInspeccionado = (event) => {
      setInfoElemento(event.detail);
      setModalAbierto(true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('elementoInspeccionado', handleElementoInspeccionado);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('elementoInspeccionado', handleElementoInspeccionado);
    };
  }, []);

  // No mostrar el botón si está deshabilitado
  if (!inspectorHabilitado) {
    return null;
  }

  return (
    <>
      <Tooltip title="Inspector de elementos para soporte" placement="left">
        <Fab
          color="info"
          onClick={() => setModalAbierto(true)}
          sx={{
            position: 'fixed',
            bottom: 80, // Arriba del botón de captura
            right: 16,
            zIndex: 9999, // Por encima de todos los modales
          }}
          className="captura-ignore"
          data-html2canvas-ignore="true"
          data-testid="boton-inspector-flotante"
        >
          <Search />
        </Fab>
      </Tooltip>

      <InspectorElementos
        open={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setInfoElemento(null);
        }}
        elementoInicial={infoElemento}
      />
    </>
  );
};

export default InspectorElementos;
