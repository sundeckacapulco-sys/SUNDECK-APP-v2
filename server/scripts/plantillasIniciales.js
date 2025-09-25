const mongoose = require('mongoose');
const PlantillaWhatsApp = require('../models/PlantillaWhatsApp');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');

const plantillasIniciales = [
  // 🔹 PRIMER CONTACTO DESPUÉS DE COTIZACIÓN
  {
    nombre: "Seguimiento Cotización - Formal",
    categoria: "cotizacion_enviada",
    estilo: "formal_profesional",
    mensaje: `Hola {nombre}, espero que esté muy bien.

Le envié la cotización #{numero_cotizacion} por {total} el día de ayer.

¿Ha tenido oportunidad de revisarla? Me gustaría saber si tiene alguna pregunta o si necesita alguna aclaración sobre los productos cotizados.

Quedo atento a sus comentarios.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'numero_cotizacion', descripcion: 'Número de cotización', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true,
    es_predeterminada: true
  },
  {
    nombre: "Seguimiento Cotización - Breve",
    categoria: "cotizacion_enviada", 
    estilo: "breve_persuasivo",
    mensaje: `¡Hola {nombre}! 👋

¿Ya pudiste revisar la cotización de {total}?

Si tienes dudas o quieres ajustar algo, aquí estoy para apoyarte 😊

¡Saludos!`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true
  },

  // 🔹 RECONTACTO DESPUÉS DE VISITA/LEVANTAMIENTO
  {
    nombre: "Seguimiento Post-Levantamiento - Formal",
    categoria: "seguimiento_cotizacion",
    estilo: "formal_profesional", 
    mensaje: `Estimado/a {nombre},

Espero que se encuentre muy bien. Hace unos días realizamos el levantamiento de medidas en su propiedad y me da mucho gusto poder confirmarle que ya tenemos lista su cotización.

Los productos que levantamos suman un total de {total_m2} m² y el presupuesto final es de {total}.

¿Cuándo sería un buen momento para presentarle los detalles y resolver cualquier duda que pueda tener?

Quedo a sus órdenes.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total_m2', descripcion: 'Total en metros cuadrados', tipo: 'numero', requerida: false },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true
  },
  {
    nombre: "Seguimiento Post-Levantamiento - Breve",
    categoria: "seguimiento_cotizacion",
    estilo: "breve_persuasivo",
    mensaje: `¡Hola {nombre}! 

Ya está lista tu cotización después del levantamiento 📐✨

Total: {total} para {total_m2} m²

¿Te parece si la revisamos juntos? ¿Cuándo tienes un ratito libre?

¡Saludos! 😊`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total_m2', descripcion: 'Total en metros cuadrados', tipo: 'numero', requerida: false },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true
  },

  // 🔹 PROSPECTO FRÍO (NO CONTESTÓ EL PRIMER MENSAJE)
  {
    nombre: "Recontacto Prospecto Frío - Formal",
    categoria: "recontacto",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Espero que se encuentre muy bien. Hace algunos días le envié información sobre nuestros productos Sundeck y me gustaría saber si tuvo oportunidad de revisarla.

Entiendo que puede estar ocupado/a, pero me encantaría poder platicarle sobre las ventajas de nuestros sistemas y cómo pueden beneficiar su hogar o negocio.

Si este no es un buen momento, por favor déjeme saber cuándo sería más conveniente para usted.

Quedo atento a su respuesta.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true
  },
  {
    nombre: "Recontacto Prospecto Frío - Breve",
    categoria: "recontacto",
    estilo: "breve_persuasivo",
    mensaje: `Hola {nombre} 👋

Sé que andas ocupado/a, pero no quería dejar pasar la oportunidad de platicar contigo sobre Sundeck.

¿5 minutos para una llamada rápida? Te aseguro que vale la pena 😊

¡Que tengas excelente día!`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true
  },

  // 🔹 CLIENTE INTERESADO PERO INDECISO
  {
    nombre: "Cliente Indeciso - Formal",
    categoria: "seguimiento_cotizacion",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Comprendo perfectamente que una decisión como esta requiere tiempo y análisis. Es normal tener dudas cuando se trata de una inversión importante para su hogar.

Me gustaría ofrecerle algunas referencias de clientes satisfechos en su zona y, si gusta, podemos agendar una visita para que conozca de cerca la calidad de nuestros productos ya instalados.

También puedo explicarle nuestras opciones de financiamiento y garantías que respaldan su inversión.

¿Qué le parece si conversamos sobre sus inquietudes específicas?

Quedo a sus órdenes.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true
  },
  {
    nombre: "Cliente Indeciso - Breve",
    categoria: "seguimiento_cotizacion", 
    estilo: "breve_persuasivo",
    mensaje: `Hola {nombre} 😊

Entiendo que es una decisión importante. ¿Te ayudaría ver fotos de trabajos similares al tuyo?

También tengo referencias de clientes en tu zona que están súper contentos con su Sundeck.

¿Qué dudas específicas tienes? Estoy aquí para resolverlas 👍`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true
  },

  // 🔹 PROSPECTO DE RECOMENDACIÓN/REFERIDO
  {
    nombre: "Cliente Referido - Formal",
    categoria: "recontacto",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

¡Qué gusto saludarle! Me comunico con usted porque {referido_por} me recomendó contactarle, ya que está interesado/a en conocer nuestros productos Sundeck.

{referido_por} quedó muy satisfecho/a con su instalación y pensó que nuestros sistemas también podrían ser de su interés.

Me encantaría poder platicarle sobre las ventajas de nuestros productos y, si gusta, agendar una visita sin compromiso para conocer sus necesidades específicas.

¿Cuándo sería un buen momento para conversar?

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'referido_por', descripcion: 'Nombre de quien lo refirió', tipo: 'texto', requerida: true }
    ],
    activa: true
  },
  {
    nombre: "Cliente Referido - Breve",
    categoria: "recontacto",
    estilo: "breve_persuasivo",
    mensaje: `¡Hola {nombre}! 👋

{referido_por} me dio tu contacto porque quedó súper contento con su Sundeck y pensó que te podría interesar 😊

¿Te parece si platicamos? Te aseguro que vale la pena conocer nuestros productos.

¡Saludos!`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'referido_por', descripcion: 'Nombre de quien lo refirió', tipo: 'texto', requerida: true }
    ],
    activa: true
  },

  // 🔹 COTIZACIÓN POR VENCER
  {
    nombre: "Cotización por Vencer - Formal",
    categoria: "cotizacion_vencimiento",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Espero que se encuentre muy bien. Le escribo para recordarle que su cotización #{numero_cotizacion} por {total} vence el {fecha_vencimiento}.

Si está interesado/a en proceder con el proyecto, me gustaría coordinar los siguientes pasos para no perder esta oportunidad.

En caso de que necesite más tiempo para decidir o tenga alguna pregunta, con mucho gusto podemos extender la vigencia de su cotización.

Quedo atento a sus comentarios.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'numero_cotizacion', descripcion: 'Número de cotización', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true },
      { nombre: 'fecha_vencimiento', descripcion: 'Fecha de vencimiento', tipo: 'fecha', requerida: true }
    ],
    activa: true
  },
  {
    nombre: "Cotización por Vencer - Breve",
    categoria: "cotizacion_vencimiento",
    estilo: "breve_persuasivo",
    mensaje: `¡Hola {nombre}! ⏰

Tu cotización de {total} vence el {fecha_vencimiento}.

¿Ya decidiste? Si necesitas más tiempo o tienes dudas, avísame y la extendemos sin problema 😊

¡Saludos!`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true },
      { nombre: 'fecha_vencimiento', descripcion: 'Fecha de vencimiento', tipo: 'fecha', requerida: true }
    ],
    activa: true
  },

  // 🔹 ANTICIPO CONFIRMADO
  {
    nombre: "Anticipo Confirmado - Formal",
    categoria: "anticipo_confirmado",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

¡Excelente noticia! Hemos recibido su anticipo de {monto_anticipo} y su pedido ya está confirmado oficialmente.

Su proyecto iniciará fabricación el {fecha_fabricacion} y estimamos tener todo listo para instalación en aproximadamente 15-20 días hábiles.

Le estaremos informando del progreso de fabricación y coordinaremos con usted la fecha exacta de instalación.

¡Muchas gracias por confiar en Sundeck!

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'monto_anticipo', descripcion: 'Monto del anticipo', tipo: 'moneda', requerida: true },
      { nombre: 'fecha_fabricacion', descripcion: 'Fecha de inicio de fabricación', tipo: 'fecha', requerida: true }
    ],
    activa: true,
    es_predeterminada: true
  },

  // 🔹 FABRICACIÓN INICIADA
  {
    nombre: "Fabricación Iniciada - Formal",
    categoria: "fabricacion_iniciada",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

¡Excelentes noticias! Su proyecto ya está en fabricación desde hoy.

Nuestro equipo técnico está trabajando en sus productos con los más altos estándares de calidad. Estimamos tener todo terminado para el {fecha_estimada_terminacion}.

Le estaremos informando del progreso y coordinaremos la instalación una vez que esté todo listo.

¡Gracias por su paciencia!

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'fecha_estimada_terminacion', descripcion: 'Fecha estimada de terminación', tipo: 'fecha', requerida: true }
    ],
    activa: true,
    es_predeterminada: true
  }
];

