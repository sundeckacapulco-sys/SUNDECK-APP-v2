import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, LinearProgress, Tabs, Tab,
  Switch, FormControlLabel, Tooltip, Menu, ListItemIcon, ListItemText,
  Divider, Paper, Avatar, Popper, ClickAwayListener, MenuList
} from '@mui/material';
import {
  Add, Edit, Delete, MoreVert, WhatsApp, Analytics, TrendingUp,
  Star, StarBorder, ContentCopy, Visibility, BarChart, PieChart,
  FilterList, Refresh, Download, Upload
} from '@mui/icons-material';
import TextFieldConDictado from '../Common/TextFieldConDictado';
import axiosConfig from '../../config/axios';

const PlantillasWhatsAppAdmin = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para modales
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    estilo: '',
    activa: '',
    efectividad: ''
  });
  
  // Estados para menú de acciones
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  
  // Función para manejar el menú
  const handleMenuClick = (event, plantilla) => {
    event.preventDefault();
    event.stopPropagation();
    
    const buttonElement = event.currentTarget;
    const rect = buttonElement.getBoundingClientRect();
    
    setSelectedPlantilla(plantilla);
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setMenuOpen(true);
  };
  
  const handleMenuClose = () => {
    setMenuOpen(false);
    setSelectedPlantilla(null);
  };
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState(null);
  const [mejoresPlantillas, setMejoresPlantillas] = useState([]);
  
  // Formulario de plantilla
  const [formData, setFormData] = useState({
    nombre: '', categoria: '', estilo: 'formal_profesional', mensaje: '', 
    activa: true, es_predeterminada: false, tags: [], notas_admin: ''
  });

  const categorias = [
    { value: 'cotizacion_enviada', label: '📋 Cotización Enviada', color: '#2196f3' },
    { value: 'seguimiento_cotizacion', label: '📞 Seguimiento General', color: '#ff9800' },
    { value: 'negociacion_hunter', label: '🎯 Negociación Hunter', color: '#f44336' },
    { value: 'negociacion_farmer', label: '🌱 Negociación Farmer', color: '#4caf50' },
    { value: 'manejo_objeciones', label: '🛡️ Manejo Objeciones', color: '#9c27b0' },
    { value: 'cotizacion_vencimiento', label: '⏰ Por Vencer', color: '#ff5722' },
    { value: 'post_vencimiento', label: '📅 Post-Vencimiento', color: '#795548' },
    { value: 'anticipo_confirmado', label: '💰 Anticipo Confirmado', color: '#4caf50' },
    { value: 'fabricacion_iniciada', label: '🔨 Fabricación', color: '#607d8b' },
    { value: 'producto_terminado', label: '✅ Terminado', color: '#8bc34a' },
    { value: 'recontacto', label: '🔄 Recontacto', color: '#673ab7' }
  ];

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await cargarPlantillas();
      
      // Cargar estadísticas y mejores plantillas solo si estamos en el dashboard
      if (tabValue === 0) {
        try {
          await Promise.all([
            cargarEstadisticas(),
            cargarMejoresPlantillas()
          ]);
        } catch (statsError) {
          console.warn('Error cargando estadísticas:', statsError);
          // No mostrar error al usuario, las estadísticas son opcionales
        }
      }
    } catch (error) {
      setError('Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  const cargarPlantillas = async () => {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([_, value]) => value !== '')
    );
    const response = await axiosConfig.get('/plantillas-whatsapp', { params });
    setPlantillas(response.data.plantillas || []);
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await axiosConfig.get('/plantillas-whatsapp/estadisticas/resumen');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      // Solo datos reales - si falla, mostrar vacío
      setEstadisticas({
        total_plantillas: 0,
        plantillas_activas: 0,
        efectividad_promedio: 0,
        rating_promedio: 0,
        por_categoria: []
      });
    }
  };

  const cargarMejoresPlantillas = async () => {
    try {
      const response = await axiosConfig.get('/plantillas-whatsapp/mejores');
      setMejoresPlantillas(response.data.plantillas || []);
    } catch (error) {
      console.error('Error cargando mejores plantillas:', error);
      // Solo datos reales - si falla, mostrar vacío
      setMejoresPlantillas([]);
    }
  };

  const cargarPlantillasIniciales = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.post('/plantillas-whatsapp/cargar-iniciales');
      setSuccess(`✅ ${response.data.creadas} plantillas creadas, ${response.data.existentes} ya existían`);
      cargarDatos();
    } catch (error) {
      setError('Error cargando plantillas iniciales');
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const EstadisticasCard = ({ titulo, valor, subtitulo, color, icono }) => (
    <Card sx={{ bgcolor: `${color}15`, border: `2px solid ${color}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icono}
          <Typography variant="h6" sx={{ color, fontWeight: 'bold', ml: 1 }}>
            {titulo}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: `${color}`, fontWeight: 'bold' }}>
          {valor}
        </Typography>
        {subtitulo && (
          <Typography variant="caption" color="text.secondary">
            {subtitulo}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
        📱 Administración de Plantillas WhatsApp
      </Typography>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="📊 Dashboard" />
        <Tab label="📋 Gestión de Plantillas" />
        <Tab label="📈 Análisis y Métricas" />
      </Tabs>

      {/* TAB 1: DASHBOARD */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <EstadisticasCard
              titulo="Total Plantillas"
              valor={estadisticas?.total_plantillas || 0}
              color="#2196f3"
              icono={<WhatsApp />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <EstadisticasCard
              titulo="En Uso Activo"
              valor={estadisticas?.plantillas_activas || 0}
              subtitulo={estadisticas?.total_plantillas > 0 ? 
                `${((estadisticas.plantillas_activas / estadisticas.total_plantillas) * 100).toFixed(1)}% del total` : 
                '0% del total'
              }
              color="#4caf50"
              icono={<TrendingUp />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <EstadisticasCard
              titulo="Efectividad Promedio"
              valor={`${estadisticas?.efectividad_promedio || 0}%`}
              color="#ff9800"
              icono={<BarChart />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <EstadisticasCard
              titulo="Rating Promedio"
              valor={`⭐ ${estadisticas?.rating_promedio || 0}`}
              subtitulo="de 5 estrellas"
              color="#9c27b0"
              icono={<Star />}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>🏆 Top 5 Plantillas</Typography>
                {mejoresPlantillas.slice(0, 5).map((plantilla, index) => (
                  <Box key={plantilla._id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: index === 0 ? '#ffd700' : '#e0e0e0', mr: 2 }}>
                      {index + 1}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{plantilla.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {plantilla.efectividad}% efectividad • {plantilla.veces_usada} usos
                      </Typography>
                    </Box>
                    <Chip label={`⭐ ${plantilla.rating_promedio}`} size="small" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>📊 Por Categoría</Typography>
                {estadisticas?.por_categoria?.map((cat) => (
                  <Box key={cat.categoria} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {categorias.find(c => c.value === cat.categoria)?.label || cat.categoria}
                      </Typography>
                      <Typography variant="body2">{cat.total}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(cat.total / estadisticas.total_plantillas) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TAB 2: GESTIÓN DE PLANTILLAS */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => { setModalMode('crear'); setOpenModal(true); }}
            sx={{ bgcolor: '#25D366' }}
          >
            Nueva Plantilla
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Upload />} 
            onClick={cargarPlantillasIniciales}
          >
            Cargar Plantillas Iniciales
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={cargarDatos}>
            Actualizar
          </Button>
        </Box>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={filtros.categoria}
                    onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categorias.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estilo</InputLabel>
                  <Select
                    value={filtros.estilo}
                    onChange={(e) => setFiltros({...filtros, estilo: e.target.value})}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="formal_profesional">🎩 Formal</MenuItem>
                    <MenuItem value="breve_persuasivo">⚡ Persuasivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtros.activa}
                    onChange={(e) => setFiltros({...filtros, activa: e.target.value})}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="true">Activas</MenuItem>
                    <MenuItem value="false">Inactivas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setFiltros({ categoria: '', estilo: '', activa: '', efectividad: '' })}
                >
                  Limpiar Filtros
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de plantillas */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plantilla</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Métricas</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5}><LinearProgress /></TableCell></TableRow>
                ) : (
                  plantillas.map((plantilla) => (
                    <TableRow key={plantilla._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {plantilla.nombre}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {plantilla.es_predeterminada && (
                              <Chip label="⭐ Predeterminada" size="small" color="warning" />
                            )}
                            <Chip 
                              label={plantilla.estilo === 'formal_profesional' ? '🎩 Formal' : '⚡ Persuasivo'} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={categorias.find(c => c.value === plantilla.categoria)?.label || plantilla.categoria}
                          size="small"
                          sx={{ 
                            bgcolor: `${categorias.find(c => c.value === plantilla.categoria)?.color}15`,
                            color: categorias.find(c => c.value === plantilla.categoria)?.color
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={`${plantilla.efectividad || 0}%`}
                            size="small"
                            color={
                              (plantilla.efectividad || 0) > 70 ? 'success' : 
                              (plantilla.efectividad || 0) > 40 ? 'warning' : 'error'
                            }
                          />
                          <Chip 
                            label={`⭐ ${plantilla.rating_promedio || 0}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip 
                            label={`${plantilla.metricas?.veces_usada || 0} usos`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={plantilla.activa}
                          onChange={(e) => toggleEstadoPlantilla(plantilla._id, e.target.checked)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, plantilla)}
                          size="small"
                          aria-label="Acciones"
                          aria-controls={menuOpen ? 'plantilla-menu' : undefined}
                          aria-haspopup="true"
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
      </TabPanel>

      {/* TAB 3: ANÁLISIS Y MÉTRICAS */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>📈 Análisis Detallado</Typography>
        <Alert severity="info">
          Funcionalidad de análisis avanzado en desarrollo. 
          Incluirá gráficos de tendencias, análisis de conversión por período, 
          y comparativas de efectividad.
        </Alert>
      </TabPanel>

      {/* Menú de acciones con posición absoluta */}
      {menuOpen && (
        <ClickAwayListener onClickAway={handleMenuClose}>
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: 150,
              zIndex: 1300
            }}
          >
            <MenuList>
              <MenuItem onClick={() => { 
                setModalMode('ver'); 
                setPlantillaSeleccionada(selectedPlantilla); 
                setOpenModal(true); 
                handleMenuClose(); 
              }}>
                <ListItemIcon><Visibility /></ListItemIcon>
                <ListItemText>Ver Detalles</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { 
                setModalMode('editar'); 
                setPlantillaSeleccionada(selectedPlantilla); 
                setFormData(selectedPlantilla); 
                setOpenModal(true); 
                handleMenuClose(); 
              }}>
                <ListItemIcon><Edit /></ListItemIcon>
                <ListItemText>Editar</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { 
                duplicarPlantilla(selectedPlantilla._id); 
                handleMenuClose(); 
              }}>
                <ListItemIcon><ContentCopy /></ListItemIcon>
                <ListItemText>Duplicar</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { 
                eliminarPlantilla(selectedPlantilla._id); 
                handleMenuClose(); 
              }} sx={{ color: 'error.main' }}>
                <ListItemIcon><Delete color="error" /></ListItemIcon>
                <ListItemText>Eliminar</ListItemText>
              </MenuItem>
            </MenuList>
          </Paper>
        </ClickAwayListener>
      )}

      {/* Modal de plantilla */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {modalMode === 'crear' && '➕ Nueva Plantilla WhatsApp'}
          {modalMode === 'editar' && '✏️ Editar Plantilla'}
          {modalMode === 'ver' && '👁️ Detalles de Plantilla'}
        </DialogTitle>
        <DialogContent>
          {modalMode === 'ver' ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>{plantillaSeleccionada?.nombre}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Categoría:</Typography>
                  <Typography>{categorias.find(c => c.value === plantillaSeleccionada?.categoria)?.label}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Estilo:</Typography>
                  <Typography>{plantillaSeleccionada?.estilo === 'formal_profesional' ? 'Formal-Profesional' : 'Breve-Persuasivo'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Mensaje:</Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                    <Typography style={{ whiteSpace: 'pre-wrap' }}>
                      {plantillaSeleccionada?.mensaje}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Métricas:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={`${plantillaSeleccionada?.efectividad || 0}% efectividad`} />
                    <Chip label={`⭐ ${plantillaSeleccionada?.rating_promedio || 0}`} />
                    <Chip label={`${plantillaSeleccionada?.metricas?.veces_usada || 0} usos`} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de la Plantilla"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  disabled={modalMode === 'ver'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    disabled={modalMode === 'ver'}
                  >
                    {categorias.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estilo</InputLabel>
                  <Select
                    value={formData.estilo}
                    onChange={(e) => setFormData({...formData, estilo: e.target.value})}
                    disabled={modalMode === 'ver'}
                  >
                    <MenuItem value="formal_profesional">🎩 Formal-Profesional</MenuItem>
                    <MenuItem value="breve_persuasivo">⚡ Breve-Persuasivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextFieldConDictado
                  fullWidth
                  rows={8}
                  label="Mensaje de la Plantilla"
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                  placeholder="Escribe el mensaje... Usa {nombre}, {total}, etc. para variables dinámicas"
                  disabled={modalMode === 'ver'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activa}
                      onChange={(e) => setFormData({...formData, activa: e.target.checked})}
                      disabled={modalMode === 'ver'}
                    />
                  }
                  label="Plantilla Activa"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.es_predeterminada}
                      onChange={(e) => setFormData({...formData, es_predeterminada: e.target.checked})}
                      disabled={modalMode === 'ver'}
                    />
                  }
                  label="Plantilla Predeterminada"
                />
              </Grid>
              <Grid item xs={12}>
                <TextFieldConDictado
                  fullWidth
                  rows={3}
                  label="Notas de Administración (Opcional)"
                  value={formData.notas_admin}
                  onChange={(e) => setFormData({...formData, notas_admin: e.target.value})}
                  placeholder="Notas internas sobre cuándo usar esta plantilla..."
                  disabled={modalMode === 'ver'}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>
            {modalMode === 'ver' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {modalMode !== 'ver' && (
            <Button onClick={guardarPlantilla} variant="contained">
              {modalMode === 'crear' ? 'Crear' : 'Guardar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Alertas */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
    </Box>
  );

  // Funciones auxiliares
  async function guardarPlantilla() {
    try {
      if (modalMode === 'crear') {
        await axiosConfig.post('/plantillas-whatsapp', formData);
        setSuccess('✅ Plantilla creada exitosamente');
      } else {
        await axiosConfig.put(`/plantillas-whatsapp/${plantillaSeleccionada._id}`, formData);
        setSuccess('✅ Plantilla actualizada exitosamente');
      }
      setOpenModal(false);
      setFormData({ nombre: '', categoria: '', estilo: 'formal_profesional', mensaje: '', activa: true, es_predeterminada: false, tags: [], notas_admin: '' });
      cargarDatos();
    } catch (error) {
      setError('❌ Error guardando plantilla');
    }
  }

  async function toggleEstadoPlantilla(id, activa) {
    try {
      await axiosConfig.put(`/plantillas-whatsapp/${id}`, { activa });
      setSuccess(`✅ Plantilla ${activa ? 'activada' : 'desactivada'}`);
      cargarDatos();
    } catch (error) {
      setError('❌ Error actualizando estado');
    }
  }

  async function duplicarPlantilla(id) {
    try {
      await axiosConfig.post(`/plantillas-whatsapp/${id}/duplicar`);
      setSuccess('✅ Plantilla duplicada exitosamente');
      cargarDatos();
    } catch (error) {
      setError('❌ Error duplicando plantilla');
    }
  }

  async function eliminarPlantilla(id) {
    if (window.confirm('¿Estás seguro de eliminar esta plantilla?')) {
      try {
        await axiosConfig.delete(`/plantillas-whatsapp/${id}`);
        setSuccess('✅ Plantilla eliminada');
        cargarDatos();
      } catch (error) {
        setError('❌ Error eliminando plantilla');
      }
    }
  }
};

export default PlantillasWhatsAppAdmin;
