import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, LinearProgress
} from '@mui/material';
import { Add, Edit, Delete, MoreVert, WhatsApp } from '@mui/icons-material';
import TextFieldConDictado from '../Common/TextFieldConDictado';
import axiosConfig from '../../config/axios';

const PlantillasAdmin = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '', categoria: '', estilo: 'formal_profesional', mensaje: '', activa: true
  });

  const categorias = [
    { value: 'cotizacion_enviada', label: '📋 Cotización Enviada' },
    { value: 'seguimiento_cotizacion', label: '📞 Seguimiento General' },
    { value: 'negociacion_hunter', label: '🎯 Negociación Hunter' },
    { value: 'negociacion_farmer', label: '🌱 Negociación Farmer' },
    { value: 'manejo_objeciones', label: '🛡️ Manejo Objeciones' },
    { value: 'cotizacion_vencimiento', label: '⏰ Por Vencer' },
    { value: 'post_vencimiento', label: '📅 Post-Vencimiento' },
    { value: 'anticipo_confirmado', label: '💰 Anticipo Confirmado' },
    { value: 'fabricacion_iniciada', label: '🔨 Fabricación' },
    { value: 'producto_terminado', label: '✅ Terminado' },
    { value: 'cobranza_saldo', label: '💳 Cobranza' },
    { value: 'recontacto', label: '🔄 Recontacto' }
  ];

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/plantillas-whatsapp');
      setPlantillas(response.data.plantillas || []);
    } catch (error) {
      setError('Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  const guardarPlantilla = async () => {
    try {
      if (modalMode === 'crear') {
        await axiosConfig.post('/plantillas-whatsapp', formData);
        setSuccess('Plantilla creada exitosamente');
      } else {
        await axiosConfig.put(`/plantillas-whatsapp/${plantillaSeleccionada._id}`, formData);
        setSuccess('Plantilla actualizada exitosamente');
      }
      setOpenModal(false);
      cargarPlantillas();
    } catch (error) {
      setError('Error guardando plantilla');
    }
  };

  const eliminarPlantilla = async (id) => {
    if (window.confirm('¿Eliminar plantilla?')) {
      try {
        await axiosConfig.delete(`/plantillas-whatsapp/${id}`);
        setSuccess('Plantilla eliminada');
        cargarPlantillas();
      } catch (error) {
        setError('Error eliminando plantilla');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>📱 Plantillas WhatsApp</Typography>
      
      <Button 
        variant="contained" 
        startIcon={<Add />} 
        onClick={() => { setModalMode('crear'); setOpenModal(true); }}
        sx={{ mb: 2, bgcolor: '#25D366' }}
      >
        Nueva Plantilla
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Estilo</TableCell>
                <TableCell>Usos</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><LinearProgress /></TableCell></TableRow>
              ) : (
                plantillas.map((plantilla) => (
                  <TableRow key={plantilla._id}>
                    <TableCell>{plantilla.nombre}</TableCell>
                    <TableCell>
                      <Chip label={categorias.find(c => c.value === plantilla.categoria)?.label || plantilla.categoria} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={plantilla.estilo === 'formal_profesional' ? '🎩 Formal' : '⚡ Persuasivo'} size="small" />
                    </TableCell>
                    <TableCell>{plantilla.metricas?.veces_usada || 0}</TableCell>
                    <TableCell>
                      <Chip label={plantilla.activa ? 'Activa' : 'Inactiva'} color={plantilla.activa ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => { setPlantillaSeleccionada(plantilla); setFormData(plantilla); setModalMode('editar'); setOpenModal(true); }}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => eliminarPlantilla(plantilla._id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{modalMode === 'crear' ? 'Nueva Plantilla' : 'Editar Plantilla'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                >
                  {categorias.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Estilo</InputLabel>
                <Select
                  value={formData.estilo}
                  onChange={(e) => setFormData({...formData, estilo: e.target.value})}
                >
                  <MenuItem value="formal_profesional">🎩 Formal-Profesional</MenuItem>
                  <MenuItem value="breve_persuasivo">⚡ Breve-Persuasivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextFieldConDictado
                fullWidth
                rows={6}
                label="Mensaje de la Plantilla"
                value={formData.mensaje}
                onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                placeholder="Escribe el mensaje de la plantilla... Usa {nombre}, {telefono}, {total}, etc. para variables dinámicas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button onClick={guardarPlantilla} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantillasAdmin;
