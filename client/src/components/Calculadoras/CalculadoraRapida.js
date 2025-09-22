import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Paper,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Close,
  Calculate,
  Clear,
  ContentCopy,
  Add,
  Remove,
  Close as Multiply,
  Percent
} from '@mui/icons-material';

const CalculadoraRapida = ({ open, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);

  // Funciones de calculadora básica
  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      
      // Agregar al historial
      const calculation = `${currentValue} ${getOperationSymbol(operation)} ${inputValue} = ${newValue}`;
      setHistory(prev => [calculation, ...prev.slice(0, 9)]); // Mantener solo 10 elementos
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case 'add':
        return firstValue + secondValue;
      case 'subtract':
        return firstValue - secondValue;
      case 'multiply':
        return firstValue * secondValue;
      case 'divide':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case 'percentage':
        return (firstValue * secondValue) / 100;
      default:
        return secondValue;
    }
  };

  const getOperationSymbol = (op) => {
    switch (op) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      case 'percentage': return '%';
      default: return '';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
  };

  // Funciones específicas para cotizaciones
  const calcularArea = () => {
    const [ancho, alto] = display.split('x').map(val => parseFloat(val.trim()));
    if (ancho && alto) {
      const area = ancho * alto;
      setDisplay(String(area));
      setHistory(prev => [`Área: ${ancho}m × ${alto}m = ${area}m²`, ...prev.slice(0, 9)]);
    }
  };

  const calcularDescuento = () => {
    const [precio, descuento] = display.split('-').map(val => parseFloat(val.trim()));
    if (precio && descuento) {
      const resultado = precio - (precio * descuento / 100);
      setDisplay(String(resultado));
      setHistory(prev => [`Descuento: $${precio} - ${descuento}% = $${resultado}`, ...prev.slice(0, 9)]);
    }
  };

  // Soporte para teclado
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!open) return; // Solo funciona cuando la calculadora está abierta
      
      const key = event.key;
      event.preventDefault(); // Prevenir comportamiento por defecto
      
      // Números
      if (key >= '0' && key <= '9') {
        inputNumber(key);
      }
      // Operaciones
      else if (key === '+') {
        performOperation('add');
      }
      else if (key === '-') {
        performOperation('subtract');
      }
      else if (key === '*' || key === 'x' || key === 'X') {
        performOperation('multiply');
      }
      else if (key === '/') {
        performOperation('divide');
      }
      else if (key === '%') {
        performOperation('percentage');
      }
      // Punto decimal
      else if (key === '.' || key === ',') {
        inputDecimal();
      }
      // Igual o Enter
      else if (key === '=' || key === 'Enter') {
        performOperation(null);
      }
      // Limpiar
      else if (key === 'Escape' || key === 'c' || key === 'C') {
        clear();
      }
      // Backspace
      else if (key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
      // Copiar (Ctrl+C)
      else if (event.ctrlKey && key === 'c') {
        copyToClipboard();
      }
      // Funciones especiales
      else if (key === 'a' || key === 'A') {
        calcularArea();
      }
      else if (key === 'd' || key === 'D') {
        calcularDescuento();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [open, display, operation, previousValue, waitingForOperand]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Calculate color="primary" />
            <Typography variant="h6">Calculadora Rápida</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          {/* Display */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#1a1a1a', color: 'white', textAlign: 'right' }}>
              <Typography variant="h4" sx={{ fontFamily: 'monospace', minHeight: '40px' }}>
                {display}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: '#6c757d' }}>
                  {operation && previousValue !== null && `${previousValue} ${getOperationSymbol(operation)}`}
                </Typography>
                <IconButton size="small" onClick={copyToClipboard} sx={{ color: 'white' }}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Grid>

          {/* Botones de calculadora */}
          <Grid item xs={12}>
            <Grid container spacing={1}>
              {/* Fila 1 */}
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={clear} sx={{ height: 50 }}>
                  C
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={() => performOperation('percentage')} sx={{ height: 50 }}>
                  <Percent />
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={() => performOperation('divide')} sx={{ height: 50 }}>
                  ÷
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={() => performOperation('multiply')} sx={{ height: 50 }}>
                  ×
                </Button>
              </Grid>

              {/* Fila 2 */}
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(7)} sx={{ height: 50 }}>
                  7
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(8)} sx={{ height: 50 }}>
                  8
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(9)} sx={{ height: 50 }}>
                  9
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={() => performOperation('subtract')} sx={{ height: 50 }}>
                  -
                </Button>
              </Grid>

              {/* Fila 3 */}
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(4)} sx={{ height: 50 }}>
                  4
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(5)} sx={{ height: 50 }}>
                  5
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(6)} sx={{ height: 50 }}>
                  6
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={() => performOperation('add')} sx={{ height: 50 }}>
                  +
                </Button>
              </Grid>

              {/* Fila 4 */}
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(1)} sx={{ height: 50 }}>
                  1
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(2)} sx={{ height: 50 }}>
                  2
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(3)} sx={{ height: 50 }}>
                  3
                </Button>
              </Grid>
              <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="primary" 
                  onClick={() => performOperation('=')} 
                  sx={{ height: 50 }}
                >
                  =
                </Button>
              </Grid>

              {/* Fila 5 */}
              <Grid item xs={6}>
                <Button fullWidth variant="contained" onClick={() => inputNumber(0)} sx={{ height: 50 }}>
                  0
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="contained" onClick={inputDecimal} sx={{ height: 50 }}>
                  .
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button fullWidth variant="outlined" onClick={calcularArea} sx={{ height: 50, fontSize: '0.75rem' }}>
                  Área
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Funciones especiales para cotizaciones */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              🔧 Funciones Especiales para Cotizaciones
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={calcularArea}
                  startIcon={<Calculate />}
                >
                  Calcular Área (AxA)
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={calcularDescuento}
                  startIcon={<Percent />}
                >
                  Aplicar Descuento
                </Button>
              </Grid>
            </Grid>
            
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6c757d' }}>
              💡 Para área: ingresa "2.5x3" y presiona el botón. Para descuento: ingresa "1000-10" y presiona el botón.
            </Typography>
          </Grid>

          {/* Historial */}
          {history.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                📋 Historial
              </Typography>
              <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                {history.map((calc, index) => (
                  <Chip
                    key={index}
                    label={calc}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const result = calc.split(' = ')[1];
                      if (result) {
                        const numericResult = result.replace(/[^\d.-]/g, '');
                        if (numericResult) {
                          setDisplay(numericResult);
                        }
                      }
                    }}
                    sx={{ 
                      mb: 0.5, 
                      mr: 0.5,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#e3f2fd'
                      }
                    }}
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* Atajos de teclado */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
              ⌨️ Atajos de Teclado
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip label="0-9: Números" size="small" variant="outlined" />
              <Chip label="+, -, *, /: Operaciones" size="small" variant="outlined" />
              <Chip label="Enter/=: Igual" size="small" variant="outlined" />
              <Chip label="Esc/C: Limpiar" size="small" variant="outlined" />
              <Chip label="Backspace: Borrar" size="small" variant="outlined" />
              <Chip label="A: Área" size="small" variant="outlined" color="primary" />
              <Chip label="D: Descuento" size="small" variant="outlined" color="primary" />
              <Chip label="Ctrl+C: Copiar" size="small" variant="outlined" color="secondary" />
            </Box>
            <Typography variant="caption" sx={{ color: '#6c757d', display: 'block', mt: 1 }}>
              💡 Puedes usar tu teclado normalmente. Para área: "2.5x3" + A. Para descuento: "1000-10" + D
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </DialogContent>

    <DialogActions>
      <Button onClick={onClose}>
        Cerrar
      </Button>
      <Button 
        variant="contained" 
        onClick={copyToClipboard}
        startIcon={<ContentCopy />}
      >
        Copiar Resultado
      </Button>
    </DialogActions>
  </Dialog>
);
};

export default CalculadoraRapida;
