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

  // 🔹 NEGOCIACIÓN POST-COTIZACIÓN (DÍAS 1-5 CRÍTICOS)
  {
    nombre: "Negociación Día 1-2 - Hunter Agresivo",
    categoria: "seguimiento_cotizacion",
    estilo: "breve_persuasivo",
    mensaje: `¡Hola {nombre}! 🏗️

¿Ya revisaste la cotización de {total}? 

Sé que es una decisión importante, pero tengo excelentes noticias: si confirmamos esta semana, puedo ofrecerte:

✅ 5% descuento adicional
✅ Inicio de fabricación inmediato
✅ Instalación en {tiempo_fabricacion} días

¿Tienes 10 minutos para platicar? Te aseguro que vale la pena 💪

¡Saludos!`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true },
      { nombre: 'tiempo_fabricacion', descripcion: 'Tiempo de fabricación', tipo: 'numero', requerida: false }
    ],
    activa: true,
    tags: ['hunter', 'urgente', 'descuento']
  },
  {
    nombre: "Negociación Día 1-2 - Farmer Consultivo",
    categoria: "seguimiento_cotizacion",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Espero que haya tenido oportunidad de revisar la cotización que le envié por {total}.

Entiendo que es una inversión importante y seguramente tiene algunas preguntas. Me gustaría agendar una llamada para:

• Resolver cualquier duda técnica
• Explicar nuestras opciones de financiamiento
• Mostrarle referencias de trabajos similares
• Discutir los beneficios a largo plazo

¿Qué día de esta semana le viene mejor? Tengo disponibilidad mañana y pasado mañana.

Quedo atento a su respuesta.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true,
    tags: ['farmer', 'consultivo', 'educativo']
  },
  {
    nombre: "Negociación Día 3-4 - Hunter Urgencia",
    categoria: "seguimiento_cotizacion",
    estilo: "breve_persuasivo",
    mensaje: `{nombre}, ¡momento clave! ⏰

Tu cotización de {total} vence en 2 días y tengo una oportunidad única:

🎯 OFERTA ESPECIAL:
• Descuento del 8% (ahorras ${descuento_pesos})
• Apartado con solo 30% de anticipo
• Fabricación prioritaria

Solo tengo 2 espacios disponibles este mes. 

¿Nos vemos hoy o mañana para cerrar? 

¡No dejes pasar esta oportunidad! 🚀`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true },
      { nombre: 'descuento_pesos', descripcion: 'Descuento en pesos', tipo: 'moneda', requerida: false }
    ],
    activa: true,
    tags: ['hunter', 'urgencia', 'oferta_especial']
  },
  {
    nombre: "Negociación Día 3-4 - Farmer Valor",
    categoria: "seguimiento_cotizacion",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

He estado pensando en su proyecto y me gustaría compartirle algunos puntos importantes sobre su inversión de {total}:

💰 VALOR A LARGO PLAZO:
• Incremento del valor de su propiedad: 15-20%
• Ahorro en mantenimiento vs. materiales tradicionales
• Garantía de 10 años en estructura

🏆 BENEFICIOS EXCLUSIVOS:
• Financiamiento a 12 meses sin intereses
• Mantenimiento gratuito el primer año
• Servicio técnico especializado

¿Le parece si nos reunimos para revisar estos beneficios en detalle? Puedo visitarlo mañana o pasado mañana.

Su inversión merece la mejor decisión.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true,
    tags: ['farmer', 'valor', 'beneficios']
  },
  {
    nombre: "Negociación Día 5 - Hunter Cierre Final",
    categoria: "seguimiento_cotizacion",
    estilo: "breve_persuasivo",
    mensaje: `{nombre}, ¡ÚLTIMO DÍA! 🔥

Tu cotización de {total} vence HOY.

OFERTA FINAL:
✅ 10% descuento (ahorras ${descuento_final})
✅ Anticipo de solo 25%
✅ Inicio INMEDIATO

Tengo TODO listo para empezar tu proyecto mañana mismo.

¿Cerramos AHORA? Solo necesito tu confirmación.

¡Es tu momento! 💪`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true },
      { nombre: 'descuento_final', descripcion: 'Descuento final en pesos', tipo: 'moneda', requerida: false }
    ],
    activa: true,
    tags: ['hunter', 'cierre_final', 'ultimo_dia']
  },
  {
    nombre: "Negociación Día 5 - Farmer Reflexión",
    categoria: "seguimiento_cotizacion",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Su cotización por {total} vence hoy y quería contactarlo una última vez.

Comprendo que es una decisión importante que requiere reflexión. Si necesita más tiempo, puedo extender la vigencia sin problema.

Sin embargo, me gustaría ofrecerle una condición especial por la confianza que ha depositado en nosotros:

🎁 OFERTA DE CORTESÍA:
• Descuento del 7% sobre el total
• Facilidades de pago personalizadas
• Garantía extendida a 12 años

Si decide proceder, podemos iniciar su proyecto la próxima semana.

¿Qué le parece si conversamos 10 minutos para definir el siguiente paso?

Quedo a sus órdenes.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'total', descripcion: 'Monto total', tipo: 'moneda', requerida: true }
    ],
    activa: true,
    tags: ['farmer', 'reflexion', 'extension']
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

  // 🔹 MANEJO DE OBJECIONES COMUNES
  {
    nombre: "Objeción Precio - Hunter",
    categoria: "seguimiento_cotizacion",
    estilo: "breve_persuasivo",
    mensaje: `{nombre}, entiendo tu preocupación por el precio 💰

Pero déjame mostrarte el VERDADERO valor:

🏠 Tu casa vale 15% MÁS con Sundeck
💸 Ahorras $50,000+ en mantenimiento (10 años)
⚡ Instalación en solo {tiempo_fabricacion} días
🛡️ Garantía de 10 años

PLUS: Te doy facilidades de pago que se ajusten a tu presupuesto.

¿Vemos las opciones? Te sorprenderás 😉`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true },
      { nombre: 'tiempo_fabricacion', descripcion: 'Tiempo de fabricación', tipo: 'numero', requerida: false }
    ],
    activa: true,
    tags: ['objecion', 'precio', 'hunter']
  },
  {
    nombre: "Objeción Tiempo - Farmer",
    categoria: "seguimiento_cotizacion",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Comprendo perfectamente que necesite tiempo para tomar esta decisión.

Permítame compartirle por qué otros clientes que tomaron tiempo extra terminaron eligiendo Sundeck:

✅ TRANQUILIDAD: Garantía respaldada por 15 años de experiencia
✅ CALIDAD: Materiales premium con certificaciones internacionales  
✅ SERVICIO: Acompañamiento completo desde el diseño hasta post-instalación

No hay prisa. Su decisión debe ser la correcta para usted y su familia.

¿Le parece si le envío algunas referencias de clientes que tuvieron dudas similares?

Quedo a sus órdenes.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true,
    tags: ['objecion', 'tiempo', 'farmer']
  },

  // 🔹 SEGUIMIENTO POST-VENCIMIENTO
  {
    nombre: "Post-Vencimiento Semana 1 - Hunter",
    categoria: "recontacto",
    estilo: "breve_persuasivo",
    mensaje: `{nombre}, ¡no todo está perdido! 🔥

Sé que se venció tu cotización, pero tengo una SEGUNDA OPORTUNIDAD:

🎯 OFERTA RESCATE:
• Mismo precio que antes
• Descuento del 6% adicional  
• Inicio en 15 días máximo

Solo por esta semana. Después ya no podré mantener estos precios.

¿Le damos una segunda vuelta? 💪

¡Saludos!`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true,
    tags: ['post_vencimiento', 'rescate', 'hunter']
  },
  {
    nombre: "Post-Vencimiento Mes 1 - Farmer",
    categoria: "recontacto",
    estilo: "formal_profesional",
    mensaje: `Estimado/a {nombre},

Espero que se encuentre muy bien. Ha pasado un mes desde que conversamos sobre su proyecto Sundeck.

Entiendo que las circunstancias pueden cambiar y quería contactarlo para saber si aún tiene interés en el proyecto.

Si es así, me da mucho gusto informarle que:

• Mantengo las mismas condiciones de precio
• Tengo disponibilidad inmediata para fabricación
• Puedo ofrecerle nuevas opciones de financiamiento

Si prefiere que no lo contacte más sobre este tema, por favor házmelo saber y respetaré completamente su decisión.

Quedo atento a sus comentarios.

Saludos cordiales,
Sundeck Acapulco`,
    variables: [
      { nombre: 'nombre', descripcion: 'Nombre del cliente', tipo: 'texto', requerida: true }
    ],
    activa: true,
    tags: ['post_vencimiento', 'mes_1', 'farmer']
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
