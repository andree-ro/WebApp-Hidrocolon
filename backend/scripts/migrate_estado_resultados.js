// migrate_estado_resultados.js
// Migración para módulo de Estado de Resultados y Libro Bancos
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
        
        console.log('✅ Conexión establecida');
        console.log('\n📊 CREANDO TABLAS PARA ESTADO DE RESULTADOS Y LIBRO BANCOS...\n');

        // ========================================================================
        // TABLA 1: SALDO INICIAL BANCOS
        // ========================================================================
        console.log('🏦 Creando tabla: saldo_inicial_bancos...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS saldo_inicial_bancos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Saldo inicial en bancos',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro del saldo inicial',
                usuario_registro_id INT NOT NULL COMMENT 'Usuario que registró el saldo inicial',
                activo BOOLEAN DEFAULT TRUE COMMENT 'Solo el registro activo se usa como saldo inicial',
                observaciones TEXT NULL,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_activo (activo),
                INDEX idx_fecha_registro (fecha_registro)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Tabla para almacenar el saldo inicial del libro de bancos'
        `);
        console.log('✅ Tabla creada: saldo_inicial_bancos');

        // ========================================================================
        // TABLA 2: LIBRO BANCOS
        // ========================================================================
        console.log('📖 Creando tabla: libro_bancos...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS libro_bancos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                fecha DATE NOT NULL COMMENT 'Fecha de la operación bancaria',
                beneficiario VARCHAR(200) NOT NULL COMMENT 'Nombre del beneficiario o pagador',
                descripcion TEXT NOT NULL COMMENT 'Descripción detallada de la operación',
                clasificacion VARCHAR(100) NULL COMMENT 'Clasificación o categoría de la operación',
                tipo_operacion ENUM('ingreso', 'egreso') NOT NULL COMMENT 'Tipo de operación: ingreso o egreso',
                numero_cheque VARCHAR(50) NULL COMMENT 'Número de cheque si aplica',
                numero_deposito VARCHAR(50) NULL COMMENT 'Número de depósito si aplica',
                ingreso DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto de ingreso',
                egreso DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto de egreso',
                saldo DECIMAL(10,2) NOT NULL COMMENT 'Saldo después de esta operación',
                usuario_registro_id INT NOT NULL COMMENT 'Usuario que registró la operación',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_fecha (fecha),
                INDEX idx_tipo_operacion (tipo_operacion),
                INDEX idx_beneficiario (beneficiario),
                INDEX idx_fecha_creacion (fecha_creacion)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Tabla para el libro de bancos con registro de operaciones e ingresos y egresos'
        `);
        console.log('✅ Tabla creada: libro_bancos');

        // ========================================================================
        // TABLA 3: CONCEPTOS ESTADO RESULTADOS
        // ========================================================================
        console.log('📋 Creando tabla: conceptos_estado_resultados...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS conceptos_estado_resultados (
                id INT PRIMARY KEY AUTO_INCREMENT,
                tipo ENUM('costo_operacion', 'gasto_operacion', 'otro_gasto') NOT NULL 
                    COMMENT 'Tipo de concepto: costo de operación, gasto de operación u otro gasto',
                nombre VARCHAR(200) NOT NULL COMMENT 'Nombre del concepto (ej: Sueldos, Energía Eléctrica)',
                monto DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto del concepto',
                periodo_inicio DATE NOT NULL COMMENT 'Fecha inicio del período al que aplica',
                periodo_fin DATE NOT NULL COMMENT 'Fecha fin del período al que aplica',
                descripcion TEXT NULL COMMENT 'Descripción adicional del concepto',
                usuario_registro_id INT NOT NULL COMMENT 'Usuario que registró el concepto',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_tipo (tipo),
                INDEX idx_periodo (periodo_inicio, periodo_fin),
                INDEX idx_nombre (nombre),
                INDEX idx_tipo_periodo (tipo, periodo_inicio, periodo_fin)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Tabla para conceptos personalizables del estado de resultados (costos, gastos, otros)'
        `);
        console.log('✅ Tabla creada: conceptos_estado_resultados');

        // ========================================================================
        // VERIFICAR TABLAS CREADAS
        // ========================================================================
        console.log('\n📋 Verificando tablas creadas...');
        const [tables] = await connection.execute(`
            SHOW TABLES LIKE '%bancos%' 
            UNION 
            SHOW TABLES LIKE '%estado_resultados%'
        `);
        
        console.log('\n✅ Tablas del módulo Estado de Resultados:');
        tables.forEach(table => {
            console.log(`   ✓ ${Object.values(table)[0]}`);
        });

        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('📊 Módulo de Estado de Resultados y Libro Bancos listo');
        
    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  Las tablas ya existen');
        } else {
            console.error('❌ Error en migración:', error);
            throw error;
        }
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
        console.error('❌ Error:', error);
        process.exit(1);
    });