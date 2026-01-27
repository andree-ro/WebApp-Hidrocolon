// verificar_datos_sistema.js
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
        
        // Verificar ventas
        console.log('📊 VENTAS:');
        const [ventas] = await connection.execute(`
            SELECT COUNT(*) as total, SUM(total) as monto_total
            FROM ventas
            WHERE DATE(fecha_venta) >= '2024-01-01'
        `);
        console.log(`   Total ventas: ${ventas[0].total}`);
        console.log(`   Monto total: Q${parseFloat(ventas[0].monto_total || 0).toFixed(2)}\n`);
        
        // Verificar gastos de turnos
        console.log('💸 GASTOS (de turnos):');
        const [gastos] = await connection.execute(`
            SELECT COUNT(*) as total, SUM(total_gastos) as monto_total
            FROM turnos
            WHERE total_gastos > 0
        `);
        console.log(`   Total turnos con gastos: ${gastos[0].total}`);
        console.log(`   Monto total: Q${parseFloat(gastos[0].monto_total || 0).toFixed(2)}\n`);
        
        // Verificar depósitos
        console.log('🏦 DEPÓSITOS:');
        const [depositos] = await connection.execute(`
            SELECT COUNT(*) as total, SUM(monto) as monto_total
            FROM depositos
            WHERE fecha >= '2024-01-01'
        `);
        console.log(`   Total depósitos: ${depositos[0].total}`);
        console.log(`   Monto total: Q${parseFloat(depositos[0].monto_total || 0).toFixed(2)}\n`);
        
        // Verificar transferencias
        console.log('💱 TRANSFERENCIAS:');
        const [transferencias] = await connection.execute(`
            SELECT COUNT(*) as total, SUM(monto) as monto_total
            FROM transferencias
            WHERE fecha >= '2024-01-01'
        `);
        console.log(`   Total transferencias: ${transferencias[0].total}`);
        console.log(`   Monto total: Q${parseFloat(transferencias[0].monto_total || 0).toFixed(2)}\n`);
        
        // Verificar vouchers
        console.log('🎫 VOUCHERS:');
        const [vouchers] = await connection.execute(`
            SELECT COUNT(*) as total, SUM(monto) as monto_total
            FROM vouchers
            WHERE fecha >= '2024-01-01'
        `);
        console.log(`   Total vouchers: ${vouchers[0].total}`);
        console.log(`   Monto total: Q${parseFloat(vouchers[0].monto_total || 0).toFixed(2)}\n`);
        
        // Verificar pagos de comisiones
        console.log('💰 PAGOS DE COMISIONES:');
        const [comisiones] = await connection.execute(`
            SELECT COUNT(*) as total, SUM(monto_pagado) as monto_total
            FROM pagos_comisiones
            WHERE fecha_pago >= '2024-01-01'
        `);
        console.log(`   Total pagos: ${comisiones[0].total}`);
        console.log(`   Monto total: Q${parseFloat(comisiones[0].monto_total || 0).toFixed(2)}\n`);
        
        // Verificar turnos
        console.log('🔄 TURNOS:');
        const [turnos] = await connection.execute(`
            SELECT COUNT(*) as total, 
                   SUM(total_ventas) as total_ventas,
                   SUM(total_efectivo) as total_efectivo,
                   SUM(total_tarjeta) as total_tarjeta,
                   SUM(total_transferencias) as total_transferencias,
                   SUM(total_depositos) as total_depositos
            FROM turnos
            WHERE estado = 'cerrado'
        `);
        console.log(`   Total turnos cerrados: ${turnos[0].total}`);
        console.log(`   Total ventas: Q${parseFloat(turnos[0].total_ventas || 0).toFixed(2)}`);
        console.log(`   Total efectivo: Q${parseFloat(turnos[0].total_efectivo || 0).toFixed(2)}`);
        console.log(`   Total tarjeta: Q${parseFloat(turnos[0].total_tarjeta || 0).toFixed(2)}`);
        console.log(`   Total transferencias: Q${parseFloat(turnos[0].total_transferencias || 0).toFixed(2)}`);
        console.log(`   Total depósitos: Q${parseFloat(turnos[0].total_depositos || 0).toFixed(2)}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verificar();