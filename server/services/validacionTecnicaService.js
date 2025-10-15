/**
 * Servicio de Validaciones Técnicas
 * 
 * Implementa "candados" que impiden avanzar etapas sin información técnica completa
 */

class ValidacionTecnicaService {
  
  /**
   * Campos técnicos obligatorios para diferentes tipos de productos
   */
  static CAMPOS_OBLIGATORIOS = {
    // Para TODOS los productos
    basicos: [
      'tipoControl',      // Manual/Motorizado/Micro
      'orientacion',      // IZQ/DER/Centro
      'tipoInstalacion',  // Techo/Pared/Empotrado/Exterior
      'eliminacion',      // Sí/No
      'risoAlto',         // Sí/No
      'risoBajo'          // Sí/No
    ],
    
    // Para productos motorizados
    motorizados: [
      'motorModelo',      // Somfy 25Nm, etc.
      'motorPrecio',      // Precio del motor
      'controlModelo',    // Monocanal/Multicanal
      'controlPrecio'     // Precio del control
    ],
    
    // Para toldos
    toldos: [
      'tipoToldo',        // Caída vertical/Proyección
      'kitModelo',        // Padova/Contempo/etc.
      'kitPrecio'         // Precio del kit
    ],
    
    // Para instalación
    instalacion: [
      'sistema',          // Día/Noche/Estándar/Doble
      'telaMarca',        // Screen 3%, Blackout Premium, etc.
      'baseTabla'         // Medidas específicas
    ]
  };

  /**
   * Valida si un producto tiene la información técnica completa
   */
  static validarProductoCompleto(producto) {
    const errores = [];
    const advertencias = [];
    
    // Validar campos básicos obligatorios
    // Primero buscar en el producto directamente, luego en medidas individuales
    for (const campo of this.CAMPOS_OBLIGATORIOS.basicos) {
      let campoEncontrado = this.validarCampo(producto, campo);
      
      // Si no está en el producto, buscar en medidas individuales
      if (!campoEncontrado && producto.medidas && Array.isArray(producto.medidas)) {
        campoEncontrado = producto.medidas.some(medida => this.validarCampo(medida, campo));
      }
      
      if (!campoEncontrado) {
        errores.push(`❌ Campo obligatorio faltante: ${this.getNombreCampo(campo)}`);
      }
    }
    
    // Validar campos específicos según tipo de producto
    if (producto.motorizado) {
      for (const campo of this.CAMPOS_OBLIGATORIOS.motorizados) {
        if (!this.validarCampo(producto, campo)) {
          errores.push(`❌ Motorización incompleta: ${this.getNombreCampo(campo)}`);
        }
      }
    }
    
    if (producto.esToldo) {
      for (const campo of this.CAMPOS_OBLIGATORIOS.toldos) {
        if (!this.validarCampo(producto, campo)) {
          errores.push(`❌ Información de toldo faltante: ${this.getNombreCampo(campo)}`);
        }
      }
    }
    
    // Validar información de instalación
    for (const campo of this.CAMPOS_OBLIGATORIOS.instalacion) {
      if (!this.validarCampo(producto, campo)) {
        advertencias.push(`⚠️ Información de instalación: ${this.getNombreCampo(campo)}`);
      }
    }
    
    // Validar medidas individuales si existen
    if (producto.medidas && Array.isArray(producto.medidas)) {
      producto.medidas.forEach((medida, index) => {
        if (!medida.ancho || !medida.alto) {
          errores.push(`❌ Medidas incompletas en pieza ${index + 1}`);
        }
        
        // Validar campos técnicos por medida individual
        for (const campo of this.CAMPOS_OBLIGATORIOS.basicos) {
          if (!this.validarCampo(medida, campo)) {
            advertencias.push(`⚠️ Pieza ${index + 1}: ${this.getNombreCampo(campo)}`);
          }
        }
      });
    }
    
    return {
      valido: errores.length === 0,
      errores,
      advertencias,
      completitud: this.calcularCompletitud(producto)
    };
  }

