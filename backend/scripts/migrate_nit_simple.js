// migrate_nit_simple.js
const mysql = require('mysql2/promise');
const path = require('path');

// Cargar .env desde la carpeta padre (backend)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
    let connection = null;
    
    try {
        
        if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
            throw new Error('❌ Faltan variables de entorno. Verifica el archivo .env en la carpeta backend');
        }
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Conectado a la base de datos\n');
        
        // Agregar columna nit
        console.log('🔧 Agregando campo nit...');
        try {
            await connection.execute(`
                ALTER TABLE pacientes 
                ADD COLUMN nit VARCHAR(20) NULL COMMENT 'NIT del paciente' 
                AFTER dpi
            `);
            console.log('✅ Campo nit agregado exitosamente');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  El campo nit ya existe');
            } else {
                throw error;
            }
        }
        
        // Agregar índice
        console.log('🔧 Agregando índice...');
        try {
            await connection.execute(`
                ALTER TABLE pacientes 
                ADD INDEX idx_nit (nit)
            `);
            console.log('✅ Índice agregado');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  El índice ya existe');
            } else {
                throw error;
            }
        }
        
        // Verificar estructura final
        const [columns] = await connection.execute('DESCRIBE pacientes');
        console.log('\n📋 Estructura final de tabla pacientes:');
        columns.forEach(col => {
            const marker = col.Field === 'nit' ? '✅ [NUEVO]' : '  ';
            console.log(`${marker} ${col.Field} - ${col.Type}`);
        });
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.code) console.error('Código:', error.code);
        if (error.sql) console.error('SQL:', error.sql);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

console.log('🚀 Ejecutando migración para agregar NIT a pacientes...\n');
migrate()
    .then(() => {
        console.log('\n✅ Migración completada exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });