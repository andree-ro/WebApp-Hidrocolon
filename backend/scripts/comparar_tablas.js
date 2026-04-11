const mysql = require('mysql2/promise');
require('dotenv').config();

async function comparar() {
  const connVieja = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  require('dotenv').config({ path: '.env.sucursalZ9', override: true });

  const connNueva = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const [tablasViejas] = await connVieja.query('SHOW TABLES');
  const [tablasNuevas] = await connNueva.query('SHOW TABLES');

  const viejas = tablasViejas.map(t => Object.values(t)[0]);
  const nuevas = tablasNuevas.map(t => Object.values(t)[0]);

  console.log('\n=== TABLAS EN ORIGINAL PERO NO EN NUEVA ===');
  viejas.filter(t => !nuevas.includes(t)).forEach(t => console.log(`  ❌ ${t}`));

  console.log('\n=== TABLAS EN NUEVA PERO NO EN ORIGINAL ===');
  nuevas.filter(t => !viejas.includes(t)).forEach(t => console.log(`  ⚠️ ${t}`));

  console.log('\n=== COMPARANDO COLUMNAS DE TABLAS COMUNES ===');
  for (const tabla of viejas.filter(t => nuevas.includes(t))) {
    const [colsViejas] = await connVieja.query(`DESCRIBE ${tabla}`);
    const [colsNuevas] = await connNueva.query(`DESCRIBE ${tabla}`);
    
    const nombresViejas = colsViejas.map(c => c.Field);
    const nombresNuevas = colsNuevas.map(c => c.Field);
    
    const faltantes = nombresViejas.filter(c => !nombresNuevas.includes(c));
    if (faltantes.length > 0) {
      console.log(`\n  ❌ ${tabla} - columnas faltantes: ${faltantes.join(', ')}`);
    } else {
      console.log(`  ✅ ${tabla}`);
    }
  }

  await connVieja.end();
  await connNueva.end();
}

comparar().catch(console.error);