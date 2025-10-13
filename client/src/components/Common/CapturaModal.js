import React, { useState, useRef } from 'react';
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
  Fab
} from '@mui/material';
import {
  Screenshot,
  Download,
  ContentCopy,
  Close,
  CameraAlt,
  BugReport
} from '@mui/icons-material';
// Importación dinámica de html2canvas para evitar problemas de SSR

const CapturaModal = ({ open, onClose, elemento = null, titulo = "Captura de Pantalla" }) => {
  const [capturando, setCapturando] = useState(false);
  const [imagenCapturada, setImagenCapturada] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const canvasRef = useRef(null);

  const capturarPantalla = async () => {
    try {
      setCapturando(true);
      setMensaje('');

      // Importación dinámica de html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // Determinar qué capturar
      const elementoACapturar = elemento || document.body;
      
      const canvas = await html2canvas(elementoACapturar, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Mayor calidad
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (element) => {
          // Ignorar elementos de captura para evitar recursión
          return element.classList?.contains('captura-ignore') || 
                 element.getAttribute('data-html2canvas-ignore') === 'true';
        }
      });

      setImagenCapturada(canvas.toDataURL('image/png'));
      setMensaje('✅ Captura realizada exitosamente');
    } catch (error) {
      console.error('Error capturando pantalla:', error);
      setMensaje('❌ Error al capturar la pantalla: ' + error.message);
    } finally {
      setCapturando(false);
    }
  };

  const descargarImagen = () => {
    if (!imagenCapturada) return;

    const link = document.createElement('a');
    link.download = `captura-sundeck-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = imagenCapturada;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMensaje('✅ Imagen descargada');
  };

  const copiarAlPortapapeles = async () => {
    if (!imagenCapturada) return;

    try {
      // Convertir dataURL a blob
      const response = await fetch(imagenCapturada);
      const blob = await response.blob();
      
      // Copiar al portapapeles
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setMensaje('✅ Imagen copiada al portapapeles');
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      setMensaje('❌ Error al copiar. Usa el botón de descarga.');
    }
  };

  const limpiarCaptura = () => {
    setImagenCapturada(null);
    setMensaje('');
  };

  const handleClose = () => {
    limpiarCaptura();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="captura-ignore"
      data-html2canvas-ignore="true"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Screenshot color="primary" />
        {titulo}
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

        {!imagenCapturada ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CameraAlt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Capturar Pantalla para Soporte
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Esta herramienta te permite capturar la pantalla actual para enviar a soporte técnico.
              La imagen incluirá todos los elementos visibles del modal o página.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={capturarPantalla}
              disabled={capturando}
              startIcon={<Screenshot />}
              sx={{ minWidth: 200 }}
            >
              {capturando ? 'Capturando...' : 'Capturar Pantalla'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Vista Previa de la Captura:
            </Typography>
            
            <Box 
              sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1, 
                p: 1,
                maxHeight: 400,
                overflow: 'auto',
                bgcolor: 'grey.50'
              }}
            >
              <img 
                src={imagenCapturada} 
                alt="Captura de pantalla" 
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: 'block'
                }}
              />
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={descargarImagen}
                startIcon={<Download />}
                color="success"
              >
                Descargar
              </Button>
              
              <Button
                variant="outlined"
                onClick={copiarAlPortapapeles}
                startIcon={<ContentCopy />}
              >
                Copiar
              </Button>
              
              <Button
                variant="outlined"
                onClick={limpiarCaptura}
                color="warning"
              >
                Nueva Captura
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Para soporte:</strong> Puedes descargar la imagen y adjuntarla a tu ticket, 
                o copiarla y pegarla directamente en WhatsApp/Email.
              </Typography>
            </Alert>
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

// Componente del botón flotante para captura rápida
export const BotonCapturaFlotante = ({ elemento = null }) => {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
      <Tooltip title="Capturar pantalla para soporte" placement="left">
        <Fab
          color="secondary"
          onClick={() => setModalAbierto(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300,
          }}
          className="captura-ignore"
          data-html2canvas-ignore="true"
        >
          <BugReport />
        </Fab>
      </Tooltip>

      <CapturaModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        elemento={elemento}
        titulo="Captura para Soporte Técnico"
      />
    </>
  );
};

export default CapturaModal;
