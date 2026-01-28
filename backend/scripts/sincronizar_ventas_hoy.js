// sincronizar_ventas_hoy.js
// Script para sincronizar las ventas del día de hoy al libro de bancos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function sincronizarVentasHoy() {
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
        // 1. DEFINIR FECHA DE HOY (28 de enero 2026)
        // ========================================================================
        const hoy = '2026-01-28';
        console.log(`📅 Sincronizando ventas del día: ${hoy}\n`);
        
        // ========================================================================
        // 2. BUSCAR VENTAS DE HOY QUE NO ESTÁN EN LIBRO DE BANCOS
        // ========================================================================
        console.log('🔍 Buscando ventas de hoy no sincronizadas...');
        
        // Obtener todas las facturas ya sincronizadas de hoy
        const [facturasYaSincronizadas] = await connection.execute(`
            SELECT DISTINCT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(descripcion, ' - ', 1), 'Venta ', -1) as numero_factura
            FROM libro_bancos
            WHERE fecha = ? AND clasificacion = 'Ventas'
        `, [hoy]);
        
        const facturasSync = facturasYaSincronizadas.map(f => f.numero_factura);
        console.log(`   ℹ️  Facturas ya sincronizadas: ${facturasSync.length}`);
        
        // Obtener todas las ventas de hoy
        const [ventasHoy] = await connection.execute(`
            SELECT 
                v.id,
                v.numero_factura,
                v.cliente_nombre,
                v.total,
                v.metodo_pago,
                v.fecha_creacion
            FROM ventas v
            WHERE DATE(v.fecha_creacion) = ?
            ORDER BY v.fecha_creacion ASC
        `, [hoy]);
        
        console.log(`   📊 Total de ventas de hoy en BD: ${ventasHoy.length}`);
        
        // Filtrar las que NO están sincronizadas
        const ventasPendientes = ventasHoy.filter(v => 
            !facturasSync.includes(v.numero_factura)
        );
        
        console.log(`   ✅ Ventas pendientes de sincronizar: ${ventasPendientes.length}\n`);
        
        if (ventasPendientes.length === 0) {
            console.log('ℹ️  No hay ventas pendientes de sincronizar.\n');
            await connection.commit();
            await connection.end();
            return;
        }
        
        // ========================================================================
        // 3. OBTENER SALDO ACTUAL DEL LIBRO DE BANCOS
        // ========================================================================
        const [ultimoSaldo] = await connection.execute(`
            SELECT saldo_bancos FROM libro_bancos 
            ORDER BY fecha DESC, id DESC 
            LIMIT 1
        `);
        
        let saldoActual = parseFloat(ultimoSaldo[0].saldo_bancos);
        console.log(`📊 Saldo actual antes de sincronizar: Q${saldoActual.toFixed(2)}\n`);
        
        // ========================================================================
        // 4. OBTENER USUARIO ADMINISTRADOR
        // ========================================================================
        const [usuarios] = await connection.execute(`
            SELECT id FROM usuarios WHERE rol_id = 1 LIMIT 1
        `);
        const usuarioId = usuarios[0].id;
        
        // ========================================================================
        // 5. REGISTRAR CADA VENTA EN LIBRO DE BANCOS
        // ========================================================================
        console.log('💰 Registrando ventas en libro de bancos...\n');
        
        for (const venta of ventasPendientes) {
            const descripcion = `Venta ${venta.numero_factura} - ${venta.cliente_nombre} (${venta.metodo_pago})`;
            const ingreso = parseFloat(venta.total);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                hoy,
                venta.cliente_nombre,
                descripcion,
                'Ventas',
                'ingreso',
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
            
            console.log(`   ✅ ${venta.numero_factura} | ${venta.cliente_nombre} | Q${ingreso.toFixed(2)}`);
        }
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Sincronización completada!');
        console.log('='.repeat(60));
        console.log(`\n✅ ${ventasPendientes.length} ventas sincronizadas`);
        console.log(`📊 Saldo final actualizado: Q${saldoActual.toFixed(2)}\n`);
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error en sincronización:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

sincronizarVentasHoy()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });