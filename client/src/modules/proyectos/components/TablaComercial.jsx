import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Pagination,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  TrendingUp as ConvertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  PersonAdd as AssignIcon,
  Cancel as CancelIcon,
  ChangeCircle as ChangeStateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../../config/axios';

const TablaComercial = ({ 
  registros, 
  loading, 
  page, 
  totalPages, 
  totalRegistros,
  onPageChange,
  onRecargar
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  
  // Diálogos
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [selectedAsesor, setSelectedAsesor] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [dialogRegistroId, setDialogRegistroId] = useState(null); // Guardar ID para diálogos
  
  // Lista de asesores (mock - deberías obtenerla de un endpoint)
  const asesores = [
    { id: 'Abigail', nombre: 'Abigail' },
    { id: 'Carlos', nombre: 'Carlos' },
    { id: 'Diana', nombre: 'Diana' }
  ];

  const handleMenuOpen = (event, registro) => {
    setAnchorEl(event.currentTarget);
    setSelectedRegistro(registro);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRegistro(null);
  };

  const handleVer = (id) => {
    navigate(`/proyectos/${id}`);
    handleMenuClose();
  };

  const handleEditar = (id) => {
    navigate(`/proyectos/${id}/editar`);
    handleMenuClose();
  };

  const handleConvertir = async (id) => {
    if (!window.confirm('¿Estás seguro de convertir este prospecto a proyecto?')) {
      return;
    }
    
    try {
      const response = await axiosConfig.post(`/proyectos/${id}/convertir`);
      
      console.log('✅ Prospecto convertido:', response.data);
      alert('Prospecto convertido a proyecto exitosamente');
      
      handleMenuClose();
      onRecargar();
    } catch (error) {
      console.error('❌ Error al convertir prospecto:', error);
      alert(error.response?.data?.message || 'Error al convertir prospecto');
    }
  };

  const handleOpenAssignDialog = () => {
    // Guardar el ID antes de cerrar el menú
    setDialogRegistroId(selectedRegistro?._id);
    setSelectedAsesor(selectedRegistro?.asesorComercial || '');
    setAssignDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenStateDialog = () => {
    // Guardar el ID antes de cerrar el menú
    setDialogRegistroId(selectedRegistro?._id);
    setSelectedEstado(selectedRegistro?.estadoComercial || 'nuevo');
    setStateDialogOpen(true);
    handleMenuClose();
  };

  const handleAsignarAsesor = async () => {
    if (!dialogRegistroId) {
      alert('Error: No hay registro seleccionado');
      return;
    }
    
    try {
      await axiosConfig.put(`/proyectos/${dialogRegistroId}`, {
        asesorComercial: selectedAsesor
      });
      
      alert('Asesor asignado exitosamente');
      setAssignDialogOpen(false);
      setDialogRegistroId(null);
      onRecargar();
    } catch (error) {
      console.error('❌ Error al asignar asesor:', error);
      alert(error.response?.data?.message || 'Error al asignar asesor');
    }
  };

  const handleCambiarEstado = async () => {
    if (!dialogRegistroId) {
      alert('Error: No hay registro seleccionado');
      return;
    }
    
    try {
      await axiosConfig.put(`/proyectos/${dialogRegistroId}`, {
        estadoComercial: selectedEstado
      });
      
      alert('Estado actualizado exitosamente');
      setStateDialogOpen(false);
      setDialogRegistroId(null);
      onRecargar();
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      alert(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleMarcarPerdido = async (id) => {
    if (!window.confirm('¿Estás seguro de marcar este registro como perdido?')) {
      return;
    }
    
    try {
      await axiosConfig.put(`/proyectos/${id}`, {
        estadoComercial: 'perdido'
      });
      
      alert('Registro marcado como perdido');
      handleMenuClose();
      onRecargar();
    } catch (error) {
      console.error('❌ Error al marcar como perdido:', error);
      alert(error.response?.data?.message || 'Error al marcar como perdido');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTipoBadge = (tipo) => {
    if (tipo === 'prospecto') {
      return (
        <Chip 
          label="🔵 Prospecto"
          size="small"
          sx={{ 
            bgcolor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        />
      );
    } else {
      return (
        <Chip 
          label="🟢 Proyecto"
          size="small"
          sx={{ 
            bgcolor: '#e8f5e9',
            color: '#388e3c',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        />
      );
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: '🆕 Nuevo', color: '#2196f3' },
      contactado: { label: '📞 Contactado', color: '#00bcd4' },
      'en seguimiento': { label: '👀 En Seguimiento', color: '#673ab7' },
      cita_agendada: { label: '📅 Cita', color: '#9c27b0' },
      cotizado: { label: '💰 Cotizado', color: '#ff9800' },
      activo: { label: '✅ Activo', color: '#4caf50' },
      fabricacion: { label: '🏗️ Fabricación', color: '#ff5722' },
      instalacion: { label: '🚚 Instalación', color: '#3f51b5' },
      completado: { label: '✔️ Completado', color: '#8bc34a' },
      pausado: { label: '⏸️ Pausado', color: '#9e9e9e' },
      perdido: { label: '❌ Perdido', color: '#f44336' }
    };

    const estadoInfo = estados[estado] || { label: estado, color: '#757575' };

    return (
      <Chip 
        label={estadoInfo.label}
        size="small"
        variant="outlined"
        sx={{ 
          borderColor: estadoInfo.color,
          color: estadoInfo.color,
          fontWeight: 500,
          fontSize: '0.7rem'
        }}
      />
    );
  };

  if (registros.length === 0 && !loading) {
    return (
      <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay registros para mostrar
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Asesor</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Monto</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Fecha</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registros.map((registro) => (
              <TableRow 
                key={registro._id}
                hover
                sx={{ 
                  '&:hover': { bgcolor: '#fafafa' },
                  cursor: 'pointer'
                }}
                onClick={() => handleVer(registro._id)}
              >
                <TableCell>{getTipoBadge(registro.tipo)}</TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="600">
                      {registro.cliente?.nombre || 'Sin nombre'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {registro.cliente?.telefono && (
                        <Tooltip title="Teléfono">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {registro.cliente.telefono}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                      {registro.cliente?.email && (
                        <Tooltip title="Email">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {registro.cliente.email}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  {getEstadoBadge(registro.estadoComercial || 'nuevo')}
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {registro.asesorComercial || 'Sin asignar'}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="600">
                    {formatCurrency(registro.monto_estimado || registro.total)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(registro.createdAt || registro.fecha_creacion)}
                  </Typography>
                </TableCell>
                
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small" 
                        onClick={() => handleVer(registro._id)}
                        sx={{ color: '#1976d2' }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditar(registro._id)}
                        sx={{ color: '#757575' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, registro)}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleVer(selectedRegistro?._id)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleEditar(selectedRegistro?._id)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleOpenAssignDialog}>
          <ListItemIcon>
            <AssignIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Asignar Asesor</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleOpenStateDialog}>
          <ListItemIcon>
            <ChangeStateIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Cambiar Estado</ListItemText>
        </MenuItem>
        
        {selectedRegistro?.tipo === 'prospecto' && (
          <MenuItem onClick={() => handleConvertir(selectedRegistro?._id)}>
            <ListItemIcon>
              <ConvertIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Convertir a Proyecto</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => handleMarcarPerdido(selectedRegistro?._id)}>
          <ListItemIcon>
            <CancelIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Marcar como Perdido</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo de Asignación de Asesor */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Asignar Asesor Comercial</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Asesor</InputLabel>
            <Select
              value={selectedAsesor}
              label="Asesor"
              onChange={(e) => setSelectedAsesor(e.target.value)}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {asesores.map((asesor) => (
                <MenuItem key={asesor.id} value={asesor.id}>
                  {asesor.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleAsignarAsesor} variant="contained">
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Cambio de Estado */}
      <Dialog open={stateDialogOpen} onClose={() => setStateDialogOpen(false)}>
        <DialogTitle>Cambiar Estado Comercial</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={selectedEstado}
              label="Estado"
              onChange={(e) => setSelectedEstado(e.target.value)}
            >
              <MenuItem value="nuevo">🆕 Nuevo</MenuItem>
              <MenuItem value="contactado">📞 Contactado</MenuItem>
              <MenuItem value="en seguimiento">👀 En Seguimiento</MenuItem>
              <MenuItem value="cita_agendada">📅 Cita Agendada</MenuItem>
              <MenuItem value="cotizado">💰 Cotizado</MenuItem>
              <MenuItem value="activo">✅ Activo</MenuItem>
              <MenuItem value="fabricacion">🏗️ En Fabricación</MenuItem>
              <MenuItem value="instalacion">🚚 En Instalación</MenuItem>
              <MenuItem value="completado">✔️ Completado</MenuItem>
              <MenuItem value="pausado">⏸️ Pausado</MenuItem>
              <MenuItem value="perdido">❌ Perdido</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCambiarEstado} variant="contained">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Paginación */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {registros.length} de {totalRegistros} registros
          </Typography>
          <Pagination 
            count={totalPages}
            page={page}
            onChange={(e, value) => onPageChange(value)}
            color="primary"
            disabled={loading}
          />
        </Box>
      )}
    </Box>
  );
};

export default TablaComercial;
