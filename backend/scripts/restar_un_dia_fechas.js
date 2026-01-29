// restar_un_dia_fechas.js
// Script para RESTAR 1 día a todas las fechas del libro de bancos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function restarUnDia() {
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
        
        await connection.beginTransaction();
        
        console.log('✅ Conexión establecida\n');
        console.log('📅 Iniciando corrección de fechas (RESTANDO 1 DÍA)...\n');
        
        // ========================================================================
        // 1. OBTENER TODAS LAS OPERACIONES
        // ========================================================================
        console.log('📊 Obteniendo operaciones...');
        
        const [operaciones] = await connection.execute(`
            SELECT id, fecha, descripcion
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
        `);
        
        console.log(`   ✅ ${operaciones.length} operaciones encontradas\n`);
        
        // ========================================================================
        // 2. RESTAR 1 DÍA A CADA FECHA
        // ========================================================================
        console.log('🔄 Corrigiendo fechas (RESTANDO 1 día a cada operación)...\n');
        
        let corregidas = 0;
        
        for (const op of operaciones) {
            // Obtener fecha actual
            let fechaActual;
            if (op.fecha instanceof Date) {
                fechaActual = new Date(op.fecha);
            } else {
                fechaActual = new Date(op.fecha + 'T12:00:00Z');
            }
            
            // RESTAR 1 día
            fechaActual.setDate(fechaActual.getDate() - 1);
            
            // Formatear como YYYY-MM-DD usando UTC
            const year = fechaActual.getUTCFullYear();
            const month = String(fechaActual.getUTCMonth() + 1).padStart(2, '0');
            const day = String(fechaActual.getUTCDate()).padStart(2, '0');
            const fechaNueva = `${year}-${month}-${day}`;
            
            // Actualizar en la base de datos
            await connection.execute(`
                UPDATE libro_bancos
                SET fecha = ?
                WHERE id = ?
            `, [fechaNueva, op.id]);
            
            corregidas++;
            
            // Mostrar algunos ejemplos
            if (corregidas <= 5) {
                console.log(`   📝 Ejemplo: ${op.fecha} → ${fechaNueva}`);
            }
            
            // Mostrar progreso cada 50 operaciones
            if (corregidas % 50 === 0) {
                console.log(`   📝 Corregidas ${corregidas} operaciones...`);
            }
        }
        
        console.log(`\n   ✅ Total corregidas: ${corregidas} operaciones`);
        
        // ========================================================================
        // 3. MOSTRAR RESUMEN
        // ========================================================================
        console.log('\n📊 Resumen de fechas después de la corrección:');
        
        const [resumenFechas] = await connection.execute(`
            SELECT 
                fecha,
                COUNT(*) as cantidad_operaciones,
                SUM(ingreso) as total_ingresos,
                SUM(egreso) as total_egresos
            FROM libro_bancos
            GROUP BY fecha
            ORDER BY fecha DESC
            LIMIT 10
        `);
        
        console.log('\n   Últimas 10 fechas:');
        resumenFechas.forEach(row => {
            console.log(`   ${row.fecha} | ${row.cantidad_operaciones} ops | Ingresos: Q${parseFloat(row.total_ingresos).toFixed(2)} | Egresos: Q${parseFloat(row.total_egresos).toFixed(2)}`);
        });
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Fechas corregidas exitosamente!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${corregidas} operaciones actualizadas (RESTADO 1 DÍA)`);
        console.log('✅ Todas las fechas ahora están correctas\n');
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error corrigiendo fechas:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

restarUnDia()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });