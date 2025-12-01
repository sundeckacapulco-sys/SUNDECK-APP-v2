# Guía Maestra de Documentación

Bienvenido a la documentación del proyecto Sundeck CRM. Este archivo es el punto de partida para entender la arquitectura, las decisiones y el historial del proyecto.

## 🗺️ ¿Por dónde empezar?

Si eres nuevo en el proyecto, te recomendamos leer los documentos en este orden:

1.  **`README.md` (en la raíz):** Te dará una visión general del proyecto y cómo ponerlo en marcha.
2.  **`SETUP.md` (en la raíz):** Instrucciones detalladas de instalación y configuración.
3.  **`CHANGELOG.md` (en la raíz):** Un historial de los cambios más importantes en el proyecto.
4.  **Este documento:** Para entender cómo se organiza el resto de la información.

## 📂 Estructura de la Documentación

La documentación está organizada en las siguientes carpetas:

### 📄 `/` (Directorio Raíz)

Contiene los archivos más críticos y de acceso frecuente.

-   `README.md`: Visión general y arranque rápido.
-   `SETUP.md`: Guía de instalación.
-   `CHANGELOG.md`: Historial de versiones y cambios.
-   `CONTINUAR_AQUI.md`: Apunta a la tarea actual en desarrollo. **¡Léelo si quieres saber en qué estamos trabajando ahora!**
-   `AGENTS.md`: Instrucciones para los agentes de IA que asisten en el desarrollo.

### 📚 `docs/`

Todo lo demás vive aquí, organizado por propósito.

-   **`/guides`**: 📖 **Guías y Tutoriales.** Si necesitas aprender a hacer algo específico, como probar una funcionalidad o depurar un problema, empieza aquí.
-   **`/specs`**: 📝 **Especificaciones y Análisis.** Contiene los requerimientos, análisis y detalles de implementación de las funcionalidades clave del sistema (la calculadora, los KPIs, etc.).
-   **`/audits`**: 🔍 **Auditorías y Calidad.** Documentos relacionados con la verificación y calidad del código, incluyendo checklists y resultados de auditorías pasadas.
-   **`/archive`**: 📦 **Archivo Histórico.** Documentos que ya no son relevantes para el día a día, pero que se conservan por su valor histórico (planes de trabajo pasados, resúmenes de tareas completadas, etc.).

### 🔨 `tools/`

Contiene scripts de utilidad para facilitar el desarrollo, como `kill-ports.bat` para liberar puertos.
