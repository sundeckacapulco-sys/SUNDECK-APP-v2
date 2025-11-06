# 🧭 RUTA ÓPTIMA DE INTEGRACIÓN — MÓDULO DE PROSPECTOS UNIFICADOS  
**Proyecto:** SUNDECK CRM  
**Versión:** 1.0  
**Fecha:** 7 Noviembre 2025  
**Autor:** Dirección Técnica – David Rojas  
**Responsable técnico:** Agente Codex  

---

## 🎯 OBJETIVO
Integrar el nuevo **Módulo de Prospectos Unificados** dentro del flujo actual de proyectos,  
recuperando la trazabilidad comercial (seguimiento de asesores, notas, conversiones, alertas)  
sin alterar el modelo operativo del CRM.

---

## 🧩 CONTEXTO
Actualmente, el modelo `Proyecto.js` ya unifica:
- Levantamiento técnico  
- Cotización formal  
- Pedido → Fabricación → Instalación  

Sin embargo, faltaba la **etapa previa de venta (prospectos)** que permita:
- Monitorear el trabajo de los asesores.  
- Registrar seguimientos y notas.  
- Medir conversión y tiempo de cierre.  
- Generar alertas automáticas por inactividad.  

---

## ⚙️ FASE 1 — EXTENDER MODELO `Proyecto.js`

**Ubicación:** `/server/models/Proyecto.js`

Agregar dentro del `ProyectoSchema` los siguientes campos:

