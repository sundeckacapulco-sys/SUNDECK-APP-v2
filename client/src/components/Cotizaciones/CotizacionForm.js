import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Add,
  Delete,
  Calculate,
  Settings,
  CalendarToday,
  Functions,
  ContentCopy
} from '@mui/icons-material';
import SelectorProductos from './SelectorProductos';
import AgregarProductoRapido from './AgregarProductoRapido';
import CalculadoraRapida from '../Calculadoras/CalculadoraRapida';
import CalculadoraDiasHabiles from '../Calculadoras/CalculadoraDiasHabiles';
import CalculadoraMotores from '../Calculadoras/CalculadoraMotores';
import CalcularYAgregar from '../Calculadoras/CalcularYAgregar';
import { calcularSubtotalProducto } from './calculadora';
import {
  Checkbox,
  FormControlLabel,
  Chip
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import axiosConfig from '../../config/axios';

const parseNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const obtenerUnidadMedidaNormalizada = ({ unidadMedida, medida } = {}, areaCalculada = 0) => {
  const unidadRaw = (unidadMedida || medida || '').toString().trim().toLowerCase();

  if (!unidadRaw) {
    return areaCalculada > 0 ? 'm2' : 'pieza';
  }

  const normalizaciones = {
    m2: ['m2', 'm^2', 'metro cuadrado', 'metros cuadrados', 'mt2', 'mts2', 'metro2', 'm2s'],
    ml: ['ml', 'metro lineal', 'metros lineales', 'lineal'],
    metro: ['metro', 'metros', 'm', 'mt', 'mts'],
    pieza: ['pieza', 'pza', 'pz', 'pzas', 'piezas', 'unidad', 'unidades'],
    par: ['par', 'pares'],
    juego: ['juego', 'juegos'],
    kit: ['kit', 'kits']
  };

  const encontrada = Object.entries(normalizaciones).find(([, alias]) =>
    alias.some(valor => valor === unidadRaw)
  );

  if (encontrada) {
    return encontrada[0];
  }

  if (unidadRaw.includes('cuadrad')) {
    return 'm2';
  }

  if (unidadRaw.includes('lineal')) {
    return 'ml';
  }

  if (unidadRaw.includes('metro')) {
    return 'metro';
  }

  if (unidadRaw.includes('pieza') || unidadRaw.includes('unidad') || unidadRaw.includes('pz')) {
    return 'pieza';
  }

  if (unidadRaw.includes('par')) {
    return 'par';
  }

  if (unidadRaw.includes('juego')) {
    return 'juego';
  }

  if (unidadRaw.includes('kit')) {
    return 'kit';
  }

  return unidadRaw;
};

const normalizarProductoCotizacion = (producto = {}) => {
  const medidasOriginales = Array.isArray(producto.medidas)
    ? (producto.medidas[0] || {})
    : (producto.medidas || {});

  const ancho = parseNumber(medidasOriginales.ancho ?? producto.ancho, 0);
  const alto = parseNumber(medidasOriginales.alto ?? producto.alto, 0);
  const largo = parseNumber(medidasOriginales.largo ?? producto.largo, medidasOriginales.profundidad ?? producto.profundidad ?? 0);
  const cantidad = parseNumber(producto.cantidad, 1) || 1;

  const areaCalculada = parseNumber(
    medidasOriginales.area ?? producto.area ?? (ancho * alto),
    0
  );

  const unidadMedida =
    producto.unidadMedida ||
    medidasOriginales.unidadMedida ||
    (areaCalculada > 0 ? 'm2' : 'pieza');

  const precioUnitario = parseNumber(
    producto.precioUnitario ?? producto.precioM2 ?? producto.precio,
    0
  );

  let subtotalCalculado;
  if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
    subtotalCalculado = precioUnitario * cantidad;
  } else {
    subtotalCalculado = areaCalculada * precioUnitario * cantidad;
  }

  const subtotal = parseNumber(producto.subtotal, subtotalCalculado);

  return {
    ...producto,
    productoId: producto.productoId || producto.producto || producto.producto?._id || '',
    nombre: producto.nombre || producto.nombreProducto || producto.descripcion || producto.ubicacion || 'Producto sin nombre',
    descripcion: producto.descripcion || producto.ubicacion || '',
    descripcionProducto: producto.descripcionProducto || producto.observaciones || '',
    categoria: producto.categoria || '',
    material: producto.material || producto.nombreProducto || '',
    color: producto.color || '',
    cristal: producto.cristal || '',
    unidadMedida,
    medidas: {
      ...(Array.isArray(producto.medidas) ? {} : (producto.medidas || {})),
      ancho,
      alto,
      largo,
      area: areaCalculada
    },
    cantidad,
    precioUnitario,
    subtotal
  };
};

const normalizarDescuento = (descuento = {}) => {
  if (!descuento) {
    return {
      porcentaje: 0,
      monto: 0,
      motivo: ''
    };
  }

  const tipo = descuento.tipo || (descuento.monto ? 'monto' : 'porcentaje');

  return {
    porcentaje:
      tipo === 'porcentaje'
        ? parseNumber(descuento.valor ?? descuento.porcentaje, 0)
        : 0,
    monto:
      tipo === 'monto'
        ? parseNumber(descuento.valor ?? descuento.monto, 0)
        : parseNumber(descuento.monto, 0),
    motivo: descuento.motivo || ''
  };
};

