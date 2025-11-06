
# Project Title

A brief description of what this project does and who it's for


# 🌟 MÓDULO DE PROSPECTOS UNIFICADOS — SUNDECK CRM  
**Versión:** 1.0  
**Fecha:** 6 Noviembre 2025  
**Autor:** Dirección Técnica — Sundeck CRM (David Rojas)  

---

## 🎯 OBJETIVO

Reintegrar la funcionalidad de **Prospectos** dentro del modelo `Proyecto`,  
sin crear una nueva colección en la base de datos.  
El objetivo es recuperar la capacidad de **supervisión de asesores de venta**, seguimiento comercial y control de conversión,  
manteniendo compatibilidad con el flujo actual del CRM.

---

## 🧠 CONCEPTO BASE

> Cada prospecto es un proyecto en potencia.  
> No se duplican colecciones: se amplía `Proyecto.js` para representar etapas comerciales.

### Flujos posibles:

Prospecto (estado: en seguimiento)
↓
Cotización directa / formal
↓
Proyecto activo (tipo: proyecto)
↓
Pedido confirmado
↓
Fabricación
↓
Instalación

yaml
Copiar código

---

## ⚙️ 1. AJUSTE DE MODELO — `server/models/Proyecto.js`

Agregar los campos nuevos:

```js
tipo: { type: String, enum: ["prospecto", "proyecto"], default: "prospecto" },
estadoComercial: {
  type: String,
  enum: ["en seguimiento", "cotizado", "sin respuesta", "convertido", "perdido"],
  default: "en seguimiento"
},
origen: { type: String, enum: ["cotizacion directa", "referido", "web", "visita"], default: "cotizacion directa" },
asesor: { type: String },
ultimaNota: { type: Date },
notas: [{ autor: String, mensaje: String, fecha: { type: Date, default: Date.now } }],
historicoSeguimiento: [{ evento: String, fecha: Date, autor: String }],
probabilidadCierre: { type: Number, default: 0.0 }
💡 Esto permite manejar prospectos y proyectos dentro del mismo documento Mongo.

⚙️ 2. CONTROLADOR — server/controllers/prospectosController.js
js
Copiar código
const Proyecto = require("../models/Proyecto");

// Listar todos los prospectos
exports.getProspectos = async (req, res) => {
  const prospectos = await Proyecto.find({ tipo: "prospecto" }).sort({ fechaCreacion: -1 });
  res.json(prospectos);
};

// Agregar nota de seguimiento
exports.agregarNota = async (req, res) => {
  const { id } = req.params;
  const { mensaje, autor } = req.body;
  const proyecto = await Proyecto.findById(id);
  proyecto.notas.push({ autor, mensaje });
  proyecto.ultimaNota = new Date();
  proyecto.historicoSeguimiento.push({ evento: "nota agregada", fecha: new Date(), autor });
  await proyecto.save();
  res.json({ ok: true, mensaje: "Nota agregada", proyecto });
};

// Convertir a proyecto formal
exports.convertirAProyecto = async (req, res) => {
  const { id } = req.params;
  const proyecto = await Proyecto.findById(id);
  proyecto.tipo = "proyecto";
  proyecto.estadoComercial = "convertido";
  proyecto.historicoSeguimiento.push({ evento: "convertido a proyecto", fecha: new Date() });
  await proyecto.save();
  res.json({ ok: true, mensaje: "Prospecto convertido con éxito", proyecto });
};
⚙️ 3. RUTAS — server/routes/prospectosRoutes.js
js
Copiar código
const express = require("express");
const router = express.Router();
const controller = require("../controllers/prospectosController");

router.get("/", controller.getProspectos);
router.post("/:id/agregar-nota", controller.agregarNota);
router.post("/:id/convertir", controller.convertirAProyecto);

module.exports = router;
Y montar en el backend principal:

js
Copiar código
app.use("/api/prospectos", require("./routes/prospectosRoutes"));
📊 4. KPIs COMERCIALES
Actualizar server/controllers/kpiController.js con indicadores nuevos:

js
Copiar código
const totalProspectos = await Proyecto.countDocuments({ tipo: "prospecto" });
const prospectosConvertidos = await Proyecto.countDocuments({ estadoComercial: "convertido" });
const prospectosPerdidos = await Proyecto.countDocuments({ estadoComercial: "perdido" });

const conversionRate = ((prospectosConvertidos / totalProspectos) * 100).toFixed(2);
Mostrar en Dashboard:

Total de prospectos activos

Tasa de conversión

Tiempo promedio de cierre

Ranking de asesores

💻 5. FRONTEND — NUEVO MÓDULO
📂 client/src/modules/Prospectos/ProspectosDashboard.jsx

jsx
Copiar código
useEffect(() => {
  axios.get("/api/prospectos").then(res => setProspectos(res.data));
}, []);

return (
  <Card className="shadow-md p-4">
    <h2 className="text-xl font-bold">Prospectos en Seguimiento</h2>
    <Table>
      {prospectos.map(p => (
        <tr key={p._id}>
          <td>{p.cliente.nombre}</td>
          <td>{p.asesor}</td>
          <td>{p.estadoComercial}</td>
          <td>
            <Button onClick={() => abrirNotas(p._id)}>🗒️ Nota</Button>
            <Button onClick={() => convertir(p._id)}>🔁 Convertir</Button>
          </td>
        </tr>
      ))}
    </Table>
  </Card>
);
🧠 6. SUPERVISOR DE ASESORES
📂 client/src/modules/Ventas/SupervisionAsesores.jsx

Mostrar:

Prospectos por asesor

Último contacto

Tasa de conversión

Tiempo promedio de respuesta

Alertas de inactividad (>5 días sin nota)

🔁 7. ALERTAS AUTOMÁTICAS
Crear tarea programada:

js
Copiar código
const prospectosInactivos = await Proyecto.find({
  tipo: "prospecto",
  ultimaNota: { $lt: Date.now() - 5 * 24 * 60 * 60 * 1000 }
});
→ Enviar alerta al asesor y coordinador (Abigail).

✅ RESULTADO FINAL
Área	Estado Final
Modelo	Proyecto extendido con campos de prospecto
Backend	/api/prospectos funcional y vinculado a Proyecto
Dashboard	Nueva pestaña: “Prospectos”
KPIs	Conversión y desempeño por asesor
Flujo Técnico	Sin alteraciones
IA futura	Lista para predicción de cierre

📌 COMMITS ESPERADOS
makefile
Copiar código
feat: crear módulo prospectos unificado
update: modelo Proyecto con campos comerciales
add: rutas y controladores prospectos dentro de proyectos
update: dashboard ventas con pestaña prospectos
Supervisión final:
David Rojas — Dirección Técnica Sundeck CRM
Responsable técnico: Agente Codex