  /**
   * Valida si se puede avanzar a la siguiente etapa
   */
  static validarAvanceEtapa(productos, etapaDestino) {
    const validaciones = productos.map((producto, index) => ({
      indice: index,
      ubicacion: producto.ubicacion,
      ...this.validarProductoCompleto(producto)
    }));
    
    const productosInvalidos = validaciones.filter(v => !v.valido);
    const totalErrores = validaciones.reduce((total, v) => total + v.errores.length, 0);
    const totalAdvertencias = validaciones.reduce((total, v) => total + v.advertencias.length, 0);
    
    // Definir requisitos por etapa
    const requisitos = this.getRequisitosPorEtapa(etapaDestino);
    
    return {
      puedeAvanzar: productosInvalidos.length === 0 && this.cumpleRequisitos(validaciones, requisitos),
      etapaDestino,
      requisitos,
      resumen: {
        productosValidos: validaciones.length - productosInvalidos.length,
        productosInvalidos: productosInvalidos.length,
        totalErrores,
        totalAdvertencias,
        completitudPromedio: validaciones.reduce((sum, v) => sum + v.completitud, 0) / validaciones.length
      },
      detalleProductos: validaciones,
      mensajeCandado: productosInvalidos.length > 0 
        ? `🔒 No se puede avanzar a ${etapaDestino}. ${productosInvalidos.length} producto(s) con información incompleta.`
        : null
    };
  }

  /**
   * Genera orden de instalación con información técnica completa
   */
  static generarOrdenInstalacion(productos, datosAdicionales = {}) {
    const validacion = this.validarAvanceEtapa(productos, 'instalacion');
    
    if (!validacion.puedeAvanzar) {
      throw new Error(`No se puede generar orden de instalación: ${validacion.mensajeCandado}`);
    }
    
    const ordenInstalacion = {
      // Información del cliente
      cliente: datosAdicionales.cliente || {},
      
      // Información técnica detallada por producto
      productosInstalacion: productos.map((producto, index) => {
        const validacionProducto = this.validarProductoCompleto(producto);
        
        return {
          // Identificación
          indice: index + 1,
          ubicacion: producto.ubicacion,
          descripcion: `${producto.productoLabel || producto.nombre} - ${producto.color}`,
          
          // Medidas y especificaciones
          medidas: this.extraerMedidasParaInstalacion(producto),
          
          // Información técnica crítica para instalación
          especificacionesInstalacion: {
            tipoControl: producto.tipoControl,
            orientacion: producto.orientacion,
            tipoInstalacion: producto.tipoInstalacion,
            eliminacion: producto.eliminacion === 'si',
            risoAlto: producto.risoAlto === 'si',
            risoBajo: producto.risoBajo === 'si',
            sistema: producto.sistema,
            telaMarca: producto.telaMarca,
            baseTabla: producto.baseTabla
          },
          
          // Información de motorización (si aplica)
          motorizacion: producto.motorizado ? {
            motor: {
              modelo: producto.motorModelo,
              modeloManual: producto.motorModeloManual,
              precio: producto.motorPrecio
            },
            control: {
              modelo: producto.controlModelo,
              modeloManual: producto.controlModeloManual,
              precio: producto.controlPrecio,
              canales: this.getCanalesControl(producto.controlModelo)
            }
          } : null,
          
          // Información de toldo (si aplica)
          toldo: producto.esToldo ? {
            tipo: producto.tipoToldo,
            kit: {
              modelo: producto.kitModelo,
              modeloManual: producto.kitModeloManual,
              precio: producto.kitPrecio
            }
          } : null,
          
          // Observaciones específicas para instalación
          observacionesInstalacion: this.generarObservacionesInstalacion(producto),
          
          // Estado de validación
          validacion: validacionProducto
        };
      }),
      
      // Resumen técnico
      resumenTecnico: {
        totalProductos: productos.length,
        productosMotorizados: productos.filter(p => p.motorizado).length,
        toldos: productos.filter(p => p.esToldo).length,
        requierenR24: productos.filter(p => p.requiereR24 || p.ancho > 2.5 || p.alto > 2.5).length,
        tiposInstalacion: [...new Set(productos.map(p => p.tipoInstalacion))],
        sistemasEspeciales: [...new Set(productos.map(p => p.sistema).filter(Boolean))]
      },
      
      // Herramientas y materiales necesarios
      herramientasNecesarias: this.calcularHerramientasNecesarias(productos),
      
      // Tiempo estimado de instalación
      tiempoEstimado: this.calcularTiempoInstalacion(productos),
      
      // Validación general
      validacionGeneral: validacion
    };
    
    return ordenInstalacion;
  }

