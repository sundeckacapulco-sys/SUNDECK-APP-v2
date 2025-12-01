# 🧪 INSTRUCCIÓN — CREAR SANDBOX DE PROSPECTOS (Entorno de Pruebas)

**Proyecto:** SUNDECK CRM  
**Autor:** Dirección Técnica – David Rojas  
**Responsable técnico:** Agente Codex  
**Fecha:** 7 Noviembre 2025  
**Versión:** 1.0  

---

## 🎯 OBJETIVO

Implementar una interfaz **temporal y segura** para realizar **pruebas reales de flujo Prospecto → Proyecto**,  
permitiendo validar el comportamiento del backend sin depender del Dashboard final.

---

## 🧩 CONTEXTO

El backend del CRM ya cuenta con todos los endpoints y modelos actualizados,  
pero el frontend aún no tiene una vista comercial activa.  
Por ello se requiere una **vista sandbox** dentro del entorno React para crear, listar y convertir prospectos.

---

## ⚙️ FASE 1 — ESTRUCTURA DE ARCHIVOS

**Ubicación:**  
```
/client/src/sandbox/
```

**Archivos creados:**
- ✅ `ProspectoTest.jsx` → componente principal del sandbox  
- `index.js` → punto de montaje si se desea probar de forma independiente (opcional)

---

## ⚙️ FASE 2 — COMPONENTE PRINCIPAL

**Archivo:** `/client/src/sandbox/ProspectoTest.jsx` 

### Características implementadas:

1. **Creación de Prospectos:**
   - Input para nombre del cliente
   - Validación de campo requerido
   - Asignación automática de asesor comercial
   - Feedback visual de éxito/error

2. **Listado de Prospectos:**
   - Carga automática al montar componente
   - Botón de recarga manual
   - Visualización de estado comercial y tipo
   - Información de asesor e ID

3. **Conversión a Proyecto:**
   - Botón individual por prospecto
   - Deshabilitado si ya es proyecto
   - Actualización automática de lista
   - Manejo de errores

4. **UX Mejorada:**
   - Loading states
   - Mensajes de error claros
   - Diseño responsive
   - Colores diferenciados por estado
   - Información técnica de endpoints

---

## ⚙️ FASE 3 — MODO DE PRUEBA

### Opción A: Integración temporal en App.jsx

```jsx
import ProspectoTest from "./sandbox/ProspectoTest";

function App() {
  return (
    <div>
      {/* Sandbox temporal */}
      <ProspectoTest />
    </div>
  );
}

export default App;
```

### Opción B: Ruta dedicada

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProspectoTest from "./sandbox/ProspectoTest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sandbox/prospectos" element={<ProspectoTest />} />
        {/* ... otras rutas */}
      </Routes>
    </BrowserRouter>
  );
}
```

⚠️ **Nota:** Este sandbox es temporal.  
No se conectará al flujo productivo ni reemplazará vistas oficiales.

---

## 🧪 FASE 4 — PRUEBAS A REALIZAR

| Prueba | Descripción | Resultado esperado |
|--------|-------------|-------------------|
| **Crear Prospecto** | Llenar el input y presionar "Crear Prospecto" | Se crea registro tipo "prospecto" en Mongo |
| **Listar Prospectos** | Al cargar la página se muestra lista de prospectos | Coincide con `/api/prospectos` |
| **Convertir a Proyecto** | Clic en botón "Convertir a Proyecto" | Campo `tipo` cambia a "proyecto" y se actualiza vista |
| **Verificar Historial** | Revisar Mongo o dashboard → `historialEstados` actualizado | Registro de cambio automático |
| **Manejo de Errores** | Intentar crear sin nombre o con error de red | Mensaje de error visible |
| **Recarga Manual** | Clic en botón "🔄 Recargar" | Lista se actualiza con datos frescos |

---

## ⚙️ FASE 5 — VALIDACIÓN DE FUNCIONAMIENTO

### Endpoints usados:

```
POST   /api/proyectos
GET    /api/prospectos
POST   /api/prospectos/:id/convertir
```

### Campos observables:

- `tipo` → "prospecto" | "proyecto"
- `estadoComercial` → estado actual del prospecto
- `asesorComercial` → nombre del asesor asignado
- `historialEstados` → array con cambios de estado
- `cliente.nombre` → nombre del cliente

### Validaciones en consola:

```javascript
// Al crear prospecto
console.log("✅ Prospecto creado:", res.data);

