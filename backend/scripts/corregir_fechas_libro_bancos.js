// corregir_fechas_libro_bancos.js
// Script para corregir fechas que están un día atrás en libro de bancos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function corregirFechas() {
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
        console.log('📅 Iniciando corrección de fechas...\n');
        
        // ========================================================================
        // 1. OBTENER TODAS LAS OPERACIONES DEL LIBRO DE BANCOS
        // ========================================================================
        console.log('📊 Obteniendo operaciones...');
        
        const [operaciones] = await connection.execute(`
            SELECT id, fecha, descripcion, clasificacion
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
        `);
        
        console.log(`   ✅ ${operaciones.length} operaciones encontradas\n`);
        
        // ========================================================================
        // 2. CORREGIR CADA FECHA (SUMAR 1 DÍA)
        // ========================================================================
        console.log('🔄 Corrigiendo fechas (sumando 1 día a cada operación)...\n');
        
        let corregidas = 0;
        
        for (const op of operaciones) {
            // Convertir fecha de MySQL a Date
            const fechaOriginal = op.fecha;
            
            // Si la fecha es un objeto Date de MySQL, usar directamente
            let fechaVieja;
            if (fechaOriginal instanceof Date) {
                fechaVieja = new Date(fechaOriginal);
            } else {
                // Si es string, convertir agregando hora para evitar problemas de zona horaria
                fechaVieja = new Date(fechaOriginal + 'T12:00:00Z');
            }
            
            // Sumar 1 día
            fechaVieja.setDate(fechaVieja.getDate() + 1);
            
            // Formatear como YYYY-MM-DD usando UTC para evitar problemas de zona horaria
            const year = fechaVieja.getUTCFullYear();
            const month = String(fechaVieja.getUTCMonth() + 1).padStart(2, '0');
            const day = String(fechaVieja.getUTCDate()).padStart(2, '0');
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
                console.log(`   📝 Ejemplo: ${fechaOriginal} → ${fechaNueva}`);
            }
            
            // Mostrar progreso cada 50 operaciones
            if (corregidas % 50 === 0) {
                console.log(`   📝 Corregidas ${corregidas} operaciones...`);
            }
        }
        
        console.log(`\n   ✅ Total corregidas: ${corregidas} operaciones`);
        
        // ========================================================================
        // 3. MOSTRAR RESUMEN DE FECHAS CORREGIDAS
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
            const fecha = new Date(row.fecha + 'T00:00:00');
            const fechaFormateada = fecha.toLocaleDateString('es-GT', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            console.log(`   ${fechaFormateada} | ${row.cantidad_operaciones} ops | Ingresos: Q${parseFloat(row.total_ingresos).toFixed(2)} | Egresos: Q${parseFloat(row.total_egresos).toFixed(2)}`);
        });
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Fechas corregidas exitosamente!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${corregidas} operaciones actualizadas`);
        console.log('✅ Todas las fechas ahora muestran el día correcto\n');
        
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

corregirFechas()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });