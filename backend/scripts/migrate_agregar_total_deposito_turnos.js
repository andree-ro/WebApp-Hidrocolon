// migrate_agregar_total_deposito_turnos.js
// Migración: Agregar campo total_ventas_deposito a turnos
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
        console.log('📝 Agregando campo total_ventas_deposito a turnos...');
        
        try {
            // Agregar columna total_ventas_deposito
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_ventas_deposito DECIMAL(10,2) DEFAULT 0.00 
                COMMENT 'Total de ventas por depósito bancario'
                AFTER total_ventas_transferencia
            `);
            console.log('✅ Campo total_ventas_deposito agregado exitosamente');
            
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  El campo total_ventas_deposito ya existe');
            } else {
                throw error;
            }
        }
        
        console.log('\n🎉 ¡Migración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

migrate()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });