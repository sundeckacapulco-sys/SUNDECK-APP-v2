import { useCallback, useMemo, useState } from 'react';
import { createEmptyPieza } from '../AgregarEtapaModal.constants';

const usePiezasManager = ({ unidad, todosLosProductos, precioGeneral, setErrorLocal }) => {
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
          precioM2: prev.precioM2 || ''
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

  const calcularMedidasProcesadas = useCallback((medidas, cantidad, productoFallback, productoLabelFallback) => (
    medidas.slice(0, cantidad).map((medida) => {
      const ancho = parseFloat(medida.ancho) || 0;
      const alto = parseFloat(medida.alto) || 0;
      const area = unidad === 'cm' ? (ancho * alto) / 10000 : ancho * alto;

      return {
        ancho,
        alto,
        area,
        producto: medida.producto || productoFallback,
        productoLabel: medida.productoLabel || productoLabelFallback,
        color: medida.color || 'Blanco',
        precioM2: medida.precioM2 || ''
      };
    })
  ), [unidad]);

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

    const nuevaPartida = {
      ...piezaForm,
      cantidad,
      medidas: medidasProcesadas,
      precioM2: parseFloat(piezaForm.precioM2) || precioGeneral,
      productoLabel: productoLabel || piezaForm.productoLabel,
      observaciones: `${piezaForm.observaciones ? `${piezaForm.observaciones} - ` : ''}Partida de ${cantidad} pieza${cantidad > 1 ? 's' : ''}`
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

      const mensaje = `✅ Se actualizó partida con ${cantidad} pieza${cantidad > 1 ? 's' : ''} en ${piezaForm.ubicacion}`;
      setErrorLocal('');
      setTimeout(() => {
        setErrorLocal(mensaje);
        setTimeout(() => setErrorLocal(''), 4000);
      }, 100);

      setEditandoPieza(false);
      setIndiceEditando(-1);
    } else {
      setPiezas(prev => [...prev, nuevaPartida]);

      const mensaje = `✅ Partida agregada: ${cantidad} pieza${cantidad > 1 ? 's' : ''} en ${piezaForm.ubicacion}. Puedes agregar más partidas o terminar.`;
      setErrorLocal('');
      setTimeout(() => {
        setErrorLocal(mensaje);
        setTimeout(() => setErrorLocal(''), 4000);
      }, 100);
    }

    setPiezaForm(createEmptyPieza());
    // Mantener el formulario abierto para agregar más partidas
    // setAgregandoPieza(false); // Comentado para permitir agregar múltiples partidas
  }, [
    calcularMedidasProcesadas,
    editandoPieza,
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
            precioM2: piezaAEditar.precioM2
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
        controlPrecio: piezaAEditar.controlPrecio || ''
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
    handleCancelarEdicion
  };
};

export default usePiezasManager;
