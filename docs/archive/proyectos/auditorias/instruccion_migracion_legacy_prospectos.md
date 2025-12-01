# 🧭 INSTRUCCIÓN FINAL — MIGRACIÓN LEGACY DE PROSPECTOS → PROYECTOS

**Fecha:** 6 Noviembre 2025  
**Responsable técnico:** Agente Codex  
**Supervisión:** David Rojas – Dirección Técnica Sundeck CRM  

---

## 🎯 OBJETIVO
Unificar definitivamente el flujo comercial del CRM, eliminando la colección `prospectos` y sus rutas legacy, dejando `proyectos` como única fuente de verdad.

---

## ⚙️ PASOS A EJECUTAR

### 🔹 1. AUDITORÍA DE DEPENDENCIAS
Buscar en código referencias activas:
```bash
grep -rnw 'server' -e 'prospecto'
Registrar archivos detectados en:

swift
Copiar código
/docs/proyectos/auditorias/dependencias_prospecto_legacy.md
🔹 2. MIGRACIÓN DE DATOS (si aplica)
Verificar registros:

js
Copiar código
db.prospectos.count();
Si > 0, migrar:

js
Copiar código
db.prospectos.find().forEach(p => {
  db.proyectos.insertOne({ ...p, migradoDesde: "prospectos" });
});
db.prospectos.drop();
Si = 0, pasar directamente a la siguiente fase.

🔹 3. DESACTIVAR ENDPOINTS Y MIDDLEWARE LEGACY
Comentar rutas de /api/prospectos.

Eliminar importaciones de ProyectoSyncMiddleware.

Documentar en README_BACKEND.md el cambio.

🔹 4. VALIDAR FLUJO ACTIVO
Crear un registro nuevo desde frontend (Prospecto/Proyecto).

Confirmar en MongoDB:

js
Copiar código
db.proyectos.find().sort({ _id: -1 }).limit(1);
Validar que el flujo Levantamiento → Cotización → Pedido sigue funcionando.

🔹 5. DOCUMENTACIÓN FINAL
Crear archivo:

swift
Copiar código
/docs/proyectos/auditorias/verificacion_migracion_legacy_prospectos.md
Incluir:

Fecha de ejecución

Colecciones activas

Registros migrados (si hubo)

Endpoints desactivados

Estado final del flujo

✅ RESULTADO ESPERADO
Elemento	Estado final
Modelo Prospecto	Eliminado
Middleware Sync	Eliminado
Rutas /api/prospectos	Desactivadas
Flujo Levantamiento → Pedido	Funcional
Base de datos	Solo colección proyectos
KPIs Ventas	Sin impacto
Documentación	Actualizada

Commits esperados:

vbnet
Copiar código
chore: audit prospecto legacy
fix: migrate prospectos to proyectos
refactor: remove ProyectoSyncMiddleware
docs: update backend readme and verification
Entrega final:
/docs/proyectos/auditorias/verificacion_migracion_legacy_prospectos.md

Versión: 1.0
Fecha: 6 Nov 2025
Estado: Pendiente de ejecución por Codex

yaml
Copiar código

---

## 🧭 Beneficios de esta solución

✅ Elimina duplicidad sin riesgo.  
✅ Mantiene trazabilidad comercial y KPIs intactos.  
✅ Simplifica mantenimiento del backend.  
✅ Limpia rutas, middlewares y dependencias obsoletas.  
✅ Deja al sistema listo para automatización total del pipeline comercial

