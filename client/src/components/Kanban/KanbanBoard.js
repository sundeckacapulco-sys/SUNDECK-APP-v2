import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Avatar
} from '@mui/material';
import { MoreVert, Phone, Email, Edit, Visibility, TrendingUp, Refresh, Schedule } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '../../utils/safeDnd';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const KanbanBoard = () => {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProspecto, setSelectedProspecto] = useState(null);
  const [openEtapa, setOpenEtapa] = useState(false);
  const [nuevaEtapa, setNuevaEtapa] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');

  const navigate = useNavigate();

  const etapas = [
    { 
      id: 'nuevo', 
      title: 'Nuevos', 
      color: '#e3f2fd',
      textColor: '#1976d2'
    },
    { 
      id: 'contactado', 
      title: 'Contactados', 
      color: '#f3e5f5',
      textColor: '#7b1fa2'
    },
    { 
      id: 'cita_agendada', 
      title: 'Cita Agendada', 
      color: '#fff3e0',
      textColor: '#f57c00'
    },
    { 
      id: 'cotizacion', 
      title: 'Cotización', 
      color: '#fff8e1',
      textColor: '#f9a825'
    },
    { 
      id: 'venta_cerrada', 
      title: 'Venta Cerrada', 
      color: '#e8f5e8',
      textColor: '#2e7d32'
    },
    { 
      id: 'pedido', 
      title: 'Pedido', 
      color: '#e1f5fe',
      textColor: '#0288d1'
    },
    { 
      id: 'fabricacion', 
      title: 'Fabricación', 
      color: '#f1f8e9',
      textColor: '#689f38'
    },
    { 
      id: 'instalacion', 
      title: 'Instalación', 
      color: '#fff3e0',
      textColor: '#f57c00'
    },
    { 
      id: 'entregado', 
      title: 'Entregado', 
      color: '#e8f5e8',
      textColor: '#2e7d32'
    }
  ];

  const prioridadColors = {
    baja: 'default',
    media: 'primary',
    alta: 'warning',
    urgente: 'error'
  };

  useEffect(() => {
    fetchProspectos();
  }, []);

  const fetchProspectos = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/prospectos?limit=100');
      setProspectos(response.data.docs || []);
    } catch (error) {
      console.error('Error fetching prospectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const nuevaEtapaId = destination.droppableId;
    
    // Encontrar el prospecto
    const prospecto = prospectos.find(p => p._id === draggableId);
    if (!prospecto || prospecto.etapa === nuevaEtapaId) return;

    // Actualizar localmente primero para mejor UX
    setProspectos(prev => 
      prev.map(p => 
        p._id === draggableId 
          ? { ...p, etapa: nuevaEtapaId }
          : p
      )
    );

    // Actualizar en el servidor
    try {
      await axiosConfig.put(`/prospectos/${draggableId}/etapa`, {
        etapa: nuevaEtapaId,
        motivo: 'Movido desde Kanban'
      });

      // Si se movió a "pedido", intentar crear el pedido automáticamente
      if (nuevaEtapaId === 'pedido') {
        console.log('🛒 Prospecto movido a Pedido, verificando cotización...');
        await crearPedidoDesdeProspecto(draggableId);
      }

      // Notificar al dashboard que hubo cambios
      localStorage.setItem('pedidos_updated', Date.now().toString());
      
    } catch (error) {
      console.error('Error updating etapa:', error);
      // Revertir cambio local si falla
      setProspectos(prev => 
        prev.map(p => 
          p._id === draggableId 
            ? { ...p, etapa: prospecto.etapa }
            : p
        )
      );
    }
  };

  // Función para crear pedido automáticamente desde prospecto
  const crearPedidoDesdeProspecto = async (prospectoId) => {
    try {
      // Buscar cotizaciones del prospecto
      const cotizacionesRes = await axiosConfig.get(`/cotizaciones?prospecto=${prospectoId}`);
      
      if (cotizacionesRes.data && cotizacionesRes.data.length > 0) {
        // Buscar la cotización más reciente aprobada o activa
        const cotizacionAprobada = cotizacionesRes.data.find(c => 
          c.estado === 'aprobada' || c.estado === 'Activa'
        );
        
        if (cotizacionAprobada) {
          console.log('📋 Cotización encontrada, creando pedido...', cotizacionAprobada.numero);
          
          // Crear pedido desde la cotización
          const pedidoRes = await axiosConfig.post(`/pedidos/desde-cotizacion/${cotizacionAprobada._id}`, {
            direccionEntrega: {
              calle: '',
              colonia: '',
              ciudad: '',
              codigoPostal: '',
              referencias: 'Dirección por confirmar'
            },
            contactoEntrega: {
              nombre: cotizacionAprobada.nombre || 'Por confirmar',
              telefono: '',
              horarioPreferido: 'Por confirmar'
            },
            anticipo: {
              porcentaje: 50
            }
          });

          if (pedidoRes.data) {
            console.log('✅ Pedido creado exitosamente:', pedidoRes.data.pedido?.numero);
            
            // Mostrar notificación de éxito
            alert(`✅ Pedido ${pedidoRes.data.pedido?.numero} creado exitosamente desde la cotización ${cotizacionAprobada.numero}`);
          }
        } else {
          console.log('⚠️ No se encontró cotización aprobada para crear pedido');
          alert('⚠️ Para crear un pedido, el prospecto debe tener una cotización aprobada');
        }
      } else {
        console.log('⚠️ No se encontraron cotizaciones para este prospecto');
        alert('⚠️ Para crear un pedido, primero debe existir una cotización para este prospecto');
      }
    } catch (error) {
      console.error('❌ Error creando pedido desde prospecto:', error);
      alert('❌ Error al crear el pedido. Revisa que exista una cotización aprobada.');
    }
  };

  const handleMenuClick = (event, prospecto) => {
    setAnchorEl(event.currentTarget);
    setSelectedProspecto(prospecto);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProspecto(null);
  };

  const handleCambiarEtapa = async () => {
    try {
      await axiosConfig.put(`/prospectos/${selectedProspecto._id}/etapa`, {
        etapa: nuevaEtapa,
        motivo: motivoCambio
      });
      setNuevaEtapa('');
      setMotivoCambio('');
      setOpenEtapa(false);
      fetchProspectos();
    } catch (error) {
      console.error('Error cambiando etapa:', error);
    }
  };

  const getProspectosPorEtapa = (etapaId) => {
    return prospectos.filter(p => p.etapa === etapaId);
  };

  const ProspectoCard = ({ prospecto, index }) => (
    <Draggable draggableId={prospecto._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 1,
            cursor: 'pointer',
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
            boxShadow: snapshot.isDragging ? 4 : 1,
            '&:hover': {
              boxShadow: 2
            }
          }}
          onClick={() => navigate(`/prospectos/${prospecto._id}`)}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {prospecto.nombre}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick(e, prospecto);
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {prospecto.producto}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption">
                {prospecto.telefono}
              </Typography>
            </Box>
            
            {prospecto.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption">
                  {prospecto.email}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Chip
                label={prospecto.prioridad}
                size="small"
                color={prioridadColors[prospecto.prioridad]}
                variant="outlined"
              />
              
              {prospecto.vendedorAsignado && (
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                  {prospecto.vendedorAsignado.nombre?.charAt(0)}
                </Avatar>
              )}
            </Box>
            
            {prospecto.fechaCita && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Schedule fontSize="small" sx={{ mr: 0.5, color: 'warning.main' }} />
                <Typography variant="caption" color="warning.main">
                  {new Date(prospecto.fechaCita).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Pipeline Kanban
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchProspectos}
        >
          Actualizar
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {etapas.map((etapa) => {
            const prospectosEtapa = getProspectosPorEtapa(etapa.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={1.33} key={etapa.id}>
                <Card 
                  sx={{ 
                    height: '80vh',
                    backgroundColor: etapa.color,
                    border: `2px solid ${etapa.textColor}20`
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: etapa.textColor,
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        {etapa.title}
                      </Typography>
                      <Chip
                        label={prospectosEtapa.length}
                        size="small"
                        sx={{ 
                          backgroundColor: etapa.textColor,
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    
                    <Droppable droppableId={etapa.id} key={etapa.id}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            minHeight: '60vh',
                            backgroundColor: snapshot.isDraggingOver ? `${etapa.textColor}10` : 'transparent',
                            borderRadius: 1,
                            p: 0.5
                          }}
                        >
                          {prospectosEtapa.map((prospecto, index) => (
                            <ProspectoCard
                              key={prospecto._id}
                              prospecto={prospecto}
                              index={index}
                            />
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DragDropContext>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/prospectos/${selectedProspecto?._id}`);
            handleMenuClose();
          }}
        >
          Ver Detalles
        </MenuItem>
        <MenuItem
          onClick={() => {
            setNuevaEtapa(selectedProspecto?.etapa || '');
            setOpenEtapa(true);
            handleMenuClose();
          }}
        >
          <TrendingUp sx={{ mr: 1 }} />
          Cambiar Etapa
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/cotizaciones/nueva?prospecto=${selectedProspecto?._id}`);
            handleMenuClose();
          }}
        >
          Crear Cotización
        </MenuItem>
      </Menu>

      {/* Dialog para cambiar etapa */}
      <Dialog open={openEtapa} onClose={() => setOpenEtapa(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Etapa</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Nueva Etapa</InputLabel>
            <Select
              value={nuevaEtapa}
              label="Nueva Etapa"
              onChange={(e) => setNuevaEtapa(e.target.value)}
            >
              {etapas.map(etapa => (
                <MenuItem key={etapa.id} value={etapa.id}>
                  {etapa.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Motivo del cambio (opcional)"
            value={motivoCambio}
            onChange={(e) => setMotivoCambio(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEtapa(false)}>Cancelar</Button>
          <Button onClick={handleCambiarEtapa} variant="contained">
            Cambiar Etapa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;
