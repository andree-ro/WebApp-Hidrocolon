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
  const [rows] = await conn.query('SHOW TABLES');
  rows.forEach(t => console.log(Object.values(t)[0]));
  await conn.end();
}

mostrar().catch(console.error);