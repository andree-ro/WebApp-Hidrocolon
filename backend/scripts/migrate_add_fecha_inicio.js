// Migración: Agregar campo fecha_inicio a pagos_comisiones
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
        console.log('🔧 Agregando campo fecha_inicio a pagos_comisiones...');
        
        // Agregar columna fecha_inicio
        await connection.execute(`
            ALTER TABLE pagos_comisiones 
            ADD COLUMN fecha_inicio DATE NULL COMMENT 'Fecha desde la cual se calculan comisiones' 
            AFTER doctora_id
        `);
        
        console.log('✅ Campo fecha_inicio agregado exitosamente');
        
        // Actualizar registros existentes: copiar fecha_corte a fecha_inicio
        await connection.execute(`
            UPDATE pagos_comisiones 
            SET fecha_inicio = fecha_corte 
            WHERE fecha_inicio IS NULL
        `);
        
        console.log('✅ Registros existentes actualizados');
        
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  El campo fecha_inicio ya existe');
        } else {
            console.error('❌ Error en migración:', error);
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

migrate()
    .then(() => {
        console.log('✅ Migración completada exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });