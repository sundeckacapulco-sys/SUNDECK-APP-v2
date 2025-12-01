# 🔧 TROUBLESHOOTING - SUNDECK CRM

**Fecha:** 8 Noviembre 2025  
**Versión:** 1.0

---

## 🚨 PROBLEMA: "Error: listen EADDRINUSE: address already in use"

### Síntomas
```
Error: listen EADDRINUSE: address already in use :::5001
```

### Causa
El puerto 5001 (backend) o 3000 (frontend) ya está siendo usado por otro proceso.

---

## ✅ SOLUCIONES

### Solución 1: Script Automático (RECOMENDADA) ⭐

**Opción A: Usar archivo .bat**
```bash
# Doble click en el archivo o ejecutar:
.\kill-ports.bat
```

**Opción B: Usar PowerShell**
```powershell
.\kill-ports.ps1
```

**Resultado esperado:**
```
✅ Puerto 5001 liberado
✅ Puerto 3000 liberado
🚀 Puertos listos. Ahora puedes ejecutar: npm run dev
```

---

### Solución 2: Manual (Paso a paso)

#### Paso 1: Identificar el proceso

**Para puerto 5001:**
```bash
netstat -ano | findstr :5001
```

**Para puerto 3000:**
```bash
netstat -ano | findstr :3000
```

**Resultado:**
```
TCP    0.0.0.0:5001    0.0.0.0:0    LISTENING    40464
                                                  ^^^^^
                                                  PID
```

#### Paso 2: Detener el proceso

```bash
# Reemplaza 40464 con el PID que obtuviste
taskkill /F /PID 40464
```

#### Paso 3: Verificar

```bash
netstat -ano | findstr :5001
# No debe mostrar nada
```

---

### Solución 3: Reiniciar todo

```bash
# 1. Cerrar todas las terminales
# 2. Cerrar VS Code
# 3. Abrir VS Code nuevamente
# 4. Ejecutar: npm run dev
```

---

## 🚨 PROBLEMA: "Something is already running on port 3000"

### Solución Rápida

```bash
# Opción 1: Usar script
.\kill-ports.bat

# Opción 2: Manual
netstat -ano | findstr :3000
taskkill /F /PID [PID_AQUI]
```

---

## 🚨 PROBLEMA: MongoDB no conecta

### Síntomas
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

### Soluciones

**1. Verificar que MongoDB está corriendo**
```bash
# Abrir MongoDB Compass
# O iniciar servicio:
net start MongoDB
```

**2. Verificar conexión**
```bash
mongosh mongodb://localhost:27017/sundeck-crm
```

**3. Si falla, reiniciar MongoDB**
```bash
net stop MongoDB
net start MongoDB
```

---

## 🚨 PROBLEMA: "Cannot find module"

### Síntomas
```
Error: Cannot find module 'express'
```

### Solución

```bash
# Reinstalar dependencias
npm install

# Si persiste, limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🚨 PROBLEMA: Frontend no carga

### Síntomas
- Pantalla blanca
- "Failed to compile"
- Errores en consola del navegador

### Soluciones

**1. Verificar que el backend está corriendo**
```bash
# En otra terminal
curl http://localhost:5001/api/proyectos
```

**2. Limpiar cache del navegador**
- Ctrl + Shift + Delete
- Borrar cache y cookies

**3. Reinstalar dependencias del cliente**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 🚨 PROBLEMA: "CORS Error"

### Síntomas
```
Access to XMLHttpRequest blocked by CORS policy
```

### Solución

**Verificar que el backend tiene CORS configurado:**

```javascript
// server/index.js debe tener:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

**Si persiste:**
```bash
# Reiniciar backend
# Ctrl + C en terminal del servidor
npm run server
```

---

## 🚨 PROBLEMA: Cambios no se reflejan

### Solución

**Backend:**
```bash
# Nodemon debería reiniciar automáticamente
# Si no, presiona: rs
# O reinicia manualmente: Ctrl + C y npm run server
```

**Frontend:**
```bash
# React debería recargar automáticamente
# Si no, presiona: Ctrl + C y npm start
# O recarga el navegador: Ctrl + R
```

---

## 📋 COMANDOS ÚTILES

### Verificar puertos en uso
```bash
# Windows
netstat -ano | findstr :5001
netstat -ano | findstr :3000

# Ver todos los puertos
netstat -ano
```

### Detener procesos
```bash
# Por PID
taskkill /F /PID [PID]

# Por nombre
taskkill /F /IM node.exe
```

### Verificar servicios
```bash
# MongoDB
net start MongoDB
mongosh

# Ver procesos de Node
tasklist | findstr node
```

### Limpiar todo
```bash
# Detener todos los procesos de Node
taskkill /F /IM node.exe

# Limpiar puertos
.\kill-ports.bat

# Reinstalar dependencias
npm install
cd client && npm install
```

---

## 🔍 LOGS Y DEBUGGING

### Ver logs del servidor
```bash
# Los logs están en:
C:\Users\dav_r\App Sundeck\SUNDECK-APP-v2\logs\

# Ver último log:
cat logs/combined.log
```

### Debugging en VS Code
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/index.js",
  "restart": true,
  "console": "integratedTerminal"
}
```

---

## 📞 AYUDA ADICIONAL

### Recursos
- **Documentación:** `docs/`
- **Guías:** `CONTINUAR_AQUI.md`
- **Estado:** `docs/ESTADO_RUTA_MAESTRA.md`

### Comandos de verificación rápida
```bash
# Estado del sistema
npm run dev

# Auditoría
node server/scripts/auditoria_dashboard.js

# Tests
npm test
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

Antes de reportar un problema, verifica:

- [ ] ¿MongoDB está corriendo?
- [ ] ¿Los puertos 5001 y 3000 están libres?
- [ ] ¿Las dependencias están instaladas? (`node_modules` existe)
- [ ] ¿El archivo `.env` existe y está configurado?
- [ ] ¿Hay errores en la consola del navegador? (F12)
- [ ] ¿Hay errores en la terminal del servidor?
- [ ] ¿Probaste reiniciar todo?

---

**Última actualización:** 8 Noviembre 2025  
**Versión:** 1.0  
**Mantenido por:** Equipo Técnico Sundeck
