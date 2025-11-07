import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Grid,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  AccessTime,
  Speed,
  Warning,
  LocationOn,
  Person
} from '@mui/icons-material';

const SupervisionEnVivo = ({ tecnicos = [] }) => {
  const formatearTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const calcularTiempoTranscurrido = (fechaCheckIn) => {
    const ahora = new Date();
    const inicio = new Date(fechaCheckIn);
    const diff = Math.floor((ahora - inicio) / 60000); // minutos
    return diff;
  };

  const getEstadoColor = (tecnico) => {
    if (tecnico.instalacion?.ejecucion?.checkOut) return 'success';
    if (tecnico.instalacion?.ejecucion?.checkIn) return 'primary';
    return 'default';
  };

  const getEstadoTexto = (tecnico) => {
    if (tecnico.instalacion?.ejecucion?.checkOut) return 'Completado';
    if (tecnico.instalacion?.ejecucion?.checkIn) return 'En sitio';
    return 'Programado';
  };

  const getEstadoIcon = (tecnico) => {
    if (tecnico.instalacion?.ejecucion?.checkOut) return <CheckCircle />;
    if (tecnico.instalacion?.ejecucion?.checkIn) return <AccessTime />;
    return <LocationOn />;
  };

  if (tecnicos.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supervisión en Vivo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No hay técnicos activos en este momento
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Supervisión en Vivo
          </Typography>
          <Chip
            label={`${tecnicos.length} activos`}
            color="primary"
            size="small"
          />
        </Box>

        <List dense>
          {tecnicos.map((tecnico) => {
            const checkIn = tecnico.instalacion?.ejecucion?.checkIn;
            const checkOut = tecnico.instalacion?.ejecucion?.checkOut;
            const metricas = tecnico.instalacion?.ejecucion?.metricas;
            const tiempoTranscurrido = checkIn ? calcularTiempoTranscurrido(checkIn.fecha) : 0;

            return (
              <ListItem
                key={tecnico._id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: checkOut ? 'success.light' : checkIn ? 'primary.light' : 'background.paper'
                }}
              >
                <ListItemIcon>
                  {getEstadoIcon(tecnico)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {tecnico.numero}
                      </Typography>
                      <Chip
                        label={getEstadoTexto(tecnico)}
                        color={getEstadoColor(tecnico)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" display="block">
                        👤 {tecnico.cliente?.nombre}
                      </Typography>
                      
                      {checkIn && (
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">
                              Entrada: {checkIn.hora}
                            </Typography>
                            {checkIn.enSitio !== undefined && (
                              <Chip
                                size="small"
                                label={checkIn.enSitio ? '✓ En sitio' : '⚠️ Fuera'}
                                color={checkIn.enSitio ? 'success' : 'warning'}
                                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Grid>

                          {!checkOut && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="primary">
                                ⏱️ {formatearTiempo(tiempoTranscurrido)} transcurridos
                              </Typography>
                            </Grid>
                          )}

                          {checkOut && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="success.main">
                                Salida: {checkOut.hora}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      )}

                      {metricas && (
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={1}>
                            {metricas.puntualidad !== undefined && (
                              <Grid item xs={6}>
                                <Tooltip title="Diferencia con hora programada">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {metricas.fueronPuntuales ? (
                                      <CheckCircle sx={{ fontSize: 14 }} color="success" />
                                    ) : (
                                      <Warning sx={{ fontSize: 14 }} color="warning" />
                                    )}
                                    <Typography variant="caption">
                                      {metricas.puntualidad > 0 ? '+' : ''}{metricas.puntualidad}min
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </Grid>
                            )}

                            {metricas.eficiencia !== undefined && (
                              <Grid item xs={6}>
                                <Tooltip title="Eficiencia vs tiempo estimado">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Speed sx={{ fontSize: 14 }} color={metricas.fueronEficientes ? 'success' : 'warning'} />
                                    <Typography variant="caption">
                                      {metricas.eficiencia}%
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </Grid>
                            )}

                            {metricas.tiempoEnSitio && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                  Total: {formatearTiempo(metricas.tiempoEnSitio)}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>

                          {metricas.eficiencia !== undefined && (
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(metricas.eficiencia, 100)}
                              color={metricas.fueronEficientes ? 'success' : 'warning'}
                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            );
          })}
        </List>

        {/* Resumen de Métricas */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Resumen del Día
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
              <Typography variant="h6" color="primary">
                {tecnicos.filter(t => t.instalacion?.ejecucion?.checkIn && !t.instalacion?.ejecucion?.checkOut).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                En sitio
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6" color="success.main">
                {tecnicos.filter(t => t.instalacion?.ejecucion?.checkOut).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completados
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6" color="warning.main">
                {tecnicos.filter(t => t.instalacion?.ejecucion?.metricas?.fueronPuntuales === false).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Retrasos
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SupervisionEnVivo;
