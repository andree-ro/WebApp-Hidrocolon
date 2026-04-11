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

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS costos_operacion (
      id INT PRIMARY KEY AUTO_INCREMENT,
      concepto VARCHAR(200) NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      fecha_costo DATE NOT NULL,
      descripcion TEXT,
      turno_id INT,
      usuario_registro_id INT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Tabla costos_operacion creada');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS gastos_operacion (
      id INT PRIMARY KEY AUTO_INCREMENT,
      concepto VARCHAR(200) NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      fecha_gasto DATE NOT NULL,
      descripcion TEXT,
      turno_id INT,
      usuario_registro_id INT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Tabla gastos_operacion creada');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS otros_gastos_financieros (
      id INT PRIMARY KEY AUTO_INCREMENT,
      concepto VARCHAR(200) NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      fecha_gasto DATE NOT NULL,
      descripcion TEXT,
      turno_id INT,
      usuario_registro_id INT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Tabla otros_gastos_financieros creada');

  await conn.end();
  console.log('🎉 Listo!');
}

fix().catch(console.error);