  // Métodos auxiliares
  static validarCampo(objeto, campo) {
    const valor = objeto[campo];
    return valor !== null && valor !== undefined && valor !== '' && valor !== 'no_especificado';
  }

  static getNombreCampo(campo) {
    const nombres = {
      tipoControl: 'Tipo de Control',
      orientacion: 'Orientación',
      tipoInstalacion: 'Tipo de Instalación',
      eliminacion: 'Eliminación',
      risoAlto: 'Riso Alto',
      risoBajo: 'Riso Bajo',
      sistema: 'Sistema',
      telaMarca: 'Tela/Marca',
      baseTabla: 'Base de Tabla',
      motorModelo: 'Modelo de Motor',
      motorPrecio: 'Precio del Motor',
      controlModelo: 'Modelo de Control',
      controlPrecio: 'Precio del Control',
      tipoToldo: 'Tipo de Toldo',
      kitModelo: 'Modelo de Kit',
      kitPrecio: 'Precio del Kit'
    };
    return nombres[campo] || campo;
  }

  static calcularCompletitud(producto) {
    let camposRequeridos = this.CAMPOS_OBLIGATORIOS.basicos.length;
    let camposCompletos = this.CAMPOS_OBLIGATORIOS.basicos.filter(campo => {
      // Buscar en producto directamente o en medidas individuales
      let encontrado = this.validarCampo(producto, campo);
      if (!encontrado && producto.medidas && Array.isArray(producto.medidas)) {
        encontrado = producto.medidas.some(medida => this.validarCampo(medida, campo));
      }
      return encontrado;
    }).length;
    
    if (producto.motorizado) {
      camposRequeridos += this.CAMPOS_OBLIGATORIOS.motorizados.length;
      camposCompletos += this.CAMPOS_OBLIGATORIOS.motorizados.filter(campo => 
        this.validarCampo(producto, campo)
      ).length;
    }
    
    if (producto.esToldo) {
      camposRequeridos += this.CAMPOS_OBLIGATORIOS.toldos.length;
      camposCompletos += this.CAMPOS_OBLIGATORIOS.toldos.filter(campo => 
        this.validarCampo(producto, campo)
      ).length;
    }
    
    return Math.round((camposCompletos / camposRequeridos) * 100);
  }

  static getRequisitosPorEtapa(etapa) {
    const requisitos = {
      cotizacion: {
        completitudMinima: 60,
        camposObligatorios: ['tipoControl', 'orientacion'],
        descripcion: 'Información básica para cotizar'
      },
      pedido: {
        completitudMinima: 80,
        camposObligatorios: ['tipoControl', 'orientacion', 'tipoInstalacion'],
        descripcion: 'Información técnica para fabricación'
      },
      produccion: {
        completitudMinima: 90,
        camposObligatorios: this.CAMPOS_OBLIGATORIOS.basicos,
        descripcion: 'Información completa para fabricar'
      },
      instalacion: {
        completitudMinima: 100,
        camposObligatorios: [...this.CAMPOS_OBLIGATORIOS.basicos, ...this.CAMPOS_OBLIGATORIOS.instalacion],
        descripcion: 'Información completa para instalar'
      }
    };
    
    return requisitos[etapa] || requisitos.cotizacion;
  }

