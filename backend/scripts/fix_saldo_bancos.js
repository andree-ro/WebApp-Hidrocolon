const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.sucursalZ9' });

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  await conn.execute('ALTER TABLE libro_bancos ADD COLUMN turno_id INT NULL');
  console.log('✅ Columna turno_id agregada a libro_bancos');
  await conn.end();
}

fix().catch(console.error);