
# Solicitud de Plan de Acción para Agente Winsurf-Local

## 1. Contexto

He sido asignado como el **agente de modificación de código**. Para proceder de manera eficiente y estructurada, necesito que generes un plan de acción detallado basado en el análisis sistémico que ya se ha realizado.

## 2. Fuente de Verdad

Utiliza como base principal el documento de auditoría existente: `docs/auditoria_sistema_actual.md`.

Este documento contiene una matriz de riesgos, un inventario de rutas y sugerencias priorizadas que debemos seguir. Partiremos de ahí para no duplicar esfuerzos.

## 3. Entregable Requerido

Genera un nuevo archivo en la raíz del proyecto llamado `PLAN_DE_ACCION.md`.

## 4. Formato del Plan de Acción

El archivo debe contener una lista de tareas, priorizadas de **mayor a menor criticidad** (comenzando por los riesgos "Críticos" y las sugerencias "Inmediatas" identificadas en la auditoría).

Para **cada tarea** en la lista, debes proporcionarme la siguiente información en un formato claro y fácil de parsear:

---

**TAREA_ID:** `[Un identificador único, ej: DASH-001]`

**DESCRIPCION:** `[Breve explicación del problema y el objetivo de la corrección.]`

**ARCHIVO:** `[Ruta completa del archivo a modificar.]`

**CODIGO_A_REEMPLAZAR:**
```javascript
// El bloque de código exacto que debo cambiar.
```

**CODIGO_NUEVO:**
```javascript
// El nuevo bloque de código que debo insertar.
```

**COMANDO_VERIFICACION:** `[El comando de terminal exacto que ejecutarás para validar mi cambio.]`

**RESULTADO_ESPERADO:** `[La salida o comportamiento que confirma que el cambio fue exitoso.]`

---

## 5. Primera Tarea Sugerida

Para iniciar, por favor, crea la primera entrada en `PLAN_DE_ACCION.md` para resolver el error que originó esta sesión: **el cálculo incorrecto de `montoTotal` en el dashboard unificado.**

Necesitaré que, como parte de esa primera tarea, investigues la estructura de datos correcta y me proporciones el `CODIGO_NUEVO` para la agregación de MongoDB en `server/routes/dashboardUnificado.js`.

## 6. Siguientes Pasos

Una vez que hayas creado `PLAN_DE_ACCION.md` con la primera tarea, notifícame. Leeré el archivo y ejecutaré la modificación de código solicitada.
