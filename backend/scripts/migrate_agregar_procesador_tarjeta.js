// migrate_agregar_procesador_tarjeta.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection = null;

    try {
        console.log('🔧 Conectando a la base de datos...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conexión establecida');

        const columnas = [
            {
                nombre: 'procesador_tarjeta',
                definicion: `ENUM('neonet', 'bac') NULL COMMENT 'Procesador de tarjeta: neonet o bac'`
            },
            {
                nombre: 'cuotas_tarjeta',
                definicion: `TINYINT NULL COMMENT 'Número de cuotas: 1, 3 o 6'`
            },
            {
                nombre: 'comision_bancaria_monto',
                definicion: `DECIMAL(10,2) NULL DEFAULT 0.00 COMMENT 'Monto en Q de la comisión bancaria cobrada'`
            },
            {
                nombre: 'comision_bancaria_porcentaje',
                definicion: `DECIMAL(5,2) NULL DEFAULT 0.00 COMMENT 'Porcentaje de comisión bancaria aplicado'`
            }
        ];

        for (const col of columnas) {
            const [rows] = await connection.execute(`
                SELECT COUNT(*) as existe
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'ventas'
                AND COLUMN_NAME = ?
            `, [col.nombre]);

            if (rows[0].existe > 0) {
                console.log(`⏭️  Columna ${col.nombre} ya existe, omitiendo...`);
            } else {
                await connection.execute(`ALTER TABLE ventas ADD COLUMN ${col.nombre} ${col.definicion}`);
                console.log(`✅ Columna ${col.nombre} agregada`);
            }
        }

        console.log('\n✅ Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

migrate();