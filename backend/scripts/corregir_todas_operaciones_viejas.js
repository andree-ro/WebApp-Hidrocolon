// corregir_todas_operaciones_viejas.js
// Script para RESTAR 1 día a todas las operaciones antes del ID 307
const mysql = require('mysql2/promise');
require('dotenv').config();

async function corregir() {
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
        
        // ========================================================================
        // OBTENER TODAS LAS OPERACIONES VIEJAS (ID <= 306)
        // ========================================================================
        console.log('📊 Obteniendo operaciones viejas (ID <= 306)...\n');
        
        const [operaciones] = await connection.execute(`
            SELECT id, fecha, descripcion
            FROM libro_bancos
            WHERE id <= 306
            ORDER BY id ASC
        `);
        
        console.log(`   ✅ ${operaciones.length} operaciones encontradas\n`);
        console.log('🔄 Corrigiendo fechas (RESTANDO 1 día)...\n');
        
        let corregidas = 0;
        
        for (const op of operaciones) {
            // Convertir fecha
            let fechaActual;
            if (op.fecha instanceof Date) {
                fechaActual = new Date(op.fecha);
            } else {
                fechaActual = new Date(op.fecha + 'T12:00:00Z');
            }
            
            // RESTAR 1 día
            fechaActual.setDate(fechaActual.getDate() - 1);
            
            // Formatear como YYYY-MM-DD
            const year = fechaActual.getUTCFullYear();
            const month = String(fechaActual.getUTCMonth() + 1).padStart(2, '0');
            const day = String(fechaActual.getUTCDate()).padStart(2, '0');
            const fechaNueva = `${year}-${month}-${day}`;
            
            // Actualizar
            await connection.execute(`
                UPDATE libro_bancos
                SET fecha = ?
                WHERE id = ?
            `, [fechaNueva, op.id]);
            
            corregidas++;
            
            // Mostrar primeros 10 ejemplos
            if (corregidas <= 10) {
                console.log(`✅ ID ${op.id}: ${op.fecha} → ${fechaNueva}`);
            }
            
            // Mostrar progreso cada 50
            if (corregidas % 50 === 0) {
                console.log(`   📝 Corregidas ${corregidas} operaciones...`);
            }
        }
        
        console.log(`\n✅ Total corregidas: ${corregidas} operaciones`);
        
        // ========================================================================
        // RECALCULAR SALDOS
        // ========================================================================
        console.log('\n🔄 Recalculando saldos...');
        
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
        `);
        
        let saldoActual = parseFloat(saldoInicial[0].saldo_inicial);
        
        const [todasOperaciones] = await connection.execute(`
            SELECT id, ingreso, egreso
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
        `);
        
        for (const operacion of todasOperaciones) {
            saldoActual = saldoActual + parseFloat(operacion.ingreso) - parseFloat(operacion.egreso);
            
            await connection.execute(`
                UPDATE libro_bancos 
                SET saldo_bancos = ?
                WHERE id = ?
            `, [saldoActual, operacion.id]);
        }
        
        console.log(`   ✅ Saldos recalculados`);
        console.log(`   📊 Saldo final: Q${saldoActual.toFixed(2)}`);
        
        // ========================================================================
        // MOSTRAR RESUMEN
        // ========================================================================
        console.log('\n📊 Verificando últimas 5 fechas...\n');
        
        const [ultimasFechas] = await connection.execute(`
            SELECT fecha, COUNT(*) as cantidad
            FROM libro_bancos
            GROUP BY fecha
            ORDER BY fecha DESC
            LIMIT 5
        `);
        
        ultimasFechas.forEach(f => {
            console.log(`   ${f.fecha} | ${f.cantidad} operaciones`);
        });
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Corrección completada!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${corregidas} operaciones corregidas (RESTADO 1 DÍA)`);
        console.log('✅ Saldos recalculados correctamente');
        console.log('✅ Ahora todas las fechas deben estar correctas\n');
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

corregir()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });