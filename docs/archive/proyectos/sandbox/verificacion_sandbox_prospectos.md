# ✅ VERIFICACIÓN — SANDBOX DE PROSPECTOS

**Proyecto:** SUNDECK CRM  
**Fecha:** 7 Noviembre 2025  
**Responsable:** David Rojas  
**Estado:** ⏳ Pendiente de pruebas

---

## 🎯 OBJETIVO DE LA VERIFICACIÓN

Validar que el sandbox de prospectos funciona correctamente y permite:
1. Crear prospectos desde la interfaz
2. Listar prospectos existentes
3. Convertir prospectos a proyectos
4. Verificar que el backend responde correctamente

---

## 📋 CHECKLIST DE VERIFICACIÓN

### ✅ FASE 1: Acceso al Sandbox

- [ ] **Iniciar servidor backend**
  ```bash
  cd server
  npm start
  # Debe iniciar en puerto 5001
  ```

- [ ] **Iniciar servidor frontend**
  ```bash
  cd client
  npm start
  # Debe iniciar en puerto 3000
  ```

- [ ] **Acceder a la ruta del sandbox**
  - URL: `http://localhost:3000/sandbox/prospectos`
  - Debe cargar sin errores de consola
  - Debe mostrar el banner amarillo "🧪 Sandbox Prospectos"

---

### ✅ FASE 2: Creación de Prospectos

- [ ] **Crear prospecto con nombre válido**
  - Ingresar nombre: "Cliente Prueba 1"
  - Click en "Crear Prospecto"
  - Debe aparecer en la lista inmediatamente
  - Consola debe mostrar: `✅ Prospecto creado: {...}`

- [ ] **Validación de campo vacío**
  - Dejar input vacío
  - Click en "Crear Prospecto"
  - Debe mostrar error: "El nombre del cliente es requerido"
  - No debe crear registro en BD

- [ ] **Crear múltiples prospectos**
  - Crear "Cliente Prueba 2"
  - Crear "Cliente Prueba 3"
  - Ambos deben aparecer en la lista
  - Contador debe mostrar: "Lista de Prospectos (3)"

---

### ✅ FASE 3: Listado de Prospectos

- [ ] **Carga automática**
  - Recargar página (F5)
  - Lista debe cargar automáticamente
  - Debe mostrar todos los prospectos creados

- [ ] **Información visible**
  - Cada prospecto debe mostrar:
    - ✅ Nombre del cliente
    - ✅ Badge azul con `estadoComercial`
    - ✅ Badge morado con `tipo: "prospecto"`
    - ✅ Asesor comercial: "Abigail"
    - ✅ ID del registro

- [ ] **Botón de recarga**
  - Click en "🔄 Recargar"
  - Lista debe actualizarse
  - Consola debe mostrar: `✅ X prospectos cargados`

---

### ✅ FASE 4: Conversión a Proyecto

- [ ] **Convertir primer prospecto**
  - Click en "Convertir a Proyecto" del primer prospecto
  - Debe cambiar badge morado a `tipo: "proyecto"`
  - Botón debe cambiar a "✅ Proyecto" (deshabilitado)
  - Consola debe mostrar: `✅ Prospecto convertido a proyecto`

- [ ] **Verificar que no se puede reconvertir**
  - Botón debe estar deshabilitado
  - Debe mostrar "✅ Proyecto"
  - No debe permitir click

- [ ] **Convertir segundo prospecto**
  - Repetir proceso con otro prospecto
  - Debe funcionar igual

---

### ✅ FASE 5: Verificación en Base de Datos

- [ ] **Abrir MongoDB Compass o terminal**
  ```bash
  mongosh
  use sundeck
  db.proyectos.find({ tipo: "prospecto" }).pretty()
  ```

- [ ] **Verificar campos creados**
  - ✅ `tipo: "prospecto"`
  - ✅ `cliente.nombre: "Cliente Prueba X"`
  - ✅ `asesorComercial: "Abigail"`
  - ✅ `estadoComercial` existe
  - ✅ `historialEstados` es un array

- [ ] **Verificar conversión**
  ```bash
  db.proyectos.find({ tipo: "proyecto" }).pretty()
  ```
  - ✅ `tipo` cambió a "proyecto"
  - ✅ `historialEstados` tiene registro del cambio

