import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Close,
  Settings,
  Add as AddIcon,
  Calculate,
  CheckCircle
} from '@mui/icons-material';

const CalculadoraMotores = ({ open, onClose, productos = [], onAgregarMotor }) => {
  const [productosMotorizados, setProductosMotorizados] = useState([]);
  const [motoresCalculados, setMotoresCalculados] = useState([]);
  const [controlesCalculados, setControlesCalculados] = useState([]);

  // Catálogo de motores disponibles
  const catalogoMotores = [
    { 
      id: 'somfy_25', 
      nombre: 'Somfy 25 Nm', 
      torque: 25, 
      precio: 3800, 
      pesoMaximo: 15,
      descripcion: 'Para persianas medianas hasta 15kg'
    },
    { 
      id: 'somfy_35', 
      nombre: 'Somfy 35 Nm', 
      torque: 35, 
      precio: 4500, 
      pesoMaximo: 25,
      descripcion: 'Para persianas grandes hasta 25kg'
    },
    { 
      id: 'somfy_50', 
      nombre: 'Somfy 50 Nm', 
      torque: 50, 
      precio: 5200, 
      pesoMaximo: 40,
      descripcion: 'Para toldos y persianas pesadas hasta 40kg'
    },
    { 
      id: 'nice_30', 
      nombre: 'Nice 30 Nm', 
      torque: 30, 
      precio: 3200, 
      pesoMaximo: 20,
      descripcion: 'Alternativa económica hasta 20kg'
    }
  ];

  // Catálogo de controles
  const catalogoControles = [
    {
      id: 'monocanal',
      nombre: 'Control Monocanal',
      precio: 950,
      capacidad: 1,
      descripcion: 'Para controlar 1 motor'
    },
    {
      id: 'multicanal_5',
      nombre: 'Control Multicanal 5CH',
      precio: 1200,
      capacidad: 5,
      descripcion: 'Para controlar hasta 5 motores'
    },
    {
      id: 'multicanal_15',
      nombre: 'Control Multicanal 15CH',
      precio: 1800,
      capacidad: 15,
      descripcion: 'Para controlar hasta 15 motores'
    }
  ];

  useEffect(() => {
    if (productos && productos.length > 0) {
      analizarProductos();
    }
  }, [productos]);

  const analizarProductos = () => {
    // Filtrar productos que requieren motorización
    const motorizados = productos.filter(producto => {
      // Buscar indicadores de motorización en el nombre o descripción
      const texto = `${producto.nombre || ''} ${producto.descripcion || ''}`.toLowerCase();
      return texto.includes('motorizado') || 
             texto.includes('motor') || 
             texto.includes('automatico') ||
             texto.includes('automático') ||
             producto.motorizado === true;
    });

    setProductosMotorizados(motorizados);
    
    if (motorizados.length > 0) {
      calcularMotoresNecesarios(motorizados);
    }
  };

  const calcularMotoresNecesarios = (productos) => {
    const motores = [];
    const controles = [];

    productos.forEach((producto, index) => {
      // Calcular peso estimado basado en área y tipo de producto
      const area = producto.medidas?.area || 0;
      const pesoEstimado = calcularPesoEstimado(producto, area);
      
      // Seleccionar motor apropiado
      const motorRecomendado = seleccionarMotor(pesoEstimado, area);
      
      motores.push({
        id: `motor_${index}`,
        productoIndex: index,
        producto: producto.nombre,
        ubicacion: producto.descripcion,
        area: area,
        pesoEstimado: pesoEstimado,
        motorRecomendado: motorRecomendado,
        cantidad: producto.cantidad || 1
      });
    });

    // Calcular controles necesarios
    const totalMotores = motores.reduce((sum, motor) => sum + motor.cantidad, 0);
    const controlesNecesarios = calcularControles(totalMotores);
    
    setMotoresCalculados(motores);
    setControlesCalculados(controlesNecesarios);
  };

  const calcularPesoEstimado = (producto, area) => {
    const nombre = producto.nombre?.toLowerCase() || '';
    let pesoPorM2 = 3; // Peso base por m²

    // Ajustar peso según tipo de producto
    if (nombre.includes('blackout')) {
      pesoPorM2 = 4.5; // Blackout es más pesado
    } else if (nombre.includes('screen')) {
      pesoPorM2 = 3.2; // Screen peso medio
    } else if (nombre.includes('toldo')) {
      pesoPorM2 = 6; // Toldos son más pesados
    } else if (nombre.includes('cortina')) {
      pesoPorM2 = 2.8; // Cortinas más ligeras
    }

    return area * pesoPorM2;
  };

  const seleccionarMotor = (peso, area) => {
    // Agregar factor de seguridad del 20%
    const pesoConSeguridad = peso * 1.2;
    
    // Buscar motor apropiado
    const motorAdecuado = catalogoMotores.find(motor => 
      motor.pesoMaximo >= pesoConSeguridad
    );

    return motorAdecuado || catalogoMotores[catalogoMotores.length - 1]; // Si no encuentra, usar el más potente
  };

  const calcularControles = (totalMotores) => {
    const controles = [];
    let motoresRestantes = totalMotores;

    // Optimizar uso de controles
    while (motoresRestantes > 0) {
      if (motoresRestantes >= 15) {
        controles.push({
          ...catalogoControles[2], // 15CH
          cantidad: 1,
          motoresControlados: 15
        });
        motoresRestantes -= 15;
      } else if (motoresRestantes >= 5) {
        controles.push({
          ...catalogoControles[1], // 5CH
          cantidad: 1,
          motoresControlados: motoresRestantes
        });
        motoresRestantes = 0;
      } else {
        controles.push({
          ...catalogoControles[0], // Monocanal
          cantidad: motoresRestantes,
          motoresControlados: 1
        });
        motoresRestantes = 0;
      }
    }

    return controles;
  };

  const calcularTotales = () => {
    const totalMotores = motoresCalculados.reduce((sum, motor) => 
      sum + (motor.motorRecomendado.precio * motor.cantidad), 0
    );
    
    const totalControles = controlesCalculados.reduce((sum, control) => 
      sum + (control.precio * control.cantidad), 0
    );

    return {
      motores: totalMotores,
      controles: totalControles,
      total: totalMotores + totalControles,
      cantidadMotores: motoresCalculados.reduce((sum, motor) => sum + motor.cantidad, 0),
      cantidadControles: controlesCalculados.reduce((sum, control) => sum + control.cantidad, 0)
    };
  };

  const agregarTodosLosMotores = () => {
    const totales = calcularTotales();
    
    // Agregar motores
    motoresCalculados.forEach(motor => {
      if (onAgregarMotor) {
        onAgregarMotor({
          nombre: motor.motorRecomendado.nombre,
          descripcion: `Motor para ${motor.producto} en ${motor.ubicacion}`,
          categoria: 'motor',
          cantidad: motor.cantidad,
          precioUnitario: motor.motorRecomendado.precio,
          subtotal: motor.motorRecomendado.precio * motor.cantidad,
          medidas: { area: 1 } // Los motores se venden por pieza
        });
      }
    });

    // Agregar controles
    controlesCalculados.forEach(control => {
      if (onAgregarMotor) {
        onAgregarMotor({
          nombre: control.nombre,
          descripcion: `Control para ${control.motoresControlados} motor(es)`,
          categoria: 'control',
          cantidad: control.cantidad,
          precioUnitario: control.precio,
          subtotal: control.precio * control.cantidad,
          medidas: { area: 1 }
        });
      }
    });

    onClose();
  };

  const totales = calcularTotales();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Settings color="primary" />
            <Typography variant="h6">Calculadora de Motores</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {productosMotorizados.length === 0 ? (
          <Alert severity="info">
            No se encontraron productos que requieran motorización en la cotización actual.
            <br/>
            <strong>Tip:</strong> Los productos con "motorizado", "motor" o "automático" en el nombre se detectan automáticamente.
          </Alert>
        ) : (
          <Box>
            {/* Resumen */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '2px solid #2563eb' }}>
              <Typography variant="h6" sx={{ color: '#2563eb', mb: 2 }}>
                🎯 Resumen de Motorización
              </Typography>
              
              <Box display="flex" gap={4} flexWrap="wrap">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Productos motorizados:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#1a1a1a' }}>
                    {productosMotorizados.length}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Motores necesarios:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#28a745' }}>
                    {totales.cantidadMotores}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Controles necesarios:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ffc107' }}>
                    {totales.cantidadControles}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Costo total:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#dc3545' }}>
                    ${totales.total.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Tabla de motores */}
            <Typography variant="h6" gutterBottom>
              ⚙️ Motores Calculados
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#2563eb' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ubicación</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Área</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Peso Est.</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motor Recomendado</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cant.</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {motoresCalculados.map((motor, index) => (
                    <TableRow key={index}>
                      <TableCell>{motor.producto}</TableCell>
                      <TableCell>{motor.ubicacion}</TableCell>
                      <TableCell>{motor.area.toFixed(2)} m²</TableCell>
                      <TableCell>{motor.pesoEstimado.toFixed(1)} kg</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {motor.motorRecomendado.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {motor.motorRecomendado.descripcion}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{motor.cantidad}</TableCell>
                      <TableCell>
                        ${(motor.motorRecomendado.precio * motor.cantidad).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Tabla de controles */}
            <Typography variant="h6" gutterBottom>
              🎮 Controles Calculados
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#9c27b0' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Control</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Capacidad</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motores Controlados</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cantidad</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {controlesCalculados.map((control, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {control.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {control.descripcion}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{control.capacidad} motores</TableCell>
                      <TableCell>{control.motoresControlados}</TableCell>
                      <TableCell>{control.cantidad}</TableCell>
                      <TableCell>
                        ${(control.precio * control.cantidad).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total */}
            <Paper sx={{ p: 2, bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  💰 Total Motorización:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  ${totales.total.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {totales.cantidadMotores} motores + {totales.cantidadControles} controles
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        {productosMotorizados.length > 0 && (
          <Button 
            variant="contained" 
            onClick={agregarTodosLosMotores}
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
          >
            Agregar Todos los Motores
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CalculadoraMotores;
