# 📦 MÓDULO DE ALMACÉN E INVENTARIO v1.0

**Fecha:** 25 Noviembre 2025  
**Estado:** ✅ IMPLEMENTADO  
**Integración:** Calculadora de Materiales, Producción

---

## 📋 DESCRIPCIÓN GENERAL

El módulo de Almacén centraliza la gestión de inventario de materia prima (Telas, Tubos, Mecanismos) y retazos reutilizables (Sobrantes). Permite un control preciso del stock, alertas de reabastecimiento y optimización de cortes.

---

## 🏗️ ARQUITECTURA TÉCNICA

### Modelos de Datos (MongoDB)

1.  **`Almacen` (Inventario Principal)**
    *   Catálogo de productos nuevos (Rollos completos, Barras, Piezas).
    *   Campos clave: `codigo`, `tipo`, `cantidad`, `unidad`, `ubicacion`, `costos`.
    *   Control: `stockMinimo`, `puntoReorden`.

2.  **`SobranteMaterial` (Retazos/Mermas Útiles)**
    *   Materiales sobrantes de producción que pueden reutilizarse.
    *   Campos clave: `longitud` (crítico para optimización), `etiqueta` (código único del retazo), `origenProyecto`.

3.  **`MovimientoAlmacen` (Historial)**
    *   Bitácora inmutable de todas las entradas, salidas y ajustes.

### Backend (API REST)

*   **Controller:** `server/controllers/almacenController.js`
*   **Rutas:** `server/routes/almacen.js` (Protegidas por Rol)
*   **Endpoints Clave:**
    *   `GET /inventario`: Listado con filtros.
    *   `GET /sobrantes`: Listado de retazos disponibles.
    *   `POST /material`: Creación de items (con validación de duplicados).
    *   `POST /simular-consumo`: "Prueba Rápida" conectada a Calculadora.

### Frontend (React)

*   **Componente Principal:** `client/src/modules/almacen/PanelAlmacen.jsx`
*   **Características UI:**
    *   **KPIs:** Tarjetas visuales con conteos y valor total.
    *   **Pestañas:** Separación clara entre "Inventario Completo", "Bajo Stock" y "Sobrantes".
    *   **CRUD:** Modales para crear, editar y eliminar materiales.
    *   **Búsqueda:** Filtrado por tipo y texto.

---

## 🚀 FUNCIONALIDADES CLAVE

### 1. Gestión de Inventario (CRUD)
*   Administradores y Gerentes pueden dar de alta nuevos materiales.
*   Validación automática de códigos duplicados (Error 400 amigable).
*   Edición completa de detalles (precios, ubicaciones).

### 2. Gestión de Sobrantes (Leftovers)
*   Pestaña dedicada para visualizar retazos.
*   Muestra la **Longitud** disponible de cada retazo, dato vital para saber si sirve para una nueva orden.
*   Identificación por etiqueta única (ej. `TEL-GEN-XYZ`).

### 3. Integración "Prueba Rápida"
*   El almacén alimenta el simulador de consumo.
*   Al cotizar una persiana, el sistema busca primero en **Sobrantes** compatibles.
*   Si encuentra uno, sugiere su uso y un descuento comercial.

---

## 📖 GUÍA DE USO

### Dar de Alta Material
1.  Ir a **Almacén** en el menú lateral.
2.  Clic en **"Nuevo Material"**.
3.  Llenar formulario (Código, Tipo, Descripción, Cantidad Inicial).
4.  Guardar.

### Consultar Sobrantes
1.  Ir a la pestaña **"Sobrantes"** (icono de tijeras ✂️).
2.  Verificar qué retazos están disponibles y sus longitudes.

### Ver Bajo Stock
1.  Ir a la pestaña **"Bajo Stock"**.
2.  Revisar ítems en rojo/amarillo que requieren compra inmediata.

---

## ✅ ESTADO ACTUAL

- ✅ **Modelo de Datos**: Completo y Relacionado.
- ✅ **API Backend**: Implementada y Segura.
- ✅ **Frontend**: Panel con Diseño Mejorado y Tabs.
- ✅ **Integración**: Conectado a Calculadora de Materiales.
- ✅ **Datos**: Catálogo base inicializado (Stock 0).

---

**Autor:** Equipo Sundeck  
**Versión:** 1.0
