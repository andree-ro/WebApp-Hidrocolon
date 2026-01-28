// verificar_fechas_bd.js
// Script para verificar las fechas exactas en la base de datos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificar() {
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
        
        console.log('✅ Conexión establecida\n');
        
        // ========================================================================
        // VER LAS ÚLTIMAS 10 OPERACIONES DEL LIBRO DE BANCOS
        // ========================================================================
        console.log('📋 ÚLTIMAS 10 OPERACIONES EN LIBRO_BANCOS:\n');
        
        const [operaciones] = await connection.execute(`
            SELECT 
                id,
                fecha,
                beneficiario,
                descripcion,
                ingreso,
                egreso
            FROM libro_bancos
            ORDER BY id DESC
            LIMIT 10
        `);
        
        operaciones.forEach(op => {
            console.log(`ID: ${op.id} | FECHA BD: ${op.fecha} | ${op.descripcion.substring(0, 50)}`);
        });
        
        // ========================================================================
        // VER LAS ÚLTIMAS 5 VENTAS DE LA TABLA VENTAS
        // ========================================================================
        console.log('\n📋 ÚLTIMAS 5 VENTAS EN TABLA VENTAS:\n');
        
        const [ventas] = await connection.execute(`
            SELECT 
                id,
                numero_factura,
                cliente_nombre,
                fecha_creacion,
                total
            FROM ventas
            ORDER BY id DESC
            LIMIT 5
        `);
        
        ventas.forEach(v => {
            console.log(`ID: ${v.id} | ${v.numero_factura} | FECHA CREACIÓN: ${v.fecha_creacion} | ${v.cliente_nombre}`);
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('🔍 ANÁLISIS:');
        console.log('='.repeat(60));
        console.log('\n1. Si las fechas en libro_bancos dicen "2026-01-27" y deberían ser "2026-01-28",');
        console.log('   entonces HAY QUE ACTUALIZAR LA BASE DE DATOS.\n');
        console.log('2. Si las fechas en libro_bancos YA dicen "2026-01-28",');
        console.log('   entonces el problema es en el FRONTEND.\n');
        
        await connection.end();
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        if (connection) await connection.end();
    }
}

verificar();