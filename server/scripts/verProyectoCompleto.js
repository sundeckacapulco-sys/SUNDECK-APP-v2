const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function ver() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const id = '690e69251346d61cfcd5178d';
  const proyecto = await Proyecto.findById(id).lean();
  
  if (!proyecto) {
    console.log('❌ Proyecto NO encontrado');
    process.exit(1);
  }
  
  console.log('\n✅ PROYECTO COMPLETO:\n');
  console.log(JSON.stringify(proyecto, null, 2));
  
  await mongoose.disconnect();
  process.exit(0);
}

ver();