  static cumpleRequisitos(validaciones, requisitos) {
    const completitudPromedio = validaciones.reduce((sum, v) => sum + v.completitud, 0) / validaciones.length;
    return completitudPromedio >= requisitos.completitudMinima;
  }

  static extraerMedidasParaInstalacion(producto) {
    if (producto.medidas && Array.isArray(producto.medidas)) {
      return producto.medidas.map((medida, index) => ({
        pieza: index + 1,
        ancho: medida.ancho,
        alto: medida.alto,
        area: medida.area || (medida.ancho * medida.alto),
        observaciones: medida.observaciones || ''
      }));
    }
    
    return [{
      pieza: 1,
      ancho: producto.ancho,
      alto: producto.alto,
      area: producto.area || (producto.ancho * producto.alto),
      observaciones: producto.observaciones || ''
    }];
  }

  static generarObservacionesInstalacion(producto) {
    const observaciones = [];
    
    if (producto.requiereR24 || producto.ancho > 2.5 || producto.alto > 2.5) {
      observaciones.push('⚠️ REQUIERE R24 - Medidas especiales');
    }
    
    if (producto.eliminacion === 'si') {
      observaciones.push('🗑️ Requiere eliminación de instalación anterior');
    }
    
    if (producto.risoAlto === 'si' || producto.risoBajo === 'si') {
      observaciones.push('📐 Instalación con risos especiales');
    }
    
    if (producto.tipoInstalacion === 'empotrado') {
      observaciones.push('🔨 Instalación empotrada - Requiere obra');
    }
    
    if (producto.motorizado) {
      observaciones.push(`⚡ Motorizado - ${producto.motorModelo} con control ${producto.controlModelo}`);
    }
    
    if (producto.esToldo) {
      observaciones.push(`☂️ Toldo ${producto.tipoToldo} - Kit ${producto.kitModelo}`);
    }
    
    if (producto.observaciones) {
      observaciones.push(`💬 Cliente: ${producto.observaciones}`);
    }
    
    return observaciones;
  }

  static calcularHerramientasNecesarias(productos) {
    const herramientas = new Set(['Taladro', 'Nivel', 'Metro', 'Destornilladores']);
    
    productos.forEach(producto => {
      if (producto.tipoInstalacion === 'techo') {
        herramientas.add('Escalera');
        herramientas.add('Detector de vigas');
      }
      
      if (producto.tipoInstalacion === 'empotrado') {
        herramientas.add('Amoladora');
        herramientas.add('Cincel');
      }
      
      if (producto.motorizado) {
        herramientas.add('Multímetro');
        herramientas.add('Conectores eléctricos');
      }
      
      if (producto.esToldo) {
        herramientas.add('Llave inglesa');
        herramientas.add('Tensor');
      }
    });
    
    return Array.from(herramientas);
  }

  static calcularTiempoInstalacion(productos) {
    let tiempoTotal = 0;
    
    productos.forEach(producto => {
      let tiempoProducto = 1; // Base: 1 hora
      
      if (producto.esToldo) tiempoProducto += 2;
      if (producto.motorizado) tiempoProducto += 1;
      if (producto.tipoInstalacion === 'empotrado') tiempoProducto += 2;
      if (producto.eliminacion === 'si') tiempoProducto += 0.5;
      
      tiempoTotal += tiempoProducto * (producto.cantidad || 1);
    });
    
    return {
      horas: Math.ceil(tiempoTotal),
      descripcion: tiempoTotal <= 4 ? 'Instalación de medio día' : 
                   tiempoTotal <= 8 ? 'Instalación de día completo' : 
                   'Instalación de múltiples días'
    };
  }

  static getCanalesControl(modeloControl) {
    const canales = {
      'monocanal': 1,
      'multicanal_4': 4,
      'multicanal_5': 5,
      'multicanal_15': 15
    };
    return canales[modeloControl] || 1;
  }
}

module.exports = ValidacionTecnicaService;
