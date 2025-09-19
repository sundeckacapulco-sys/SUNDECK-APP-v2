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
  Grid
} from '@mui/material';
import {
  Add,
  MoreVert,
  Visibility,
  Edit,
  Send,
  GetApp,
  Delete
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosConfig from '../../config/axios';

const CotizacionesList = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  const navigate = useNavigate();

  const estadoColors = {
    borrador: 'default',
    enviada: 'primary',
    vista: 'info',
    aprobada: 'success',
    rechazada: 'error',
    vencida: 'warning',
    convertida: 'success'
  };

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/cotizaciones');
      setCotizaciones(response.data.docs || []);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, cotizacion) => {
    setAnchorEl(event.currentTarget);
    setSelectedCotizacion(cotizacion);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCotizacion(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cotizaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/cotizaciones/directa')}
            sx={{
              borderColor: '#28a745',
              color: '#28a745',
              '&:hover': {
                borderColor: '#218838',
                color: '#218838',
                bgcolor: '#f8f9fa'
              }
            }}
          >
            Cotización Directa
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/cotizaciones/nueva')}
          >
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Válido Hasta</TableCell>
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
            ) : cotizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron cotizaciones
                </TableCell>
              </TableRow>
            ) : (
              cotizaciones.map((cotizacion) => (
                <TableRow key={cotizacion._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {cotizacion.numero}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cotizacion.prospecto?.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cotizacion.prospecto?.telefono}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      ${cotizacion.total?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cotizacion.estado}
                      color={estadoColors[cotizacion.estado]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(cotizacion.fecha).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(cotizacion.validoHasta).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, cotizacion)}
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

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/cotizaciones/${selectedCotizacion?._id}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/cotizaciones/${selectedCotizacion?._id}/editar`);
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Enviar cotización
            handleMenuClose();
          }}
        >
          <Send sx={{ mr: 1 }} />
          Enviar
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CotizacionesList;
