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
  Functions
} from '@mui/icons-material';
import SelectorProductos from './SelectorProductos';
import AgregarProductoRapido from './AgregarProductoRapido';
import CalculadoraRapida from '../Calculadoras/CalculadoraRapida';
import CalculadoraDiasHabiles from '../Calculadoras/CalculadoraDiasHabiles';
import CalculadoraMotores from '../Calculadoras/CalculadoraMotores';
import CalcularYAgregar from '../Calculadoras/CalcularYAgregar';
import {
  Checkbox,
  FormControlLabel,
  Chip
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import axiosConfig from '../../config/axios';

// Componente para importar partidas del levantamiento
const ImportarPartidasModal = ({ levantamientoData, onImportar, onCancelar, fields, remove }) => {
  const [partidasSeleccionadas, setPartidasSeleccionadas] = useState([]);

  // Reset al abrir el modal
  useEffect(() => {
    console.log('Modal abierto - reseteando selecciones');
    setPartidasSeleccionadas([]);
  }, [levantamientoData]);

  const handleTogglePartida = (pieza, index) => {
    console.log('=== TOGGLE PARTIDA DEBUG ===');
    console.log('Pieza clickeada:', pieza.ubicacion, 'Index:', index);
    console.log('Partidas seleccionadas ANTES:', partidasSeleccionadas.map(p => `${p.ubicacion} (index: ${p.index})`));
    
    const isSelected = partidasSeleccionadas.some(p => p.index === index);
    console.log('¿Está seleccionada?', isSelected);
    
    if (isSelected) {
      const nuevasPartidas = partidasSeleccionadas.filter(p => p.index !== index);
      console.log('REMOVIENDO - Nuevas partidas:', nuevasPartidas.length);
      console.log('Partidas después de remover:', nuevasPartidas.map(p => `${p.ubicacion} (index: ${p.index})`));
      setPartidasSeleccionadas(nuevasPartidas);
    } else {
      // VERIFICAR SI YA EXISTE LA MISMA PARTIDA CON DIFERENTE ÍNDICE
      const yaExiste = partidasSeleccionadas.some(p => 
        p.ubicacion === pieza.ubicacion && 
        (p.producto === pieza.producto || p.productoLabel === pieza.productoLabel)
      );
      
      if (yaExiste) {
        console.log('⚠️ PARTIDA YA EXISTE CON DIFERENTE ÍNDICE - NO AGREGANDO');
        return;
      }
      
      const nuevasPartidas = [...partidasSeleccionadas, { ...pieza, index }];
      console.log('AGREGANDO - Nuevas partidas:', nuevasPartidas.length);
      console.log('Partidas después de agregar:', nuevasPartidas.map(p => `${p.ubicacion} (index: ${p.index})`));
      setPartidasSeleccionadas(nuevasPartidas);
    }
    console.log('=== FIN TOGGLE DEBUG ===');
  };

  const handleSelectAll = () => {
    console.log('Select all - partidas disponibles:', levantamientoData.piezas.length);
    console.log('Select all - partidas seleccionadas:', partidasSeleccionadas.length);
    
    if (partidasSeleccionadas.length === levantamientoData.piezas.length) {
      console.log('Deseleccionando todas');
      setPartidasSeleccionadas([]);
    } else {
      const todasLasPartidas = levantamientoData.piezas.map((pieza, index) => ({ ...pieza, index }));
      console.log('Seleccionando todas:', todasLasPartidas.length);
      setPartidasSeleccionadas(todasLasPartidas);
    }
  };

  const calcularAreaPieza = (pieza) => {
    if (pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0) {
      return pieza.medidas.reduce((sum, medida) => {
        return sum + ((medida.ancho || 0) * (medida.alto || 0));
      }, 0);
    } else {
      const ancho = pieza.ancho || 0;
      const alto = pieza.alto || 0;
      const cantidad = pieza.cantidad || 1;
      return ancho * alto * cantidad;
    }
  };

  // Debug del render
  console.log('=== RENDER MODAL DEBUG ===');
  console.log('Partidas disponibles:', levantamientoData.piezas?.length);
  console.log('Partidas seleccionadas:', partidasSeleccionadas.length);
  console.log('Lista de seleccionadas:', partidasSeleccionadas.map(p => `${p.ubicacion} (index: ${p.index})`));
  console.log('=== FIN RENDER DEBUG ===');

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
          const area = calcularAreaPieza(pieza);
          
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
                    {pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0 ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Medidas individuales:
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {pieza.medidas.map((medida, medidaIndex) => (
                            <Typography key={medidaIndex} variant="caption">
                              {medida.ancho} × {medida.alto} m
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {pieza.ancho} × {pieza.alto} m × {pieza.cantidad || 1} piezas
                      </Typography>
                    )}

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
  const isEdit = Boolean(id);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
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
  const watchedProspecto = watch('prospecto');

  useEffect(() => {
    fetchProductos();
    fetchProspectos();
    if (isEdit) {
      fetchCotizacion();
    }
  }, [id]);

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
      setProspectos(response.data.docs || []);
    } catch (error) {
      console.error('Error fetching prospectos:', error);
    }
  };

  const fetchCotizacion = async () => {
    try {
      const response = await axiosConfig.get(`/cotizaciones/${id}`);
      // Reset form with fetched data
      // Implementation would go here
    } catch (error) {
      setError('Error cargando la cotización');
    }
  };

  const calcularTotales = () => {
    const subtotal = watchedProductos.reduce((sum, producto) => {
      // Usar subtotal calculado o calcular según tipo de producto
      if (producto.subtotal) {
        return sum + producto.subtotal;
      }
      
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
      cristal: '',
      medidas: {
        ancho: 0,
        alto: 0,
        area: 0
      },
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    });
  };

  // Función para obtener datos del levantamiento
  const fetchLevantamientoData = async () => {
    const selectedProspecto = prospectoId || watchedProspecto;
    if (!selectedProspecto) {
      setError('No hay prospecto seleccionado');
      return;
    }

    try {
      setLoading(true);
      // Obtener etapas del prospecto usando el mismo endpoint que funciona en ProspectoDetalle
      const { data } = await axiosConfig.get(`/etapas?prospectoId=${selectedProspecto}`);
      const etapas = data.etapas || [];
      
      console.log('Etapas encontradas:', etapas);
      
      // Inspeccionar cada etapa en detalle
      etapas.forEach((etapa, index) => {
        console.log(`Etapa ${index}:`, {
          nombreEtapa: etapa.nombreEtapa,
          piezas: etapa.piezas,
          tienePiezas: etapa.piezas && etapa.piezas.length > 0,
          estructura: etapa
        });
      });
      
      // Buscar etapa de levantamiento - búsqueda más amplia
      const levantamiento = etapas.find(etapa => {
        // Verificar si tiene piezas
        const tienePiezas = etapa.piezas && etapa.piezas.length > 0;
        
        // Buscar por nombres comunes de etapas de levantamiento
        const esLevantamiento = etapa.nombreEtapa && (
          etapa.nombreEtapa.toLowerCase().includes('visita') ||
          etapa.nombreEtapa.toLowerCase().includes('medición') ||
          etapa.nombreEtapa.toLowerCase().includes('levantamiento') ||
          etapa.nombreEtapa.toLowerCase().includes('técnico') ||
          etapa.nombreEtapa === 'Visita Inicial / Medición' ||
          etapa.nombreEtapa === 'Levantamiento Técnico'
        );
        
        console.log(`Etapa "${etapa.nombreEtapa}":`, { tienePiezas, esLevantamiento, piezasData: etapa.piezas });
        
        return tienePiezas && esLevantamiento;
      });

      // Si no encuentra por nombre, buscar cualquier etapa que tenga piezas en cualquier propiedad
      const etapaConPiezas = !levantamiento ? etapas.find(etapa => {
        // Buscar piezas en diferentes propiedades posibles
        const tienePiezasNormal = etapa.piezas && etapa.piezas.length > 0;
        const tienePiezasData = etapa.data && etapa.data.piezas && etapa.data.piezas.length > 0;
        const tienePartidas = etapa.partidas && etapa.partidas.length > 0;
        const tieneMedidas = etapa.medidas && etapa.medidas.length > 0;
        
        console.log(`Buscando piezas en "${etapa.nombreEtapa}":`, {
          tienePiezasNormal,
          tienePiezasData, 
          tienePartidas,
          tieneMedidas,
          propiedades: Object.keys(etapa)
        });
        
        return tienePiezasNormal || tienePiezasData || tienePartidas || tieneMedidas;
      }) : null;

      const etapaFinal = levantamiento || etapaConPiezas;

      if (etapaFinal) {
        console.log('Etapa seleccionada para importar:', etapaFinal);
        
        // Normalizar la estructura de datos si es necesario
        if (!etapaFinal.piezas && etapaFinal.data && etapaFinal.data.piezas) {
          etapaFinal.piezas = etapaFinal.data.piezas;
        } else if (!etapaFinal.piezas && etapaFinal.partidas) {
          etapaFinal.piezas = etapaFinal.partidas;
        } else if (!etapaFinal.piezas && etapaFinal.medidas) {
          etapaFinal.piezas = etapaFinal.medidas;
        }
        
        // ELIMINAR DUPLICADOS EN LOS DATOS ORIGINALES
        const piezasUnicasOriginales = etapaFinal.piezas.filter((pieza, index, array) => {
          const esPrimera = array.findIndex(p => 
            p.ubicacion === pieza.ubicacion && 
            (p.producto === pieza.producto || p.productoLabel === pieza.productoLabel)
          ) === index;
          
          if (!esPrimera) {
            console.log(`Eliminando pieza duplicada en origen: ${pieza.ubicacion} - ${pieza.producto || pieza.productoLabel}`);
          }
          
          return esPrimera;
        });
        
        console.log(`Piezas originales: ${etapaFinal.piezas.length}, Piezas únicas: ${piezasUnicasOriginales.length}`);
        
        // Actualizar con piezas únicas
        etapaFinal.piezas = piezasUnicasOriginales;
        
        setLevantamientoData(etapaFinal);
        setShowImportModal(true);
      } else {
        console.log('No se encontraron etapas con piezas');
        setError(`No se encontró levantamiento técnico para este prospecto. Etapas disponibles: ${etapas.map(e => `${e.nombreEtapa} (propiedades: ${Object.keys(e).join(', ')})`).join(' | ')}`);
      }
    } catch (err) {
      setError('Error al obtener datos del levantamiento: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Función para importar partidas del levantamiento
  const importarPartidas = (partidasSeleccionadas) => {
    if (!levantamientoData || !partidasSeleccionadas.length) return;

    console.log('Partidas seleccionadas para importar:', partidasSeleccionadas);
    console.log('Cantidad de partidas:', partidasSeleccionadas.length);

    // ELIMINAR DUPLICADOS por ubicación y producto
    const partidasUnicas = partidasSeleccionadas.filter((partida, index, array) => {
      const esPrimera = array.findIndex(p => 
        p.ubicacion === partida.ubicacion && 
        (p.producto === partida.producto || p.productoLabel === partida.productoLabel)
      ) === index;
      
      if (!esPrimera) {
        console.log(`Eliminando duplicado: ${partida.ubicacion} - ${partida.producto || partida.productoLabel}`);
      }
      
      return esPrimera;
    });

    console.log('Partidas después de eliminar duplicados:', partidasUnicas.length);

    partidasUnicas.forEach((pieza, idx) => {
      console.log(`Importando partida ${idx + 1}:`, pieza);
      // Calcular área total de la pieza
      let areaTotal = 0;
      let medidaRepresentativa = { ancho: 0, alto: 0 };

      if (pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0) {
        // Formato nuevo: sumar áreas individuales
        areaTotal = pieza.medidas.reduce((sum, medida) => {
          return sum + ((medida.ancho || 0) * (medida.alto || 0));
        }, 0);
        // Usar primera medida como representativa
        medidaRepresentativa = {
          ancho: pieza.medidas[0].ancho || 0,
          alto: pieza.medidas[0].alto || 0
        };
      } else {
        // Formato anterior
        const ancho = pieza.ancho || 0;
        const alto = pieza.alto || 0;
        const cantidad = pieza.cantidad || 1;
        areaTotal = ancho * alto * cantidad;
        medidaRepresentativa = { ancho, alto };
      }

      // Agregar producto a la cotización
      const productoImportado = {
        nombre: pieza.productoLabel || pieza.producto || 'Producto importado',
        descripcion: pieza.ubicacion || 'Sin ubicación especificada',
        descripcionProducto: '', // Se puede generar después con IA
        categoria: 'ventana', // Por defecto
        material: pieza.producto || '',
        color: pieza.color || '',
        cristal: '',
        medidas: {
          ancho: medidaRepresentativa.ancho,
          alto: medidaRepresentativa.alto,
          area: areaTotal
        },
        cantidad: pieza.medidas?.length || pieza.cantidad || 1,
        precioUnitario: pieza.precioM2 || 0,
        subtotal: areaTotal * (pieza.precioM2 || 0)
      };
      
      console.log(`Agregando producto ${idx + 1}:`, productoImportado);
      append(productoImportado);
    });

    setShowImportModal(false);
    setSuccess(`Se importaron ${partidasUnicas.length} partidas del levantamiento técnico (${partidasSeleccionadas.length - partidasUnicas.length} duplicados eliminados)`);
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

      const totales = calcularTotales();
      
      // Calcular subtotales de productos si no están calculados
      const productosConSubtotal = data.productos.map(producto => ({
        ...producto,
        subtotal: (producto.medidas?.area || 0) * (producto.precioUnitario || 0) * (producto.cantidad || 1)
      }));

      const cotizacionData = {
        prospectoId: data.prospecto, // Campo correcto para la API
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
        fechaEntregaEstimada: new Date(Date.now() + (data.tiempoFabricacion || 15) * 24 * 60 * 60 * 1000)
      };

      console.log('Enviando cotización:', cotizacionData);

      if (isEdit) {
        const response = await axiosConfig.put(`/cotizaciones/${id}`, cotizacionData);
        setSuccess('Cotización actualizada exitosamente');
        console.log('Cotización actualizada:', response.data);
      } else {
        const response = await axiosConfig.post('/cotizaciones', cotizacionData);
        setSuccess('Cotización creada exitosamente');
        console.log('Cotización creada:', response.data);
        setTimeout(() => navigate('/cotizaciones'), 2000);
      }
    } catch (error) {
      console.error('Error guardando cotización:', error);
      console.error('Response data:', error.response?.data);
      setError(error.response?.data?.message || 'Error guardando la cotización');
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

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
          onClick={() => navigate('/cotizaciones')}
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
                  rules={{ required: 'El prospecto es requerido' }}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Cliente *</InputLabel>
                      <Select {...field} label="Cliente *" error={!!errors.prospecto}>
                        {prospectos.map(prospecto => (
                          <MenuItem key={prospecto._id} value={prospecto._id}>
                            {prospecto.nombre} - {prospecto.telefono}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
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
                                const metrosLineales = producto.medidas?.area || 0;
                                return `${metrosLineales.toFixed(1)} m.l.`;
                              }
                              
                              // Productos por m²
                              const area = producto.medidas?.area || 0;
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
                                  fontSize: '1rem'
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