async function crearPlantillasIniciales() {
  try {
    console.log('🚀 Iniciando creación de plantillas iniciales...');
    
    // Limpiar plantillas existentes (opcional)
    // await PlantillaWhatsApp.deleteMany({});
    
    // Crear usuario admin ficticio para las plantillas
    const adminUserId = new mongoose.Types.ObjectId();
    
    for (const plantillaData of plantillasIniciales) {
      // Verificar si ya existe una plantilla con el mismo nombre
      const existente = await PlantillaWhatsApp.findOne({ nombre: plantillaData.nombre });
      
      if (!existente) {
        const plantilla = new PlantillaWhatsApp({
          ...plantillaData,
          creada_por: adminUserId,
          tags: ['inicial', 'sistema'],
          notas_admin: 'Plantilla creada automáticamente por el sistema'
        });
        
        await plantilla.save();
        console.log(`✅ Creada: ${plantilla.nombre}`);
      } else {
        console.log(`⚠️  Ya existe: ${plantillaData.nombre}`);
      }
    }
    
    console.log('🎉 ¡Plantillas iniciales creadas exitosamente!');
    console.log(`📊 Total de plantillas: ${plantillasIniciales.length}`);
    
  } catch (error) {
    console.error('❌ Error creando plantillas:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearPlantillasIniciales();
}

module.exports = { plantillasIniciales, crearPlantillasIniciales };
