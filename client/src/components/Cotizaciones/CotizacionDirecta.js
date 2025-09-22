import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Save,
  Cancel,
  ArrowBack,
  Person,
  Calculate,
  Description,
  Settings,
  CalendarToday,
  Functions
} from '@mui/icons-material';
import SelectorProductos from './SelectorProductos';
import AgregarProductoRapido from './AgregarProductoRapido';
import CalculadoraRapida from '../Calculadoras/CalculadoraRapida';
import CalculadoraDiasHabiles from '../Calculadoras/CalculadoraDiasHabiles';
import CalculadoraMotores from '../Calculadoras/CalculadoraMotores';
import CalcularYAgregar from '../Calculadoras/CalcularYAgregar';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import axiosConfig from '../../config/axios';

const CotizacionDirecta = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [incluirIVA, setIncluirIVA] = useState(true);
  const [showAgregarProducto, setShowAgregarProducto] = useState(false);
  const [showCalculadoraRapida, setShowCalculadoraRapida] = useState(false);
  const [showCalculadoraDias, setShowCalculadoraDias] = useState(false);
  const [showCalculadoraMotores, setShowCalculadoraMotores] = useState(false);
  const [showCalcularYAgregar, setShowCalcularYAgregar] = useState(false);

  const navigate = useNavigate();

  const steps = ['Datos del Cliente', 'Productos y Medidas', 'Totales y Condiciones'];

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      // Datos del cliente
      cliente: {
        nombre: '',
        telefono: '',
        email: '',
        direccion: ''
      },
      // Datos de la cotización
      validoHasta: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      productos: [{
        nombre: '',
        descripcion: '',
        categoria: 'ventana',
        material: '',
        color: '',
        medidas: {
          ancho: 1,
          alto: 1,
          area: 1
        },
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0
      }],
      descuento: {
        porcentaje: 0,
        motivo: ''
      },
      formaPago: {
        anticipo: {
          porcentaje: 50
        },
        saldo: {
          porcentaje: 50,
          condiciones: 'contra entrega'
        }
      },
      tiempoFabricacion: 15,
      tiempoInstalacion: 1,
      requiereInstalacion: true,
      costoInstalacion: 0,
      garantia: {
        fabricacion: 12,
        instalacion: 6,
        descripcion: 'Garantía completa contra defectos de fabricación e instalación'
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos'
  });

  const watchedProductos = watch('productos');
  const watchedDescuento = watch('descuento');
  const watchedCliente = watch('cliente');

  const calcularTotales = () => {
    const subtotal = watchedProductos.reduce((sum, producto) => {
      const area = producto.medidas?.area || 0;
      const precio = producto.precioUnitario || 0;
      const cantidad = producto.cantidad || 1;
      const subtotalProducto = area * precio * cantidad;
      return sum + subtotalProducto;
    }, 0);

    const descuentoPorcentaje = watchedDescuento?.porcentaje || 0;
    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const subtotalConDescuento = subtotal - descuentoMonto;
    const iva = incluirIVA ? subtotalConDescuento * 0.16 : 0;
    const total = subtotalConDescuento + iva;

    return {
      subtotal,
      descuentoMonto,
      subtotalConDescuento,
      iva,
      total,
      incluirIVA
    };
  };

  const agregarProducto = () => {
    append({
      nombre: '',
      descripcion: '',
      categoria: 'ventana',
      material: '',
      color: '',
      medidas: {
        ancho: 1,
        alto: 1,
        area: 1
      },
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validar paso actual
      if (activeStep === 0) {
        // Validar datos del cliente
        if (!data.cliente.nombre || !data.cliente.telefono) {
          setError('Nombre y teléfono del cliente son requeridos');
          return;
        }
        setActiveStep(1);
        return;
      }

      if (activeStep === 1) {
        // Validar productos
        if (!data.productos || data.productos.length === 0) {
          setError('Debe agregar al menos un producto');
          return;
        }

        const productosIncompletos = data.productos.some(producto => 
          !producto.nombre || !producto.precioUnitario || producto.precioUnitario <= 0
        );
        
        if (productosIncompletos) {
          setError('Todos los productos deben tener nombre y precio válido');
          return;
        }
        setActiveStep(2);
        return;
      }

      // Paso final: crear prospecto y cotización
      const totales = calcularTotales();

      // 1. Crear prospecto primero
      const prospectoData = {
        nombre: data.cliente.nombre,
        telefono: data.cliente.telefono,
        email: data.cliente.email || '',
        direccion: data.cliente.direccion || '',
        fuente: 'cotizacion_directa',
        producto: data.productos[0]?.nombre || 'Cotización directa',
        etapa: 'cotizacion',
        observaciones: 'Cliente creado desde cotización directa'
      };

      console.log('Creando prospecto:', prospectoData);
      const prospectoResponse = await axiosConfig.post('/prospectos', prospectoData);
      const prospecto = prospectoResponse.data.prospecto || prospectoResponse.data;

      // 2. Crear cotización con el prospecto creado
      const productosConSubtotal = data.productos.map(producto => ({
        ...producto,
        subtotal: (producto.medidas?.area || 0) * (producto.precioUnitario || 0) * (producto.cantidad || 1)
      }));

      const cotizacionData = {
        prospectoId: prospecto._id,
        validoHasta: data.validoHasta,
        productos: productosConSubtotal,
        descuento: data.descuento,
        formaPago: data.formaPago,
        tiempoFabricacion: data.tiempoFabricacion || 15,
        tiempoInstalacion: data.tiempoInstalacion || 1,
        requiereInstalacion: data.requiereInstalacion !== false,
        costoInstalacion: data.costoInstalacion || 0,
        garantia: data.garantia,
        subtotal: totales.subtotal,
        iva: totales.iva,
        total: totales.total,
        fechaEntregaEstimada: new Date(Date.now() + (data.tiempoFabricacion || 15) * 24 * 60 * 60 * 1000)
      };

      console.log('Creando cotización:', cotizacionData);
      const cotizacionResponse = await axiosConfig.post('/cotizaciones', cotizacionData);

      setSuccess(`¡Cotización creada exitosamente! Cliente: ${prospecto.nombre}, Cotización: ${cotizacionResponse.data.cotizacion.numero}`);
      setTimeout(() => navigate('/cotizaciones'), 3000);

    } catch (error) {
      console.error('Error creando cotización directa:', error);
      console.error('Response data:', error.response?.data);
      setError(error.response?.data?.message || 'Error creando la cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const totales = calcularTotales();

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
              📋 Información del Cliente
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingresa los datos básicos del cliente para crear el prospecto automáticamente
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="cliente.nombre"
                  control={control}
                  rules={{ required: 'El nombre es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nombre Completo *"
                      error={!!errors.cliente?.nombre}
                      helperText={errors.cliente?.nombre?.message}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#f8f9fa'
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="cliente.telefono"
                  control={control}
                  rules={{ required: 'El teléfono es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Teléfono *"
                      error={!!errors.cliente?.telefono}
                      helperText={errors.cliente?.telefono?.message}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#f8f9fa'
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="cliente.email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email (opcional)"
                      type="email"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="cliente.direccion"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Dirección (opcional)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 'bold', mb: 3 }}>
              🛍️ Productos y Medidas
            </Typography>
            
            {/* Selector de productos del catálogo */}
            <SelectorProductos 
              onProductoSeleccionado={(producto) => {
                append(producto);
                setSuccess(`Producto "${producto.nombre}" agregado desde el catálogo`);
              }}
            />

            {/* Modal para agregar producto rápido */}
            <AgregarProductoRapido
              open={showAgregarProducto}
              onClose={() => setShowAgregarProducto(false)}
              onProductoCreado={(producto) => {
                setSuccess(`Producto "${producto.nombre}" creado y disponible en el catálogo`);
              }}
              userRole={'admin'} // En cotización directa asumimos permisos
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#1a1a1a' }}>
                Productos Agregados
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={agregarProducto}
                >
                  Agregar Manual
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Add />}
                  onClick={() => setShowAgregarProducto(true)}
                  sx={{
                    bgcolor: '#9c27b0',
                    '&:hover': {
                      bgcolor: '#7b1fa2'
                    }
                  }}
                >
                  Crear Producto
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Calculate />}
                  onClick={() => setShowCalcularYAgregar(true)}
                  color="warning"
                >
                  Calcular y Agregar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => setShowCalculadoraMotores(true)}
                  color="info"
                >
                  Motores
                </Button>
              </Box>
            </Box>

            {/* Calculadoras rápidas */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Functions />}
                onClick={() => setShowCalculadoraRapida(true)}
                size="small"
              >
                Calculadora
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarToday />}
                onClick={() => setShowCalculadoraDias(true)}
                size="small"
              >
                Días Hábiles
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#2563eb' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ubicación</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Medidas</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cant.</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio/m²</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subtotal</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.nombre`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              label="Producto"
                              fullWidth
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.descripcion`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              label="Ubicación"
                              placeholder="Ej: Recámara, Sala..."
                              sx={{ width: 120 }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Controller
                            name={`productos.${index}.medidas.ancho`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                size="small"
                                label="Ancho (m)"
                                type="number"
                                sx={{ width: 80 }}
                                inputProps={{ step: 0.01, min: 0 }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Calcular área automáticamente
                                  const ancho = parseFloat(e.target.value) || 0;
                                  const alto = watchedProductos[index]?.medidas?.alto || 0;
                                  const area = ancho * alto;
                                  setValue(`productos.${index}.medidas.area`, area);
                                  // Recalcular subtotal
                                  const precio = watchedProductos[index]?.precioUnitario || 0;
                                  const cantidad = watchedProductos[index]?.cantidad || 1;
                                  setValue(`productos.${index}.subtotal`, area * precio * cantidad);
                                }}
                              />
                            )}
                          />
                          <Controller
                            name={`productos.${index}.medidas.alto`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                size="small"
                                label="Alto (m)"
                                type="number"
                                sx={{ width: 80 }}
                                inputProps={{ step: 0.01, min: 0 }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Calcular área automáticamente
                                  const alto = parseFloat(e.target.value) || 0;
                                  const ancho = watchedProductos[index]?.medidas?.ancho || 0;
                                  const area = ancho * alto;
                                  setValue(`productos.${index}.medidas.area`, area);
                                  // Recalcular subtotal
                                  const precio = watchedProductos[index]?.precioUnitario || 0;
                                  const cantidad = watchedProductos[index]?.cantidad || 1;
                                  setValue(`productos.${index}.subtotal`, area * precio * cantidad);
                                }}
                              />
                            )}
                          />
                          <Typography variant="caption" sx={{ color: '#6c757d', textAlign: 'center' }}>
                            {(() => {
                              const producto = watchedProductos[index];
                              if (!producto) return '0 m²';
                              const ancho = producto.medidas?.ancho || 0;
                              const alto = producto.medidas?.alto || 0;
                              return `${(ancho * alto).toFixed(2)} m²`;
                            })()} 
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.cantidad`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              label="Cant."
                              type="number"
                              sx={{ width: 80 }}
                              inputProps={{ step: 1, min: 1 }}
                              onChange={(e) => {
                                field.onChange(e);
                                // Calcular subtotal automáticamente
                                const cantidad = parseFloat(e.target.value) || 1;
                                const area = watchedProductos[index]?.medidas?.area || 0;
                                const precio = watchedProductos[index]?.precioUnitario || 0;
                                setValue(`productos.${index}.subtotal`, area * precio * cantidad);
                              }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`productos.${index}.precioUnitario`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              label="$/m²"
                              type="number"
                              sx={{ width: 100 }}
                              inputProps={{ step: 0.01, min: 0 }}
                              onChange={(e) => {
                                field.onChange(e);
                                // Calcular subtotal automáticamente
                                const precio = parseFloat(e.target.value) || 0;
                                const area = watchedProductos[index]?.medidas?.area || 0;
                                const cantidad = watchedProductos[index]?.cantidad || 1;
                                setValue(`productos.${index}.subtotal`, area * precio * cantidad);
                              }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        ${(() => {
                          const producto = watchedProductos[index];
                          if (!producto) return 0;
                          const area = producto.medidas?.area || 0;
                          const precio = producto.precioUnitario || 0;
                          const cantidad = producto.cantidad || 1;
                          const subtotal = area * precio * cantidad;
                          return subtotal.toLocaleString();
                        })()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => remove(index)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Modales de calculadoras */}
            <CalculadoraRapida
              open={showCalculadoraRapida}
              onClose={() => setShowCalculadoraRapida(false)}
            />

            <CalculadoraDiasHabiles
              open={showCalculadoraDias}
              onClose={() => setShowCalculadoraDias(false)}
            />

            <CalculadoraMotores
              open={showCalculadoraMotores}
              onClose={() => setShowCalculadoraMotores(false)}
              productos={watchedProductos}
              onAgregarMotor={(motor) => {
                append(motor);
                setSuccess(`Motor "${motor.nombre}" agregado a la cotización`);
              }}
            />

            <CalcularYAgregar
              open={showCalcularYAgregar}
              onClose={() => setShowCalcularYAgregar(false)}
              productos={watchedProductos}
              onAgregarProducto={(producto) => {
                append(producto);
                setSuccess(`Producto "${producto.nombre}" calculado y agregado`);
              }}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
              💰 Totales y Condiciones
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="descuento.porcentaje"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descuento (%)"
                      type="number"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="validoHasta"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Válido Hasta"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Card sx={{ mt: 3, bgcolor: '#f8f9fa', border: '2px solid #2563eb' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
                  📊 Resumen de Totales
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    Subtotal: ${totales.subtotal.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#dc3545' }}>
                    Descuento: -${totales.descuentoMonto.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    Subtotal con descuento: ${totales.subtotalConDescuento.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#28a745' }}>
                    IVA (16%): +${totales.iva.toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold',
                    color: '#2563eb',
                    bgcolor: '#e3f2fd',
                    p: 1,
                    borderRadius: 1
                  }}>
                    Total: ${totales.total.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 2 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: '#1a1a1a',
        borderRadius: 2,
        color: 'white'
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cotizaciones')}
          sx={{ 
            mr: 2,
            color: 'white',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Volver
        </Button>
        <Box>
          <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
            Nueva Cotización Directa
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#6c757d' }}>
            Crear cotización y prospecto en un solo paso
          </Typography>
        </Box>
      </Box>

      <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent(activeStep)}

            {/* Botones de navegación */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'space-between',
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e0e0e0'
            }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
              >
                Anterior
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                startIcon={activeStep === 2 ? <Save /> : null}
                disabled={loading}
                sx={{
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                  px: 4,
                  py: 1.5,
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Procesando...' : 
                 activeStep === 2 ? 'Crear Cotización' : 'Siguiente'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CotizacionDirecta;
