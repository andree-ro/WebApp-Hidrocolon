// encontrar_primer_id_correcto.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function encontrar() {
    let connection = null;
    
    try {
        console.log('🔧 Conectando a la base de datos...\n');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Conexión establecida\n');
        
        // ========================================================================
        // VER ÚLTIMAS 15 OPERACIONES
        // ========================================================================
        console.log('📊 ÚLTIMAS 15 OPERACIONES EN LIBRO DE BANCOS:\n');
        
        const [ops] = await connection.execute(`
            SELECT id, fecha, clasificacion, descripcion
            FROM libro_bancos
            ORDER BY id DESC
            LIMIT 15
        `);
        
        console.log('ID'.padEnd(6) + '| FECHA'.padEnd(13) + '| TIPO'.padEnd(25) + '| DESCRIPCIÓN');
        console.log('='.repeat(100));
        
        ops.forEach(op => {
            const fecha = op.fecha instanceof Date 
                ? op.fecha.toISOString().split('T')[0]
                : op.fecha;
            console.log(
                String(op.id).padEnd(6) + 
                '| ' + fecha.padEnd(13) + 
                '| ' + op.clasificacion.substring(0, 23).padEnd(25) + 
                '| ' + op.descripcion.substring(0, 50)
            );
        });
        
        console.log('\n' + '='.repeat(100));
        console.log('🔍 PREGUNTA IMPORTANTE:');
        console.log('='.repeat(100));
        console.log('\n¿Cuál es el PRIMER ID donde las fechas están CORRECTAS?');
        console.log('(Las operaciones más recientes, después de arreglar el código)\n');
        console.log('👉 Mira la lista de arriba y dime cuál es el primer ID correcto.\n');
        
        await connection.end();
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        if (connection) await connection.end();
    }
}

encontrar();