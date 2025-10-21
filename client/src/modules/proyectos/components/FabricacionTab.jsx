import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Build as BuildIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const FabricacionTab = ({ proyecto, estadisticas, onActualizar }) => {
  
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      'pendiente': '#6c757d',
      'en_proceso': '#17a2b8',
      'pausada': '#fd7e14',
      'completada': '#28a745',
      'lista': '#20c997',
      'cancelada': '#dc3545'
    };
    return colores[estado] || '#6c757d';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'completada':
      case 'lista':
        return <CheckCircleIcon />;
      case 'en_proceso':
        return <BuildIcon />;
      case 'pausada':
        return <WarningIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const calcularProgreso = (estado) => {
    const estados = {
      'pendiente': 0,
      'en_proceso': 50,
      'pausada': 25,
      'completada': 100,
      'lista': 100
    };
    return estados[estado] || 0;
  };

  const ordenesFabricacion = proyecto.ordenes_fabricacion || [];
  const estadisticasFabricacion = estadisticas?.flujo?.fabricacion || {};

  return (
    <Box>
      {/* Resumen de fabricación */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FactoryIcon sx={{ fontSize: 40, color: '#fd7e14', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasFabricacion.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Órdenes Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: '#17a2b8', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasFabricacion.estados?.en_proceso || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En Proceso
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#28a745', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {(estadisticasFabricacion.estados?.completada || 0) + (estadisticasFabricacion.estados?.lista || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: '#D4AF37', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {estadisticasFabricacion.estados?.pendiente || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de órdenes de fabricación */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              🏭 Órdenes de Fabricación
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: '#D4AF37', '&:hover': { bgcolor: '#B8941F' } }}
              onClick={() => {
                // Navegar a crear nueva orden de fabricación
                window.open(`/fabricacion/nueva?proyectoId=${proyecto._id}`, '_blank');
              }}
            >
              Nueva Orden
            </Button>
          </Box>

          {ordenesFabricacion.length === 0 ? (
            <Alert severity="info">
              No hay órdenes de fabricación registradas para este proyecto.
              <br />
              <Button 
                variant="text" 
                sx={{ mt: 1 }}
                onClick={() => {
                  // Crear orden automática desde el proyecto
                  console.log('Crear orden automática');
                }}
              >
                Crear orden automática desde cotización aprobada
              </Button>
            </Alert>
          ) : (
            <List>
              {ordenesFabricacion.map((orden, index) => (
                <ListItem
                  key={orden._id || index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2,
                    bgcolor: 'background.paper',
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  {/* Header de la orden */}
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Box sx={{ mr: 2 }}>
                      {obtenerIconoEstado(orden.estado)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {orden.numero || `OF-${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Creada: {formatearFecha(orden.fechaCreacion || orden.fecha_creacion)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={orden.estado || 'pendiente'}
                        size="small"
                        sx={{
                          bgcolor: obtenerColorEstado(orden.estado),
                          color: 'white'
                        }}
                      />
                      <Tooltip title="Ver orden">
                        <IconButton
                          size="small"
                          onClick={() => {
                            window.open(`/fabricacion/${orden._id}`, '_blank');
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Progreso de la orden */}
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Progreso de Fabricación
                      </Typography>
                      <Typography variant="body2">
                        {calcularProgreso(orden.estado)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calcularProgreso(orden.estado)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: obtenerColorEstado(orden.estado)
                        }
                      }}
                    />
                  </Box>

                  {/* Información adicional */}
                  <Grid container spacing={2}>
                    {orden.fechaRequerida && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Fecha requerida: {formatearFecha(orden.fechaRequerida)}
                        </Typography>
                      </Grid>
                    )}
                    {orden.fechaCompletada && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Completada: {formatearFecha(orden.fechaCompletada)}
                        </Typography>
                      </Grid>
                    )}
                    {orden.observaciones && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          💬 {orden.observaciones}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Especificaciones técnicas para fabricación */}
      {proyecto.medidas && proyecto.medidas.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 Especificaciones Técnicas
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Dimensiones</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Especial</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proyecto.medidas.map((medida, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {medida.ubicacion || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {medida.producto || '-'}
                        </Typography>
                        {medida.color && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Color: {medida.color}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {medida.ancho && medida.alto 
                            ? `${medida.ancho} × ${medida.alto} m`
                            : '-'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {medida.cantidad || 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {medida.motorizado && (
                            <Chip label="Motorizado" size="small" color="primary" />
                          )}
                          {medida.esToldo && (
                            <Chip label="Toldo" size="small" color="warning" />
                          )}
                          {medida.tipoControl && (
                            <Typography variant="caption" color="text.secondary">
                              Control: {medida.tipoControl}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FabricacionTab;
