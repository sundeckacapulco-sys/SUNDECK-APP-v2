# Guía para la Creación y Mantenimiento de Scripts

Este documento establece las mejores prácticas para crear y organizar scripts de mantenimiento, migración y auditoría en el directorio `server/scripts/`.

## Filosofía

El directorio `server/scripts/` es la "caja de herramientas" del proyecto. Contiene código que **no** forma parte del flujo de la aplicación web (es decir, no son endpoints de API), pero que es crucial para tareas de desarrollo, mantenimiento, y administración.

Un script es apropiado cuando necesitas:
- Realizar una corrección de datos masiva (un "fix").
- Ejecutar una migración de esquema de base de datos.
- Cargar datos iniciales en el sistema (seeds).
- Realizar auditorías o generar reportes internos que no necesitan una UI.
- Probar o depurar una función específica de forma aislada.

## La Estructura de Carpetas

Para mantener el orden y la seguridad, todos los scripts **deben** residir en una de las siguientes carpetas:

- **`/migraciones`**
  - **Propósito:** Scripts de un solo uso que modifican datos de forma permanente. Son de alto riesgo.
  - **Ejemplos:** `corregir-totales-factura.js`, `actualizar-formato-telefonos.js`.
  - **¡NUNCA volver a ejecutar un script de migración que ya se corrió en producción!**

- **`/datos-iniciales`**
  - **Propósito:** Scripts para poblar la base de datos con datos fundamentales o de prueba.
  - **Ejemplos:** `crear-roles-permisos.js`, `seed-productos-demo.js`.

- **`/auditorias`**
  - **Propósito:** Scripts de **solo lectura**. Verifican la integridad de los datos, buscan inconsistencias o generan reportes sin modificar nada. Son seguros de ejecutar.
  - **Ejemplos:** `validar-pedidos-sin-cliente.js`, `contar-documentos-por-coleccion.js`.

- **`/mantenimiento`**
  - **Propósito:** Tareas operativas que se pueden ejecutar de forma recurrente.
  - **Ejemplos:** `generar-backup-db.js`, `limpiar-logs-antiguos.js`.

- **`/debug`**
  - **Propósito:** Scripts para pruebas manuales, depuración o para ejecutar una lógica muy específica en un entorno de desarrollo.
  - **Ejemplos:** `probar-generacion-pdf.js`, `test-calculo-inventario.js`.

## Cómo Crear un Nuevo Script: Guía Paso a Paso

1.  **Elige la Carpeta Correcta:** Antes de escribir una sola línea de código, decide: ¿Cuál es el propósito de mi script? ¿Modifica datos de forma irreversible? (`migraciones`). ¿Es de solo lectura? (`auditorias`). ¿Es para probar algo? (`debug`). Coloca tu archivo en el lugar correcto desde el principio.

2.  **Nombra tu Archivo Descriptivamente:** El nombre debe dejar claro qué hace el script.
    - **Mal:** `test.js`, `fix.js`, `script123.js`
    - **Bien:** `migrar-usuarios-a-nuevo-esquema.js`, `auditoria-facturas-duplicadas.js`

3.  **Usa la Plantilla Base:** **No uses `console.log`**. Utiliza siempre el logger y asegúrate de cerrar la conexión a la base de datos.

    ```javascript
    // server/scripts/mi-nuevo-script.js

    const mongoose = require('mongoose');
    const logger = require('../config/logger'); // Ajusta la ruta si es necesario
    const connectDB = require('../config/db'); // Ajusta la ruta

    // Importa los modelos que necesites
    // const Proyecto = require('../models/Proyecto');

    const run = async () => {
      try {
        logger.info('Iniciando script: [Descripción corta de lo que hace]...');

        // Tu lógica aquí
        // Ejemplo: const items = await Proyecto.find({ algunaCondicion: true });
        // logger.info(`Se encontraron ${items.length} para procesar.`);

        logger.info('Script completado exitosamente.');

      } catch (error) {
        logger.error({
          message: 'Error durante la ejecución del script.',
          error: error.message,
          stack: error.stack,
        });
      } finally {
        // ¡CRÍTICO! Asegúrate de que la conexión siempre se cierre.
        logger.info('Cerrando conexión con la base de datos.');
        await mongoose.disconnect();
      }
    };

    // Conectar a la DB y ejecutar
    connectDB().then(() => {
      run();
    });
    ```

4.  **Ejecuta tu Script:**
    ```bash
    node server/scripts/tu-carpeta/tu-script.js
    ```
