import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Divider,
  ListItemIcon, ListItemText, ClickAwayListener, MenuItem
} from '@mui/material';
import {
  RestoreFromTrash, DeleteForever, Delete, MoreVert, Refresh, 
  DeleteSweep, ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const PapeleraProspectos = () => {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspecto, setSelectedProspecto] = useState(null);
  
  // Estados para menú de acciones
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Estados para modales
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEmptyDialog, setOpenEmptyDialog] = useState(false);
  const [prospectoParaAccion, setProspectoParaAccion] = useState(null); // Guardar prospecto para acciones
  
  // Estados para alertas
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProspectosPapelera();
  }, []);

  const fetchProspectosPapelera = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/prospectos/papelera/listar');
      setProspectos(response.data.docs || []);
    } catch (error) {
      console.error('Error fetching papelera:', error);
      setAlert({
        open: true,
        message: '❌ Error cargando papelera',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, prospecto) => {
    event.preventDefault();
    event.stopPropagation();
    
    const buttonElement = event.currentTarget;
    const rect = buttonElement.getBoundingClientRect();
    
    setSelectedProspecto(prospecto);
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
    setSelectedProspecto(null);
  };

  const handleRestaurar = async () => {
    try {
      if (!prospectoParaAccion) {
        setAlert({
          open: true,
          message: '❌ No hay prospecto seleccionado',
          severity: 'error'
        });
        return;
      }

      console.log('Restaurando prospecto:', prospectoParaAccion._id); // Debug
      await axiosConfig.put(`/prospectos/${prospectoParaAccion._id}/restaurar`);
      
      setAlert({
        open: true,
        message: '✅ Prospecto restaurado exitosamente',
        severity: 'success'
      });
      
      fetchProspectosPapelera();
      setOpenRestoreDialog(false);
      setProspectoParaAccion(null);
    } catch (error) {
      console.error('Error restaurando:', error); // Debug
      setAlert({
        open: true,
        message: `❌ Error al restaurar: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleEliminarPermanente = async () => {
    try {
      if (!prospectoParaAccion) {
        setAlert({
          open: true,
          message: '❌ No hay prospecto seleccionado',
          severity: 'error'
        });
        return;
      }

      console.log('Eliminando permanentemente:', prospectoParaAccion._id); // Debug
      await axiosConfig.delete(`/prospectos/${prospectoParaAccion._id}/permanente`);
      
      setAlert({
        open: true,
        message: '🗑️ Prospecto eliminado permanentemente',
        severity: 'success'
      });
      
      fetchProspectosPapelera();
      setOpenDeleteDialog(false);
      setProspectoParaAccion(null);
    } catch (error) {
      console.error('Error eliminando permanentemente:', error); // Debug
      setAlert({
        open: true,
        message: `❌ Error al eliminar: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleVaciarPapelera = async () => {
    try {
      const response = await axiosConfig.delete('/prospectos/papelera/vaciar');
      
      setAlert({
        open: true,
        message: `🗑️ ${response.data.eliminados} prospectos eliminados permanentemente`,
        severity: 'success'
      });
      
      fetchProspectosPapelera();
      setOpenEmptyDialog(false);
    } catch (error) {
      setAlert({
        open: true,
        message: '❌ Error al vaciar papelera',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/prospectos')}
            variant="outlined"
          >
            Volver a Prospectos
          </Button>
          <Typography variant="h4" component="h1">
            🗑️ Papelera de Prospectos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchProspectosPapelera}
          >
            Actualizar
          </Button>
          {prospectos.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={() => setOpenEmptyDialog(true)}
            >
              Vaciar Papelera
            </Button>
          )}
        </Box>
      </Box>

      {/* Información */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Los prospectos en la papelera se pueden restaurar o eliminar permanentemente. 
        Una vez eliminados permanentemente, no se pueden recuperar.
      </Alert>

      {/* Tabla de prospectos en papelera */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Eliminado Por</TableCell>
                <TableCell>Fecha Eliminación</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : prospectos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        🗑️ La papelera está vacía
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Los prospectos eliminados aparecerán aquí
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                prospectos.map((prospecto) => (
                  <TableRow key={prospecto._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {prospecto.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prospecto.direccion?.ciudad}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          📞 {prospecto.telefono}
                        </Typography>
                        {prospecto.email && (
                          <Typography variant="body2" color="text.secondary">
                            ✉️ {prospecto.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prospecto.producto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prospecto.eliminadoPor?.nombre} {prospecto.eliminadoPor?.apellido}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(prospecto.fechaEliminacion).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(prospecto.fechaEliminacion).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, prospecto)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Menú de acciones */}
      {menuOpen && (
        <ClickAwayListener onClickAway={handleMenuClose}>
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: 180,
              zIndex: 1300
            }}
          >
            <MenuItem onClick={() => {
              setProspectoParaAccion(selectedProspecto);
              setOpenRestoreDialog(true);
              handleMenuClose();
            }}>
              <ListItemIcon><RestoreFromTrash color="success" /></ListItemIcon>
              <ListItemText>Restaurar</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem 
              onClick={() => {
                setProspectoParaAccion(selectedProspecto);
                setOpenDeleteDialog(true);
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon><DeleteForever color="error" /></ListItemIcon>
              <ListItemText>Eliminar Permanentemente</ListItemText>
            </MenuItem>
          </Paper>
        </ClickAwayListener>
      )}

      {/* Dialog de confirmación para restaurar */}
      <Dialog
        open={openRestoreDialog}
        onClose={() => {
          setOpenRestoreDialog(false);
          setProspectoParaAccion(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>♻️ Restaurar Prospecto</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Deseas restaurar el prospecto <strong>{prospectoParaAccion?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            El prospecto volverá a aparecer en la lista principal de prospectos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenRestoreDialog(false);
            setProspectoParaAccion(null);
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRestaurar} 
            color="success" 
            variant="contained"
          >
            Restaurar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar permanentemente */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setProspectoParaAccion(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>⚠️ Eliminar Permanentemente</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar permanentemente el prospecto <strong>{prospectoParaAccion?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 'bold' }}>
            ⚠️ Esta acción NO se puede deshacer. Se perderán todos los datos asociados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setProspectoParaAccion(null);
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEliminarPermanente} 
            color="error" 
            variant="contained"
          >
            Eliminar Permanentemente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para vaciar papelera */}
      <Dialog
        open={openEmptyDialog}
        onClose={() => setOpenEmptyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>🗑️ Vaciar Papelera</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar permanentemente TODOS los prospectos de la papelera?
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 'bold' }}>
            ⚠️ Esta acción NO se puede deshacer. Se eliminarán {prospectos.length} prospectos permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmptyDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleVaciarPapelera} 
            color="error" 
            variant="contained"
          >
            Vaciar Papelera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, open: false })} 
          severity={alert.severity}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PapeleraProspectos;
