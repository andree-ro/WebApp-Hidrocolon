// verificar_estructura_libro_bancos.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificar() {
    let connection = null;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Conectado a la base de datos\n');
        
        // Verificar si la tabla existe
        const [tables] = await connection.execute(`
            SHOW TABLES LIKE 'libro_bancos'
        `);
        
        if (tables.length === 0) {
            console.log('❌ La tabla libro_bancos NO existe');
            return;
        }
        
        console.log('📋 Estructura de la tabla libro_bancos:\n');
        
        // Obtener estructura completa
        const [columns] = await connection.execute('DESCRIBE libro_bancos');
        
        columns.forEach(col => {
            console.log(`   ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key.padEnd(5)} | ${col.Default || 'NULL'}`);
        });
        
        console.log('\n📊 Total de registros:');
        const [count] = await connection.execute('SELECT COUNT(*) as total FROM libro_bancos');
        console.log(`   ${count[0].total} operaciones registradas\n`);
        
        // Ver una muestra de datos
        if (count[0].total > 0) {
            console.log('📄 Muestra de datos (primeros 3 registros):\n');
            const [sample] = await connection.execute('SELECT * FROM libro_bancos ORDER BY fecha DESC LIMIT 3');
            console.log(JSON.stringify(sample, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verificar();