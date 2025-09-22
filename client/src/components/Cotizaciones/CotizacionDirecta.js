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
  Divider,
  Checkbox,
  FormControlLabel
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
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje'); // 'porcentaje' o 'monto'

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
      const precio = producto.precioUnitario || 0;
      const cantidad = producto.cantidad || 1;
      const unidadMedida = producto?.unidadMedida;
      
      let subtotalProducto = 0;
      if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
        // Productos por pieza: precio × cantidad
        subtotalProducto = precio * cantidad;
      } else {
        // Productos por área o lineales: área × precio × cantidad
        const area = producto.medidas?.area || 0;
        subtotalProducto = area * precio * cantidad;
      }
      
      return sum + subtotalProducto;
    }, 0);

    let descuentoMonto = 0;
    if (tipoDescuento === 'porcentaje') {
      const descuentoPorcentaje = watchedDescuento?.porcentaje || 0;
      descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    } else {
      descuentoMonto = watchedDescuento?.monto || 0;
    }
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

      // 1. Crear prospecto primero con información completa
      const prospectoData = {
        nombre: data.cliente.nombre,
        telefono: data.cliente.telefono,
        email: data.cliente.email || '',
        direccion: {
          calle: data.cliente.direccion || '',
          colonia: '',
          ciudad: '',
          codigoPostal: '',
          referencias: 'Creado desde cotización directa'
        },
        fuente: 'cotizacion_directa',
        producto: data.productos[0]?.nombre || 'Cotización directa',
        etapa: 'cotizacion',
        prioridad: 'alta', // Cotización directa = alta prioridad
        observaciones: `Cliente creado desde cotización directa el ${new Date().toLocaleDateString('es-MX')}. Productos: ${data.productos.map(p => p.nombre).join(', ')}. Total: $${totales.total.toLocaleString()}`,
        fechaUltimoContacto: new Date()
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
        prospecto: prospecto._id, // Cambiar de prospectoId a prospecto
        validoHasta: data.validoHasta,
        productos: productosConSubtotal,
        descuento: {
          porcentaje: tipoDescuento === 'porcentaje' ? (data.descuento?.porcentaje || 0) : 0,
          monto: tipoDescuento === 'monto' ? (data.descuento?.monto || 0) : 0,
          motivo: data.descuento?.motivo || 'Descuento aplicado en cotización directa'
        },
        formaPago: {
          anticipo: {
            porcentaje: 60, // Estándar 60%
            monto: totales.total * 0.6
          },
          saldo: {
            porcentaje: 40, // Estándar 40%
            monto: totales.total * 0.4,
            condiciones: 'contra entrega'
          }
        },
        tiempoFabricacion: data.tiempoFabricacion || 15,
        tiempoInstalacion: data.tiempoInstalacion || 1,
        requiereInstalacion: data.requiereInstalacion !== false,
        costoInstalacion: data.costoInstalacion || 0,
        garantia: data.garantia || {
          fabricacion: 36, // 3 años estándar
          instalacion: 12, // 1 año estándar
          descripcion: 'Garantía estándar Sundeck: 3 años en productos, 1 año en instalación'
        },
        subtotal: totales.subtotal,
        iva: incluirIVA ? totales.iva : 0,
        total: totales.total,
        fechaEntregaEstimada: new Date(Date.now() + (data.tiempoFabricacion || 15) * 24 * 60 * 60 * 1000),
        // elaboradaPor se asignará automáticamente en el backend
        estado: 'enviada', // Cotización directa se considera enviada inmediatamente
        fechaEnvio: new Date(),
        observaciones: `Cotización directa generada. Cliente: ${data.cliente.nombre}. ${incluirIVA ? 'Con IVA' : 'Sin IVA'}. Descuento: ${tipoDescuento === 'porcentaje' ? (data.descuento?.porcentaje || 0) + '%' : '$' + (data.descuento?.monto || 0)}`
      };

      console.log('Creando cotización:', cotizacionData);
      const cotizacionResponse = await axiosConfig.post('/cotizaciones', cotizacionData);
      const cotizacion = cotizacionResponse.data.cotizacion || cotizacionResponse.data;

      // 3. Actualizar el prospecto con información adicional
      try {
        await axiosConfig.put(`/prospectos/${prospecto._id}`, {
          etapa: 'cotizacion',
          fechaUltimoContacto: new Date(),
          observaciones: `${prospecto.observaciones || ''}\n\n💰 Cotización ${cotizacion.numero} generada por $${totales.total.toLocaleString()}. Válida hasta: ${new Date(data.validoHasta).toLocaleDateString('es-MX')}. Tiempo estimado de fabricación: ${data.tiempoFabricacion || 15} días.`
        });
      } catch (updateError) {
        console.warn('Error actualizando prospecto, pero cotización creada exitosamente:', updateError);
      }

      setSuccess(`¡Cotización creada exitosamente! 
📋 Cliente: ${prospecto.nombre}
🔢 Cotización: ${cotizacion.numero}
💰 Total: $${totales.total.toLocaleString()}
📅 Válida hasta: ${new Date(data.validoHasta).toLocaleDateString('es-MX')}`);
      
      // Redirigir al detalle del prospecto creado para seguimiento
      setTimeout(() => navigate(`/prospectos/${prospecto._id}`), 4000);

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
                  Materiales Extras
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
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio Unit.</TableCell>
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
                          {/* Mostrar campos según la unidad de medida */}
                          {(() => {
                            const producto = watchedProductos[index];
                            const unidadMedida = producto?.unidadMedida;
                            
                            // Productos por pieza (motores, controles, etc.)
                            if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
                              return (
                                <Box sx={{ textAlign: 'center', py: 1 }}>
                                  <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                                    Producto por {unidadMedida}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                                    No requiere medidas
                                  </Typography>
                                </Box>
                              );
                            }
                            
                            // Productos lineales (canaletas, galerías)
                            if (['ml', 'metro'].includes(unidadMedida)) {
                              return (
                                <Controller
                                  name={`productos.${index}.medidas.area`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      size="small"
                                      label="Metros lineales"
                                      type="number"
                                      sx={{ width: 100 }}
                                      inputProps={{ step: 0.1, min: 0 }}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        // Recalcular subtotal
                                        const metrosLineales = parseFloat(e.target.value) || 0;
                                        const precio = watchedProductos[index]?.precioUnitario || 0;
                                        const cantidad = watchedProductos[index]?.cantidad || 1;
                                        setValue(`productos.${index}.subtotal`, metrosLineales * precio * cantidad);
                                      }}
                                    />
                                  )}
                                />
                              );
                            }
                            
                            // Productos por m² (persianas, cortinas, etc.) - comportamiento original
                            return (
                              <>
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
                              </>
                            );
                          })()}
                          
                          <Typography variant="caption" sx={{ color: '#6c757d', textAlign: 'center' }}>
                            {(() => {
                              const producto = watchedProductos[index];
                              if (!producto) return '';
                              
                              const unidadMedida = producto?.unidadMedida;
                              
                              // Productos por pieza
                              if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
                                return `1 ${unidadMedida}`;
                              }
                              
                              // Productos lineales
                              if (['ml', 'metro'].includes(unidadMedida)) {
                                const metrosLineales = producto.medidas?.area || 0;
                                return `${metrosLineales.toFixed(1)} m.l.`;
                              }
                              
                              // Productos por m²
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
                                // Calcular subtotal automáticamente según tipo de producto
                                const cantidad = parseFloat(e.target.value) || 1;
                                const producto = watchedProductos[index];
                                const precio = producto?.precioUnitario || 0;
                                const unidadMedida = producto?.unidadMedida;
                                
                                let subtotal = 0;
                                if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
                                  // Productos por pieza: precio × cantidad
                                  subtotal = precio * cantidad;
                                } else {
                                  // Productos por área o lineales: área × precio × cantidad
                                  const area = producto?.medidas?.area || 0;
                                  subtotal = area * precio * cantidad;
                                }
                                setValue(`productos.${index}.subtotal`, subtotal);
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
                              label={(() => {
                                const producto = watchedProductos[index];
                                const unidadMedida = producto?.unidadMedida;
                                if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
                                  return `$/${unidadMedida}`;
                                } else if (['ml', 'metro'].includes(unidadMedida)) {
                                  return '$/m.l.';
                                }
                                return '$/m²';
                              })()}
                              type="number"
                              sx={{ width: 100 }}
                              inputProps={{ step: 0.01, min: 0 }}
                              onChange={(e) => {
                                field.onChange(e);
                                // Calcular subtotal automáticamente según tipo de producto
                                const precio = parseFloat(e.target.value) || 0;
                                const producto = watchedProductos[index];
                                const cantidad = producto?.cantidad || 1;
                                const unidadMedida = producto?.unidadMedida;
                                
                                let subtotal = 0;
                                if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
                                  // Productos por pieza: precio × cantidad
                                  subtotal = precio * cantidad;
                                } else {
                                  // Productos por área o lineales: área × precio × cantidad
                                  const area = producto?.medidas?.area || 0;
                                  subtotal = area * precio * cantidad;
                                }
                                setValue(`productos.${index}.subtotal`, subtotal);
                              }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        ${(() => {
                          const producto = watchedProductos[index];
                          if (!producto) return 0;
                          
                          const precio = producto.precioUnitario || 0;
                          const cantidad = producto.cantidad || 1;
                          const unidadMedida = producto?.unidadMedida;
                          
                          let subtotal = 0;
                          if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
                            // Productos por pieza: precio × cantidad
                            subtotal = precio * cantidad;
                          } else {
                            // Productos por área o lineales: área × precio × cantidad
                            const area = producto.medidas?.area || 0;
                            subtotal = area * precio * cantidad;
                          }
                          
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
                console.log('🎯 CotizacionDirecta - Recibiendo producto:', producto);
                append(producto);
                console.log('✅ CotizacionDirecta - Producto agregado con append');
                setSuccess(`Material extra "${producto.nombre}" calculado y agregado`);
                console.log('✅ CotizacionDirecta - Mensaje de éxito establecido');
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
              {/* Selector de tipo de descuento */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                  💸 Tipo de Descuento
                </Typography>
                <Box display="flex" gap={1} sx={{ mb: 2 }}>
                  <Button
                    variant={tipoDescuento === 'porcentaje' ? 'contained' : 'outlined'}
                    onClick={() => setTipoDescuento('porcentaje')}
                    sx={{ flex: 1 }}
                  >
                    📊 Por Porcentaje
                  </Button>
                  <Button
                    variant={tipoDescuento === 'monto' ? 'contained' : 'outlined'}
                    onClick={() => setTipoDescuento('monto')}
                    color="secondary"
                    sx={{ flex: 1 }}
                  >
                    💰 Monto Fijo
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                {tipoDescuento === 'porcentaje' ? (
                  <Controller
                    name="descuento.porcentaje"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Descuento (%)"
                        type="number"
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        helperText="Porcentaje de descuento sobre el subtotal"
                      />
                    )}
                  />
                ) : (
                  <Controller
                    name="descuento.monto"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Descuento ($)"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText="Monto fijo de descuento en pesos"
                      />
                    )}
                  />
                )}
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
                
                {/* Checkbox para incluir IVA */}
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={incluirIVA}
                        onChange={(e) => setIncluirIVA(e.target.checked)}
                        sx={{
                          color: '#2563eb',
                          '&.Mui-checked': {
                            color: '#2563eb',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                        💰 Incluir IVA (16%)
                      </Typography>
                    }
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: '#6c757d', ml: 4 }}>
                    {incluirIVA ? 'Precio con IVA incluido' : 'Precio sin IVA'}
                  </Typography>
                </Box>
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
                    Descuento {tipoDescuento === 'porcentaje' 
                      ? `(${watchedDescuento?.porcentaje || 0}%)` 
                      : '(monto fijo)'}: -${totales.descuentoMonto.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6c757d' }}>
                    Subtotal con descuento: ${totales.subtotalConDescuento.toLocaleString()}
                  </Typography>
                  {incluirIVA && (
                    <Typography variant="body2" sx={{ color: '#28a745' }}>
                      IVA (16%): +${totales.iva.toLocaleString()}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold',
                    color: incluirIVA ? '#2563eb' : '#28a745',
                    bgcolor: incluirIVA ? '#e3f2fd' : '#f1f8e9',
                    p: 1,
                    borderRadius: 1
                  }}>
                    Total {incluirIVA ? '(con IVA)' : '(sin IVA)'}: ${totales.total.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Términos y Condiciones */}
            <Card sx={{ mt: 3, bgcolor: '#fff9e6', border: '2px solid #ffc107' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
                  📋 Términos y Condiciones
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#ff6b35', mb: 1 }}>
                    💰 Condiciones de Pago:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Anticipo:</strong> 60% del total al confirmar el pedido
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • <strong>Liquidación:</strong> 40% restante contra entrega
                  </Typography>
                  <Box sx={{ bgcolor: '#fff3cd', p: 2, borderRadius: 1, mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 1 }}>
                      💳 Resumen de Pagos:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Anticipo (60%): ${(totales.total * 0.6).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      • Saldo contra entrega (40%): ${(totales.total * 0.4).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2563eb', mb: 1 }}>
                    📦 Condiciones de Entrega:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • Tiempo de fabricación: 15-20 días hábiles
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • Instalación disponible (costo adicional)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • Garantía estándar: 3 años en productos
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • Todas las instalaciones incluyen: 1 año de garantía + 1 año de servicio gratuito
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#28a745', fontStyle: 'italic' }}>
                    • Garantía extendida disponible para productos selectos
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#9c27b0', mb: 1 }}>
                    🛡️ Garantías por Tipo de Producto:
                  </Typography>
                  <Box sx={{ bgcolor: '#f3e5f5', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>• Persianas y Cortinas:</strong> 3 años
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>• Motores y Automatización:</strong> 3 años
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>• Sistemas de Protección Antihuracan:</strong> 3 años en producto
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>• Productos Selectos:</strong> 3 años + garantía extendida disponible
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                      <strong>• Todas las Instalaciones:</strong> 1 año de garantía + 1 año de servicio gratuito
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#ff6b35', mb: 1 }}>
                    🔧 Servicio Técnico Incluido:
                  </Typography>
                  <Box sx={{ bgcolor: '#fff3cd', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Todas nuestras instalaciones incluyen:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>1 año de garantía</strong> en instalación profesional
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>1 año de servicio gratuito</strong> que incluye:
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        - Ajustes y calibración del sistema
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        - Reparación de componentes menores (topes, guías, etc.)
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        - Mantenimiento preventivo semestral
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        - Revisión de anclajes y sistemas de fijación
                      </Typography>
                      <Typography variant="body2">
                        - Soporte técnico profesional
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#28a745', mb: 1 }}>
                    ✅ Condiciones Generales:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • Precios válidos por 15 días
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    • Medidas sujetas a verificación en sitio
                  </Typography>
                  <Typography variant="body2">
                    • Colores y acabados sujetos a disponibilidad
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
