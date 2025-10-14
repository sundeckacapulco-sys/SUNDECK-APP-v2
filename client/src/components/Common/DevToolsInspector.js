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
  Chip,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close,
  Search,
  ContentCopy,
  Code,
  ExpandMore,
  BugReport
} from '@mui/icons-material';
import { useSoporte } from './ModuloSoporte';

// Inspector profesional tipo DevTools
const DevToolsInspector = ({ open, onClose }) => {
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [modoActivo, setModoActivo] = useState(false);

  // Función para obtener información completa del elemento
  const obtenerInfoCompleta = (elemento) => {
    const rect = elemento.getBoundingClientRect();
    const estilos = window.getComputedStyle(elemento);
    
    // Obtener path completo del elemento
    const obtenerPath = (el) => {
      const path = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
          selector += '#' + el.id;
          path.unshift(selector);
          break;
        } else {
          let sibling = el;
          let nth = 1;
          while (sibling = sibling.previousElementSibling) {
            if (sibling.nodeName.toLowerCase() === selector) nth++;
          }
          if (nth !== 1) selector += `:nth-of-type(${nth})`;
        }
        path.unshift(selector);
        el = el.parentNode;
      }
      return path.join(' > ');
    };

    // Obtener todos los atributos
    const atributos = {};
    for (let attr of elemento.attributes) {
      atributos[attr.name] = attr.value;
    }

    // Obtener estilos más relevantes
    const estilosRelevantes = {
      // Layout
      display: estilos.display,
      position: estilos.position,
      top: estilos.top,
      left: estilos.left,
      right: estilos.right,
      bottom: estilos.bottom,
      width: estilos.width,
      height: estilos.height,
      
      // Box Model
      margin: estilos.margin,
      padding: estilos.padding,
      border: estilos.border,
      
      // Appearance
      backgroundColor: estilos.backgroundColor,
      color: estilos.color,
      fontSize: estilos.fontSize,
      fontFamily: estilos.fontFamily,
      fontWeight: estilos.fontWeight,
      
      // Flexbox/Grid
      flexDirection: estilos.flexDirection,
      justifyContent: estilos.justifyContent,
      alignItems: estilos.alignItems,
      gridTemplateColumns: estilos.gridTemplateColumns,
      
      // Others
      zIndex: estilos.zIndex,
      opacity: estilos.opacity,
      transform: estilos.transform,
      overflow: estilos.overflow
    };

    return {
      // Información básica
      tagName: elemento.tagName.toLowerCase(),
      id: elemento.id || null,
      className: elemento.className || null,
      textContent: elemento.textContent?.trim().substring(0, 200) || null,
      
      // HTML
      innerHTML: elemento.innerHTML,
      outerHTML: elemento.outerHTML,
      
      // Selectores
      path: obtenerPath(elemento),
      
      // Posición y dimensiones
      boundingRect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom)
      },
      
      // Atributos
      attributes: atributos,
      
      // Estilos computados
      computedStyles: estilosRelevantes,
      
      // Información del padre
      parent: elemento.parentElement ? {
        tagName: elemento.parentElement.tagName.toLowerCase(),
        id: elemento.parentElement.id || null,
        className: elemento.parentElement.className || null
      } : null,
      
      // Hijos
      children: Array.from(elemento.children).map(child => ({
        tagName: child.tagName.toLowerCase(),
        id: child.id || null,
        className: child.className || null
      }))
    };
  };

  // Activar modo inspector profesional
  const activarInspector = () => {
    setModoActivo(true);
    onClose(); // Cerrar modal
    
    // Cambiar cursor de toda la página
    document.body.style.cursor = 'crosshair';
    document.documentElement.style.cursor = 'crosshair';
    
    // Agregar clase al body para identificar modo inspector
    document.body.classList.add('devtools-inspector-active');
    
    // Agregar estilos globales
    const style = document.createElement('style');
    style.id = 'devtools-inspector-styles';
    style.textContent = `
      .devtools-inspector-active * {
        cursor: crosshair !important;
      }
      .devtools-highlight {
        outline: 2px solid #2196F3 !important;
        outline-offset: 2px !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
      }
    `;
    document.head.appendChild(style);

    // Crear tooltip informativo
    const tooltip = document.createElement('div');
    tooltip.id = 'devtools-tooltip';
    tooltip.style.cssText = `
      position: fixed !important;
      background: #333 !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      font-family: monospace !important;
      z-index: 9999999 !important;
      pointer-events: none !important;
      display: none !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
    `;
    document.body.appendChild(tooltip);

    // Crear botón de cancelar
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'devtools-cancel';
    cancelBtn.innerHTML = '❌ Salir del Inspector';
    cancelBtn.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: #f44336 !important;
      color: white !important;
      border: none !important;
      padding: 12px 20px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      z-index: 9999999 !important;
      font-size: 14px !important;
      font-weight: bold !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    `;

    let elementoActual = null;

    // Manejar hover
    const handleMouseOver = (e) => {
      const elemento = e.target;
      
      if (!elemento || elemento === cancelBtn || elemento === tooltip || 
          elemento.classList.contains('inspector-ignore') ||
          elemento.classList.contains('captura-ignore')) {
        return;
      }

      // Limpiar highlight anterior
      if (elementoActual) {
        elementoActual.classList.remove('devtools-highlight');
      }

      // Highlight nuevo elemento
      elementoActual = elemento;
      elemento.classList.add('devtools-highlight');

      // Actualizar tooltip
      const rect = elemento.getBoundingClientRect();
      tooltip.innerHTML = `
        <div><strong>${elemento.tagName.toLowerCase()}</strong></div>
        ${elemento.id ? `<div>id: ${elemento.id}</div>` : ''}
        ${elemento.className ? `<div>class: ${elemento.className.split(' ').slice(0, 2).join(' ')}</div>` : ''}
        <div>${Math.round(rect.width)} × ${Math.round(rect.height)}px</div>
      `;
      
      tooltip.style.display = 'block';
      tooltip.style.left = `${e.clientX + 10}px`;
      tooltip.style.top = `${e.clientY - 50}px`;
    };

    // Manejar clic
    const handleClick = (e) => {
      const elemento = e.target;
      
      if (!elemento || elemento === cancelBtn || elemento === tooltip ||
          elemento.classList.contains('inspector-ignore') ||
          elemento.classList.contains('captura-ignore')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();

      // Capturar información
      const info = obtenerInfoCompleta(elemento);
      
      // Limpiar inspector
      limpiarInspector();
      
      // Mostrar información
      setElementoSeleccionado(info);
      setMensaje('✅ Elemento capturado con DevTools Inspector');
      
      // Reabrir modal con información
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('devtoolsElementoCapturado', { detail: info }));
      }, 100);
    };

    // Función para limpiar inspector
    const limpiarInspector = () => {
      // Restaurar cursor
      document.body.style.cursor = 'default';
      document.documentElement.style.cursor = 'default';
      
      // Remover clase del body
      document.body.classList.remove('devtools-inspector-active');
      
      // Remover estilos
      const styleEl = document.getElementById('devtools-inspector-styles');
      if (styleEl) styleEl.remove();
      
      // Limpiar elementos
      tooltip.remove();
      cancelBtn.remove();
      
      // Limpiar highlight
      if (elementoActual) {
        elementoActual.classList.remove('devtools-highlight');
      }
      
      // Remover listeners
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('click', handleClick, true);
      
      setModoActivo(false);
    };

    // Event listeners
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
    cancelBtn.addEventListener('click', limpiarInspector);

    // Agregar elementos al DOM
    document.body.appendChild(cancelBtn);

    // Auto-limpiar después de 60 segundos
    setTimeout(limpiarInspector, 60000);
  };

  // Escuchar eventos de captura
  React.useEffect(() => {
    const handleElementoCapturado = (event) => {
      setElementoSeleccionado(event.detail);
      setMensaje('✅ Elemento capturado correctamente');
    };

    window.addEventListener('devtoolsElementoCapturado', handleElementoCapturado);
    return () => window.removeEventListener('devtoolsElementoCapturado', handleElementoCapturado);
  }, []);

  // Copiar información
  const copiarInfo = async (tipo) => {
    if (!elementoSeleccionado) return;

    let texto = '';
    
    switch (tipo) {
      case 'selector':
        texto = elementoSeleccionado.path;
        break;
      case 'html':
        texto = elementoSeleccionado.outerHTML;
        break;
      case 'estilos':
        texto = JSON.stringify(elementoSeleccionado.computedStyles, null, 2);
        break;
      case 'completo':
        texto = `ELEMENTO INSPECCIONADO (DevTools):

🏷️  INFORMACIÓN BÁSICA:
Tag: ${elementoSeleccionado.tagName}
ID: ${elementoSeleccionado.id || 'ninguno'}
Clases: ${elementoSeleccionado.className || 'ninguna'}
Texto: ${elementoSeleccionado.textContent || 'sin texto'}

🎯 SELECTOR CSS:
${elementoSeleccionado.path}

📐 DIMENSIONES Y POSICIÓN:
Posición: ${elementoSeleccionado.boundingRect.x}, ${elementoSeleccionado.boundingRect.y}
Tamaño: ${elementoSeleccionado.boundingRect.width} × ${elementoSeleccionado.boundingRect.height}px
Top: ${elementoSeleccionado.boundingRect.top}px
Left: ${elementoSeleccionado.boundingRect.left}px

🎨 ESTILOS PRINCIPALES:
Display: ${elementoSeleccionado.computedStyles.display}
Position: ${elementoSeleccionado.computedStyles.position}
Background: ${elementoSeleccionado.computedStyles.backgroundColor}
Color: ${elementoSeleccionado.computedStyles.color}
Font: ${elementoSeleccionado.computedStyles.fontSize} ${elementoSeleccionado.computedStyles.fontFamily}

📦 ATRIBUTOS:
${Object.entries(elementoSeleccionado.attributes).map(([key, value]) => `${key}: ${value}`).join('\n')}

🌳 CONTEXTO:
Padre: ${elementoSeleccionado.parent ? `${elementoSeleccionado.parent.tagName}${elementoSeleccionado.parent.id ? '#' + elementoSeleccionado.parent.id : ''}` : 'ninguno'}
Hijos: ${elementoSeleccionado.children.length} elementos

💻 HTML COMPLETO:
${elementoSeleccionado.outerHTML}`;
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
    setElementoSeleccionado(null);
    setMensaje('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      className="inspector-ignore"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport color="primary" />
        DevTools Inspector Profesional
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

        {!elementoSeleccionado && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BugReport sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Inspector Profesional de Elementos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Herramienta avanzada tipo DevTools para inspeccionar elementos de la página
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={activarInspector}
              startIcon={<Search />}
              sx={{ minWidth: 250 }}
            >
              🔍 Activar Inspector DevTools
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Se cerrará este modal y podrás inspeccionar cualquier elemento con información detallada
            </Typography>
          </Box>
        )}

        {elementoSeleccionado && (
          <Box>
            <Typography variant="h6" gutterBottom>
              🎯 Elemento Capturado: <code>{elementoSeleccionado.tagName}</code>
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Chip 
                label={`ID: ${elementoSeleccionado.id || 'ninguno'}`} 
                sx={{ mr: 1, mb: 1 }} 
              />
              <Chip 
                label={`${elementoSeleccionado.boundingRect.width}×${elementoSeleccionado.boundingRect.height}px`} 
                sx={{ mr: 1, mb: 1 }} 
              />
              <Chip 
                label={`Pos: ${elementoSeleccionado.boundingRect.x}, ${elementoSeleccionado.boundingRect.y}`} 
                sx={{ mr: 1, mb: 1 }} 
              />
            </Box>

            {/* Selector CSS */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">🎯 Selector CSS</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  multiline
                  value={elementoSeleccionado.path}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </AccordionDetails>
            </Accordion>

            {/* Texto del elemento */}
            {elementoSeleccionado.textContent && (
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">📝 Contenido de Texto</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">{elementoSeleccionado.textContent}</Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Botones de copia */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
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
                variant="outlined"
                size="small"
                onClick={() => copiarInfo('estilos')}
                startIcon={<ContentCopy />}
              >
                Copiar Estilos
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => copiarInfo('completo')}
                startIcon={<BugReport />}
              >
                Copiar Info Completa para Soporte
              </Button>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                💡 <strong>Para soporte técnico:</strong> Usa "Copiar Info Completa" para obtener 
                toda la información técnica del elemento en formato profesional.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// Botón flotante para DevTools Inspector
export const BotonDevToolsInspector = () => {
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
      <Tooltip title="DevTools Inspector Profesional" placement="left">
        <Fab
          color="error"
          onClick={() => setModalAbierto(true)}
          className="inspector-ignore captura-ignore"
          sx={{
            position: 'fixed',
            bottom: 140, // Arriba de los otros botones
            right: 16,
            zIndex: 9999,
          }}
        >
          <BugReport />
        </Fab>
      </Tooltip>

      <DevToolsInspector
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </>
  );
};

export default DevToolsInspector;
