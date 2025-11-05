# 🔄 Instrucciones para Reiniciar el CRM

## ⚠️ IMPORTANTE: El error CORS persiste porque no has reiniciado el servidor

El error que ves:
```
Method PATCH is not allowed by Access-Control-Allow-Methods
```

**Causa:** Los cambios en `server/index.js` no se aplican hasta que reinicies el servidor backend.

---

## 📋 Pasos para Solucionar y Limpiar

### Paso 1: Detener el Servidor Backend

En la terminal donde está corriendo el servidor (puerto 5001):

```bash
# Presionar Ctrl+C para detener el servidor
```

### Paso 2: Limpiar la Base de Datos (Opcional)

Si quieres empezar desde cero sin proyectos/prospectos:

```bash
cd server
node scripts/limpiarBaseDatos.js
```

**Esto eliminará:**
- ✅ Todos los proyectos
- ✅ Todos los prospectos
- ✅ Todas las cotizaciones
- ✅ Todos los pedidos
- ✅ Todas las órdenes de fabricación
- ✅ Todas las instalaciones

**NO eliminará:**
- ❌ Usuarios (se conservan)
- ❌ Configuraciones del sistema

### Paso 3: Reiniciar el Servidor Backend

```bash
# Asegúrate de estar en la carpeta server
cd server

# Iniciar el servidor
npm start
```

**Deberías ver:**
```
✅ Conectado a MongoDB exitosamente
✅ CORS configurado en modo desarrollo { allowAll: true }
✅ Servidor iniciado exitosamente { port: 5001, environment: 'development' }
```

### Paso 4: Refrescar el Frontend

En el navegador:
```
Presionar F5 o Ctrl+R
```

### Paso 5: Probar el Cambio de Estado

1. Crear un nuevo proyecto o abrir uno existente
2. Click en menú (⋮) → "Cambiar Estado"
3. Seleccionar un nuevo estado
4. Click en "Cambiar Estado"
5. ✅ Debería funcionar sin errores CORS

---

## 🐛 Si el Error Persiste

### Verificar que el servidor se reinició correctamente:

1. **Revisar la consola del servidor** - Debe mostrar:
   ```
   CORS configurado en modo desarrollo
   ```

2. **Verificar el puerto** - Debe estar en 5001:
   ```
   Servidor iniciado exitosamente { port: 5001 }
   ```

3. **Limpiar caché del navegador:**
   - Chrome: Ctrl+Shift+Delete → Borrar caché
   - O abrir en modo incógnito: Ctrl+Shift+N

4. **Verificar que los cambios se aplicaron:**
   ```bash
   # En la carpeta server
   grep -n "PATCH" index.js
   ```
   
   Debería mostrar:
   ```
   43:    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
   66:    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
   ```

---

## 📊 Verificación de Funcionamiento

### En la consola del navegador (F12):

**Antes (ERROR):**
```
❌ Access to XMLHttpRequest blocked by CORS policy
❌ Method PATCH is not allowed
```

**Después (CORRECTO):**
```
✅ PATCH http://localhost:5001/api/proyectos/:id/estado 200 OK
✅ Estado del proyecto cambiado exitosamente
```

### En la consola del servidor:

**Debe mostrar:**
```
Enviando notificación de aprobación de pedido
Notificación WhatsApp registrada
Notificación por correo registrada
Notificación de aprobación enviada exitosamente
```

---

## 🎯 Resumen Rápido

```bash
# 1. Detener servidor
Ctrl+C

# 2. (Opcional) Limpiar base de datos
cd server
node scripts/limpiarBaseDatos.js

# 3. Reiniciar servidor
npm start

# 4. Refrescar navegador
F5
```

---

## 🔍 Comandos de Diagnóstico

### Verificar que MongoDB está corriendo:
```bash
# Windows
tasklist | findstr mongod

# Linux/Mac
ps aux | grep mongod
```

### Verificar que el puerto 5001 está libre:
```bash
# Windows
netstat -ano | findstr :5001

# Linux/Mac
lsof -i :5001
```

### Ver logs del servidor en tiempo real:
```bash
cd server
npm start
# Los logs aparecerán en la consola
```

---

## 💡 Notas Importantes

1. **Los cambios en `server/index.js` requieren reinicio del servidor**
2. **Los cambios en el frontend (React) se aplican automáticamente con hot reload**
3. **Si limpias la base de datos, necesitarás crear nuevos proyectos**
4. **Los usuarios NO se eliminan al limpiar la base de datos**

---

## 🆘 Soporte

Si después de seguir estos pasos el error persiste:

1. Verifica que el servidor se reinició correctamente
2. Revisa los logs del servidor en la consola
3. Abre las DevTools del navegador (F12) y revisa la pestaña Network
4. Verifica que la petición PATCH se esté enviando correctamente

---

**Última actualización:** 4 de noviembre de 2025  
**Versión:** 1.0.0
