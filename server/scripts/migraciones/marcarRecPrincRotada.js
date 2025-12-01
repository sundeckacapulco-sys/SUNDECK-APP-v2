const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function actualizar() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const proyecto = await Proyecto.findById('690e69251346d61cfcd5178d');
  
  // Buscar la partida de Rec Princ
  const medidas = proyecto.medidas[0];
  const partidaRecPrinc = medidas.piezas.find(p => p.ubicacion.includes('Rec Princ'));
  
  if (partidaRecPrinc) {
    // Marcar la primera pieza (4.28m x 2.8m) como rotada
    const pieza428 = partidaRecPrinc.medidas.find(m => m.ancho === 4.28 && m.alto === 2.8);
    
    if (pieza428) {
      console.log('\n📝 ACTUALIZANDO PIEZA:\n');
      console.log(`Antes: ${pieza428.ancho}m x ${pieza428.alto}m`);
      console.log(`Detalle técnico: "${pieza428.detalleTecnico}"`);
      
      pieza428.detalleTecnico = 'rotada';
      
      await proyecto.save();
      
      console.log('\n✅ ACTUALIZADO:\n');
      console.log(`Después: ${pieza428.ancho}m x ${pieza428.alto}m`);
      console.log(`Detalle técnico: "${pieza428.detalleTecnico}"`);
      console.log('\n🎉 Pieza marcada como rotada correctamente');
    } else {
      console.log('❌ No se encontró la pieza 4.28m x 2.8m');
    }
  } else {
    console.log('❌ No se encontró la partida de Rec Princ');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

actualizar();
