
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');
const logger = require('../config/logger');

// Lógica para /conversion
exports.getConversion = async (req, res) => {
    try {
        const [prospectos, levantamientos, cotizaciones, ventas, completados] = await Promise.all([
            Prospecto.countDocuments(),
            Prospecto.countDocuments({ etapa: { $ne: 'inicial' } }),
            Prospecto.countDocuments({ etapa: { $in: ['cotizacion_enviada', 'venta_cerrada', 'pedido', 'terminado', 'entregado'] } }),
            Pedido.countDocuments(),
            Pedido.countDocuments({ estado: 'entregado' })
        ]);

        const levantamientoACotizacion = levantamientos > 0 ? (cotizaciones / levantamientos) * 100 : 0;
        const cotizacionAVenta = cotizaciones > 0 ? (ventas / cotizaciones) * 100 : 0;

        res.json({
            embudo: { prospectos, levantamientos, cotizaciones, ventas, completados },
            tasasEmbudo: { levantamientoACotizacion, cotizacionAVenta }
        });
    } catch (error) {
        logger.error('Error en getConversion', { error: error.message });
        res.status(500).json({ message: 'Error obteniendo datos de conversión' });
    }
};

// Lógica para /perdidas
exports.getPerdidas = async (req, res) => {
    try {
        const perdidas = await Prospecto.find({ etapa: 'perdido' }).select('razonPerdida montoEstimado');

        let montoTotalPerdido = 0;
        const razones = {};
        const perdidasPorEtapa = {}; // Implementación futura

        perdidas.forEach(p => {
            montoTotalPerdido += p.montoEstimado || 0;
            if (p.razonPerdida.tipo) {
                razones[p.razonPerdida.tipo] = (razones[p.razonPerdida.tipo] || { cantidad: 0, montoTotal: 0 });
                razones[p.razonPerdida.tipo].cantidad++;
                razones[p.razonPerdida.tipo].montoTotal += p.montoEstimado || 0;
            }
        });
        
        const razonesAnalisis = Object.keys(razones).map(_id => ({
             _id,
             cantidad: razones[_id].cantidad,
             montoTotal: razones[_id].montoTotal
        }));

        res.json({
            razonesAnalisis,
            perdidasPorEtapa: [], // Placeholder
            resumen: {
                totalPerdidas: perdidas.length,
                montoTotalPerdido,
                razonPrincipal: razonesAnalisis.sort((a,b) => b.cantidad - a.cantidad)[0] || null
            }
        });
    } catch (error) {
        logger.error('Error en getPerdidas', { error: error.message });
        res.status(500).json({ message: 'Error obteniendo datos de pérdidas' });
    }
};

// Lógica para /recuperables
exports.getRecuperables = async (req, res) => {
    try {
        const prospectos = await Prospecto.find({ 
            etapa: 'perdido',
            'razonPerdida.recuperable': true
        }).populate('cliente').limit(20);

        let montoTotalRecuperable = 0;
        const porPrioridad = { alta: {cantidad: 0}, media: {cantidad: 0}, baja: {cantidad: 0} };

        prospectos.forEach(p => {
             montoTotalRecuperable += p.montoEstimado || 0;
            if (p.scoreRecuperacion >= 70) porPrioridad.alta.cantidad++;
            else if (p.scoreRecuperacion >= 50) porPrioridad.media.cantidad++;
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
        logger.error('Error en getRecuperables', { error: error.message });
        res.status(500).json({ message: 'Error obteniendo datos de recuperables' });
    }
};
