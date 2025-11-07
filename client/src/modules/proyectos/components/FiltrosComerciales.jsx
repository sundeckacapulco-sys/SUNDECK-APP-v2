import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Paper
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axiosConfig from '../../../config/axios';

const FiltrosComerciales = ({ filtros, onFiltrosChange, loading }) => {
  const [asesores, setAsesores] = useState([]);
  const [filtrosLocales, setFiltrosLocales] = useState(filtros);
  const [filtrosActivos, setFiltrosActivos] = useState(0);

  // Cargar asesores
  useEffect(() => {
    cargarAsesores();
  }, []);

  // Contar filtros activos
  useEffect(() => {
    let count = 0;
    if (filtrosLocales.tipo !== 'todos') count++;
    if (filtrosLocales.asesorComercial) count++;
    if (filtrosLocales.estadoComercial) count++;
    if (filtrosLocales.fechaDesde) count++;
    if (filtrosLocales.fechaHasta) count++;
    if (filtrosLocales.busqueda) count++;
    setFiltrosActivos(count);
  }, [filtrosLocales]);

  const cargarAsesores = async () => {
    try {
      // Aquí deberías tener un endpoint para listar usuarios/asesores
      // Por ahora usamos datos mock
      setAsesores([
        { _id: '1', nombre: 'Abigail' },
        { _id: '2', nombre: 'Carlos' },
        { _id: '3', nombre: 'Diana' }
      ]);
    } catch (error) {
      console.error('Error cargando asesores:', error);
    }
  };

  const handleChange = (campo, valor) => {
    const nuevosFiltros = { ...filtrosLocales, [campo]: valor };
    setFiltrosLocales(nuevosFiltros);
  };

  const handleAplicar = () => {
    onFiltrosChange(filtrosLocales);
  };

  const handleLimpiar = () => {
    const filtrosVacios = {
      tipo: 'todos',
      asesorComercial: '',
      estadoComercial: '',
      fechaDesde: null,
      fechaHasta: null,
      busqueda: ''
    };
    setFiltrosLocales(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  const handleBusquedaKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAplicar();
    }
  };

  // Estados comerciales según tipo
  const getEstadosDisponibles = () => {
    if (filtrosLocales.tipo === 'prospecto') {
      return [
        { value: 'nuevo', label: '🆕 Nuevo' },
        { value: 'contactado', label: '📞 Contactado' },
        { value: 'en_seguimiento', label: '👀 En Seguimiento' },
        { value: 'cita_agendada', label: '📅 Cita Agendada' },
        { value: 'cotizado', label: '💰 Cotizado' },
        { value: 'en_pausa', label: '⏸️ En Pausa' },
        { value: 'perdido', label: '❌ Perdido' }
      ];
    } else if (filtrosLocales.tipo === 'proyecto') {
      return [
        { value: 'activo', label: '✅ Activo' },
        { value: 'en_fabricacion', label: '🏗️ En Fabricación' },
        { value: 'en_instalacion', label: '🚚 En Instalación' },
        { value: 'completado', label: '✔️ Completado' },
        { value: 'pausado', label: '⏸️ Pausado' },
        { value: 'critico', label: '🚨 Crítico' }
      ];
    } else {
      return [
        { value: 'nuevo', label: '🆕 Nuevo' },
        { value: 'contactado', label: '📞 Contactado' },
        { value: 'en_seguimiento', label: '👀 En Seguimiento' },
        { value: 'activo', label: '✅ Activo' },
        { value: 'completado', label: '✔️ Completado' }
      ];
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterIcon color="primary" />
        <Box sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
          Filtros
        </Box>
        {filtrosActivos > 0 && (
          <Chip 
            label={`${filtrosActivos} activo${filtrosActivos > 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Búsqueda */}
        <TextField
          label="Buscar"
          placeholder="Nombre, teléfono, email..."
          value={filtrosLocales.busqueda}
          onChange={(e) => handleChange('busqueda', e.target.value)}
          onKeyPress={handleBusquedaKeyPress}
          disabled={loading}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />

        {/* Tipo */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={filtrosLocales.tipo}
            label="Tipo"
            onChange={(e) => handleChange('tipo', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="prospecto">🔵 Prospectos</MenuItem>
            <MenuItem value="proyecto">🟢 Proyectos</MenuItem>
          </Select>
        </FormControl>

        {/* Asesor */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Asesor Comercial</InputLabel>
          <Select
            value={filtrosLocales.asesorComercial}
            label="Asesor Comercial"
            onChange={(e) => handleChange('asesorComercial', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">Todos</MenuItem>
            {asesores.map((asesor) => (
              <MenuItem key={asesor._id} value={asesor._id}>
                {asesor.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Estado Comercial */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filtrosLocales.estadoComercial}
            label="Estado"
            onChange={(e) => handleChange('estadoComercial', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">Todos</MenuItem>
            {getEstadosDisponibles().map((estado) => (
              <MenuItem key={estado.value} value={estado.value}>
                {estado.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Fecha Desde */}
        <TextField
          label="Desde"
          type="date"
          value={filtrosLocales.fechaDesde || ''}
          onChange={(e) => handleChange('fechaDesde', e.target.value)}
          disabled={loading}
          size="small"
          sx={{ minWidth: 150 }}
          InputLabelProps={{ shrink: true }}
        />

        {/* Fecha Hasta */}
        <TextField
          label="Hasta"
          type="date"
          value={filtrosLocales.fechaHasta || ''}
          onChange={(e) => handleChange('fechaHasta', e.target.value)}
          disabled={loading}
          size="small"
          sx={{ minWidth: 150 }}
          InputLabelProps={{ shrink: true }}
        />

        {/* Botones */}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleLimpiar}
            disabled={loading || filtrosActivos === 0}
          >
            Limpiar
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleAplicar}
            disabled={loading}
          >
            Aplicar
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FiltrosComerciales;
