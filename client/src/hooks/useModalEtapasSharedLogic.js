import { useState, useEffect, useMemo } from 'react';
import { 
  mapearPiezaParaDocumento,
  crearResumenEconomico,
  crearInfoFacturacion,
  crearMetodoPago 
} from '../utils/cotizacionEnVivo';
import { calcularTotales as calcularTotalesUnificado } from '../services/calculosService';
import { normalizarParaBackend } from '../services/normalizacionService';
import { validarCompletitud } from '../services/validacionService';
import { esProductoMotorizable, esProductoToldo } from '../components/Prospectos/utils/piezaUtils';

/**
 * Hook compartido para la lógica de modales de etapas/medidas
 * Maneja piezas, validaciones, cálculos y estados comunes
 */
export const useModalEtapasSharedLogic = (config = {}) => {
  const {
    modo = 'prospecto', // 'prospecto' | 'proyecto'
    entidadId = null,
    onSaved = () => {},
    onError = () => {},
    incluirCotizacion = true,
    incluirPrecios = true
  } = config;

  // Estados principales
  const [piezas, setPiezas] = useState([]);
  const [comentarios, setComentarios] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estados para nueva pieza
  const [nuevaPieza, setNuevaPieza] = useState({
    ubicacion: '',
    producto: '',
    ancho: '',
    alto: '',
    cantidad: 1,
    color: '',
    telaMarca: '',
    observaciones: '',
    // Datos técnicos
    tipoControl: 'manual',
    orientacion: 'norte',
    tipoInstalacion: 'pared',
    eliminacion: 'no',
    risoAlto: '',
    risoBajo: '',
    sistema: 'guias',
    // Motorización
    motorizado: false,
    motorModelo: '',
    motorPrecio: '',
    controlModelo: '',
    controlPrecio: '',
    // Toldo
    esToldo: false,
    tipoToldo: '',
    kitModelo: '',
    kitPrecio: '',
    // Precios (solo si incluirPrecios = true)
    precio: incluirPrecios ? '' : 0,
    precioInstalacion: incluirPrecios ? '' : 0,
    // Fotos
    fotoUrls: []
  });

  const [mostrarFormularioPieza, setMostrarFormularioPieza] = useState(false);
  const [piezaEditandoIndex, setPiezaEditandoIndex] = useState(null);

  // Estados para cotización (solo si incluirCotizacion = true)
  const [precioGeneral, setPrecioGeneral] = useState(750);
  const [cobraInstalacion, setCobraInstalacion] = useState(false);
  const [precioInstalacion, setPrecioInstalacion] = useState('');
  const [precioInstalacionPorPieza, setPrecioInstalacionPorPieza] = useState('');
  const [tipoInstalacion, setTipoInstalacion] = useState('fijo');

  // Función para resetear nueva pieza
  const resetNuevaPieza = () => {
    setNuevaPieza({
      ubicacion: '',
      producto: '',
      ancho: '',
      alto: '',
      cantidad: 1,
      color: '',
      telaMarca: '',
      observaciones: '',
      tipoControl: 'manual',
      orientacion: 'norte',
      tipoInstalacion: 'pared',
      eliminacion: 'no',
      risoAlto: '',
      risoBajo: '',
      sistema: 'guias',
      motorizado: false,
      motorModelo: '',
      motorPrecio: '',
      controlModelo: '',
      controlPrecio: '',
      esToldo: false,
      tipoToldo: '',
      kitModelo: '',
      kitPrecio: '',
      precio: incluirPrecios ? '' : 0,
      precioInstalacion: incluirPrecios ? '' : 0,
      fotoUrls: []
    });
  };

  // Cálculos automáticos
  const calcularAreaPieza = (pieza) => {
    const ancho = parseFloat(pieza.ancho) || 0;
    const alto = parseFloat(pieza.alto) || 0;
    const cantidad = parseInt(pieza.cantidad) || 1;
    return (ancho * alto * cantidad).toFixed(2);
  };

  const calcularPrecioPieza = (pieza) => {
    if (!incluirPrecios) return 0;
    
    const area = parseFloat(calcularAreaPieza(pieza));
    const precioBase = parseFloat(pieza.precio) || precioGeneral;
    let total = area * precioBase;

    // Agregar precio de motor si está motorizado
    if (pieza.motorizado && pieza.motorPrecio) {
      total += parseFloat(pieza.motorPrecio) * parseInt(pieza.cantidad);
    }

    // Agregar precio de control si está motorizado
    if (pieza.motorizado && pieza.controlPrecio) {
      total += parseFloat(pieza.controlPrecio) * parseInt(pieza.cantidad);
    }

    // Agregar precio de kit si es toldo
    if (pieza.esToldo && pieza.kitPrecio) {
      total += parseFloat(pieza.kitPrecio) * parseInt(pieza.cantidad);
    }

    return total;
  };

  // Totales calculados
  const totales = useMemo(() => {
    const totalM2 = piezas.reduce((total, pieza) => {
      return total + parseFloat(calcularAreaPieza(pieza));
    }, 0);

    const totalPiezas = piezas.reduce((total, pieza) => {
      return total + parseInt(pieza.cantidad);
    }, 0);

    const subtotal = incluirPrecios ? piezas.reduce((total, pieza) => {
      return total + calcularPrecioPieza(pieza);
    }, 0) : 0;

    const costoInstalacion = incluirPrecios && cobraInstalacion ? (
      tipoInstalacion === 'fijo' 
        ? parseFloat(precioInstalacion) || 0
        : (parseFloat(precioInstalacionPorPieza) || 0) * totalPiezas
    ) : 0;

    const totalFinal = subtotal + costoInstalacion;

    return {
      totalM2: totalM2.toFixed(2),
      totalPiezas,
      subtotal: subtotal.toFixed(2),
      costoInstalacion: costoInstalacion.toFixed(2),
      totalFinal: totalFinal.toFixed(2)
    };
  }, [piezas, precioGeneral, cobraInstalacion, precioInstalacion, precioInstalacionPorPieza, tipoInstalacion, incluirPrecios]);

  // Validaciones
  const validarPieza = (pieza) => {
    const errores = [];
    
    if (!pieza.ubicacion.trim()) {
      errores.push('La ubicación es requerida');
    }
    
    if (!pieza.producto) {
      errores.push('El producto es requerido');
    }
    
    if (!pieza.ancho || isNaN(pieza.ancho) || parseFloat(pieza.ancho) <= 0) {
      errores.push('El ancho debe ser un número mayor a 0');
    }
    
    if (!pieza.alto || isNaN(pieza.alto) || parseFloat(pieza.alto) <= 0) {
      errores.push('El alto debe ser un número mayor a 0');
    }
    
    if (!pieza.cantidad || isNaN(pieza.cantidad) || parseInt(pieza.cantidad) <= 0) {
      errores.push('La cantidad debe ser un número mayor a 0');
    }

    // Validaciones específicas para precios si están habilitados
    if (incluirPrecios && pieza.precio && (isNaN(pieza.precio) || parseFloat(pieza.precio) < 0)) {
      errores.push('El precio debe ser un número válido');
    }
    
    return errores;
  };

  const validarFormularioCompleto = () => {
    if (piezas.length === 0) {
      return ['Debes agregar al menos una pieza'];
    }

    const erroresPiezas = [];
    piezas.forEach((pieza, index) => {
      const errores = validarPieza(pieza);
      if (errores.length > 0) {
        erroresPiezas.push(`Pieza ${index + 1}: ${errores.join(', ')}`);
      }
    });

    return erroresPiezas;
  };

  // Manejo de piezas
  const agregarPieza = () => {
    const errores = validarPieza(nuevaPieza);
    if (errores.length > 0) {
      setErrorLocal(errores.join(', '));
      return false;
    }

    if (piezaEditandoIndex !== null) {
      // Editando pieza existente
      const nuevasPiezas = [...piezas];
      nuevasPiezas[piezaEditandoIndex] = { ...nuevaPieza };
      setPiezas(nuevasPiezas);
      setPiezaEditandoIndex(null);
    } else {
      // Agregando nueva pieza
      setPiezas([...piezas, { ...nuevaPieza }]);
    }

    resetNuevaPieza();
    setMostrarFormularioPieza(false);
    setErrorLocal('');
    return true;
  };

  const editarPieza = (index) => {
    setNuevaPieza({ ...piezas[index] });
    setPiezaEditandoIndex(index);
    setMostrarFormularioPieza(true);
  };

  const eliminarPieza = (index) => {
    const nuevasPiezas = piezas.filter((_, i) => i !== index);
    setPiezas(nuevasPiezas);
  };

  const copiarPieza = (index) => {
    const piezaACopiar = { ...piezas[index] };
    piezaACopiar.ubicacion = `${piezaACopiar.ubicacion} (Copia)`;
    setNuevaPieza(piezaACopiar);
    setMostrarFormularioPieza(true);
  };

  // Funciones de utilidad
  const actualizarPrecioGeneral = (nuevoPrecio) => {
    setPrecioGeneral(nuevoPrecio);
    // Actualizar precio de piezas que no tienen precio específico
    const piezasActualizadas = piezas.map(pieza => ({
      ...pieza,
      precio: pieza.precio || nuevoPrecio
    }));
    setPiezas(piezasActualizadas);
  };

  const limpiarFormulario = () => {
    setPiezas([]);
    resetNuevaPieza();
    setComentarios('');
    setErrorLocal('');
    setMostrarFormularioPieza(false);
    setPiezaEditandoIndex(null);
    setGuardando(false);
  };

  // Preparar datos para envío
  const prepararDatosParaEnvio = () => {
    const piezasNormalizadas = piezas.map(pieza => ({
      ...pieza,
      area: calcularAreaPieza(pieza),
      ancho: parseFloat(pieza.ancho),
      alto: parseFloat(pieza.alto),
      cantidad: parseInt(pieza.cantidad),
      precio: incluirPrecios ? (parseFloat(pieza.precio) || precioGeneral) : 0,
      precioTotal: incluirPrecios ? calcularPrecioPieza(pieza) : 0,
      motorPrecio: pieza.motorPrecio ? parseFloat(pieza.motorPrecio) : null,
      controlPrecio: pieza.controlPrecio ? parseFloat(pieza.controlPrecio) : null,
      kitPrecio: pieza.kitPrecio ? parseFloat(pieza.kitPrecio) : null
    }));

    const datos = {
      entidadId,
      piezas: piezasNormalizadas,
      comentarios,
      totales,
      modo
    };

    // Agregar datos de cotización si están habilitados
    if (incluirCotizacion && incluirPrecios) {
      datos.cotizacion = {
        precioGeneral,
        cobraInstalacion,
        precioInstalacion: cobraInstalacion ? (
          tipoInstalacion === 'fijo' 
            ? parseFloat(precioInstalacion) || 0
            : parseFloat(precioInstalacionPorPieza) || 0
        ) : 0,
        tipoInstalacion
      };
    }

    return datos;
  };

  return {
    // Estados
    piezas,
    setPiezas,
    nuevaPieza,
    setNuevaPieza,
    comentarios,
    setComentarios,
    errorLocal,
    setErrorLocal,
    guardando,
    setGuardando,
    mostrarFormularioPieza,
    setMostrarFormularioPieza,
    piezaEditandoIndex,
    setPiezaEditandoIndex,
    
    // Estados de cotización
    precioGeneral,
    setPrecioGeneral,
    cobraInstalacion,
    setCobraInstalacion,
    precioInstalacion,
    setPrecioInstalacion,
    precioInstalacionPorPieza,
    setPrecioInstalacionPorPieza,
    tipoInstalacion,
    setTipoInstalacion,
    
    // Cálculos
    totales,
    calcularAreaPieza,
    calcularPrecioPieza,
    
    // Validaciones
    validarPieza,
    validarFormularioCompleto,
    
    // Funciones de manejo
    agregarPieza,
    editarPieza,
    eliminarPieza,
    copiarPieza,
    resetNuevaPieza,
    actualizarPrecioGeneral,
    limpiarFormulario,
    prepararDatosParaEnvio,
    
    // Configuración
    config: {
      modo,
      incluirCotizacion,
      incluirPrecios
    }
  };
};
