const Proyecto = require('../models/Proyecto'); // UNIFICADO: Fuente única de verdad
const logger = require('../config/logger');

// Lógica para /conversion - UNIFICADO con modelo Proyecto
exports.getConversion = async (req, res) => {
    try {
        const [prospectos, levantamientos, cotizaciones, ventas, completados] = await Promise.all([
            // Total prospectos
            Proyecto.countDocuments({ tipo: 'prospecto' }),
            // Levantamientos (prospectos que avanzaron de 'nuevo')
            Proyecto.countDocuments({ 
                tipo: 'prospecto', 
                estadoComercial: { $nin: ['nuevo'] } 
            }),
            // Cotizaciones (prospectos cotizados o convertidos)
            Proyecto.countDocuments({ 
                $or: [
                    { tipo: 'prospecto', estadoComercial: 'cotizado' },
                    { tipo: 'proyecto' }
                ]
            }),
            // Ventas (proyectos)
            Proyecto.countDocuments({ tipo: 'proyecto' }),
            // Completados
            Proyecto.countDocuments({ tipo: 'proyecto', estadoComercial: 'completado' })
        ]);

        const levantamientoACotizacion = levantamientos > 0 ? (cotizaciones / levantamientos) * 100 : 0;
        const cotizacionAVenta = cotizaciones > 0 ? (ventas / cotizaciones) * 100 : 0;

        res.json({
            embudo: { prospectos, levantamientos, cotizaciones, ventas, completados },
            tasasEmbudo: { levantamientoACotizacion, cotizacionAVenta }
        });
    } catch (error) {
        logger.error('Error en getConversion', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Error obteniendo datos de conversión' });
    }
};

// Lógica para /perdidas - UNIFICADO con modelo Proyecto
exports.getPerdidas = async (req, res) => {
    try {
        // Prospectos perdidos del modelo Proyecto
        const perdidas = await Proyecto.find({ 
            tipo: 'prospecto', 
            estadoComercial: 'perdido' 
        }).select('monto_estimado total seguimiento');

        let montoTotalPerdido = 0;
        const razones = {};
        
        perdidas.forEach(p => {
            const monto = p.total || p.monto_estimado || 0;
            montoTotalPerdido += monto;
            
            // Buscar razón en la última nota de seguimiento
            const ultimaNota = p.seguimiento?.slice(-1)[0]?.mensaje || '';
            const tipo = ultimaNota.toLowerCase().includes('precio') ? 'precio' :
                        ultimaNota.toLowerCase().includes('tiempo') ? 'tiempo' :
                        ultimaNota.toLowerCase().includes('competencia') ? 'competencia' :
                        'sin_especificar';
            
            razones[tipo] = razones[tipo] || { cantidad: 0, montoTotal: 0 };
            razones[tipo].cantidad++;
            razones[tipo].montoTotal += monto;
        });
        
        const razonesAnalisis = Object.keys(razones).map(_id => ({
             _id,
             cantidad: razones[_id].cantidad,
             montoTotal: razones[_id].montoTotal
        })).sort((a, b) => b.cantidad - a.cantidad);

        const razonPrincipal = razonesAnalisis[0] || null;

        res.json({
            razonesAnalisis,
            perdidasPorEtapa: [],
            resumen: {
                totalPerdidas: perdidas.length,
                montoTotalPerdido,
                razonPrincipal
            }
        });
    } catch (error) {
        logger.error('Error en getPerdidas', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Error obteniendo datos de pérdidas' });
    }
};

// Lógica para /recuperables - UNIFICADO con modelo Proyecto
exports.getRecuperables = async (req, res) => {
    try {
        // Prospectos perdidos en los últimos 90 días (potencialmente recuperables)
        const hace90Dias = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        const prospectos = await Proyecto.find({ 
            tipo: 'prospecto',
            estadoComercial: 'perdido',
            updatedAt: { $gte: hace90Dias }
        })
        .select('cliente monto_estimado total probabilidadCierre updatedAt')
        .sort({ updatedAt: -1 })
        .limit(20);

        let montoTotalRecuperable = 0;
        const porPrioridad = { alta: { cantidad: 0 }, media: { cantidad: 0 }, baja: { cantidad: 0 } };

        prospectos.forEach(p => {
            const monto = p.total || p.monto_estimado || 0;
            montoTotalRecuperable += monto;
            
            // Priorizar por monto
            if (monto >= 50000) porPrioridad.alta.cantidad++;
            else if (monto >= 20000) porPrioridad.media.cantidad++;
            else porPrioridad.baja.cantidad++;
        });

        res.json({
            prospectosRecuperables: prospectos,
            resumen: {
                totalRecuperables: prospectos.length,
                montoTotalRecuperable
            },
            porPrioridad
        });
    } catch (error) {
        logger.error('Error en getRecuperables', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Error obteniendo datos de recuperables' });
    }
};
