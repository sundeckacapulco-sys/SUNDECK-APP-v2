# 🚀 CONTINUAR AQUÍ - Fase 2: Pruebas Unitarias Básicas

**Última actualización:** 1 Noviembre 2025 - 08:51  
**Estado:** Fase 2 EN PROGRESO (25%)  
**Próxima tarea:** Crear tests unitarios para módulos críticos

---

## ✅ LO COMPLETADO HASTA AHORA

### Fase 1: Unificación de Modelos ✅ (100%)
- ✅ Modelo Proyecto.js unificado
- ✅ 4 endpoints funcionales
- ✅ Services actualizados
- ✅ Scripts de migración
- ✅ Modelos legacy deprecados

### Fase 2: Bloqueante #1 ✅ (100%)
- ✅ `fabricacionController.js` creado (346 líneas)
- ✅ Routes simplificadas (365 → 37 líneas)
- ✅ 5/5 tests pasando
- ✅ Logging estructurado

**Progreso Fase 2:** 25% completado

---

## 📋 PRÓXIMA SESIÓN: Pruebas Unitarias Básicas

### Objetivo
Crear tests unitarios para módulos críticos sin cobertura actual.

---

## 🎯 MÓDULOS PRIORITARIOS

### 1. PDF Generator ⚠️ ALTA PRIORIDAD
**Archivo:** `server/utils/pdfGenerator.js`  
**Problema:** 0% cobertura  
**Impacto:** Generación de cotizaciones, órdenes, reportes

### 2. Excel Generator ⚠️ ALTA PRIORIDAD
**Archivo:** `server/utils/excelGenerator.js`  
**Problema:** 0% cobertura  
**Impacto:** Exportación de datos, levantamientos

### 3. Pedido Controller ⚠️ MEDIA PRIORIDAD
**Archivo:** `server/controllers/pedidoController.js`  
**Problema:** 0% cobertura  
**Impacto:** Flujo completo de pedidos

---

## 📝 TAREA 1: Tests para PDF Generator

### Crear: `server/tests/utils/pdfGenerator.test.js`

```javascript
const pdfGenerator = require('../../utils/pdfGenerator');

// Mock de dependencias
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    end: jest.fn()
  }));
});

describe('PDF Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarCotizacion', () => {
    test('debe generar PDF de cotización con datos válidos', async () => {
      const mockCotizacion = {
        numero: 'COT-2025-001',
        fecha: new Date(),
        cliente: {
          nombre: 'Cliente Test',
          telefono: '1234567890',
          direccion: 'Calle Test 123'
        },
        productos: [
          {
            nombre: 'Persiana',
            cantidad: 2,
            precio_unitario: 1000,
            subtotal: 2000
          }
        ],
        subtotal: 2000,
        iva: 320,
        total: 2320
      };

      const result = await pdfGenerator.generarCotizacion(mockCotizacion);
      
      expect(result).toBeDefined();
      // Verificar que se llamaron los métodos esperados
    });

    test('debe manejar cotización sin productos', async () => {
      const mockCotizacion = {
        numero: 'COT-2025-002',
        cliente: { nombre: 'Cliente Test' },
        productos: [],
        total: 0
      };

      const result = await pdfGenerator.generarCotizacion(mockCotizacion);
      expect(result).toBeDefined();
    });

    test('debe lanzar error si falta número de cotización', async () => {
      const mockCotizacion = {
        cliente: { nombre: 'Cliente Test' }
      };

      await expect(pdfGenerator.generarCotizacion(mockCotizacion))
        .rejects.toThrow();
    });
  });

  describe('generarOrdenFabricacion', () => {
    test('debe generar PDF de orden de fabricación', async () => {
      const mockOrden = {
        numero: 'OF-2025-001',
        pedido: { numero: 'PED-001' },
        productos: [
          {
            nombre: 'Persiana',
            medidas: { ancho: 2.5, alto: 1.8 },
            especificacionesTecnicas: {}
          }
        ]
      };

      const result = await pdfGenerator.generarOrdenFabricacion(mockOrden);
      expect(result).toBeDefined();
    });
  });

  describe('generarOrdenInstalacion', () => {
    test('debe generar PDF de orden de instalación', async () => {
      const mockOrden = {
        numeroOrden: 'OI-2025-001',
        proyecto: { numero: 'PROJ-001' },
        productosInstalar: [],
        programacion: {
          fechaProgramada: new Date(),
          cuadrilla: []
        }
      };

      const result = await pdfGenerator.generarOrdenInstalacion(mockOrden);
      expect(result).toBeDefined();
    });
  });
});
```

