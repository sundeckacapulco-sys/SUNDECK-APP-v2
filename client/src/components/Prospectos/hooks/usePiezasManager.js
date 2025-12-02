import { useCallback, useMemo, useState } from 'react';
import { createEmptyPieza } from '../AgregarEtapaModal.constants';
import { calcularAreaCobrable } from '../../../utils/calculoAreaMinima';

const usePiezasManager = (params = {}) => {
  const {
    unidad = 'm',
    todosLosProductos = [],
    precioGeneral = 0,
    setErrorLocal = () => {}
  } = params;
  const [piezas, setPiezas] = useState([]);
  const [agregandoPieza, setAgregandoPieza] = useState(false);
  const [piezaForm, setPiezaForm] = useState(() => createEmptyPieza());
  const [editandoPieza, setEditandoPieza] = useState(false);
  const [indiceEditando, setIndiceEditando] = useState(-1);

  const resetPiezas = useCallback(() => {
    setPiezas([]);
    setPiezaForm(createEmptyPieza());
    setAgregandoPieza(false);
    setEditandoPieza(false);
    setIndiceEditando(-1);
  }, []);

  const sincronizarColores = useCallback(() => {
    setPiezaForm(prev => {
      if (!prev.medidas || prev.medidas.length === 0) {
        return prev;
      }

      const coloresUnicos = [...new Set(prev.medidas.map(medida => medida.color).filter(Boolean))];
      if (coloresUnicos.length === 1) {
        return { ...prev, color: coloresUnicos[0] };
      }

      if (coloresUnicos.length > 1) {
        return { ...prev, color: `Mixto (${coloresUnicos.join(', ')})` };
      }

      return prev;
    });
  }, []);

  const actualizarMedidas = useCallback((nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad, 10) || 1;

    setPiezaForm(prev => {
      const medidasActuales = prev.medidas || [];
      const nuevasMedidas = [];

      for (let i = 0; i < cantidad; i += 1) {
        nuevasMedidas.push(medidasActuales[i] || {
          ancho: '',
          alto: '',
          producto: prev.producto,
          productoLabel: prev.productoLabel,
          color: prev.color,
          precioM2: prev.precioM2 || '',
          sistema: [],
          sistemaEspecial: []
        });
      }

      return {
        ...prev,
        cantidad,
        medidas: nuevasMedidas
      };
    });
  }, []);

  const validarMedidas = useCallback((cantidad, medidas) => {
    for (let i = 0; i < cantidad; i += 1) {
      const medida = medidas[i];
      if (!medida || !medida.ancho || !medida.alto) {
        setErrorLocal(`Completa las medidas de la pieza ${i + 1}.`);
        return false;
      }
    }
    return true;
  }, [setErrorLocal]);

  const obtenerLabelProducto = useCallback((producto) => {
    const productoSeleccionado = todosLosProductos.find(p => p.value === producto);
    return productoSeleccionado ? productoSeleccionado.label : producto;
  }, [todosLosProductos]);

  /**
   * SISTEMA DÍA/NOCHE: Detecta si el producto es día/noche y duplica las medidas
   * Por cada medida se generan 2 piezas: una Blackout y una Malla/Screen
   */
  const esSistemaDiaNoche = useCallback((producto) => {
    return producto === 'dia_noche' || 
           producto === 'Sistema Día/Noche' ||
           (typeof producto === 'string' && producto.toLowerCase().includes('día/noche'));
  }, []);

  const calcularMedidasProcesadas = useCallback((medidas, cantidad, productoFallback, productoLabelFallback) => {
    const medidasBase = medidas.slice(0, cantidad).map((medida) => {
      const anchoRaw = parseFloat(medida.ancho) || 0;
      const altoRaw = parseFloat(medida.alto) || 0;
      
      // Convertir a metros si está en cm
      const anchoMetros = unidad === 'cm' ? anchoRaw / 100 : anchoRaw;
      const altoMetros = unidad === 'cm' ? altoRaw / 100 : altoRaw;
      
      // REGLA DE NEGOCIO: Mínimo 1m por dimensión para cobro
      const areaInfo = calcularAreaCobrable(anchoMetros, altoMetros);

      return {
        // CRÍTICO: Preservar TODOS los campos de la medida original
        ...medida,
        // Sobrescribir solo los campos calculados
        ancho: anchoMetros,
        alto: altoMetros,
        area: areaInfo.areaReal,           // Área real para mostrar
        areaCobrable: areaInfo.areaCobrable, // Área para cotizar (mín 1m por dimensión)
        anchoAjustado: areaInfo.anchoAjustado,
        altoAjustado: areaInfo.altoAjustado,
        tieneAjusteMinimo: areaInfo.tieneAjuste,
        producto: medida.producto || productoFallback,
        productoLabel: medida.productoLabel || productoLabelFallback,
        color: medida.color || 'Blanco',
        precioM2: medida.precioM2 || ''
      };
    });

    // SISTEMA DÍA/NOCHE: Duplicar cada medida para crear 2 piezas (Blackout + Malla)
    if (esSistemaDiaNoche(productoFallback)) {
      const medidasDuplicadas = [];
      medidasBase.forEach((medida, index) => {
        // Pieza 1: Blackout
        medidasDuplicadas.push({
          ...medida,
          tipoPiezaDiaNoche: 'blackout',
          observacionesTecnicas: `${medida.observacionesTecnicas || ''} [DÍA/NOCHE - BLACKOUT]`.trim(),
          numeroPiezaOriginal: index + 1
        });
        // Pieza 2: Malla/Screen
        medidasDuplicadas.push({
          ...medida,
          tipoPiezaDiaNoche: 'malla',
          observacionesTecnicas: `${medida.observacionesTecnicas || ''} [DÍA/NOCHE - MALLA]`.trim(),
          numeroPiezaOriginal: index + 1
        });
      });
      console.log('🌓 Sistema Día/Noche detectado: Duplicando medidas', {
        medidasOriginales: medidasBase.length,
        medidasDuplicadas: medidasDuplicadas.length
      });
      return medidasDuplicadas;
    }

    return medidasBase;
  }, [unidad, esSistemaDiaNoche]);

  const handleAgregarPieza = useCallback(() => {
    if (!piezaForm.ubicacion) {
      setErrorLocal('Completa la ubicación para agregar la partida.');
      return;
    }

    const cantidad = parseInt(piezaForm.cantidad, 10) || 1;
    if (cantidad < 1 || cantidad > 20) {
      setErrorLocal('La cantidad de piezas debe ser entre 1 y 20.');
      return;
    }

    const medidas = piezaForm.medidas || [];
    if (!validarMedidas(cantidad, medidas)) {
      return;
    }

    const productoLabel = obtenerLabelProducto(piezaForm.producto) || piezaForm.productoLabel;
    const medidasProcesadas = calcularMedidasProcesadas(
      medidas,
      cantidad,
      piezaForm.producto,
      productoLabel
    );

    // SISTEMA DÍA/NOCHE: Calcular cantidad real de piezas (duplicadas)
    const esDiaNoche = esSistemaDiaNoche(piezaForm.producto);
    const cantidadRealPiezas = esDiaNoche ? cantidad * 2 : cantidad;
    const observacionDiaNoche = esDiaNoche 
      ? ` [SISTEMA DÍA/NOCHE: ${cantidad} medida${cantidad > 1 ? 's' : ''} = ${cantidadRealPiezas} piezas (Blackout + Malla)]`
      : '';

    const nuevaPartida = {
      ...piezaForm,
      cantidad: cantidadRealPiezas, // Cantidad real incluyendo duplicados
      cantidadMedidasOriginales: cantidad, // Guardar cantidad original para referencia
      esSistemaDiaNoche: esDiaNoche,
      medidas: medidasProcesadas,
      precioM2: parseFloat(piezaForm.precioM2) || precioGeneral,
      productoLabel: productoLabel || piezaForm.productoLabel,
      observaciones: `${piezaForm.observaciones ? `${piezaForm.observaciones} - ` : ''}Partida de ${cantidadRealPiezas} pieza${cantidadRealPiezas > 1 ? 's' : ''}${observacionDiaNoche}`,
      // MOTORIZACIÓN: Preservar todos los campos de motorización
      motorizado: piezaForm.motorizado || false,
      motorModelo: piezaForm.motorModelo || '',
      motorModeloEspecificar: piezaForm.motorModeloEspecificar || '',
      motorPrecio: piezaForm.motorPrecio || '',
      numMotores: piezaForm.numMotores || 1,
      piezasPorMotor: piezaForm.piezasPorMotor || 1,
      controlModelo: piezaForm.controlModelo || '',
      controlPrecio: piezaForm.controlPrecio || '',
      esControlMulticanal: piezaForm.esControlMulticanal || false,
      piezasPorControl: piezaForm.piezasPorControl || 1,
      // INSTALACIÓN ESPECIAL: Preservar todos los campos de instalación
      cobraInstalacion: piezaForm.cobraInstalacion || false,
      tipoInstalacion: piezaForm.tipoInstalacion || 'fijo',
      precioInstalacion: piezaForm.precioInstalacion || '',
      precioInstalacionPorPieza: piezaForm.precioInstalacionPorPieza || '',
      observacionesInstalacion: piezaForm.observacionesInstalacion || ''
    };

    console.log('🔍 AGREGANDO PIEZA - piezaForm completo:', piezaForm);
    console.log('🔍 AGREGANDO PIEZA - medidasProcesadas:', medidasProcesadas);
    console.log('🔍 AGREGANDO PIEZA - nuevaPartida final:', nuevaPartida);

    if (editandoPieza && indiceEditando >= 0) {
      setPiezas(prev => {
        const nuevasPiezas = [...prev];
        nuevasPiezas[indiceEditando] = nuevaPartida;
        return nuevasPiezas;
      });

      const mensajeDiaNoche = esDiaNoche ? ` 🌓 (${cantidad} medida${cantidad > 1 ? 's' : ''} × 2 = ${cantidadRealPiezas} piezas Blackout+Malla)` : '';
      const mensaje = `✅ Se actualizó partida con ${cantidadRealPiezas} pieza${cantidadRealPiezas > 1 ? 's' : ''} en ${piezaForm.ubicacion}${mensajeDiaNoche}`;
      setErrorLocal('');
      setTimeout(() => {
        setErrorLocal(mensaje);
        setTimeout(() => setErrorLocal(''), 5000);
      }, 100);

      setEditandoPieza(false);
      setIndiceEditando(-1);
    } else {
      setPiezas(prev => [...prev, nuevaPartida]);

      const mensajeDiaNoche = esDiaNoche ? ` 🌓 Sistema Día/Noche: ${cantidad} medida${cantidad > 1 ? 's' : ''} × 2 = ${cantidadRealPiezas} piezas (Blackout + Malla)` : '';
      const mensaje = `✅ Partida agregada: ${cantidadRealPiezas} pieza${cantidadRealPiezas > 1 ? 's' : ''} en ${piezaForm.ubicacion}.${mensajeDiaNoche} Puedes agregar más partidas o terminar.`;
      setErrorLocal('');
      setTimeout(() => {
        setErrorLocal(mensaje);
        setTimeout(() => setErrorLocal(''), 5000);
      }, 100);
    }

    setPiezaForm(createEmptyPieza());
    // Mantener el formulario abierto para agregar más partidas
    // setAgregandoPieza(false); // Comentado para permitir agregar múltiples partidas
  }, [
    calcularMedidasProcesadas,
    editandoPieza,
    esSistemaDiaNoche,
    indiceEditando,
    obtenerLabelProducto,
    piezaForm,
    precioGeneral,
    setErrorLocal,
    validarMedidas
  ]);

  const handleEliminarPieza = useCallback((index) => {
    setPiezas(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleEditarPieza = useCallback((index) => {
    setPiezaForm(prev => {
      const piezaAEditar = piezas[index];
      if (!piezaAEditar) {
        return prev;
      }

      return {
        ubicacion: piezaAEditar.ubicacion,
        cantidad: piezaAEditar.cantidad || (piezaAEditar.medidas ? piezaAEditar.medidas.length : 1),
        medidas: piezaAEditar.medidas || [
          {
            ancho: piezaAEditar.ancho || '',
            alto: piezaAEditar.alto || '',
            producto: piezaAEditar.producto,
            productoLabel: piezaAEditar.productoLabel,
            color: piezaAEditar.color,
            precioM2: piezaAEditar.precioM2,
            sistema: piezaAEditar.sistema || [],
            sistemaEspecial: piezaAEditar.sistemaEspecial || []
          }
        ],
        producto: piezaAEditar.producto,
        productoLabel: piezaAEditar.productoLabel,
        color: piezaAEditar.color,
        precioM2: piezaAEditar.precioM2 || '',
        observaciones: piezaAEditar.observaciones || '',
        fotoUrls: piezaAEditar.fotoUrls || [],
        videoUrl: piezaAEditar.videoUrl || '',
        esToldo: piezaAEditar.esToldo || false,
        tipoToldo: piezaAEditar.tipoToldo || 'caida_vertical',
        kitModelo: piezaAEditar.kitModelo || '',
        kitModeloManual: piezaAEditar.kitModeloManual || '',
        kitPrecio: piezaAEditar.kitPrecio || '',
        motorizado: piezaAEditar.motorizado || false,
        motorModelo: piezaAEditar.motorModelo || '',
        motorModeloManual: piezaAEditar.motorModeloManual || '',
        motorPrecio: piezaAEditar.motorPrecio || '',
        controlModelo: piezaAEditar.controlModelo || '',
        controlModeloManual: piezaAEditar.controlModeloManual || '',
        controlPrecio: piezaAEditar.controlPrecio || '',
        sistema: piezaAEditar.sistema || [],
        sistemaEspecial: piezaAEditar.sistemaEspecial || []
      };
    });

    setIndiceEditando(index);
    setEditandoPieza(true);
    setAgregandoPieza(true);
  }, [piezas]);

  const handleCancelarEdicion = useCallback(() => {
    setEditandoPieza(false);
    setIndiceEditando(-1);
    setPiezaForm(createEmptyPieza());
  }, []);

  const estadoPiezas = useMemo(() => ({
    piezas,
    piezaForm,
    agregandoPieza,
    editandoPieza,
    indiceEditando
  }), [agregandoPieza, editandoPieza, indiceEditando, piezaForm, piezas]);

  const reemplazarPiezas = useCallback((nuevasPiezas) => {
    setPiezas(Array.isArray(nuevasPiezas) ? nuevasPiezas : []);
  }, []);

  return {
    ...estadoPiezas,
    setAgregandoPieza,
    setPiezaForm,
    reemplazarPiezas,
    resetPiezas,
    sincronizarColores,
    actualizarMedidas,
    handleAgregarPieza,
    handleEliminarPieza,
    handleEditarPieza,
    handleCancelarEdicion,
    // Utilidades
    esSistemaDiaNoche
  };
};

export default usePiezasManager;
