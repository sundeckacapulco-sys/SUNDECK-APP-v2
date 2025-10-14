import React from 'react';
import {
  Tooltip,
  Fab
} from '@mui/material';
import {
  TouchApp
} from '@mui/icons-material';
import { useSoporte } from './ModuloSoporte';

// Función global para activar selector directo
window.activarSelectorDirecto = () => {
  // Cambiar cursor
  document.body.style.cursor = 'crosshair';
  document.documentElement.style.cursor = 'crosshair';
  
  // Crear indicador visual
  const indicador = document.createElement('div');
  indicador.id = 'selector-directo-indicador';
  indicador.innerHTML = '👆 Haz clic en cualquier elemento para enviarlo al chat';
  indicador.style.cssText = `
    position: fixed !important;
    top: 10px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: #4CAF50 !important;
    color: white !important;
    padding: 12px 24px !important;
    border-radius: 25px !important;
    z-index: 999999 !important;
    font-size: 14px !important;
    font-weight: bold !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    animation: pulse 2s infinite !important;
  `;
  
  // Agregar animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: translateX(-50%) scale(1); }
      50% { transform: translateX(-50%) scale(1.05); }
      100% { transform: translateX(-50%) scale(1); }
    }
    .selector-highlight {
      outline: 3px solid #4CAF50 !important;
      outline-offset: 2px !important;
      background-color: rgba(76, 175, 80, 0.1) !important;
    }
  `;
  document.head.appendChild(style);
  
  let elementoActual = null;
  
  // Función para obtener información simple pero completa
  const obtenerInfoElemento = (elemento) => {
    const rect = elemento.getBoundingClientRect();
    const estilos = window.getComputedStyle(elemento);
    
    // Generar selector simple
    let selector = elemento.tagName.toLowerCase();
    if (elemento.id) {
      selector = `#${elemento.id}`;
    } else if (elemento.className) {
      const clases = elemento.className.split(' ').filter(c => c && !c.startsWith('css-')).slice(0, 2);
      if (clases.length > 0) {
        selector += '.' + clases.join('.');
      }
    }
    
    return `ELEMENTO SELECCIONADO:

🏷️ Tag: ${elemento.tagName.toLowerCase()}
🆔 ID: ${elemento.id || 'ninguno'}
🎨 Clases: ${elemento.className || 'ninguna'}
📝 Texto: ${elemento.textContent?.trim().substring(0, 100) || 'sin texto'}
📐 Tamaño: ${Math.round(rect.width)} × ${Math.round(rect.height)}px
📍 Posición: ${Math.round(rect.x)}, ${Math.round(rect.y)}
🎯 Selector: ${selector}

💻 HTML:
${elemento.outerHTML.substring(0, 500)}${elemento.outerHTML.length > 500 ? '...' : ''}

🎨 Estilos principales:
- Display: ${estilos.display}
- Position: ${estilos.position}
- Background: ${estilos.backgroundColor}
- Color: ${estilos.color}
- Font: ${estilos.fontSize} ${estilos.fontFamily.split(',')[0]}

---
Elemento capturado automáticamente para análisis de soporte técnico.`;
  };
  
  // Manejar hover
  const handleMouseOver = (e) => {
    const elemento = e.target;
    
    if (elemento === indicador || 
        elemento.classList.contains('captura-ignore') ||
        elemento.classList.contains('inspector-ignore')) {
      return;
    }
    
    // Limpiar highlight anterior
    if (elementoActual) {
      elementoActual.classList.remove('selector-highlight');
    }
    
    // Highlight nuevo elemento
    elementoActual = elemento;
    elemento.classList.add('selector-highlight');
  };
  
  // Manejar clic - ENVÍO AUTOMÁTICO
  const handleClick = (e) => {
    const elemento = e.target;
    
    if (elemento === indicador || 
        elemento.classList.contains('captura-ignore') ||
        elemento.classList.contains('inspector-ignore')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Obtener información del elemento
    const info = obtenerInfoElemento(elemento);
    
    // COPIAR AL PORTAPAPELES AUTOMÁTICAMENTE
    if (navigator.clipboard) {
      navigator.clipboard.writeText(info).then(() => {
        console.log('✅ Información copiada al portapapeles automáticamente');
        
        // Mostrar la información capturada en una ventana emergente
        const ventanaInfo = window.open('', '_blank', 'width=600,height=800,scrollbars=yes');
        if (ventanaInfo) {
          ventanaInfo.document.write(`
            <html>
              <head>
                <title>Elemento Capturado para Soporte</title>
                <style>
                  body { font-family: monospace; padding: 20px; background: #f5f5f5; }
                  .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .header { background: #4CAF50; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
                  .copy-btn { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px 0; }
                  .copy-btn:hover { background: #1976D2; }
                  pre { background: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>🎯 Elemento Capturado para Soporte Técnico</h2>
                    <p>Información lista para copiar y enviar al chat de soporte</p>
                  </div>
                  
                  <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('info').textContent); alert('✅ Copiado al portapapeles!');">📋 Copiar Solo la Información</button>
                  
                  <pre id="info">${info}</pre>
                  
                  <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
                    <strong>📌 Instrucciones:</strong><br>
                    1. Haz clic en "📋 Copiar Solo la Información" arriba<br>
                    2. Ve al chat de soporte<br>
                    3. Pega la información (Ctrl+V)<br>
                    4. Cierra esta ventana
                  </div>
                </div>
              </body>
            </html>
          `);
          ventanaInfo.document.close();
        }
      }).catch(() => {
        console.log('❌ No se pudo copiar automáticamente');
        alert('❌ No se pudo copiar automáticamente. Información mostrada en consola.');
      });
    }
    
    // También mostrar en consola como respaldo
    console.log('ELEMENTO CAPTURADO PARA SOPORTE:');
    console.log(info);
    
    // Mostrar notificación de éxito
    const notificacion = document.createElement('div');
    notificacion.innerHTML = '✅ Información capturada y lista para copiar<br><small>Se abrió ventana con la información</small>';
    notificacion.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #4CAF50 !important;
      color: white !important;
      padding: 20px 30px !important;
      border-radius: 10px !important;
      z-index: 9999999 !important;
      font-size: 16px !important;
      font-weight: bold !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
      text-align: center !important;
    `;
    document.body.appendChild(notificacion);
    
    // Limpiar todo después de mostrar notificación
    setTimeout(() => {
      limpiarSelector();
      notificacion.remove();
    }, 3000);
  };
  
  // Función para limpiar selector
  const limpiarSelector = () => {
    document.body.style.cursor = 'default';
    document.documentElement.style.cursor = 'default';
    
    if (elementoActual) {
      elementoActual.classList.remove('selector-highlight');
    }
    
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('click', handleClick, true);
    
    if (indicador.parentNode) {
      indicador.remove();
    }
    
    const styleEl = document.querySelector('style');
    if (styleEl && styleEl.textContent.includes('selector-highlight')) {
      styleEl.remove();
    }
  };
  
  // Event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleClick, true);
  
  // Agregar indicador
  document.body.appendChild(indicador);
  
  // Auto-limpiar después de 30 segundos
  setTimeout(limpiarSelector, 30000);
};

// Botón flotante súper simple
export const BotonSelectorDirecto = () => {
  const { soporteActivo } = useSoporte();
  const [habilitado, setHabilitado] = React.useState(true);

  React.useEffect(() => {
    const configuracion = localStorage.getItem('sundeck_inspector_habilitado');
    if (configuracion !== null) {
      setHabilitado(JSON.parse(configuracion));
    }
  }, []);

  if (!habilitado || !soporteActivo) {
    return null;
  }

  return (
    <Tooltip title="Selector Directo - Clic y envía al chat automáticamente" placement="left">
      <Fab
        color="success"
        onClick={() => window.activarSelectorDirecto()}
        className="inspector-ignore captura-ignore"
        sx={{
          position: 'fixed',
          bottom: 200, // Arriba de todos los otros
          right: 16,
          zIndex: 9999,
        }}
      >
        <TouchApp />
      </Fab>
    </Tooltip>
  );
};

export default BotonSelectorDirecto;
