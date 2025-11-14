import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  GridView as GridViewIcon,
  ViewAgenda as ViewAgendaIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axiosConfig from '../../../config/axios';

const BotonGenerarEtiquetas = ({ proyectoId, nombreProyecto }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const generarEtiquetas = async (formato) => {
    setLoading(true);
    handleClose();

    try {
      const response = await axiosConfig.get(
        `/etiquetas/proyecto/${proyectoId}`,
        {
          params: { formato },
          responseType: 'blob'
        }
      );

      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Etiquetas_${nombreProyecto || proyectoId}_${formato}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Etiquetas generadas exitosamente (${formato === 'multiple' ? 'Múltiples' : 'Individuales'})`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Error generando etiquetas:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error generando etiquetas',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Generando...' : 'Etiquetas QR'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => generarEtiquetas('multiple')}>
          <ListItemIcon>
            <GridViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Múltiples por Página"
            secondary="2 etiquetas por hoja"
          />
        </MenuItem>

        <MenuItem onClick={() => generarEtiquetas('individual')}>
          <ListItemIcon>
            <ViewAgendaIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Individuales"
            secondary="1 etiqueta por hoja (4x6)"
          />
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BotonGenerarEtiquetas;
