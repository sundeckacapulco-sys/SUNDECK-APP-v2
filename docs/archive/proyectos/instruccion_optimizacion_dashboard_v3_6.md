# ⚙️ INSTRUCCIÓN OFICIAL – OPTIMIZACIÓN DASHBOARD SUNDECK v3.6
**Autor:** Dirección Técnica — David Rojas  
**Responsables:**  
- 👨‍💻 Codex → Optimización Backend + Frontend  
- 🧠 Winsurf (Sonet 4) → Auditoría y pruebas de rendimiento  

---

## 🎯 OBJETIVO  
Optimizar el **Dashboard Comercial y Operativo** del CRM SUNDECK,  
mejorando rendimiento, visualización y relevancia de KPIs,  
usando los datos actuales del modelo `Proyecto.js` sin alterar estructura ni flujo.

---

## 🧩 ALCANCE  
1. Mejorar rendimiento de consultas y API `/api/dashboard/resumen`.  
2. Optimizar renderizado y componentes del frontend.  
3. Afinar diseño visual con el branding Sundeck.  
4. Agregar KPIs humanos y métricas de eficiencia comercial.  

---

## ⚙️ FASE 1 – BACKEND (Codex)

### 🧠 1.1 Indexación en MongoDB
Agregar índices en el modelo `Proyecto` para mejorar las consultas:
```js
ProyectoSchema.index({ tipo: 1 });
ProyectoSchema.index({ estadoComercial: 1 });
ProyectoSchema.index({ fechaCreacion: -1 });
⚡ 1.2 Caché en el endpoint /api/dashboard/resumen
Implementar caché temporal con node-cache:

js
Copiar código
const NodeCache = require("node-cache");
const dashboardCache = new NodeCache({ stdTTL: 30 }); // 30 segundos

exports.getResumenDashboard = async (req, res) => {
  const cached = dashboardCache.get("resumen");
  if (cached) return res.json(cached);

  const data = await calcularKPIs(); // lógica actual
  dashboardCache.set("resumen", data);
  res.json(data);
};
➡️ Resultado: KPIs instantáneos sin recargar MongoDB en cada consulta.

🔄 1.3 Optimizar agregaciones
Reducir operaciones a una sola agregación pipeline:

js
Copiar código
const resumen = await Proyecto.aggregate([
  {
    $group: {
      _id: "$estadoComercial",
      total: { $sum: 1 },
      monto: { $sum: "$montoTotal" }
    }
  }
]);
🧩 FASE 2 – FRONTEND (Codex)
💻 2.1 Renderizado optimizado
Actualizar /client/src/pages/Dashboard.jsx:

Usar useMemo para cálculos derivados (tasa de conversión, tiempos).

Controlar useEffect con dependencias claras (solo recarga si cambia data).

Implementar carga progresiva (Skeletons de Material UI).

📊 2.2 Nuevos KPIs humanos
Agregar métricas derivadas:

KPI	Cálculo	Descripción
Tiempo promedio de cierre	Diferencia entre creación y conversión	Eficiencia comercial
Tasa de respuesta	(Prospectos con nota / total prospectos) * 100	Nivel de seguimiento
Referidos activos	Conteo origenComercial.referidoPor	Clientes recomendados

Visualizarlos con:

jsx
Copiar código
<Card>
  <h4>Tiempo promedio de cierre</h4>
  <p>{data.tiempoPromedioCierre} días</p>
</Card>
🧭 2.3 Branding visual refinado
Fondo base: #F8FAFC

Grid principal con gap: 20px

Colores corporativos:

Primario: #0F172A

Dorado: #D4AF37

Neutros: #334155

Acento: #14B8A6

Tipografía: Playfair Display (títulos) + Inter (contenido)

Sombra ligera: shadow-md hover:shadow-lg transition

🧩 FASE 3 – AUDITORÍA (Winsurf)
🧾 3.1 Pruebas de rendimiento
Medir carga del dashboard antes y después de la optimización.

Validar reducción de tiempo a < 300 ms en API /api/dashboard/resumen.

Confirmar uso correcto de índices (db.proyectos.getIndexes()).

🧾 3.2 Validación visual
Confirmar layout consistente y responsivo.

Verificar KPIs correctos y sin duplicidad.

Asegurar coherencia con branding Sundeck.

🧾 3.3 Entrega de auditoría
Generar archivo:
/docs/proyectos/auditorias/verificacion_optimizacion_dashboard_v3_6.md

Debe incluir:

Tiempos de respuesta antes/después.

Capturas del dashboard.

Logs de consultas y métricas.

🧾 COMMITS ESPERADOS
makefile
Copiar código
perf: optimización dashboard comercial v3.6
add: índices y caché en endpoint /api/dashboard/resumen
update: frontend renderizado y nuevos KPIs humanos
style: mejoras visuales según branding Sundeck
docs: auditoria winsurf dashboard optimizado
✅ RESULTADO FINAL
Área	Mejora	Resultado
Backend	Índices + caché	Respuesta 3x más rápida
Frontend	Render controlado + KPIs nuevos	Interfaz fluida y útil
Visual	Layout y colores corporativos	Presentación premium
Auditoría	Validación Winsurf	Sistema certificado

Versión: 3.6
Estado: Aprobado para ejecución inmediata
Supervisor: Dirección Técnica — David Rojas

