# Prompt Maestro para Validación Integral de PDFs

Utiliza las siguientes instrucciones detalladas para guiar a un agente en la ejecución de pruebas exhaustivas sobre cada PDF generado por la plataforma. Ajusta los nombres de archivos y rutas según el entorno específico.

---

**Objetivo General:**
Verificar que cada PDF generado cumpla con los requisitos de negocio, incluya todos los datos obligatorios y respete la estructura visual esperada.

**Contexto del Proceso:**
1. Identificar el módulo o flujo que produce el PDF (por ejemplo: cotizaciones, contratos, reportes de prospectos, etc.).
2. Recolectar los datos de entrada utilizados para la generación del PDF (valores numéricos, datos de cliente, productos seleccionados, descuentos, firmas, fechas, etc.).
3. Ejecutar el flujo completo que genera el PDF en un entorno de prueba controlado.

**Pasos del Agente:**
1. **Preparación del entorno**
   - Confirma que el repositorio esté actualizado y que las dependencias estén instaladas.
   - Anota la versión de la aplicación y la fecha/hora de la prueba.

2. **Generación de PDFs**
   - Ejecuta el flujo completo de negocio para producir el PDF.
   - Documenta la ruta y el nombre exacto del archivo generado.
   - Si se generan múltiples PDFs, repite estos pasos para cada uno.

3. **Checklist de Contenido Obligatorio**
   - **Datos de identificación:** nombre o razón social del cliente, RUT/ID, datos de contacto.
   - **Información del documento:** número o código único, fecha de emisión, vigencia.
   - **Detalle de productos/servicios:** descripción, SKU/código, cantidades, precios unitarios, descuentos aplicados.
   - **Totales calculados:** subtotal, impuestos, cargos adicionales, descuentos globales y total final.
   - **Firmas o validaciones:** firmas digitales, sellos, códigos QR u otros mecanismos de autenticación.
   - **Condiciones comerciales:** términos y condiciones, notas legales y cláusulas relevantes.
   - **Datos adicionales requeridos por el proceso:** campos específicos definidos por el negocio (por ejemplo, datos de instalación, plazos de entrega, responsables internos).

4. **Validaciones Visuales y de Formato**
   - Comprueba que el PDF respete la plantilla oficial (logos, colores corporativos, tipografías y orden de secciones).
   - Asegura que no existan textos truncados, tablas cortadas o elementos superpuestos.
   - Verifica la correcta paginación (número de páginas y numeración).

5. **Validaciones Técnicas**
   - Confirma que el PDF pueda abrirse en los visores estándar (Adobe Reader, navegadores modernos).
   - Revisa el tamaño del archivo y detecta posibles anomalías (archivos demasiado grandes o vacíos).
   - Si aplica, valida la presencia de metadatos (propiedades del documento, autoría, títulos).

6. **Comparación contra Casos de Referencia**
   - Contrasta el PDF con ejemplos aprobados previamente o con la documentación de negocio.
   - Documenta cualquier desviación, aunque sea mínima, indicando la sección afectada y el impacto esperado.

7. **Registro de Evidencias**
   - Guarda capturas de pantalla de las secciones clave del PDF.
   - Genera un informe de prueba que incluya: datos de entrada, pasos ejecutados, resultados observados, evidencias adjuntas y conclusiones.
   - Si se detectan defectos, clasifícalos por severidad y registra los pasos para reproducirlos.

8. **Pruebas de Regresión**
   - Si se implementan correcciones, repite el flujo para asegurar que los PDFs actualizados cumplen con todos los criterios.
   - Documenta la fecha y versión de cada reejecución.

9. **Checklist Final Antes de Cerrar la Prueba**
   - ¿Todos los campos obligatorios aparecen y contienen los valores correctos?
   - ¿Los cálculos y totales son exactos?
   - ¿La estética y estructura son consistentes con el diseño aprobado?
   - ¿Se documentaron todas las evidencias y resultados?

10. **Salida del Agente**
    - Entregar un informe final en formato Markdown o PDF que resuma: objetivo de la prueba, alcance, resultados, incidencias encontradas, evidencias y recomendaciones.
    - Incluir una sección de "Próximos pasos" indicando acciones sugeridas (por ejemplo, ajustes de datos, mejoras en plantilla o automatizaciones futuras).

**Notas Adicionales:**
- Mantén un registro de tiempo invertido en cada fase para estimar el esfuerzo de QA.
- Si el proceso genera PDFs en diferentes idiomas o monedas, repite la validación para cada variante.
- Cuando sea posible, automatiza las comparaciones de contenido mediante herramientas de comparación de PDFs o extracción de texto.

---

Utiliza este prompt como guía maestra para asegurar que las pruebas de PDFs sean consistentes, completas y alineadas con los requisitos del negocio.