### Duración Estimada: 2-3 horas

---

## 📝 TAREA 2: Tests para Excel Generator

### Crear: `server/tests/utils/excelGenerator.test.js`

```javascript
const excelGenerator = require('../../utils/excelGenerator');

// Mock de ExcelJS
jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue({
        columns: [],
        addRow: jest.fn(),
        getRow: jest.fn().mockReturnValue({
          font: {},
          fill: {},
          alignment: {}
        })
      }),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('test'))
      }
    }))
  };
});

describe('Excel Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generarLevantamiento', () => {
    test('debe generar Excel de levantamiento con datos válidos', async () => {
      const mockDatos = {
        proyecto: 'PROJ-001',
        cliente: 'Cliente Test',
        medidas: [
          {
            ubicacion: 'Sala',
            ancho: 2.5,
            alto: 1.8,
            producto: 'Persiana'
          }
        ]
      };

      const result = await excelGenerator.generarLevantamiento(mockDatos);
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    test('debe manejar levantamiento sin medidas', async () => {
      const mockDatos = {
        proyecto: 'PROJ-002',
        medidas: []
      };

      const result = await excelGenerator.generarLevantamiento(mockDatos);
      expect(result).toBeDefined();
    });
  });

  describe('exportarProyectos', () => {
    test('debe exportar lista de proyectos a Excel', async () => {
      const mockProyectos = [
        {
          numero: 'PROJ-001',
          cliente: { nombre: 'Cliente 1' },
          estado: 'activo',
          total: 5000
        },
        {
          numero: 'PROJ-002',
          cliente: { nombre: 'Cliente 2' },
          estado: 'completado',
          total: 3000
        }
      ];

      const result = await excelGenerator.exportarProyectos(mockProyectos);
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('exportarInventario', () => {
    test('debe exportar inventario a Excel', async () => {
      const mockInventario = [
        {
          codigo: 'MAT-001',
          nombre: 'Material Test',
          cantidad: 100,
          precio: 50
        }
      ];

      const result = await excelGenerator.exportarInventario(mockInventario);
      expect(result).toBeDefined();
    });
  });
});
```

### Duración Estimada: 2-3 horas

---

## 📝 TAREA 3: Tests para Pedido Controller

### Crear: `server/tests/controllers/pedidoController.test.js`

```javascript
// Mocks
jest.mock('../../models/Pedido');
jest.mock('../../models/Prospecto');
jest.mock('../../models/Cotizacion');
jest.mock('../../config/logger');

const Pedido = require('../../models/Pedido');
const pedidoController = require('../../controllers/pedidoController');

function crearRespuestaMock() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Pedido Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crearPedido', () => {
    test('debe crear pedido correctamente', async () => {
      const mockPedido = {
        _id: 'pedido123',
        numero: 'PED-001',
        save: jest.fn().mockResolvedValue(true)
      };

      Pedido.mockImplementation(() => mockPedido);

      const req = {
        body: {
          prospectoId: 'prospecto123',
          productos: [],
          total: 1000
        },
        usuario: { _id: 'usuario123' }
      };
      const res = crearRespuestaMock();

      await pedidoController.crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          pedido: expect.any(Object)
        })
      );
    });

    test('debe manejar errores al crear pedido', async () => {
      Pedido.mockImplementation(() => {
        throw new Error('Error de base de datos');
      });

      const req = { body: {}, usuario: { _id: 'usuario123' } };
      const res = crearRespuestaMock();

      await pedidoController.crearPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('obtenerPedidos', () => {
    test('debe obtener lista de pedidos', async () => {
      const mockPedidos = [
        { _id: '1', numero: 'PED-001' },
        { _id: '2', numero: 'PED-002' }
      ];

      Pedido.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPedidos)
      });

      const req = { query: {} };
      const res = crearRespuestaMock();

      await pedidoController.obtenerPedidos(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPedidos);
    });
  });

  describe('actualizarEstadoPedido', () => {
    test('debe actualizar estado de pedido', async () => {
      const mockPedido = {
        _id: 'pedido123',
        estado: 'pendiente',
        save: jest.fn().mockResolvedValue(true)
      };

      Pedido.findById = jest.fn().mockResolvedValue(mockPedido);

      const req = {
        params: { id: 'pedido123' },
        body: { estado: 'confirmado' },
        usuario: { _id: 'usuario123' }
      };
      const res = crearRespuestaMock();

      await pedidoController.actualizarEstadoPedido(req, res);

      expect(mockPedido.estado).toBe('confirmado');
      expect(mockPedido.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});
```

