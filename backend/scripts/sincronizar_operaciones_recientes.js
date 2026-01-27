// sincronizar_operaciones_recientes.js
// Script para sincronizar operaciones recientes que no están en libro de bancos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function sincronizar() {
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
        
        // Obtener saldo inicial
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
        `);
        
        if (saldoInicial.length === 0) {
            console.log('❌ ERROR: No hay saldo inicial registrado');
            return;
        }
        
        // Obtener usuario administrador
        const [usuarios] = await connection.execute(`
            SELECT id FROM usuarios WHERE rol_id = 1 LIMIT 1
        `);
        const usuarioId = usuarios[0].id;
        
        // Obtener el último saldo del libro de bancos
        const [ultimoSaldo] = await connection.execute(`
            SELECT saldo_bancos FROM libro_bancos 
            ORDER BY fecha DESC, id DESC 
            LIMIT 1
        `);
        
        let saldoActual = ultimoSaldo.length > 0 
            ? parseFloat(ultimoSaldo[0].saldo_bancos)
            : parseFloat(saldoInicial[0].saldo_inicial);
        
        console.log(`📊 Saldo actual en libro de bancos: Q${saldoActual.toFixed(2)}\n`);
        
        // Fecha de hoy
        const hoy = new Date().toISOString().split('T')[0];
        console.log(`📅 Sincronizando operaciones del día: ${hoy}\n`);
        
        let totalSincronizadas = 0;
        
        // ========================================================================
        // 1. SINCRONIZAR VENTAS DE HOY
        // ========================================================================
        console.log('💰 Buscando ventas de hoy no sincronizadas...');
        
        // Obtener IDs de ventas ya sincronizadas
        const [ventasSincronizadas] = await connection.execute(`
            SELECT DISTINCT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(descripcion, ' - ', 1), 'Venta ', -1) as numero_factura
            FROM libro_bancos
            WHERE fecha = ? AND clasificacion = 'Ventas'
        `, [hoy]);
        
        const facturasYaSincronizadas = ventasSincronizadas.map(v => v.numero_factura);
        
        // Obtener todas las ventas de hoy
        const [todasVentasHoy] = await connection.execute(`
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
        
        // Filtrar las que no están sincronizadas
        const ventasHoy = todasVentasHoy.filter(v => 
            !facturasYaSincronizadas.includes(v.numero_factura)
        );
        
        for (const venta of ventasHoy) {
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
            
            totalSincronizadas++;
            console.log(`   ✅ Venta sincronizada: ${venta.numero_factura} - Q${ingreso.toFixed(2)}`);
        }
        
        if (ventasHoy.length === 0) {
            console.log('   ℹ️  No hay ventas pendientes de sincronizar');
        }
        
        // ========================================================================
        // 2. SINCRONIZAR GASTOS DE HOY
        // ========================================================================
        console.log('\n💸 Buscando gastos de hoy no sincronizados...');
        
        // Obtener IDs de gastos ya sincronizados
        const [gastosSincronizados] = await connection.execute(`
            SELECT id FROM libro_bancos
            WHERE fecha = ? AND clasificacion LIKE 'Gastos%'
        `, [hoy]);
        
        const idsGastosSincronizados = gastosSincronizados.map(g => g.id);
        
        // Obtener todos los gastos de hoy
        const [todosGastosHoy] = await connection.execute(`
            SELECT 
                g.id,
                g.descripcion,
                g.monto,
                g.tipo_gasto,
                g.fecha_creacion
            FROM gastos g
            WHERE DATE(g.fecha_creacion) = ?
            ORDER BY g.fecha_creacion ASC
        `, [hoy]);
        
        // Buscar manualmente los que no están sincronizados
        const gastosHoy = [];
        for (const gasto of todosGastosHoy) {
            const descripcionBuscar = `Gasto: ${gasto.descripcion}`;
            const [existe] = await connection.execute(`
                SELECT 1 FROM libro_bancos 
                WHERE fecha = ? 
                AND CAST(descripcion AS CHAR) LIKE CAST(? AS CHAR)
                LIMIT 1
            `, [hoy, descripcionBuscar + '%']);
            
            if (existe.length === 0) {
                gastosHoy.push(gasto);
            }
        }
        
        for (const gasto of gastosHoy) {
            const descripcion = `Gasto: ${gasto.descripcion} (${gasto.tipo_gasto})`;
            const egreso = parseFloat(gasto.monto);
            saldoActual -= egreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                hoy,
                'Gastos operativos',
                descripcion,
                `Gastos - ${gasto.tipo_gasto}`,
                'egreso',
                0.00,
                egreso,
                saldoActual,
                usuarioId
            ]);
            
            totalSincronizadas++;
            console.log(`   ✅ Gasto sincronizado: ${gasto.descripcion.substring(0, 50)} - Q${egreso.toFixed(2)}`);
        }
        
        if (gastosHoy.length === 0) {
            console.log('   ℹ️  No hay gastos pendientes de sincronizar');
        }
        
        // ========================================================================
        // 3. SINCRONIZAR DEPÓSITOS DE HOY
        // ========================================================================
        console.log('\n🏦 Buscando depósitos de hoy no sincronizados...');
        
        // Obtener números de depósito ya sincronizados
        const [depositosSincronizados] = await connection.execute(`
            SELECT numero_deposito FROM libro_bancos
            WHERE fecha = ? AND numero_deposito IS NOT NULL
        `, [hoy]);
        
        const numerosDepositosSincronizados = depositosSincronizados.map(d => d.numero_deposito);
        
        // Obtener todos los depósitos de hoy
        const [todosDepositosHoy] = await connection.execute(`
            SELECT 
                d.id,
                d.numero_deposito,
                d.paciente_nombre,
                d.monto,
                d.fecha_creacion
            FROM depositos d
            WHERE DATE(d.fecha_creacion) = ?
            ORDER BY d.fecha_creacion ASC
        `, [hoy]);
        
        // Filtrar los que no están sincronizados
        const depositosHoy = todosDepositosHoy.filter(d => 
            !numerosDepositosSincronizados.includes(d.numero_deposito)
        );
        
        for (const deposito of depositosHoy) {
            const descripcion = `Depósito ${deposito.numero_deposito} - ${deposito.paciente_nombre}`;
            const ingreso = parseFloat(deposito.monto);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, numero_deposito, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                hoy,
                deposito.paciente_nombre,
                descripcion,
                'Depósitos bancarios',
                'ingreso',
                deposito.numero_deposito,
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
            
            totalSincronizadas++;
            console.log(`   ✅ Depósito sincronizado: ${deposito.numero_deposito} - Q${ingreso.toFixed(2)}`);
        }
        
        if (depositosHoy.length === 0) {
            console.log('   ℹ️  No hay depósitos pendientes de sincronizar');
        }
        
        // ========================================================================
        // 4. SINCRONIZAR TRANSFERENCIAS DE HOY
        // ========================================================================
        console.log('\n💱 Buscando transferencias de hoy no sincronizadas...');
        
        // Obtener boletas de transferencias ya sincronizadas
        const [transferenciasSincronizadas] = await connection.execute(`
            SELECT DISTINCT
                SUBSTRING_INDEX(SUBSTRING_INDEX(descripcion, ' - ', 1), 'Transferencia ', -1) as numero_boleta
            FROM libro_bancos
            WHERE fecha = ? AND clasificacion = 'Transferencias bancarias'
        `, [hoy]);
        
        const boletasYaSincronizadas = transferenciasSincronizadas.map(t => t.numero_boleta);
        
        // Obtener todas las transferencias de hoy
        const [todasTransferenciasHoy] = await connection.execute(`
            SELECT 
                t.id,
                t.numero_boleta,
                t.paciente_nombre,
                t.monto,
                t.fecha_creacion
            FROM transferencias t
            WHERE DATE(t.fecha_creacion) = ?
            ORDER BY t.fecha_creacion ASC
        `, [hoy]);
        
        // Filtrar las que no están sincronizadas
        const transferenciasHoy = todasTransferenciasHoy.filter(t => 
            !boletasYaSincronizadas.includes(t.numero_boleta)
        );
        
        for (const transferencia of transferenciasHoy) {
            const descripcion = `Transferencia ${transferencia.numero_boleta} - ${transferencia.paciente_nombre}`;
            const ingreso = parseFloat(transferencia.monto);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                hoy,
                transferencia.paciente_nombre,
                descripcion,
                'Transferencias bancarias',
                'ingreso',
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
            
            totalSincronizadas++;
            console.log(`   ✅ Transferencia sincronizada: ${transferencia.numero_boleta} - Q${ingreso.toFixed(2)}`);
        }
        
        if (transferenciasHoy.length === 0) {
            console.log('   ℹ️  No hay transferencias pendientes de sincronizar');
        }
        
        // ========================================================================
        // 5. SINCRONIZAR VOUCHERS DE HOY
        // ========================================================================
        console.log('\n🎫 Buscando vouchers de hoy no sincronizados...');
        
        // Obtener números de voucher ya sincronizados
        const [vouchersSincronizados] = await connection.execute(`
            SELECT DISTINCT
                SUBSTRING_INDEX(SUBSTRING_INDEX(descripcion, ' - ', 1), 'Voucher tarjeta ', -1) as numero_voucher
            FROM libro_bancos
            WHERE fecha = ? AND clasificacion = 'Vouchers tarjeta'
        `, [hoy]);
        
        const vouchersYaSincronizados = vouchersSincronizados.map(v => v.numero_voucher);
        
        // Obtener todos los vouchers de hoy
        const [todosVouchersHoy] = await connection.execute(`
            SELECT 
                v.id,
                v.numero_voucher,
                v.paciente_nombre,
                v.monto,
                v.fecha_creacion
            FROM vouchers_tarjeta v
            WHERE DATE(v.fecha_creacion) = ?
            ORDER BY v.fecha_creacion ASC
        `, [hoy]);
        
        // Filtrar los que no están sincronizados
        const vouchersHoy = todosVouchersHoy.filter(v => 
            !vouchersYaSincronizados.includes(v.numero_voucher)
        );
        
        for (const voucher of vouchersHoy) {
            const descripcion = `Voucher tarjeta ${voucher.numero_voucher} - ${voucher.paciente_nombre}`;
            const ingreso = parseFloat(voucher.monto);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                hoy,
                voucher.paciente_nombre,
                descripcion,
                'Vouchers tarjeta',
                'ingreso',
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
            
            totalSincronizadas++;
            console.log(`   ✅ Voucher sincronizado: ${voucher.numero_voucher} - Q${ingreso.toFixed(2)}`);
        }
        
        if (vouchersHoy.length === 0) {
            console.log('   ℹ️  No hay vouchers pendientes de sincronizar');
        }
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Sincronización completada!');
        console.log('='.repeat(60));
        console.log(`\n📊 Total de operaciones sincronizadas: ${totalSincronizadas}`);
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

sincronizar()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });