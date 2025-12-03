import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Typography, Paper, Box, CircularProgress, Alert, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateRangePicker } from 'react-date-range';
import { sub, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import es from 'date-fns/locale/es';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import axiosConfig from '../../config/axios';

const ResumenCard = ({ title, value, unit }) => (
  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
    <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>
      {unit === 'currency' ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0) : (value || 0)}
    </Typography>
  </Paper>
);

const GraficoLineaMultiple = ({ data, xAxisKey, lines, title }) => (
  <Paper sx={{ p: 2, height: 350 }}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines?.map(line => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} name={line.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </Paper>
);

const AnalisisHistorico = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([{
    startDate: sub(new Date(), { days: 30 }),
    endDate: new Date(),
    key: 'selection'
  }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = dateRange[0];
      const params = {
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0],
      };

      const response = await axiosConfig.get('/kpis/historico', { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los datos históricos. Intente de nuevo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeChange = (ranges) => {
    setDateRange([ranges.selection]);
  };

  const setDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate = today;

    switch (preset) {
      case '7d':
        startDate = sub(today, { days: 7 });
        break;
      case '30d':
        startDate = sub(today, { days: 30 });
        break;
      case 'this_month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'this_week':
        startDate = startOfWeek(today, { locale: es });
        endDate = endOfWeek(today, { locale: es });
        break;
      default:
        startDate = sub(today, { days: 30 });
    }
    setDateRange([{ startDate, endDate, key: 'selection' }]);
  };

  const chartData = data?.seriesDeTiempo?.fechas?.map((fecha, index) => ({
      fecha,
      ventas: data?.seriesDeTiempo?.ventas?.[index] || 0,
      prospectos: data?.seriesDeTiempo?.prospectos?.[index] || 0,
      iniciadas: data?.seriesDeTiempo?.ordenesIniciadas?.[index] || 0,
      finalizadas: data?.seriesDeTiempo?.ordenesFinalizadas?.[index] || 0,
  })) || [];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Análisis Histórico de KPIs</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Seleccionar Rango</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip label="7 Días" onClick={() => setDatePreset('7d')} size="small" />
              <Chip label="30 Días" onClick={() => setDatePreset('30d')} size="small" />
              <Chip label="Esta Semana" onClick={() => setDatePreset('this_week')} size="small" />
              <Chip label="Este Mes" onClick={() => setDatePreset('this_month')} size="small" />
            </Stack>
            <DateRangePicker
              onChange={handleDateRangeChange}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              months={1}
              ranges={dateRange}
              direction="horizontal"
              locale={es}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} lg={9}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !data || !data.resumenes ? (
            <Alert severity="info">No hay datos para mostrar en el rango seleccionado.</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} lg={3}><ResumenCard title="Ventas Totales" value={data.resumenes.totalVentas?.valor} unit="currency" /></Grid>
              <Grid item xs={12} sm={6} lg={3}><ResumenCard title="Nuevos Prospectos" value={data.resumenes.totalProspectos?.valor} /></Grid>
              <Grid item xs={12} sm={6} lg={3}><ResumenCard title="Órdenes Iniciadas" value={data.resumenes.totalOrdenesIniciadas?.valor} /></Grid>
              <Grid item xs={12} sm={6} lg={3}><ResumenCard title="Órdenes Finalizadas" value={data.resumenes.totalOrdenesFinalizadas?.valor} /></Grid>

              <Grid item xs={12}>
                <GraficoLineaMultiple data={chartData} xAxisKey="fecha" title="Evolución Comercial" lines={[
                  { key: 'ventas', name: 'Ventas $', color: '#8884d8' },
                  { key: 'prospectos', name: 'Prospectos', color: '#82ca9d' },
                ]} />
              </Grid>
              <Grid item xs={12}>
                <GraficoLineaMultiple data={chartData} xAxisKey="fecha" title="Evolución de Producción" lines={[
                  { key: 'iniciadas', name: 'Órdenes Iniciadas', color: '#ffc658' },
                  { key: 'finalizadas', name: 'Órdenes Finalizadas', color: '#FF8042' },
                ]} />
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Datos Detallados</Typography>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell align="right">Ventas ($)</TableCell>
                          <TableCell align="right">Prospectos</TableCell>
                          <TableCell align="right">Iniciadas</TableCell>
                          <TableCell align="right">Finalizadas</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data?.tablaDeDatos?.map((row) => (
                          <TableRow key={row.fecha}>
                            <TableCell>{row.fecha}</TableCell>
                            <TableCell align="right">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.ventas)}</TableCell>
                            <TableCell align="right">{row.prospectos}</TableCell>
                            <TableCell align="right">{row.iniciadas}</TableCell>
                            <TableCell align="right">{row.finalizadas}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalisisHistorico;