### Duración Estimada: 2-3 horas

---

## 📋 Checklist de Tareas

- [ ] **Tarea 1:** Tests para PDF Generator
  - [ ] Crear archivo de test
  - [ ] Configurar mocks de pdfkit
  - [ ] Test: generarCotizacion
  - [ ] Test: generarOrdenFabricacion
  - [ ] Test: generarOrdenInstalacion
  - [ ] Ejecutar y verificar

- [ ] **Tarea 2:** Tests para Excel Generator
  - [ ] Crear archivo de test
  - [ ] Configurar mocks de ExcelJS
  - [ ] Test: generarLevantamiento
  - [ ] Test: exportarProyectos
  - [ ] Test: exportarInventario
  - [ ] Ejecutar y verificar

- [ ] **Tarea 3:** Tests para Pedido Controller
  - [ ] Crear archivo de test
  - [ ] Configurar mocks de modelos
  - [ ] Test: crearPedido
  - [ ] Test: obtenerPedidos
  - [ ] Test: actualizarEstadoPedido
  - [ ] Ejecutar y verificar

- [ ] **Verificación Final:**
  - [ ] Ejecutar todos los tests: `npm test -- --runInBand`
  - [ ] Verificar cobertura aumentada
  - [ ] Actualizar AGENTS.md

---

## ⚠️ IMPORTANTE

### Estrategia de Testing
1. **Mockear dependencias externas** (pdfkit, ExcelJS, mongoose)
2. **Probar casos de éxito** primero
3. **Probar casos de error** después
4. **Verificar validaciones** de entrada

### Comandos Útiles

```bash
# Ejecutar tests específicos
npm test -- pdfGenerator.test.js
npm test -- excelGenerator.test.js
npm test -- pedidoController.test.js

# Ejecutar todos los tests
npm test -- --runInBand

# Ver cobertura
npm test -- --coverage
```

---

## 📚 ARCHIVOS DE REFERENCIA

### Ejemplo de Test Exitoso
- `server/tests/controllers/fabricacionController.test.js` - ✅ 5/5 pasando

### Documentación
- `AGENTS.md` - Estado general (Fase 2 al 25%)
- `RESUMEN_SESION_31_OCT_2025.md` - Contexto de Fase 1

### Código a Testear
- `server/utils/pdfGenerator.js` - PDF Generator
- `server/utils/excelGenerator.js` - Excel Generator
- `server/controllers/pedidoController.js` - Pedido Controller

---

## 📊 PROGRESO FASE 2

```
Bloqueante #1: Módulo Fabricación  ████████████████████ 100% ✅
Pruebas Unitarias Básicas          ░░░░░░░░░░░░░░░░░░░░   0% ⬅️ AQUÍ

Total: █████░░░░░░░░░░░░░░ 25%
```

---

**Responsable:** Próximo Agente  
**Duración estimada:** 1 día (6-9 horas)  
**Complejidad:** Media  
**Riesgo:** Bajo

**¡Listo para crear tests unitarios!** 🚀