```js
tipo: { type: String, enum: ['prospecto', 'proyecto'], default: 'prospecto' },
estadoComercial: {
  type: String,
  enum: ['en seguimiento', 'cotizado', 'sin respuesta', 'convertido', 'perdido'],
  default: 'en seguimiento'
},
origenComercial: {
  fuente: String,        // web, referido, facebook, llamada, visita
  referidoPor: String,
  campana: String,
  fechaPrimerContacto: Date
},
asesorComercial: { type: Schema.Types.ObjectId, ref: 'Usuario' },
seguimiento: [{
  fecha: Date,
  autor: Schema.Types.ObjectId,
  mensaje: String,
  tipo: { type: String, enum: ['nota', 'llamada', 'whatsapp', 'email', 'visita'] }
}],
probabilidadCierre: { type: Number, default: 0 },
ultimaNota: { type: Date, default: null }
💡 Importante:
Estos campos no modifican ni interfieren con el flujo técnico ni los controladores de pedidos, fabricación o instalación.
Solo amplían la capa comercial inicial.

⚙️ FASE 2 — CONTROLADOR DE PROSPECTOS
Ubicación: /server/controllers/prospectosController.js

Crear nuevo archivo:

js
Copiar código
const Proyecto = require('../models/Proyecto');

// Obtener todos los prospectos
exports.getProspectos = async (req, res) => {
  const data = await Proyecto.find({ tipo: 'prospecto' }).sort({ createdAt: -1 });
  res.json(data);
};

// Agregar nota de seguimiento
exports.agregarNota = async (req, res) => {
  const { id } = req.params;
  const { mensaje, autor, tipo } = req.body;
  const p = await Proyecto.findById(id);
  p.seguimiento.push({ autor, mensaje, tipo, fecha: new Date() });
  p.ultimaNota = new Date();
  await p.save();
  res.json({ ok: true, mensaje: 'Nota agregada', p });
};

// Convertir prospecto a proyecto formal
exports.convertirAProyecto = async (req, res) => {
  const { id } = req.params;
  const p = await Proyecto.findById(id);
  p.tipo = 'proyecto';
  p.estadoComercial = 'convertido';
  await p.save();
  res.json({ ok: true, mensaje: 'Prospecto convertido con éxito', p });
};
⚙️ FASE 3 — RUTAS
Archivo: /server/routes/prospectosRoutes.js

js
Copiar código
const express = require('express');
const router = express.Router();
const controller = require('../controllers/prospectosController');

router.get('/', controller.getProspectos);
router.post('/:id/agregar-nota', controller.agregarNota);
router.post('/:id/convertir', controller.convertirAProyecto);

module.exports = router;
Montar en server/index.js:

js
Copiar código
app.use('/api/prospectos', require('./routes/prospectosRoutes'));
⚙️ FASE 4 — DASHBOARD DE PROSPECTOS
Ubicación sugerida: /client/src/modules/Prospectos/ProspectosDashboard.jsx

Componentes requeridos:

Lista de prospectos con:

Cliente

Asesor

Estado comercial

Última nota

Botones de acción:

🗒️ Agregar nota

🔁 Convertir a proyecto

jsx
Copiar código
useEffect(() => {
  axios.get("/api/prospectos").then(res => setProspectos(res.data));
}, []);

return (
  <Card className="shadow-md p-4">
    <h2 className="text-xl font-bold mb-4">Prospectos en Seguimiento</h2>
    <Table>
      {prospectos.map(p => (
        <tr key={p._id}>
          <td>{p.cliente?.nombre}</td>
          <td>{p.asesorComercial?.nombre}</td>
          <td>{p.estadoComercial}</td>
          <td>{moment(p.ultimaNota).fromNow()}</td>
          <td>
            <Button onClick={() => abrirNotas(p._id)}>🗒️</Button>
            <Button onClick={() => convertir(p._id)}>🔁</Button>
          </td>
        </tr>
      ))}
    </Table>
  </Card>
);
⚙️ FASE 5 — KPI Y SUPERVISIÓN DE ASESORES
Archivo: /server/controllers/kpiController.js

Agregar indicadores:

js
Copiar código
const totalProspectos = await Proyecto.countDocuments({ tipo: "prospecto" });
const prospectosConvertidos = await Proyecto.countDocuments({ estadoComercial: "convertido" });
const prospectosPerdidos = await Proyecto.countDocuments({ estadoComercial: "perdido" });
const conversionRate = totalProspectos ? (prospectosConvertidos / totalProspectos * 100).toFixed(2) : 0;
Vista Dashboard:

Prospectos por asesor

Último contacto (alerta 🔴 si >5 días sin nota)

Tasa de conversión global y por asesor

⚙️ FASE 6 — ALERTAS AUTOMÁTICAS
Crear archivo:
/server/jobs/alertasProspectos.js

js
Copiar código
const Proyecto = require("../models/Proyecto");

module.exports = async function alertasProspectos(notificar) {
  const limite = new Date(Date.now() - 5*24*60*60*1000);
  const inactivos = await Proyecto.find({ tipo: "prospecto", ultimaNota: { $lt: limite } });
  for (const p of inactivos) {
    await notificar({
      to: [p.asesorComercial, "coordinacion@sundeck"],
      asunto: `Prospecto sin seguimiento: ${p?.cliente?.nombre ?? p._id}`,
      cuerpo: `Han pasado más de 5 días sin actividad. Estado actual: ${p.estadoComercial}`
    });
  }
};
Programar revisión diaria vía cron job o scheduler de backend.

🧠 FASE 7 — VALIDACIÓN
Archivo: /docs/proyectos/prospectos_unificados/verificacion_prospectos_unificados.md

Verificar los siguientes puntos:

Elemento	Estado	Observaciones
Modelo extendido con campos comerciales	✅	
API /api/prospectos funcional	✅	
Notas y conversión de prospectos	✅	
Dashboard de Prospectos visible	✅	
KPIs actualizados en dashboard	✅	
Alertas por inactividad	✅	

🧾 COMMITS ESPERADOS
makefile
Copiar código
feat: módulo prospectos unificado integrado en Proyecto.js  
add: controlador y rutas prospectos  
update: KPIs comerciales con conversionRate  
add: alertas automáticas por inactividad  
docs: verificacion prospectos unificados
✅ RESULTADO FINAL
Área	Estado Final
Modelo Proyecto	Extendido con campos de prospecto
Backend	/api/prospectos activo y conectado a Proyecto
Frontend	Módulo Prospectos visible
Supervisión	Panel de asesores con alertas
KPIs	Conversión y seguimiento funcional
Flujo técnico	Sin alteraciones
IA futura	Dataset preparado para predicción de cierre

Versión: 1.0
Estado: Pendiente de ejecución por Codex
Supervisión: David Rojas — Dirección Técnica Sundeck CRM

