const mysql = require('mysql2/promise');
require('dotenv').config();

async function mostrar() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  for (const tabla of ['costos_operacion', 'gastos_operacion', 'otros_gastos_financieros']) {
    const [rows] = await conn.query(`DESCRIBE ${tabla}`);
    console.log(`\n=== ${tabla} ===`);
    rows.forEach(r => console.log(`  ${r.Field} - ${r.Type}`));
  }
  await conn.end();
}

mostrar().catch(console.error);