const construirProductoDesdePartida = (partida = {}, pieza = {}, partidaIndex = 0, piezaIndex = 0) => {
  const ancho = parseNumber(pieza.ancho ?? partida.ancho, 0);
  const alto = parseNumber(pieza.alto ?? partida.alto, 0);
  const cantidad = parseNumber(pieza.cantidad ?? partida.cantidad, 1) || 1;
  const areaBase = parseNumber(
    pieza.area ?? pieza.m2 ?? pieza.superficie ?? (ancho * alto),
    ancho * alto
  );

  const operacionBase = pieza.tipoOperacion || partida.tipoOperacion || pieza.operacion || '';
  const esMotorizada =
    pieza.motorizado === true ||
    partida.motorizado === true ||
    (typeof operacionBase === 'string' && operacionBase.toLowerCase().includes('motoriz'));

  const sistema = Array.isArray(pieza.sistema)
    ? pieza.sistema.join(', ')
    : (pieza.sistema || partida.sistema || '');
  const tipoControl =
    pieza.tipoControl ||
    pieza.control ||
    partida.motorizacion?.modeloControl ||
    partida.control ||
    '';
  const tipoInstalacion =
    pieza.tipoInstalacion ||
    pieza.instalacion ||
    partida.tipoInstalacion ||
    partida.instalacion ||
    '';
  const caida = pieza.caida || pieza.orientacion || partida.caida || '';
  const galeria = pieza.galeria || pieza.cabezal || partida.galeria || partida.cabezal || '';
  const base = pieza.base || pieza.tabla || pieza.baseInstalacion || partida.base || '';
  const modelo = pieza.modeloCodigo || pieza.modelo || partida.modelo || '';
  const color = pieza.color || partida.color || 'Sin especificar';
  const observaciones = [partida.observaciones, pieza.observaciones]
    .filter(Boolean)
    .join(' | ');

  const operacion = esMotorizada
    ? `Motorizado${partida.motorizacion?.modeloMotor ? ` (${partida.motorizacion.modeloMotor})` : ''}`
    : (operacionBase || 'Manual');

  const nombreProducto =
    partida.producto ||
    pieza.productoLabel ||
    pieza.producto ||
    `Producto ${partidaIndex + 1}-${piezaIndex + 1}`;
  const ubicacion = pieza.ubicacion || partida.ubicacion || 'Sin ubicación';

  const unidadMedida = obtenerUnidadMedidaNormalizada(
    { unidadMedida: pieza.unidadMedida || partida.unidadMedida || pieza.medida, medida: pieza.medida },
    areaBase
  );

  const areaTexto = Number.isFinite(areaBase) ? areaBase.toFixed(2) : '0.00';

  const descripcionDetallada = [
    `Ubicación: ${ubicacion}`,
    `Producto: ${nombreProducto}${modelo ? ` (${modelo})` : ''}`,
    `Medidas: ${ancho}m x ${alto}m (${areaTexto} m²)`,
    `Cantidad: ${cantidad} ${cantidad === 1 ? 'pieza' : 'piezas'}`,
    color && `Color: ${color}`,
    sistema && `Sistema: ${sistema}`,
    tipoControl && `Control: ${tipoControl}`,
    caida && `Caída: ${caida}`,
    tipoInstalacion && `Instalación: ${tipoInstalacion}`,
    galeria && `Galería/Cabezal: ${galeria}`,
    base && `Base/Tabla: ${base}`,
    operacion && `Operación: ${operacion}`,
    observaciones && `Observaciones: ${observaciones}`
  ]
    .filter(Boolean)
    .join('\n');

  const material = pieza.telaMarca || pieza.material || partida.material || sistema || '';

  return normalizarProductoCotizacion({
    nombre: nombreProducto,
    descripcion: ubicacion,
    categoria: partida.producto || 'General',
    material,
    color,
    medidas: {
      ancho,
      alto,
      area: areaBase
    },
    cantidad,
    precioUnitario: 0,
    unidadMedida,
    subtotal: 0,
    descripcionProducto: descripcionDetallada,
    modelo,
    sistema,
    tipoControl,
    tipoInstalacion,
    caida,
    galeria,
    base,
    operacion,
    observaciones,
    esMotorizada
  });
};

