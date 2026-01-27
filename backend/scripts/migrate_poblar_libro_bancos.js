// migrate_poblar_libro_bancos.js
// Migración para poblar el libro de bancos con todos los datos históricos del sistema
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
        
        await connection.beginTransaction();
        
        console.log('✅ Conexión establecida\n');
        
        // Verificar saldo inicial
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial FROM saldo_inicial_bancos WHERE activo = 1 LIMIT 1
        `);
        
        if (saldoInicial.length === 0) {
            console.log('❌ ERROR: Debes registrar un saldo inicial antes de ejecutar esta migración');
            console.log('   Por favor, ve a la aplicación y registra el saldo inicial primero.');
            return;
        }
        
        let saldoActual = parseFloat(saldoInicial[0].saldo_inicial);
        console.log(`📊 Saldo inicial: Q${saldoActual.toFixed(2)}\n`);
        
        // Obtener usuario administrador para registrar operaciones
        const [usuarios] = await connection.execute(`
            SELECT id FROM usuarios WHERE rol_id = 1 LIMIT 1
        `);
        const usuarioId = usuarios[0].id;
        
        console.log('🚀 Iniciando migración de datos históricos...\n');
        
        // ========================================================================
        // 1. VENTAS (INGRESOS)
        // ========================================================================
        console.log('💰 Migrando VENTAS...');
        const [ventas] = await connection.execute(`
            SELECT 
                id,
                DATE(fecha_creacion) as fecha,
                numero_factura,
                cliente_nombre,
                total,
                metodo_pago,
                efectivo_recibido,
                tarjeta_monto,
                transferencia_monto,
                deposito_monto
            FROM ventas
            ORDER BY fecha_creacion ASC
        `);
        
        for (const venta of ventas) {
            const descripcion = `Venta ${venta.numero_factura} - ${venta.cliente_nombre || 'Cliente general'} (${venta.metodo_pago})`;
            const ingreso = parseFloat(venta.total);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                venta.fecha,
                venta.cliente_nombre || 'Cliente general',
                descripcion,
                'Ventas',
                'ingreso',
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
        }
        console.log(`   ✅ ${ventas.length} ventas migradas`);
        
        // ========================================================================
        // 2. GASTOS (EGRESOS)
        // ========================================================================
        console.log('💸 Migrando GASTOS...');
        const [gastos] = await connection.execute(`
            SELECT 
                g.id,
                DATE(g.fecha_creacion) as fecha,
                g.descripcion,
                g.monto,
                g.tipo_gasto
            FROM gastos g
            ORDER BY g.fecha_creacion ASC
        `);
        
        for (const gasto of gastos) {
            const descripcion = `Gasto: ${gasto.descripcion} (${gasto.tipo_gasto})`;
            const egreso = parseFloat(gasto.monto);
            saldoActual -= egreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                gasto.fecha,
                'Gastos operativos',
                descripcion,
                `Gastos - ${gasto.tipo_gasto}`,
                'egreso',
                0.00,
                egreso,
                saldoActual,
                usuarioId
            ]);
        }
        console.log(`   ✅ ${gastos.length} gastos migrados`);
        
        // ========================================================================
        // 3. DEPÓSITOS (INGRESOS)
        // ========================================================================
        console.log('🏦 Migrando DEPÓSITOS...');
        const [depositos] = await connection.execute(`
            SELECT 
                id,
                DATE(fecha_creacion) as fecha,
                numero_deposito,
                paciente_nombre,
                monto
            FROM depositos
            ORDER BY fecha_creacion ASC
        `);
        
        for (const deposito of depositos) {
            const descripcion = `Depósito ${deposito.numero_deposito} - ${deposito.paciente_nombre}`;
            const ingreso = parseFloat(deposito.monto);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, numero_deposito, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                deposito.fecha,
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
        }
        console.log(`   ✅ ${depositos.length} depósitos migrados`);
        
        // ========================================================================
        // 4. TRANSFERENCIAS (INGRESOS)
        // ========================================================================
        console.log('💱 Migrando TRANSFERENCIAS...');
        const [transferencias] = await connection.execute(`
            SELECT 
                id,
                DATE(fecha_creacion) as fecha,
                numero_boleta,
                paciente_nombre,
                monto
            FROM transferencias
            ORDER BY fecha_creacion ASC
        `);
        
        for (const transferencia of transferencias) {
            const descripcion = `Transferencia ${transferencia.numero_boleta} - ${transferencia.paciente_nombre}`;
            const ingreso = parseFloat(transferencia.monto);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                transferencia.fecha,
                transferencia.paciente_nombre,
                descripcion,
                'Transferencias bancarias',
                'ingreso',
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
        }
        console.log(`   ✅ ${transferencias.length} transferencias migradas`);
        
        // ========================================================================
        // 5. VOUCHERS (INGRESOS)
        // ========================================================================
        console.log('🎫 Migrando VOUCHERS...');
        const [vouchers] = await connection.execute(`
            SELECT 
                id,
                DATE(fecha_creacion) as fecha,
                numero_voucher,
                paciente_nombre,
                monto
            FROM vouchers_tarjeta
            ORDER BY fecha_creacion ASC
        `);
        
        for (const voucher of vouchers) {
            const descripcion = `Voucher tarjeta ${voucher.numero_voucher} - ${voucher.paciente_nombre}`;
            const ingreso = parseFloat(voucher.monto);
            saldoActual += ingreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                voucher.fecha,
                voucher.paciente_nombre,
                descripcion,
                'Vouchers tarjeta',
                'ingreso',
                ingreso,
                0.00,
                saldoActual,
                usuarioId
            ]);
        }
        console.log(`   ✅ ${vouchers.length} vouchers migrados`);
        
        // ========================================================================
        // 6. PAGOS DE COMISIONES (EGRESOS)
        // ========================================================================
        console.log('💰 Migrando PAGOS DE COMISIONES...');
        const [pagosComisiones] = await connection.execute(`
            SELECT 
                pc.id,
                pc.fecha_pago as fecha,
                pc.monto_total,
                d.nombre as doctora_nombre
            FROM pagos_comisiones pc
            JOIN doctoras d ON pc.doctora_id = d.id
            WHERE pc.estado = 'pagado'
            ORDER BY pc.fecha_pago ASC
        `);
        
        for (const pago of pagosComisiones) {
            const descripcion = `Pago de comisiones - ${pago.doctora_nombre}`;
            const egreso = parseFloat(pago.monto_total);
            saldoActual -= egreso;
            
            await connection.execute(`
                INSERT INTO libro_bancos (
                    fecha, beneficiario, descripcion, clasificacion,
                    tipo_operacion, ingreso, egreso, saldo_bancos, usuario_registro_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                pago.fecha,
                pago.doctora_nombre,
                descripcion,
                'Pagos de comisiones',
                'egreso',
                0.00,
                egreso,
                saldoActual,
                usuarioId
            ]);
        }
        console.log(`   ✅ ${pagosComisiones.length} pagos de comisiones migrados`);
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ¡Migración completada exitosamente!');
        console.log('='.repeat(60));
        console.log(`\n📊 Saldo final en libro de bancos: Q${saldoActual.toFixed(2)}\n`);
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('\n❌ Error en migración:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

migrate()
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });