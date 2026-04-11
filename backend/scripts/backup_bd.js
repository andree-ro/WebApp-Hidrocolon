const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function backup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const [tablas] = await conn.query('SHOW TABLES');
  let sql = '';

  for (const tabla of tablas) {
    const nombreTabla = Object.values(tabla)[0];
    
    // Estructura
    const [create] = await conn.query(`SHOW CREATE TABLE ${nombreTabla}`);
    sql += `\n\nDROP TABLE IF EXISTS ${nombreTabla};\n`;
    sql += Object.values(create[0])[1] + ';\n';
    
    // Datos
    const [rows] = await conn.query(`SELECT * FROM ${nombreTabla}`);
    if (rows.length > 0) {
      const cols = Object.keys(rows[0]).join(', ');
      for (const row of rows) {
        const vals = Object.values(row).map(v => 
          v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
        ).join(', ');
        sql += `INSERT INTO ${nombreTabla} (${cols}) VALUES (${vals});\n`;
      }
    }
  }

  const filename = `backup_zona3_${new Date().toISOString().split('T')[0]}.sql`;
  fs.writeFileSync(filename, sql);
  console.log(`✅ Backup guardado en: ${filename}`);
  await conn.end();
}

backup().catch(console.error);