// Componente para importar partidas del levantamiento
const ImportarPartidasModal = ({ levantamientoData, onImportar, onCancelar, fields, remove }) => {
  const [partidasSeleccionadas, setPartidasSeleccionadas] = useState([]);

  // Reset al abrir el modal
  useEffect(() => {
    setPartidasSeleccionadas([]);
  }, [levantamientoData]);

  const handleTogglePartida = (pieza, index) => {
    const isSelected = partidasSeleccionadas.some(p => p.index === index);
    
    if (isSelected) {
      setPartidasSeleccionadas(partidasSeleccionadas.filter(p => p.index !== index));
    } else {
      // Verificar si ya existe la misma partida
      const yaExiste = partidasSeleccionadas.some(p => 
        p.ubicacion === pieza.ubicacion && 
        (p.producto === pieza.producto || p.productoLabel === pieza.productoLabel)
      );
      
      if (!yaExiste) {
        setPartidasSeleccionadas([...partidasSeleccionadas, { ...pieza, index }]);
      }
    }
  };

  const handleSelectAll = () => {
    if (partidasSeleccionadas.length === levantamientoData.piezas.length) {
      setPartidasSeleccionadas([]);
    } else {
      setPartidasSeleccionadas(levantamientoData.piezas.map((pieza, index) => ({ ...pieza, index })));
    }
  };

  const calcularAreaPieza = (pieza) => {
    // Buscar en piezas (levantamiento) o medidas (antiguo)
    const piezasIndividuales = pieza.piezas || pieza.medidas || [];
    
    if (piezasIndividuales.length > 0) {
      return piezasIndividuales.reduce((sum, medida) => {
        // Priorizar m2 si existe, sino calcular
        const m2 = medida.m2 || (parseNumber(medida.ancho, 0) * parseNumber(medida.alto, 0));
        return sum + m2;
      }, 0);
    }

    const ancho = parseNumber(pieza.ancho, 0);
    const alto = parseNumber(pieza.alto, 0);
    const cantidad = parseNumber(pieza.cantidad, 1) || 1;
    return ancho * alto * cantidad;
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Selecciona las partidas que deseas importar a la cotización:
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={partidasSeleccionadas.length === levantamientoData.piezas.length}
              indeterminate={partidasSeleccionadas.length > 0 && partidasSeleccionadas.length < levantamientoData.piezas.length}
              onChange={handleSelectAll}
            />
          }
          label="Seleccionar todas las partidas"
        />
      </Box>

      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {levantamientoData.piezas.map((pieza, index) => {
          const isSelected = partidasSeleccionadas.some(p => p.index === index);
          const area = parseNumber(calcularAreaPieza(pieza), 0);
          
          return (
            <Card 
              key={index} 
              sx={{ 
                mb: 2, 
                border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                cursor: 'pointer'
              }}
              onClick={() => handleTogglePartida(pieza, index)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleTogglePartida(pieza, index)}
                  />
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
                      📍 {pieza.ubicacion || `Área ${index + 1}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6c757d', fontStyle: 'italic', display: 'block' }}>
                      Área de instalación para cotización
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip 
                        label={pieza.productoLabel || pieza.producto || 'Sin producto'}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`${area.toFixed(2)} m²`}
                        color="success"
                        size="small"
                      />
                      {pieza.color && (
                        <Chip 
                          label={pieza.color}
                          color="secondary"
                          size="small"
                        />
                      )}
                      {pieza.precioM2 && (
                        <Chip 
                          label={`$${pieza.precioM2}/m²`}
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                    
                    {/* Mostrar medidas */}
                    {(() => {
                      const piezasIndividuales = pieza.piezas || pieza.medidas || [];
                      return piezasIndividuales.length > 0 ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            × m × {piezasIndividuales.length} {piezasIndividuales.length === 1 ? 'pieza' : 'piezas'}
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {piezasIndividuales.map((medida, medidaIndex) => (
                              <Typography key={medidaIndex} variant="caption">
                                {medida.ancho} × {medida.alto} m ({(medida.m2 || (medida.ancho * medida.alto) || 0).toFixed(2)} m²)
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {pieza.ancho} × {pieza.alto} m × {pieza.cantidad || 1} piezas
                        </Typography>
                      );
                    })()}

                    {pieza.observaciones && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        💬 {pieza.observaciones}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {partidasSeleccionadas.length} de {levantamientoData.piezas.length} partidas seleccionadas
        </Typography>
        <Box display="flex" gap={1}>
          <Button onClick={onCancelar}>
            Cancelar
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              // Limpiar productos existentes antes de importar
              while (fields.length > 0) {
                remove(0);
              }
              onImportar(partidasSeleccionadas);
            }}
            disabled={partidasSeleccionadas.length === 0}
            color="warning"
          >
            Reemplazar Productos
          </Button>
          <Button
            variant="contained"
            onClick={() => onImportar(partidasSeleccionadas)}
            disabled={partidasSeleccionadas.length === 0}
          >
            Agregar {partidasSeleccionadas.length} Partidas
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const CotizacionForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productos, setProductos] = useState([]);
  const [prospectos, setProspectos] = useState([]);
  const [openCalculadora, setOpenCalculadora] = useState(false);
  const [productoCalcular, setProductoCalcular] = useState(null);
  const [levantamientoData, setLevantamientoData] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAgregarProducto, setShowAgregarProducto] = useState(false);
  const [incluirIVA, setIncluirIVA] = useState(true);
  const [diasValidez, setDiasValidez] = useState(15);
  const [showCalculadoraRapida, setShowCalculadoraRapida] = useState(false);
  const [showCalculadoraDias, setShowCalculadoraDias] = useState(false);
  const [showCalculadoraMotores, setShowCalculadoraMotores] = useState(false);
  const [showCalcularYAgregar, setShowCalcularYAgregar] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje'); // 'porcentaje' o 'monto'
  const [proyectoOrigen, setProyectoOrigen] = useState(null);

  // Función para actualizar la fecha de validez
  const actualizarFechaValidez = (dias) => {
    const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setValue('validoHasta', nuevaFecha);
    setDiasValidez(dias);
  };

  // Función para generar descripción con IA
  const generarDescripcionIA = (index) => {
    const producto = watchedProductos[index];
    if (!producto?.nombre) {
      setError('Primero ingresa el nombre del producto');
      return;
    }

    // Generar descripción basada en el tipo de producto
    let descripcion = '';
    const nombreProducto = producto.nombre.toLowerCase();

    if (nombreProducto.includes('blackout')) {
      descripcion = `Cortina Blackout de alta calidad que bloquea 100% la luz exterior. Ideal para recámaras y espacios que requieren oscuridad total. Fabricada con materiales resistentes y duraderos. Incluye sistema de instalación y accesorios necesarios. Perfecta para control de luz y privacidad.`;
    } else if (nombreProducto.includes('screen')) {
      descripcion = `Persiana Screen que permite el paso de luz natural mientras mantiene la privacidad. Excelente para espacios de trabajo y áreas sociales. Material resistente a rayos UV y fácil mantenimiento. Sistema de operación suave y silencioso. Ideal para control de luminosidad sin perder la vista exterior.`;
    } else if (nombreProducto.includes('persiana')) {
      descripcion = `Persiana de alta calidad fabricada con materiales premium. Diseño elegante que se adapta a cualquier decoración. Sistema de control preciso para ajuste de luz y privacidad. Instalación profesional incluida. Garantía de fabricación y funcionamiento.`;
    } else if (nombreProducto.includes('cortina')) {
      descripcion = `Cortina decorativa y funcional que combina estilo y practicidad. Materiales de primera calidad con acabados elegantes. Fácil operación y mantenimiento. Perfecta para complementar la decoración de cualquier espacio. Incluye todos los accesorios de instalación.`;
    } else {
      descripcion = `Producto de alta calidad diseñado para brindar funcionalidad y estilo a su espacio. Fabricado con materiales premium y tecnología avanzada. Instalación profesional y garantía incluida. Ideal para mejorar el confort y la estética de su hogar u oficina.`;
    }

    setValue(`productos.${index}.descripcionProducto`, descripcion);
    setSuccess('Descripción generada con IA exitosamente');
  };

  // Función para limpiar descripción
  const limpiarDescripcion = (index) => {
    setValue(`productos.${index}.descripcionProducto`, '');
  };

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prospectoId = searchParams.get('prospecto');
  const proyectoId = searchParams.get('proyecto');
  const returnTo = searchParams.get('returnTo');
  const isEdit = Boolean(id);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      prospecto: prospectoId || '',
      validoHasta: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 15 días desde hoy
      productos: [],
      descuento: {
        porcentaje: 0,
        motivo: ''
      },
      formaPago: {
        anticipo: {
          porcentaje: 60
        },
        saldo: {
          porcentaje: 40,
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
  const watchedProspecto = watch('prospecto');

  useEffect(() => {
    fetchProductos();
    fetchProspectos();
    if (isEdit) {
      fetchCotizacion();
    }
    // Si viene desde un proyecto, cargar automáticamente el levantamiento
    if (proyectoId) {
      fetchLevantamientoData();
    }
  }, [id, proyectoId]);

  const fetchProductos = async () => {
    try {
      const response = await axiosConfig.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  };

  const fetchProspectos = async () => {
    try {
      const response = await axiosConfig.get('/prospectos?limit=100');
      const listaProspectos = response.data.docs || [];
      setProspectos(listaProspectos);
      return listaProspectos;
    } catch (error) {
      console.error('Error fetching prospectos:', error);
      return [];
    }
  };

  const fetchCotizacion = async () => {
    try {
      console.log('Cargando cotización con ID:', id);
      const response = await axiosConfig.get(`/cotizaciones/${id}`);
      const cotizacion = response.data;

      console.log('Cotización cargada:', cotizacion);

      const productosNormalizados = Array.isArray(cotizacion.productos)
        ? cotizacion.productos.map(normalizarProductoCotizacion)
        : [];

      const descuentoNormalizado = normalizarDescuento(cotizacion.descuento);

      const requiereInstalacion =
        cotizacion.requiereInstalacion !== undefined
          ? cotizacion.requiereInstalacion
          : (cotizacion.instalacion?.incluye ?? true);

      const costoInstalacion =
        cotizacion.costoInstalacion !== undefined
          ? cotizacion.costoInstalacion
          : cotizacion.instalacion?.costo || 0;

      const incluirIVAFlag =
        cotizacion.incluirIVA !== undefined
          ? cotizacion.incluirIVA
          : (cotizacion.facturacion?.iva ?? 0) > 0;

      const formaPagoNormalizada = cotizacion.formaPago || {
        anticipo: {
          porcentaje: 60,
          monto: 0
        },
        saldo: {
          porcentaje: 40,
          monto: 0,
          condiciones: 'contra entrega'
        }
      };

      reset({
        prospecto: cotizacion.prospecto?._id || cotizacion.prospecto || '',
        validoHasta: cotizacion.validoHasta
          ? new Date(cotizacion.validoHasta).toISOString().slice(0, 10)
          : '',
        productos: productosNormalizados,
        descuento: descuentoNormalizado,
        formaPago: {
          anticipo: {
            porcentaje: formaPagoNormalizada?.anticipo?.porcentaje ?? 60,
            monto: formaPagoNormalizada?.anticipo?.monto ?? 0
          },
          saldo: {
            porcentaje: formaPagoNormalizada?.saldo?.porcentaje ?? 40,
            monto: formaPagoNormalizada?.saldo?.monto ?? 0,
            condiciones: formaPagoNormalizada?.saldo?.condiciones || 'contra entrega'
          }
        },
        tiempoFabricacion: cotizacion.tiempoFabricacion ?? 15,
        tiempoInstalacion: cotizacion.tiempoInstalacion ?? 1,
        requiereInstalacion,
        costoInstalacion,
        garantia: {
          fabricacion: cotizacion.garantia?.fabricacion ?? 12,
          instalacion: cotizacion.garantia?.instalacion ?? 6,
          descripcion:
            cotizacion.garantia?.descripcion ||
            'Garantía completa contra defectos de fabricación e instalación'
        },
        observaciones: cotizacion.observaciones || cotizacion.comentarios || ''
      });

      if (descuentoNormalizado.monto && descuentoNormalizado.monto > 0) {
        setTipoDescuento('monto');
      } else if (descuentoNormalizado.porcentaje && descuentoNormalizado.porcentaje > 0) {
        setTipoDescuento('porcentaje');
      } else {
        setTipoDescuento('porcentaje');
      }

      if (cotizacion.validoHasta) {
        const validoHasta = new Date(cotizacion.validoHasta);
        const hoy = new Date();
        const diffTime = validoHasta - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDiasValidez(Math.max(1, diffDays));
      }

      setIncluirIVA(incluirIVAFlag);

      setSuccess('Cotización cargada exitosamente');

    } catch (error) {
      console.error('Error cargando cotización:', error);
      setError('Error cargando la cotización: ' + (error.response?.data?.message || error.message));
    }
  };

  const calcularTotales = () => {
    const subtotal = watchedProductos.reduce((sum, producto) => {
      const subtotalProducto = calcularSubtotalProducto(producto);
      return sum + subtotalProducto;
    }, 0);

    let descuentoMonto = 0;
    if (tipoDescuento === 'porcentaje') {
      const descuentoPorcentaje = parseNumber(watchedDescuento?.porcentaje, 0);
      descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    } else {
      descuentoMonto = parseNumber(watchedDescuento?.monto, 0);
    }
    descuentoMonto = Math.min(descuentoMonto, subtotal);

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
      cristal: '',
      medidas: {
        ancho: 0,
        alto: 0,
        area: 0
      },
      cantidad: 1,
      precioUnitario: 0,
      unidadMedida: 'm2',
      subtotal: 0
    });
  };

  // Copiar el producto del primer item a todos los siguientes
  const copiarProductoPrimero = () => {
    const productos = watchedProductos;
    if (productos.length < 2) {
      alert('Necesitas al menos 2 productos para copiar');
      return;
    }

    const primerProducto = productos[0];
    if (!primerProducto?.nombre) {
      alert('El primer producto debe tener un nombre');
      return;
    }

    // Copiar nombre del primer producto a todos los demás
    for (let i = 1; i < productos.length; i++) {
      setValue(`productos.${i}.nombre`, primerProducto.nombre);
      setValue(`productos.${i}.categoria`, primerProducto.categoria || 'ventana');
      setValue(`productos.${i}.material`, primerProducto.material || '');
      setValue(`productos.${i}.color`, primerProducto.color || '');
      setValue(`productos.${i}.unidadMedida`, primerProducto.unidadMedida || 'm2');
    }

    alert(`✅ Producto "${primerProducto.nombre}" copiado a ${productos.length - 1} items`);
  };

  // Copiar el precio del primer item a todos los siguientes
  const copiarPrecioPrimero = () => {
    const productos = watchedProductos;
    if (productos.length < 2) {
      alert('Necesitas al menos 2 productos para copiar el precio');
      return;
    }

    const primerProducto = productos[0];
    const precioUnitario = parseFloat(primerProducto?.precioUnitario) || 0;
    
    if (precioUnitario === 0) {
      alert('El primer producto debe tener un precio válido');
      return;
    }

    // Copiar precio del primer producto a todos los demás y recalcular subtotales
    for (let i = 1; i < productos.length; i++) {
      setValue(`productos.${i}.precioUnitario`, precioUnitario);
      
      // Recalcular subtotal según tipo de producto
      const producto = productos[i];
      const cantidad = producto?.cantidad || 1;
      const unidadMedida = producto?.unidadMedida;
      
      let subtotal = 0;
      if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
        subtotal = precioUnitario * cantidad;
      } else {
        const area = parseNumber(producto?.medidas?.area, 0);
        subtotal = area * precioUnitario * cantidad;
      }
      setValue(`productos.${i}.subtotal`, subtotal);
    }

    alert(`✅ Precio $${precioUnitario.toLocaleString()} copiado a ${productos.length - 1} items`);
  };

  // Función para importar desde proyecto unificado
  const importarDesdeProyectoUnificado = (proyecto) => {
    const partidas = proyecto.levantamiento?.partidas || [];

    const productosNormalizados = partidas.flatMap((partida, partidaIndex) => {
      const piezas = Array.isArray(partida.piezas) && partida.piezas.length > 0
        ? partida.piezas
        : [partida];

      return piezas.map((pieza, piezaIndex) =>
        construirProductoDesdePartida(partida, pieza, partidaIndex, piezaIndex)
      );
    });

    console.log('📦 Productos importados:', productosNormalizados);
    setValue('productos', productosNormalizados);
    setSuccess(`✅ Se importaron ${productosNormalizados.length} productos con todas sus especificaciones técnicas`);
  };

  // Función para obtener datos del levantamiento
  const fetchLevantamientoData = async () => {
    try {
      setLoading(true);
      if (!proyectoId) {
        setProyectoOrigen(null);
      }

      // Si viene desde un proyecto unificado, buscar ahí
      if (proyectoId) {
        console.log('🔍 Buscando levantamiento en proyecto:', proyectoId);
        const { data } = await axiosConfig.get(`/proyectos/${proyectoId}`);
        const proyecto = data.data || data;
        setProyectoOrigen(proyecto);

        // Pre-seleccionar el prospecto del proyecto
        console.log('📋 Datos del proyecto:', proyecto);
        console.log('👤 Prospecto del proyecto:', proyecto.prospecto);

        if (!prospectos || prospectos.length === 0) {
          await fetchProspectos();
        }

        const prospectoProyectoRaw = proyecto.prospecto?._id || proyecto.prospecto?.id || proyecto.prospecto;
        const prospectoProyectoId =
          typeof prospectoProyectoRaw === 'object'
            ? (prospectoProyectoRaw?._id || prospectoProyectoRaw?.id || '')
            : prospectoProyectoRaw;

        if (prospectoProyectoId) {
          console.log('✅ Pre-seleccionando prospecto:', prospectoProyectoId);
          setTimeout(() => {
            setValue('prospecto', prospectoProyectoId);
            console.log('✅ Prospecto seteado:', prospectoProyectoId);
          }, 100);
        }

        if (proyecto.levantamiento && proyecto.levantamiento.partidas) {
          console.log('✅ Partidas encontradas:', proyecto.levantamiento.partidas);
          importarDesdeProyectoUnificado(proyecto);
          return;
        } else {
          setError('Este proyecto no tiene levantamiento técnico');
          return;
        }
      }
      
      // Si no hay proyecto, buscar por prospecto
      const selectedProspecto = prospectoId || watchedProspecto;
      if (!selectedProspecto) {
        setError('No hay prospecto o proyecto seleccionado');
        return;
      }

      console.log('🔍 Buscando proyecto para prospecto:', selectedProspecto);

      // Buscar proyecto asociado al prospecto
      const { data: proyectosData } = await axiosConfig.get(`/proyectos?prospecto_original=${selectedProspecto}`);
      const proyectos = proyectosData?.data?.docs || [];
      
      if (proyectos.length === 0) {
        setError('No se encontró proyecto asociado a este prospecto');
        return;
      }

      const proyecto = proyectos[0];
      
      console.log('✅ Proyecto encontrado:', {
        id: proyecto._id,
        numero: proyecto.numero,
        tienePartidas: !!proyecto.levantamiento?.partidas?.length,
        tieneMedidas: !!proyecto.medidas?.length
      });

      // Verificar que el proyecto tenga levantamiento (nuevo o legacy)
      const tienePartidas = proyecto.levantamiento?.partidas?.length > 0;
      const tieneMedidas = proyecto.medidas?.length > 0;
      
      if (!tienePartidas && !tieneMedidas) {
        setError('Este proyecto no tiene levantamiento técnico. Crea un levantamiento primero.');
        return;
      }

      // Priorizar partidas nuevas, si no hay usar medidas legacy
      let piezasParaImportar;
      if (tienePartidas) {
        console.log('✅ Usando partidas del levantamiento nuevo:', proyecto.levantamiento.partidas);
        piezasParaImportar = proyecto.levantamiento.partidas;
      } else {
        console.log('✅ Usando medidas legacy:', proyecto.medidas);
        // Convertir medidas legacy a formato de partidas
        piezasParaImportar = proyecto.medidas[0]?.piezas || [];
      }
      
      // Eliminar duplicados
      const piezasUnicas = piezasParaImportar.filter((pieza, index, array) => {
        const esPrimera = array.findIndex(p => 
          p.ubicacion === pieza.ubicacion && 
          (p.producto === pieza.producto || p.productoLabel === pieza.productoLabel)
        ) === index;
        return esPrimera;
      });
      
      console.log(`✅ Levantamiento: ${piezasUnicas.length} partidas encontradas`);
      
      setLevantamientoData({ piezas: piezasUnicas });
      setShowImportModal(true);
    } catch (err) {
      setError('Error al obtener datos del levantamiento: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Función para importar partidas del levantamiento
  const importarPartidas = (partidasSeleccionadas) => {
    if (!levantamientoData || !partidasSeleccionadas.length) return;

    // Eliminar duplicados por ubicación y producto
    const partidasUnicas = partidasSeleccionadas.filter((partida, index, array) => {
      return array.findIndex(p =>
        p.ubicacion === partida.ubicacion &&
        (p.producto === partida.producto || p.productoLabel === partida.productoLabel)
      ) === index;
    });

    const productosConstruidos = [];

    partidasUnicas.forEach((partida, partidaIndex) => {
      const piezas = Array.isArray(partida.piezas) && partida.piezas.length > 0
        ? partida.piezas
        : [partida];

      piezas.forEach((pieza, piezaIndex) => {
        const productoImportado = construirProductoDesdePartida(
          partida,
          pieza,
          partida.index ?? partidaIndex,
          piezaIndex
        );
        productosConstruidos.push(productoImportado);
        append(productoImportado);
      });
    });

    setShowImportModal(false);
    const duplicadosEliminados = partidasSeleccionadas.length - partidasUnicas.length;
    const detalleDuplicados = duplicadosEliminados > 0
      ? ` (${duplicadosEliminados} partidas duplicadas omitidas)`
      : '';
    setSuccess(`✅ Se importaron ${productosConstruidos.length} productos del levantamiento${detalleDuplicados}`);
  };

  const calcularPrecioProducto = async (index, producto) => {
    try {
      if (!producto.productoId || !producto.medidas.ancho || !producto.medidas.alto) {
        return;
      }

      const response = await axiosConfig.post(`/productos/${producto.productoId}/calcular-precio`, {
        medidas: producto.medidas,
        opciones: {
          colorEspecial: producto.color !== 'blanco',
          cristalEspecial: producto.cristal !== 'claro'
        }
      });

      const { precio, area, tiempoFabricacion } = response.data;
      
      setValue(`productos.${index}.medidas.area`, area);
      setValue(`productos.${index}.precioUnitario`, precio);
      setValue(`productos.${index}.subtotal`, precio * producto.cantidad);
      setValue(`productos.${index}.tiempoFabricacion`, tiempoFabricacion);
    } catch (error) {
      console.error('Error calculando precio:', error);
    }
  };

  // Las cotizaciones directas se manejan en el componente CotizacionDirecta.js

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validar que hay productos
      if (!data.productos || data.productos.length === 0) {
        setError('Debe agregar al menos un producto a la cotización');
        return;
      }

      // Validar que los productos tienen información básica
      const productosIncompletos = data.productos.some(producto => 
        !producto.nombre || !producto.precioUnitario || producto.precioUnitario <= 0
      );
      
      if (productosIncompletos) {
        setError('Todos los productos deben tener nombre y precio válido');
        return;
      }

      // Validar que hay un prospecto seleccionado
      if (!data.prospecto) {
        setError('Debe seleccionar un prospecto. Para cotizaciones sin prospecto existente, use "Nueva Cotización Directa"');
        return;
      }
      
      const prospectoIdFinal = data.prospecto;

      // Debug del prospecto seleccionado
      console.log('=== DEBUG PROSPECTO ===');
      console.log('data.prospecto:', data.prospecto);
      console.log('prospectoIdFinal:', prospectoIdFinal);
      console.log('Tipo de prospectoIdFinal:', typeof prospectoIdFinal);
      console.log('¿Es válido?:', !!prospectoIdFinal);
      console.log('=== FIN DEBUG PROSPECTO ===');

      const totales = calcularTotales();
      
      // Calcular subtotales de productos usando la misma lógica que calcularTotales()
      const productosConSubtotal = data.productos.map(producto => {
        const subtotal = calcularSubtotalProducto(producto);
        const cantidad = parseNumber(producto.cantidad, 1) || 1;
        const precioUnitario = parseNumber(
          producto.precioUnitario ?? producto.precioM2 ?? producto.precio,
          0
        );
        const area = parseNumber(
          producto.medidas?.area ?? producto.area ?? producto.metrosCuadrados,
          0
        );

        return {
          ...producto,
          cantidad,
          precioUnitario,
          medidas: {
            ...(producto.medidas || {}),
            area
          },
          subtotal
        };
      });

      // Validar que tenemos un prospectoId válido
      if (!prospectoIdFinal) {
        setError('No se pudo obtener un ID de prospecto válido');
        return;
      }

      console.log('ProspectoId final a usar:', prospectoIdFinal);
      console.log('Tipo de prospectoId:', typeof prospectoIdFinal);
      
      // Debug de totales para verificar consistencia
      console.log('=== DEBUG TOTALES ===');
      console.log('Totales calculados:', totales);
      console.log('Incluir IVA:', incluirIVA);
      console.log('Productos con subtotal:', productosConSubtotal.map(p => ({
        nombre: p.nombre,
        subtotal: p.subtotal,
        precio: p.precioUnitario,
        cantidad: p.cantidad,
        area: p.medidas?.area
      })));
      const sumaSubtotales = productosConSubtotal.reduce((sum, p) => sum + (p.subtotal || 0), 0);
      console.log('Suma de subtotales productos:', sumaSubtotales);
      console.log('Total calculado por función:', totales.subtotal);
      console.log('IVA calculado:', totales.iva);
      console.log('Total final:', totales.total);
      console.log('¿Son iguales?', Math.abs(sumaSubtotales - totales.subtotal) < 0.01);
      console.log('=== FIN DEBUG ===');

      const cotizacionData = {
        prospecto: prospectoIdFinal, // Usar el ID final (existente o creado) - campo correcto para backend
        validoHasta: data.validoHasta,
        productos: productosConSubtotal,
        descuento: data.descuento,
        formaPago: data.formaPago,
        tiempoFabricacion: data.tiempoFabricacion || 15,
        tiempoInstalacion: data.tiempoInstalacion || 1,
        requiereInstalacion: data.requiereInstalacion !== false,
        costoInstalacion: data.costoInstalacion || 0,
        garantia: data.garantia,
        // Incluir totales calculados
        subtotal: totales.subtotal,
        iva: totales.iva,
        total: totales.total,
        incluirIVA: incluirIVA, // Agregar flag de IVA
        fechaEntregaEstimada: new Date(Date.now() + (data.tiempoFabricacion || 15) * 24 * 60 * 60 * 1000)
      };

      console.log(isEdit ? 'Actualizando cotización:' : 'Creando cotización:', cotizacionData);
      
      let response;
      if (isEdit) {
        response = await axiosConfig.put(`/cotizaciones/${id}`, cotizacionData);
        setSuccess('Cotización actualizada exitosamente');
        console.log('Cotización actualizada:', response.data);
        // Navegar de vuelta a la lista después de actualizar
        setTimeout(() => {
          navigate('/cotizaciones');
        }, 2000);
      } else {
        console.log('Enviando datos de cotización:', cotizacionData);
        console.log('prospecto en payload:', cotizacionData.prospecto);
        console.log('Tipo de prospecto en payload:', typeof cotizacionData.prospecto);
        response = await axiosConfig.post('/cotizaciones', cotizacionData);
        console.log('Respuesta del servidor:', response.data);
        setSuccess('Cotización creada exitosamente');
        console.log('Navegando a /cotizaciones en 2 segundos...');
        setTimeout(() => {
          console.log('Ejecutando navegación...');
          navigate('/cotizaciones');
        }, 2000);
      }
    } catch (error) {
      console.error('Error guardando cotización:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Error guardando la cotización';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = `Error de validación: ${error.response.data.details.join(', ')}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  const numeroProyectoOrigen =
    proyectoOrigen?.numero ||
    proyectoOrigen?.folio ||
    proyectoOrigen?.codigo ||
    proyectoOrigen?._id ||
    proyectoId;

  const nombreClienteProyecto =
    proyectoOrigen?.cliente?.nombre ||
    proyectoOrigen?.cliente?.razonSocial ||
    proyectoOrigen?.prospecto?.nombre ||
    proyectoOrigen?.prospecto?.datosGenerales?.nombreCompleto ||
    proyectoOrigen?.prospecto?.datosGenerales?.nombre ||
    proyectoOrigen?.prospecto?.datosGenerales?.cliente ||
    (typeof proyectoOrigen?.prospecto === 'string' ? proyectoOrigen.prospecto : '') ||
    'Sin cliente asignado';

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 2 }}>
      {/* Header con colores Sundeck */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: '#1a1a1a', // Negro Sundeck
        borderRadius: 2,
        color: 'white'
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(returnTo || '/cotizaciones')}
          sx={{ 
            mr: 2,
            color: 'white',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Volver
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
              {isEdit ? 'Editar Cotización' : 'Nueva Cotización'}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#6c757d' }}>
              SUNDECK - Soluciones en Cortinas y Persianas
            </Typography>
          </Box>
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

          {proyectoId && proyectoOrigen && (
            <Alert severity="info" sx={{ mb: 2 }}>
              📋 Cotización para proyecto: <strong>{numeroProyectoOrigen}</strong>
              <br />
              👤 Cliente: <strong>{nombreClienteProyecto}</strong>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Información básica */}
            <Typography variant="h6" gutterBottom>
              Información Básica
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="prospecto"
                  control={control}
                  rules={{ required: 'Debe seleccionar un cliente' }}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Cliente *</InputLabel>
                      <Select {...field} label="Cliente *" error={!!errors.prospecto}>
                        <MenuItem value="">
                          <em>Seleccionar cliente...</em>
                        </MenuItem>
                        {prospectos.map(prospecto => (
                          <MenuItem key={prospecto._id} value={prospecto._id}>
                            {prospecto.nombre} - {prospecto.telefono}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.prospecto && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                          {errors.prospecto.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                {/* Mensaje informativo */}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#2563eb', fontStyle: 'italic' }}>
                    💡 Para crear cotizaciones sin cliente existente, use "Nueva Cotización Directa" desde el menú principal.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {/* Campo para días de validez */}
                  <Box sx={{ width: '40%' }}>
                    <TextField
                      label="Válido por (días)"
                      type="number"
                      value={diasValidez}
                      onChange={(e) => {
                        const dias = parseInt(e.target.value) || 15;
                        actualizarFechaValidez(dias);
                      }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#fff3cd'
                        }
                      }}
                      InputProps={{
                        inputProps: { min: 1, max: 365 }
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', color: '#6c757d', mt: 0.5 }}>
                      Por defecto: 15 días
                    </Typography>
                    
                    {/* Botones de acceso rápido */}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {[7, 15, 30, 60].map((dias) => (
                        <Button
                          key={dias}
                          size="small"
                          variant={diasValidez === dias ? "contained" : "outlined"}
                          onClick={() => actualizarFechaValidez(dias)}
                          sx={{
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            fontSize: '0.75rem',
                            bgcolor: diasValidez === dias ? '#2563eb' : 'transparent',
                            borderColor: '#2563eb',
                            color: diasValidez === dias ? 'white' : '#2563eb',
                            '&:hover': {
                              bgcolor: diasValidez === dias ? '#1d4ed8' : '#e3f2fd'
                            }
                          }}
                        >
                          {dias}d
                        </Button>
                      ))}
                    </Box>
                  </Box>
                  
                  {/* Campo de fecha calculada */}
                  <Box sx={{ width: '60%' }}>
                    <Controller
                      name="validoHasta"
                      control={control}
                      rules={{ required: 'La fecha de validez es requerida' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Válido Hasta *"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.validoHasta}
                          helperText={errors.validoHasta?.message || `Cotización válida por ${diasValidez} días`}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#f8f9fa'
                            }
                          }}
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Selector de productos del catálogo */}
            <SelectorProductos 
              onProductoSeleccionado={(producto) => {
                append(producto);
                setSuccess(`Producto "${producto.nombre}" agregado exitosamente`);
              }}
            />

            {/* Modal para agregar producto rápido */}
            <AgregarProductoRapido
              open={showAgregarProducto}
              onClose={() => setShowAgregarProducto(false)}
              onProductoCreado={(producto) => {
                setSuccess(`Producto "${producto.nombre}" creado y disponible en el catálogo`);
                // Opcional: agregar directamente a la cotización
                // append(producto);
              }}
              userRole={user?.rol || 'vendedor'}
            />

            {/* Productos */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Productos Agregados
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(prospectoId || watchedProspecto) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Calculate />}
                    onClick={fetchLevantamientoData}
                    disabled={loading}
                  >
                    📋 Importar Levantamiento
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={agregarProducto}
                >
                  Agregar Manual
                </Button>
                {['admin', 'supervisor'].includes(user?.rol) && (
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
                )}
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

            {/* Botones de copiar - Solo aparecen si hay más de 1 producto */}
            {fields.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<ContentCopy />}
                  onClick={copiarProductoPrimero}
                  size="small"
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': {
                      bgcolor: '#059669'
                    }
                  }}
                >
                  Copiar Producto del 1° a los demás
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ContentCopy />}
                  onClick={copiarPrecioPrimero}
                  size="small"
                  sx={{
                    bgcolor: '#f59e0b',
                    '&:hover': {
                      bgcolor: '#d97706'
                    }
                  }}
                >
                  Copiar Precio del 1° a los demás
                </Button>
              </Box>
            )}

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
                  <TableRow sx={{ bgcolor: '#2563eb' }}> {/* Azul Sundeck */}
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
                      <TableCell sx={{ minWidth: 200 }}>
                        <Controller
                          name={`productos.${index}.nombre`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              label="Producto"
                              fullWidth
                              sx={{
                                '& .MuiInputBase-input': {
                                  fontSize: '0.875rem',
                                  whiteSpace: 'normal',
                                  overflow: 'visible'
                                }
                              }}
                            />
                          )}
                        />
                        {watchedProductos[index]?.descripcionProducto && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              whiteSpace: 'pre-line',
                              fontSize: '0.85rem'
                            }}
                          >
                            {watchedProductos[index].descripcionProducto}
                          </Typography>
                        )}
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
                              sx={{ 
                                width: 120,
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: '#fff3cd'
                                }
                              }}
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
                                      sx={{ 
                                        width: 100,
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: '#f8f9fa'
                                        }
                                      }}
                                      inputProps={{ step: 0.1, min: 0 }}
                                    />
                                  )}
                                />
                              );
                            }
                            
                            // Productos por m² (persianas, cortinas, etc.) - comportamiento original
                            return (
                              <Controller
                                name={`productos.${index}.medidas.area`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    size="small"
                                    label="m²"
                                    type="number"
                                    sx={{ 
                                      width: 80,
                                      '& .MuiOutlinedInput-root': {
                                        bgcolor: '#f8f9fa'
                                      }
                                    }}
                                  />
                                )}
                              />
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
                                const metrosLineales = parseNumber(producto.medidas?.area, 0);
                                return `${metrosLineales.toFixed(1)} m.l.`;
                              }

                              // Productos por m²
                              const area = parseNumber(producto.medidas?.area, 0);
                              return `${area.toFixed(2)} m²`;
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
                              type="number"
                              sx={{ width: 80 }}
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
                                  const area = parseNumber(producto?.medidas?.area, 0);
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
                              type="number"
                              sx={{ width: 100 }}
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
                          const subtotal = calcularSubtotalProducto(producto);
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

            {/* Sección de Descripciones de Productos - A todo lo ancho */}
            {fields.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 'bold',
                  mb: 3,
                  borderBottom: '2px solid #2563eb',
                  pb: 1
                }}>
                  📝 Descripciones de Productos
                </Typography>
                
                {/* Una sola columna a todo lo ancho */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {fields.map((field, index) => (
                    <Card key={field.id} sx={{ 
                      borderRadius: 3,
                      border: '2px solid #e0e0e0',
                      boxShadow: 2,
                      '&:hover': {
                        borderColor: '#2563eb',
                        boxShadow: 4
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
                            🏷️ Producto {index + 1}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip 
                              label={watchedProductos[index]?.nombre || 'Sin nombre'}
                              color="primary"
                              size="medium"
                            />
                            <Chip 
                              label={watchedProductos[index]?.descripcion || 'Sin ubicación'}
                              color="secondary"
                              size="medium"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Controller
                          name={`productos.${index}.descripcionProducto`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              multiline
                              rows={4}
                              label="Descripción técnica del producto"
                              placeholder="Describe las características, beneficios y especificaciones técnicas del producto..."
                              sx={{ 
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: '#f8f9fa',
                                  borderRadius: 2,
                                  minHeight: '120px'
                                },
                                '& .MuiOutlinedInput-input': {
                                  fontSize: '14px',
                                  lineHeight: '1.6',
                                  padding: '16px 14px',
                                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                  letterSpacing: '0.01em'
                                },
                                '& .MuiInputLabel-root': {
                                  fontSize: '16px',
                                  lineHeight: '1.4375em'
                                },
                                '& textarea': {
                                  fontSize: '14px !important',
                                  lineHeight: '1.6 !important',
                                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif !important',
                                  letterSpacing: '0.01em !important',
                                  resize: 'vertical'
                                }
                              }}
                            />
                          )}
                        />
                        
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            onClick={() => generarDescripcionIA(index)}
                            sx={{
                              bgcolor: '#28a745',
                              '&:hover': { bgcolor: '#218838' },
                              borderRadius: 2,
                              px: 3,
                              py: 1
                            }}
                          >
                            🤖 Generar con IA
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => limpiarDescripcion(index)}
                            sx={{
                              borderColor: '#6c757d',
                              color: '#6c757d',
                              '&:hover': { 
                                borderColor: '#1a1a1a',
                                color: '#1a1a1a'
                              },
                              borderRadius: 2,
                              px: 3,
                              py: 1
                            }}
                          >
                            🗑️ Limpiar
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {/* Totales */}
            <Card sx={{ 
              mb: 3, 
              bgcolor: '#f8f9fa',
              border: '2px solid #2563eb',
              borderRadius: 3,
              boxShadow: 3
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 'bold',
                  borderBottom: '2px solid #2563eb',
                  pb: 1,
                  mb: 2
                }}>
                  💰 Resumen de Totales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {/* Selector de tipo de descuento */}
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                      💸 Tipo de Descuento
                    </Typography>
                    <Box display="flex" gap={1} sx={{ mb: 2 }}>
                      <Button
                        variant={tipoDescuento === 'porcentaje' ? 'contained' : 'outlined'}
                        onClick={() => setTipoDescuento('porcentaje')}
                        sx={{ flex: 1 }}
                        size="small"
                      >
                        📊 Porcentaje
                      </Button>
                      <Button
                        variant={tipoDescuento === 'monto' ? 'contained' : 'outlined'}
                        onClick={() => setTipoDescuento('monto')}
                        color="secondary"
                        sx={{ flex: 1 }}
                        size="small"
                      >
                        💰 Monto Fijo
                      </Button>
                    </Box>

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
                            helperText="Porcentaje sobre el subtotal"
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
                            helperText="Monto fijo en pesos"
                          />
                        )}
                      />
                    )}
                    
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
                  <Grid item xs={12} md={6}>
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
                      {!incluirIVA && (
                        <Typography variant="caption" sx={{ color: '#6c757d', fontStyle: 'italic', display: 'block', mt: 1 }}>
                          * Precio no incluye IVA
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Condiciones de pago */}
            <Typography variant="h6" gutterBottom>
              Condiciones de Pago
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="formaPago.anticipo.porcentaje"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Anticipo (%)"
                      type="number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="formaPago.saldo.condiciones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Condiciones del saldo"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Botones */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e0e0e0'
            }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/cotizaciones')}
                disabled={loading}
                sx={{
                  borderColor: '#6c757d',
                  color: '#6c757d',
                  '&:hover': {
                    borderColor: '#1a1a1a',
                    color: '#1a1a1a'
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
                sx={{
                  bgcolor: '#2563eb', // Azul Sundeck
                  '&:hover': {
                    bgcolor: '#1d4ed8'
                  },
                  px: 4,
                  py: 1.5,
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar Cotización' : 'Crear Cotización')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Modal para Importar Partidas del Levantamiento */}
      <Dialog
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          📋 Importar Partidas del Levantamiento Técnico
        </DialogTitle>
        <DialogContent>
          {levantamientoData && (
            <ImportarPartidasModal
              levantamientoData={levantamientoData}
              onImportar={importarPartidas}
              onCancelar={() => setShowImportModal(false)}
              fields={fields}
              remove={remove}
            />
          )}
        </DialogContent>
      </Dialog>

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
          setSuccess(`Material extra "${producto.nombre}" calculado y agregado`);
        }}
      />
    </Box>
  );
};

export default CotizacionForm;