// Al convertir
console.log("✅ Prospecto convertido a proyecto");

// Al cargar lista
console.log(`✅ ${res.data.length} prospectos cargados`);
```

---

## 🧾 RESULTADO FINAL

| Área | Estado esperado |
|------|----------------|
| Creación de prospectos | ✅ funcional |
| Listado dinámico | ✅ funcional |
| Conversión prospecto → proyecto | ✅ funcional |
| Middleware de auditoría (`historialEstados`) | ✅ registrando cambios |
| Base de datos | ✅ estable, sin conflictos |
| Manejo de errores | ✅ implementado |
| UX y feedback visual | ✅ implementado |

---

## 📋 COMMITS ESPERADOS

```bash
feat: crear sandbox de pruebas prospectos
add: componente ProspectoTest.jsx con UX mejorada
test: validación flujo prospecto → proyecto
docs: instrucción sandbox prospectos
```

---

## 🧠 OBSERVACIONES

1. **Evolución futura:**  
   Este sandbox puede evolucionar luego en el Dashboard de Ventas oficial.

2. **Validación temprana:**  
   Permite validar los flujos base antes de desplegar vistas productivas.

3. **Seguridad:**  
   Puede mantenerse oculto tras autenticación o ruta `/sandbox`.

4. **Temporal:**  
   Diseñado para ser removido una vez que el Dashboard oficial esté listo.

5. **Extensible:**  
   Fácil de expandir con más funcionalidades de prueba si es necesario.

---

## 🔍 VERIFICACIÓN DE ÉXITO

### Checklist de validación:

- [ ] Componente `ProspectoTest.jsx` creado en `/client/src/sandbox/`
- [ ] Interfaz carga correctamente sin errores de consola
- [ ] Se pueden crear prospectos con nombre válido
- [ ] Lista de prospectos se muestra correctamente
- [ ] Conversión a proyecto funciona
- [ ] Estados visuales (loading, error) funcionan
- [ ] Botón de recarga actualiza la lista
- [ ] Logs en consola muestran información correcta
- [ ] Base de datos refleja los cambios

### Comandos de verificación:

```bash
# Verificar que el archivo existe
ls client/src/sandbox/ProspectoTest.jsx

# Iniciar servidor de desarrollo
cd client
npm start

# Acceder a la ruta (según configuración)
# http://localhost:3000/sandbox/prospectos
```

---

**Versión:** 1.0  
**Estado:** ✅ Implementado e Integrado  
**Supervisión:** Dirección Técnica — David Rojas  
**Fecha de implementación:** 7 Noviembre 2025

---

## 🎉 INTEGRACIÓN COMPLETADA

### Archivos modificados:

1. **`client/src/App.js`**
   - ✅ Import agregado: `import ProspectoTest from './sandbox/ProspectoTest';`
   - ✅ Ruta agregada: `<Route path="/sandbox/prospectos" element={<ProspectoTest />} />`
   - ✅ Ubicación: Sección "SANDBOX - Entorno de pruebas (temporal)"

### Acceso al sandbox:

**URL:** `http://localhost:3000/sandbox/prospectos`

**Características:**
- ✅ Usa el mismo Layout de la aplicación
- ✅ Requiere autenticación (protegido por AuthContext)
- ✅ Integrado en el flujo normal de rutas
- ✅ No interfiere con otras funcionalidades
- ✅ Fácil de remover cuando ya no sea necesario

### Próximos pasos:

1. **Iniciar servidores:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start

   # Terminal 2 - Frontend
   cd client
   npm start
   ```

2. **Acceder al sandbox:**
   - Iniciar sesión en la aplicación
   - Navegar a: `http://localhost:3000/sandbox/prospectos`

3. **Realizar pruebas:**
   - Seguir checklist en: `/docs/proyectos/sandbox/verificacion_sandbox_prospectos.md`
   - Documentar resultados
   - Reportar cualquier problema

### Remoción futura:

Cuando el Dashboard oficial esté listo, remover:
1. Archivo: `client/src/sandbox/ProspectoTest.jsx`
2. Import en `App.js`: línea 28
3. Ruta en `App.js`: línea 72
4. Carpeta: `client/src/sandbox/`
