// eliminar_ventas_anuladas_libro.js
// Script para eliminar del libro de bancos las ventas que están anuladas
const mysql = require('mysql2/promise');
require('dotenv').config();

async function limpiar() {
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
        
        await connection.beginTransaction();
        
        console.log('✅ Conexión establecida\n');
        
        // ========================================================================
        // 1. BUSCAR VENTAS ANULADAS
        // ========================================================================
        console.log('🔍 Buscando ventas anuladas...\n');
        
        const [ventasAnuladas] = await connection.execute(`
            SELECT id, numero_factura, total, observaciones
            FROM ventas
            WHERE observaciones LIKE '%ANULADA:%'
            ORDER BY id
        `);
        
        console.log(`   ✅ ${ventasAnuladas.length} ventas anuladas encontradas\n`);
        
        if (ventasAnuladas.length === 0) {
            console.log('✅ No hay ventas anuladas para limpiar del libro de bancos\n');
            await connection.end();
            return;
        }
        
        // Mostrar ventas anuladas
        console.log('📋 VENTAS ANULADAS:\n');
        ventasAnuladas.forEach(v => {
            console.log(`   ${v.numero_factura} | Q${parseFloat(v.total).toFixed(2)}`);
        });
        console.log('');
        
        // ========================================================================
        // 2. ELIMINAR REGISTROS DEL LIBRO DE BANCOS
        // ========================================================================
        console.log('🗑️ Eliminando registros del libro de bancos...\n');
        
        let eliminados = 0;
        
        for (const venta of ventasAnuladas) {
            const [resultado] = await connection.execute(`
                DELETE FROM libro_bancos
                WHERE clasificacion = 'Ventas'
                AND descripcion LIKE ?
            `, [`%${venta.numero_factura}%`]);
            
            if (resultado.affectedRows > 0) {
                eliminados++;
                console.log(`   ✅ ${venta.numero_factura} eliminado del libro de bancos`);
            }
        }
        
        console.log(`\n✅ Total eliminados: ${eliminados} registros\n`);
        
        // ========================================================================
        // 3. RECALCULAR SALDOS
        // ========================================================================
        console.log('🔄 Recalculando saldos del libro de bancos...\n');
        
        // Obtener saldo inicial
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
        `);
        
        let saldoActual = parseFloat(saldoInicial[0].saldo_inicial);
        
        // Obtener todas las operaciones ordenadas
        const [operaciones] = await connection.execute(`
            SELECT id, ingreso, egreso
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
        `);
        
        // Recalcular cada saldo
        for (const operacion of operaciones) {
            saldoActual = saldoActual + parseFloat(operacion.ingreso) - parseFloat(operacion.egreso);
            
            await connection.execute(`
                UPDATE libro_bancos 
                SET saldo_bancos = ?
                WHERE id = ?
            `, [saldoActual, operacion.id]);
        }
        
        console.log(`   ✅ Saldos recalculados`);
        console.log(`   📊 Saldo final: Q${saldoActual.toFixed(2)}\n`);
        
        await connection.commit();
        
        console.log('='.repeat(60));
        console.log('🎉 ¡Limpieza completada!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${eliminados} ventas anuladas eliminadas del libro de bancos`);
        console.log('✅ Saldos recalculados correctamente\n');
        
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

limpiar()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });