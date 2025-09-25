import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Link,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Divider,
  ListItemIcon,
  ListItemText,
  ClickAwayListener
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Phone,
  Email,
  Archive,
  Unarchive,
  Block,
  DeleteForever
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const ProspectosList = () => {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    etapa: '',
    prioridad: '',
    fuente: '',
    archivado: false // Nuevo filtro para mostrar archivados
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // Estados para menú de acciones
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedProspecto, setSelectedProspecto] = useState(null);
  
  // Estados para modales y alertas
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // 'archive', 'unarchive', 'delete'
  const [prospectoParaEliminar, setProspectoParaEliminar] = useState(null); // Guardar prospecto para eliminar
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  const etapas = [
    { value: 'nuevo', label: 'Nuevo', color: 'default' },
    { value: 'contactado', label: 'Contactado', color: 'primary' },
    { value: 'cita_agendada', label: 'Cita Agendada', color: 'secondary' },
    { value: 'cotizacion', label: 'Cotización', color: 'warning' },
    { value: 'pedido', label: 'Pedido', color: 'info' },
    { value: 'fabricacion', label: 'Fabricación', color: 'success' },
    { value: 'instalacion', label: 'Instalación', color: 'success' },
    { value: 'entregado', label: 'Entregado', color: 'success' },
    { value: 'postventa', label: 'Postventa', color: 'success' },
    { value: 'perdido', label: 'Perdido', color: 'error' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja', color: 'default' },
    { value: 'media', label: 'Media', color: 'primary' },
    { value: 'alta', label: 'Alta', color: 'warning' },
    { value: 'urgente', label: 'Urgente', color: 'error' }
  ];

  const fuentes = [
    { value: 'web', label: 'Web' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'referido', label: 'Referido' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'google', label: 'Google' },
    { value: 'volante', label: 'Volante' },
    { value: 'otro', label: 'Otro' }
  ];

  const fetchProspectos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: paginacion.page,
        limit: paginacion.limit,
        ...filtros
      });

      const response = await axiosConfig.get(`/prospectos?${params}`);
      setProspectos(response.data.docs || []);
      setPaginacion(prev => ({
        ...prev,
        total: response.data.totalDocs || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching prospectos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspectos();
  }, [paginacion.page, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginacion(prev => ({ ...prev, page: 1 }));
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

  // Funciones para acciones de administración
  const handleArchivar = async () => {
    try {
      // Solo enviar los campos que necesitamos actualizar
      const updateData = {
        archivado: true,
        fechaArchivado: new Date().toISOString(),
        motivoArchivado: 'perdido'
      };
      
      await axiosConfig.put(`/prospectos/${selectedProspecto._id}`, updateData);
      
      setAlert({
        open: true,
        message: '✅ Prospecto archivado exitosamente',
        severity: 'success'
      });
      
      fetchProspectos();
      handleMenuClose();
    } catch (error) {
      console.error('Error archivando:', error);
      setAlert({
        open: true,
        message: '❌ Error al archivar prospecto',
        severity: 'error'
      });
    }
  };

  const handleDesarchivar = async () => {
    try {
      const updateData = {
        archivado: false
      };
      // No enviar fechaArchivado ni motivoArchivado como null
      
      await axiosConfig.put(`/prospectos/${selectedProspecto._id}`, updateData);
      
      setAlert({
        open: true,
        message: '✅ Prospecto desarchivado exitosamente',
        severity: 'success'
      });
      
      fetchProspectos();
      handleMenuClose();
    } catch (error) {
      console.error('Error desarchivando:', error);
      setAlert({
        open: true,
        message: '❌ Error al desarchivar prospecto',
        severity: 'error'
      });
    }
  };

  const handleMoverAPapelera = async () => {
    try {
      if (!prospectoParaEliminar) {
        setAlert({
          open: true,
          message: '❌ No hay prospecto seleccionado',
          severity: 'error'
        });
        return;
      }

      if (actionType === 'forzar') {
        // Eliminar permanentemente
        console.log('Eliminando permanentemente:', prospectoParaEliminar._id);
        const response = await axiosConfig.delete(`/prospectos/${prospectoParaEliminar._id}/forzar`);
        console.log('Respuesta:', response.data);
        
        setAlert({
          open: true,
          message: '🗑️ Prospecto eliminado permanentemente',
          severity: 'success'
        });
      } else {
        // Mover a papelera (comportamiento normal)
        console.log('Moviendo a papelera:', prospectoParaEliminar._id);
        const response = await axiosConfig.put(`/prospectos/${prospectoParaEliminar._id}/papelera`);
        console.log('Respuesta:', response.data);
        
        setAlert({
          open: true,
          message: '🗑️ Prospecto movido a papelera exitosamente',
          severity: 'success'
        });
      }
      
      fetchProspectos();
      setOpenDeleteDialog(false);
      setProspectoParaEliminar(null);
      setActionType('');
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response?.data);
      setAlert({
        open: true,
        message: `❌ Error: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  const getEtapaInfo = (etapa) => {
    return etapas.find(e => e.value === etapa) || etapas[0];
  };

  const getPrioridadInfo = (prioridad) => {
    return prioridades.find(p => p.value === prioridad) || prioridades[0];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Prospectos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={() => navigate('/prospectos/papelera')}
            color="error"
          >
            Papelera
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/prospectos/nuevo')}
          >
            Nuevo Prospecto
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Nombre, teléfono, email..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Etapa</InputLabel>
                <Select
                  value={filtros.etapa}
                  label="Etapa"
                  onChange={(e) => handleFiltroChange('etapa', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {etapas.map(etapa => (
                    <MenuItem key={etapa.value} value={etapa.value}>
                      {etapa.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={filtros.prioridad}
                  label="Prioridad"
                  onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {prioridades.map(prioridad => (
                    <MenuItem key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Fuente</InputLabel>
                <Select
                  value={filtros.fuente}
                  label="Fuente"
                  onChange={(e) => handleFiltroChange('fuente', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {fuentes.map(fuente => (
                    <MenuItem key={fuente.value} value={fuente.value}>
                      {fuente.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filtros.archivado}
                    onChange={(e) => handleFiltroChange('archivado', e.target.checked)}
                    color="warning"
                  />
                }
                label="Ver Archivados"
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFiltros({ busqueda: '', etapa: '', prioridad: '', fuente: '', archivado: false })}
                size="small"
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de prospectos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Etapa</TableCell>
              <TableCell>Prioridad</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : prospectos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron prospectos
                </TableCell>
              </TableRow>
            ) : (
              prospectos.map((prospecto) => {
                const etapaInfo = getEtapaInfo(prospecto.etapa);
                const prioridadInfo = getPrioridadInfo(prospecto.prioridad);
                
                return (
                  <TableRow
                    key={prospecto._id}
                    hover
                    onClick={() => navigate(`/prospectos/${prospecto._id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: prospecto.archivado ? '#f5f5f5' : 'inherit',
                      opacity: prospecto.archivado ? 0.7 : 1
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Link
                            component={RouterLink}
                            to={`/prospectos/${prospecto._id}`}
                            underline="hover"
                            sx={{ fontWeight: 600 }}
                          >
                            {prospecto.nombre}
                          </Link>
                          {prospecto.archivado && (
                            <Chip 
                              label="Archivado" 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {prospecto.direccion?.ciudad}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" />
                          <Typography variant="body2">
                            {prospecto.telefono}
                          </Typography>
                        </Box>
                        {prospecto.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" />
                            <Typography variant="body2">
                              {prospecto.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prospecto.producto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prospecto.tipoProducto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={etapaInfo.label}
                        color={etapaInfo.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prioridadInfo.label}
                        color={prioridadInfo.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(prospecto.createdAt).toLocaleDateString()}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {paginacion.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={paginacion.totalPages}
            page={paginacion.page}
            onChange={(e, page) => setPaginacion(prev => ({ ...prev, page }))}
            color="primary"
          />
        </Box>
      )}

      {/* Menú de acciones mejorado */}
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
              navigate(`/prospectos/${selectedProspecto?._id}`);
              handleMenuClose();
            }}>
              <ListItemIcon><Visibility /></ListItemIcon>
              <ListItemText>Ver Detalles</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              navigate(`/prospectos/${selectedProspecto?._id}/editar`);
              handleMenuClose();
            }}>
              <ListItemIcon><Edit /></ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            
            <Divider />
            
            {selectedProspecto?.archivado ? (
              <MenuItem onClick={() => {
                handleDesarchivar();
              }}>
                <ListItemIcon><Unarchive color="success" /></ListItemIcon>
                <ListItemText>Desarchivar</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem onClick={() => {
                handleArchivar();
              }}>
                <ListItemIcon><Archive color="warning" /></ListItemIcon>
                <ListItemText>Archivar</ListItemText>
              </MenuItem>
            )}
            
            <MenuItem 
              onClick={() => {
                setProspectoParaEliminar(selectedProspecto);
                setOpenDeleteDialog(true);
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon><Delete color="error" /></ListItemIcon>
              <ListItemText>Mover a Papelera</ListItemText>
            </MenuItem>
            
            {/* Solo mostrar eliminación forzada para admins */}
            {/* Aquí puedes agregar una verificación de rol si tienes acceso al contexto de usuario */}
            <MenuItem 
              onClick={() => {
                setProspectoParaEliminar(selectedProspecto);
                setActionType('forzar');
                setOpenDeleteDialog(true);
                handleMenuClose();
              }}
              sx={{ color: 'error.dark' }}
            >
              <ListItemIcon><DeleteForever color="error" /></ListItemIcon>
              <ListItemText>Eliminar Permanentemente</ListItemText>
            </MenuItem>
          </Paper>
        </ClickAwayListener>
      )}

      {/* Dialog de confirmación para mover a papelera */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setProspectoParaEliminar(null);
          setActionType('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'forzar' ? '⚠️ Eliminar Permanentemente' : '🗑️ Mover a Papelera'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {actionType === 'forzar' ? (
              <>¿Estás seguro de que deseas eliminar permanentemente el prospecto <strong>{prospectoParaEliminar?.nombre}</strong>?</>
            ) : (
              <>¿Estás seguro de que deseas mover el prospecto <strong>{prospectoParaEliminar?.nombre}</strong> a la papelera?</>
            )}
          </Typography>
          <Typography 
            variant="body2" 
            color={actionType === 'forzar' ? 'error.main' : 'text.secondary'} 
            sx={{ mt: 1, fontWeight: actionType === 'forzar' ? 'bold' : 'normal' }}
          >
            {actionType === 'forzar' ? (
              '⚠️ Esta acción NO se puede deshacer. Se perderán todos los datos asociados permanentemente.'
            ) : (
              'El prospecto se moverá a la papelera y podrás restaurarlo más tarde si es necesario.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setProspectoParaEliminar(null);
            setActionType('');
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMoverAPapelera} 
            color="error" 
            variant="contained"
          >
            {actionType === 'forzar' ? 'Eliminar Permanentemente' : 'Mover a Papelera'}
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

export default ProspectosList;
