// verificar_saldo_inicial.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificar() {
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
        // 1. SALDO INICIAL
        // ========================================================================
        const [saldoInicial] = await connection.execute(`
            SELECT saldo_inicial, fecha_registro 
            FROM saldo_inicial_bancos 
            WHERE activo = 1 
            LIMIT 1
        `);
        
        console.log('💰 SALDO INICIAL CONFIGURADO:\n');
        console.log(`   Q${parseFloat(saldoInicial[0].saldo_inicial).toFixed(2)}`);
        console.log(`   Registrado: ${saldoInicial[0].fecha_registro}\n`);
        
        const saldoInicialValor = parseFloat(saldoInicial[0].saldo_inicial);
        
        // ========================================================================
        // 2. PRIMERAS 10 OPERACIONES
        // ========================================================================
        const [primeras] = await connection.execute(`
            SELECT id, fecha, descripcion, ingreso, egreso, saldo_bancos
            FROM libro_bancos
            ORDER BY fecha ASC, id ASC
            LIMIT 10
        `);
        
        console.log('📊 PRIMERAS 10 OPERACIONES:\n');
        console.log('ID'.padEnd(6) + '| FECHA'.padEnd(13) + '| INGRESO'.padEnd(12) + '| EGRESO'.padEnd(12) + '| SALDO'.padEnd(12) + '| DESCRIPCIÓN');
        console.log('='.repeat(100));
        
        let saldoEsperado = saldoInicialValor;
        
        primeras.forEach(op => {
            saldoEsperado = saldoEsperado + parseFloat(op.ingreso) - parseFloat(op.egreso);
            const saldoBD = parseFloat(op.saldo_bancos);
            const coincide = Math.abs(saldoEsperado - saldoBD) < 0.01 ? '✅' : '❌';
            
            const fecha = op.fecha instanceof Date 
                ? op.fecha.toISOString().split('T')[0]
                : op.fecha;
            
            console.log(
                String(op.id).padEnd(6) + 
                '| ' + fecha.padEnd(13) + 
                '| Q' + parseFloat(op.ingreso).toFixed(2).padEnd(10) + 
                '| Q' + parseFloat(op.egreso).toFixed(2).padEnd(10) + 
                '| Q' + saldoBD.toFixed(2).padEnd(10) + 
                '| ' + op.descripcion.substring(0, 30)
            );
            console.log(`   Esperado: Q${saldoEsperado.toFixed(2)} ${coincide}`);
        });
        
        // ========================================================================
        // 3. ÚLTIMA OPERACIÓN
        // ========================================================================
        const [ultima] = await connection.execute(`
            SELECT id, fecha, saldo_bancos
            FROM libro_bancos
            ORDER BY fecha DESC, id DESC
            LIMIT 1
        `);
        
        console.log('\n📊 ÚLTIMA OPERACIÓN:\n');
        console.log(`   ID: ${ultima[0].id}`);
        console.log(`   Fecha: ${ultima[0].fecha}`);
        console.log(`   Saldo: Q${parseFloat(ultima[0].saldo_bancos).toFixed(2)}`);
        
        // ========================================================================
        // 4. DIAGNÓSTICO
        // ========================================================================
        console.log('\n' + '='.repeat(60));
        console.log('🔍 DIAGNÓSTICO:');
        console.log('='.repeat(60));
        
        if (primeras.length > 0) {
            const primerSaldo = parseFloat(primeras[0].saldo_bancos);
            const calculoManual = saldoInicialValor + parseFloat(primeras[0].ingreso) - parseFloat(primeras[0].egreso);
            
            if (Math.abs(primerSaldo - calculoManual) > 0.01) {
                console.log('\n❌ LOS SALDOS NO COINCIDEN');
                console.log(`   Saldo en BD: Q${primerSaldo.toFixed(2)}`);
                console.log(`   Saldo esperado: Q${calculoManual.toFixed(2)}`);
                console.log('\n⚠️  NECESITAS RECALCULAR TODOS LOS SALDOS');
            } else {
                console.log('\n✅ Los saldos parecen estar correctos');
            }
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        if (connection) await connection.end();
    }
}

verificar();