---

### ✅ FASE 6: Manejo de Errores

- [ ] **Simular error de red**
  - Detener servidor backend
  - Intentar crear prospecto
  - Debe mostrar mensaje de error rojo
  - No debe romper la interfaz

- [ ] **Reiniciar backend**
  - Iniciar servidor nuevamente
  - Click en "🔄 Recargar"
  - Lista debe cargar correctamente

---

## 🔍 ENDPOINTS VERIFICADOS

### POST /api/proyectos
```bash
# Crear prospecto
curl -X POST http://localhost:5001/api/proyectos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "prospecto",
    "cliente": { "nombre": "Test API" },
    "asesorComercial": "Abigail"
  }'
```

**Respuesta esperada:**
```json
{
  "_id": "...",
  "tipo": "prospecto",
  "cliente": { "nombre": "Test API" },
  "asesorComercial": "Abigail",
  "estadoComercial": "nuevo",
  "historialEstados": [...]
}
```

### GET /api/prospectos
```bash
# Listar prospectos
curl http://localhost:5001/api/prospectos
```

**Respuesta esperada:**
```json
[
  {
    "_id": "...",
    "tipo": "prospecto",
    "cliente": { "nombre": "..." },
    ...
  }
]
```

### POST /api/prospectos/:id/convertir
```bash
# Convertir a proyecto
curl -X POST http://localhost:5001/api/prospectos/[ID]/convertir
```

**Respuesta esperada:**
```json
{
  "message": "Prospecto convertido a proyecto exitosamente",
  "proyecto": {
    "_id": "...",
    "tipo": "proyecto",
    ...
  }
}
```

---

## 📊 RESULTADOS ESPERADOS

| Funcionalidad | Estado | Observaciones |
|---------------|--------|---------------|
| Acceso a ruta `/sandbox/prospectos` | ⏳ | |
| Creación de prospectos | ⏳ | |
| Validación de campos | ⏳ | |
| Listado automático | ⏳ | |
| Recarga manual | ⏳ | |
| Conversión a proyecto | ⏳ | |
| Manejo de errores | ⏳ | |
| Persistencia en BD | ⏳ | |
| Logs en consola | ⏳ | |

---

## 🐛 PROBLEMAS ENCONTRADOS Y RESUELTOS

### Problema 1: Token de autenticación no incluido
**Descripción:** El componente usaba `axios` directamente en lugar de `axiosConfig`  
**Solución:** Cambiado a `import axiosConfig from "../config/axios"`  
**Estado:** ✅ RESUELTO

### Problema 2: Campo teléfono faltante
**Descripción:** Backend requiere teléfono pero frontend no lo incluía  
**Solución:** Agregado campo de teléfono al formulario con validación  
**Estado:** ✅ RESUELTO

### Problema 3: Prospecto inválido en BD
**Descripción:** Se creó un prospecto sin nombre/teléfono antes de las correcciones  
**Solución:** Script `limpiarProspectosInvalidos.js` para limpiar datos inválidos  
**Estado:** ✅ RESUELTO - BD limpia  

---

## 📸 EVIDENCIAS

### Screenshot 1: Vista inicial del sandbox
*[Adjuntar captura]*

### Screenshot 2: Prospecto creado
*[Adjuntar captura]*

### Screenshot 3: Conversión a proyecto
*[Adjuntar captura]*

### Screenshot 4: Verificación en MongoDB
*[Adjuntar captura]*

---

## ✅ APROBACIÓN FINAL

- [ ] Todas las funcionalidades probadas
- [ ] Sin errores críticos
- [ ] Base de datos actualizada correctamente
- [ ] Logs funcionando
- [ ] Documentación actualizada

**Aprobado por:** ___________________  
**Fecha:** ___________________  
**Firma:** ___________________

---

## 🚀 PRÓXIMOS PASOS

Una vez verificado el sandbox:

1. **Documentar hallazgos** en este archivo
2. **Reportar bugs** si los hay
3. **Validar flujo completo** prospecto → proyecto
4. **Preparar integración** con Dashboard oficial
5. **Planear remoción** del sandbox una vez que el Dashboard esté listo

---

**Estado actual:** ⏳ Pendiente de verificación  
**Última actualización:** 7 Noviembre 2025  
**Responsable de pruebas:** David Rojas
