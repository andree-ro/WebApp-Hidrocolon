// scripts/migrate.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection = null;
    
    try {
        console.log('ðŸš€ Iniciando migraciÃ³n de base de datos...');
        console.log('ðŸ“ Conectando a la base de datos...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('âœ… ConexiÃ³n establecida exitosamente');
        console.log('âš¡ Creando tablas del sistema...');

        // 1. TABLA ROLES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(50) NOT NULL UNIQUE,
                descripcion TEXT,
                permisos JSON NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('âœ… Tabla creada: roles');

        // 2. TABLA USUARIOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                rol_id INT NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                ultimo_login TIMESTAMP NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
            )
        `);
        console.log('âœ… Tabla creada: usuarios');

        // 3. TABLA PRESENTACIONES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS presentaciones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('âœ… Tabla creada: presentaciones');

        // 4. TABLA LABORATORIOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS laboratorios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('âœ… Tabla creada: laboratorios');

        // 5. TABLA EXTRAS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS extras (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                existencias INT NOT NULL DEFAULT 0,
                stock_minimo INT DEFAULT 20,
                costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('âœ… Tabla creada: extras');

        // 6. TABLA MEDICAMENTOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS medicamentos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(200) NOT NULL,
                presentacion_id INT NOT NULL,
                laboratorio_id INT NOT NULL,
                existencias INT NOT NULL DEFAULT 0,
                stock_minimo INT DEFAULT 11,
                fecha_vencimiento DATE NOT NULL,
                precio_tarjeta DECIMAL(10,2) NOT NULL,
                precio_efectivo DECIMAL(10,2) NOT NULL,
                costo_compra DECIMAL(10,2) NOT NULL,
                porcentaje_comision DECIMAL(5,2) DEFAULT 0.00,
                indicaciones TEXT,
                contraindicaciones TEXT,
                dosis TEXT,
                imagen_url VARCHAR(500),
                requiere_extras BOOLEAN DEFAULT FALSE,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (presentacion_id) REFERENCES presentaciones(id) ON DELETE RESTRICT,
                FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE RESTRICT,
                INDEX idx_nombre (nombre),
                INDEX idx_vencimiento (fecha_vencimiento),
                INDEX idx_existencias (existencias)
            )
        `);
        console.log('âœ… Tabla creada: medicamentos');

        // 7. TABLA MEDICAMENTOS_EXTRAS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS medicamentos_extras (
                id INT PRIMARY KEY AUTO_INCREMENT,
                medicamento_id INT NOT NULL,
                extra_id INT NOT NULL,
                cantidad_requerida INT DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
                FOREIGN KEY (extra_id) REFERENCES extras(id) ON DELETE CASCADE,
                UNIQUE KEY unique_medicamento_extra (medicamento_id, extra_id)
            )
        `);
        console.log('âœ… Tabla creada: medicamentos_extras');

        // 8. TABLA SERVICIOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS servicios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(200) NOT NULL,
                precio_tarjeta DECIMAL(10,2) NOT NULL,
                precio_efectivo DECIMAL(10,2) NOT NULL,
                monto_minimo DECIMAL(10,2) DEFAULT 0.00,
                porcentaje_comision DECIMAL(5,2) DEFAULT 0.00,
                requiere_medicamentos BOOLEAN DEFAULT FALSE,
                requiere_extras BOOLEAN DEFAULT FALSE,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_nombre (nombre)
            )
        `);
        console.log('âœ… Tabla creada: servicios');

        // 9. TABLA SERVICIOS_MEDICAMENTOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS servicios_medicamentos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                servicio_id INT NOT NULL,
                medicamento_id INT NOT NULL,
                cantidad_requerida INT DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE
            )
        `);
        console.log('âœ… Tabla creada: servicios_medicamentos');


        // ============================================================================
        // TABLA: SERVICIOS_EXTRAS (Relación muchos a muchos)
        // ============================================================================
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS servicios_extras (
                id INT PRIMARY KEY AUTO_INCREMENT,
                servicio_id INT NOT NULL,
                extra_id INT NOT NULL,
                cantidad_requerida INT DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                FOREIGN KEY (extra_id) REFERENCES extras(id) ON DELETE CASCADE,
                UNIQUE KEY unique_servicio_extra (servicio_id, extra_id),
                INDEX idx_servicio (servicio_id),
                INDEX idx_extra (extra_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla creada: servicios_extras');





        // 10. TABLA JORNADAS_ULTRASONIDOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS jornadas_ultrasonidos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(200) NOT NULL,
                precio_tarjeta DECIMAL(10,2) NOT NULL,
                precio_efectivo DECIMAL(10,2) NOT NULL,
                monto_minimo DECIMAL(10,2) DEFAULT 0.00,
                porcentaje_comision DECIMAL(5,2) DEFAULT 0.00,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('âœ… Tabla creada: jornadas_ultrasonidos');

        // 11. TABLA COMBOS_PROMOCIONES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS combos_promociones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(200) NOT NULL,
                precio_tarjeta DECIMAL(10,2) NOT NULL,
                precio_efectivo DECIMAL(10,2) NOT NULL,
                monto_minimo DECIMAL(10,2) DEFAULT 0.00,
                porcentaje_comision DECIMAL(5,2) DEFAULT 0.00,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('âœ… Tabla creada: combos_promociones');

        // 12. TABLA PACIENTES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pacientes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                telefono VARCHAR(20),
                dpi VARCHAR(20),
                fecha_primer_cita DATE,
                proxima_cita DATE,
                fecha_nacimiento DATE,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_nombres (nombres, apellidos),
                INDEX idx_telefono (telefono),
                INDEX idx_dpi (dpi),
                INDEX idx_cumpleanos (fecha_nacimiento)
            )
        `);
        console.log('âœ… Tabla creada: pacientes');


        // Agregar constraint UNIQUE al DPI (solo para valores NO NULL)
        console.log('\n🔒 Verificando constraint UNIQUE en DPI...');
        
        // Verificar si ya existe el constraint
        const [existingConstraints] = await connection.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'pacientes' 
            AND CONSTRAINT_TYPE = 'UNIQUE'
            AND CONSTRAINT_NAME = 'unique_dpi_activo'
        `);
        
        if (existingConstraints.length === 0) {
            // Agregar UNIQUE constraint para DPI
            // Nota: MySQL permite múltiples valores NULL en un campo UNIQUE
            await connection.execute(`
                ALTER TABLE pacientes 
                ADD CONSTRAINT unique_dpi_activo UNIQUE (dpi)
            `);
            console.log('✅ Constraint UNIQUE agregado al campo DPI');
        } else {
            console.log('⚠️  Constraint UNIQUE ya existe en DPI');
        }

        // 13. TABLA TURNOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS turnos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                efectivo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                efectivo_final DECIMAL(10,2) DEFAULT NULL,
                total_ventas_efectivo DECIMAL(10,2) DEFAULT 0.00,
                total_ventas_tarjeta DECIMAL(10,2) DEFAULT 0.00,
                total_ventas_transferencia DECIMAL(10,2) DEFAULT 0.00,
                total_gastos DECIMAL(10,2) DEFAULT 0.00,
                total_comisiones DECIMAL(10,2) DEFAULT 0.00,
                observaciones TEXT,
                estado ENUM('abierto', 'cerrado') DEFAULT 'abierto',
                fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre TIMESTAMP NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
            )
        `);
        console.log('âœ… Tabla creada: turnos');

        // 14. TABLA VENTAS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ventas (
                id INT PRIMARY KEY AUTO_INCREMENT,
                numero_factura VARCHAR(50) UNIQUE NOT NULL,
                turno_id INT NOT NULL,
                paciente_id INT,
                usuario_vendedor_id INT NOT NULL,
                metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'deposito', 'mixto') NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                descuento DECIMAL(10,2) DEFAULT 0.00,
                total DECIMAL(10,2) NOT NULL,
                efectivo_recibido DECIMAL(10,2) DEFAULT 0.00,
                efectivo_cambio DECIMAL(10,2) DEFAULT 0.00,
                tarjeta_monto DECIMAL(10,2) DEFAULT 0.00,
                transferencia_monto DECIMAL(10,2) DEFAULT 0.00,
                deposito_monto DECIMAL(10,2) DEFAULT 0.00,
                cliente_nombre VARCHAR(200),
                cliente_telefono VARCHAR(20),
                cliente_nit VARCHAR(20),
                cliente_direccion TEXT,
                es_venta_ajuste BOOLEAN DEFAULT FALSE,
                fecha_venta_real DATE,
                observaciones TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE RESTRICT,
                FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
                FOREIGN KEY (usuario_vendedor_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_numero_factura (numero_factura),
                INDEX idx_fecha_creacion (fecha_creacion),
                INDEX idx_metodo_pago (metodo_pago)
            )
        `);
        console.log('âœ… Tabla creada: ventas');

        // 15. TABLA DETALLE_VENTAS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS detalle_ventas (
                id INT PRIMARY KEY AUTO_INCREMENT,
                venta_id INT NOT NULL,
                tipo_producto ENUM('medicamento', 'servicio', 'jornada_ultrasonido', 'combo_promocion') NOT NULL,
                producto_id INT NOT NULL,
                producto_nombre VARCHAR(200) NOT NULL,
                cantidad INT NOT NULL DEFAULT 1,
                precio_unitario DECIMAL(10,2) NOT NULL,
                precio_total DECIMAL(10,2) NOT NULL,
                porcentaje_comision DECIMAL(5,2) DEFAULT 0.00,
                monto_comision DECIMAL(10,2) DEFAULT 0.00,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
            )
        `);
        console.log('âœ… Tabla creada: detalle_ventas');

        // 16-21. TABLAS RESTANTES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS vouchers_tarjeta (
                id INT PRIMARY KEY AUTO_INCREMENT,
                turno_id INT NOT NULL,
                numero_voucher VARCHAR(100) NOT NULL,
                paciente_nombre VARCHAR(200) NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
                INDEX idx_numero_voucher (numero_voucher)
            )
        `);
        console.log('âœ… Tabla creada: vouchers_tarjeta');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS transferencias (
                id INT PRIMARY KEY AUTO_INCREMENT,
                turno_id INT NOT NULL,
                numero_boleta VARCHAR(100) NOT NULL,
                paciente_nombre VARCHAR(200) NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
                INDEX idx_numero_boleta (numero_boleta)
            )
        `);
        console.log('âœ… Tabla creada: transferencias');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS depositos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                turno_id INT NOT NULL,
                numero_deposito VARCHAR(100) NOT NULL,
                paciente_nombre VARCHAR(200) NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
                INDEX idx_numero_deposito (numero_deposito)
            )
        `);
        console.log('✅ Tabla creada: depositos');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS gastos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                turno_id INT NOT NULL,
                descripcion TEXT NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                tipo_gasto ENUM('administrativo', 'compras', 'mantenimiento', 'personal', 'servicios', 'otros') NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
                INDEX idx_tipo_gasto (tipo_gasto)
            )
        `);
        console.log('âœ… Tabla creada: gastos');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notificaciones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                tipo ENUM('medicamento_vencimiento', 'medicamento_stock_bajo', 'extra_stock_bajo', 'cita_proxima') NOT NULL,
                titulo VARCHAR(200) NOT NULL,
                mensaje TEXT NOT NULL,
                referencia_id INT,
                referencia_tipo VARCHAR(50),
                revisada BOOLEAN DEFAULT FALSE,
                fecha_revision TIMESTAMP NULL,
                usuario_revision_id INT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_revision_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_tipo (tipo),
                INDEX idx_revisada (revisada),
                INDEX idx_fecha_creacion (fecha_creacion)
            )
        `);
        console.log('âœ… Tabla creada: notificaciones');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bitacora (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                modulo VARCHAR(100) NOT NULL,
                accion VARCHAR(100) NOT NULL,
                descripcion TEXT NOT NULL,
                datos_anteriores JSON,
                datos_nuevos JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_usuario (usuario_id),
                INDEX idx_modulo (modulo),
                INDEX idx_accion (accion),
                INDEX idx_fecha_creacion (fecha_creacion)
            )
        `);
        console.log('âœ… Tabla creada: bitacora');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS movimientos_inventario (
                id INT PRIMARY KEY AUTO_INCREMENT,
                tipo_producto ENUM('medicamento', 'extra') NOT NULL,
                producto_id INT NOT NULL,
                tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'vencimiento') NOT NULL,
                cantidad_anterior INT NOT NULL,
                cantidad_movimiento INT NOT NULL,
                cantidad_nueva INT NOT NULL,
                motivo VARCHAR(200),
                venta_id INT,
                usuario_id INT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_tipo_producto (tipo_producto, producto_id),
                INDEX idx_tipo_movimiento (tipo_movimiento),
                INDEX idx_fecha_creacion (fecha_creacion)
            )
        `);
        console.log('âœ… Tabla creada: movimientos_inventario');

        // ============================================================================
        // NUEVA MIGRACIÃ“N: TABLA DOCTORAS (Sistema de Comisiones)
        // ============================================================================
        console.log('ðŸ‘©â€âš•ï¸ Creando tabla doctoras...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS doctoras (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                activo BOOLEAN DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_nombre (nombre),
                INDEX idx_activo (activo)
            )
        `);
        console.log('âœ… Tabla creada: doctoras');

        console.log('ðŸ”„ Insertando datos iniciales...');

        // DATOS INICIALES
        await connection.execute(`
            INSERT IGNORE INTO roles (nombre, descripcion, permisos) VALUES 
            ('administrador', 'Acceso completo al sistema', '{"all": true}'),
            ('vendedor', 'Acceso a ventas y carrito Ãºnicamente', '{"ventas": true, "carrito": true, "cierre": true}')
        `);
        console.log('âœ… Datos insertados: roles');

        await connection.execute(`
            INSERT IGNORE INTO presentaciones (nombre, descripcion) VALUES 
            ('Unidad', 'Producto unitario'),
            ('Ampollas', 'Medicamento en ampollas'),
            ('Frasco 250 ml', 'Frasco de 250 mililitros'),
            ('Frasco Pastillas', 'Frasco con pastillas'),
            ('Frasco 500 ml', 'Frasco de 500 mililitros'),
            ('Frasco Polvo', 'Frasco con polvo'),
            ('Frasco Jarabe', 'Frasco con jarabe')
        `);
        console.log('âœ… Datos insertados: presentaciones');

        await connection.execute(`
            INSERT IGNORE INTO laboratorios (nombre, descripcion) VALUES 
            ('Farmex', 'Laboratorio Farmex'),
            ('Bonin', 'Laboratorio Bonin'),
            ('Dipronat', 'Laboratorio Dipronat'),
            ('Reckeweg', 'Laboratorio Reckeweg'),
            ('Praxis', 'Laboratorio Praxis'),
            ('Adeph', 'Laboratorio Adeph'),
            ('Hidrocolon', 'Laboratorio propio Hidrocolon')
        `);
        console.log('âœ… Datos insertados: laboratorios');

        await connection.execute(`
            INSERT IGNORE INTO usuarios (usuario, password_hash, rol_id, nombres, apellidos) VALUES 
            ('admin@hidrocolon.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'Administrador', 'Sistema')
        `);
        console.log('âœ… Datos insertados: usuarios');

        // ============================================================================
        // DATOS INICIALES: DOCTORAS
        // ============================================================================
        await connection.execute(`
            INSERT IGNORE INTO doctoras (nombre) VALUES 
            ('Doctora Juana'),
            ('Doctora Edith'),
            ('ClÃ­nica'),
            ('Otras Doctoras')
        `);
        console.log('âœ… Datos insertados: doctoras');

        // ============================================================================
        // AGREGAR CAMPO doctora_id A detalle_ventas
        // ============================================================================
        console.log('ðŸ”§ Verificando campo doctora_id en detalle_ventas...');
        
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'detalle_ventas' 
            AND COLUMN_NAME = 'doctora_id'
            AND TABLE_SCHEMA = DATABASE()
        `);

        if (columns.length === 0) {
            console.log('âž• Agregando campo doctora_id a detalle_ventas...');
            await connection.execute(`
                ALTER TABLE detalle_ventas 
                ADD COLUMN doctora_id INT NULL AFTER monto_comision
            `);
            console.log('âœ… Campo doctora_id agregado');

            // Agregar foreign key
            await connection.execute(`
                ALTER TABLE detalle_ventas
                ADD CONSTRAINT fk_detalle_ventas_doctora 
                FOREIGN KEY (doctora_id) 
                REFERENCES doctoras(id) 
                ON DELETE SET NULL
                ON UPDATE CASCADE
            `);
            console.log('âœ… Foreign key creada: fk_detalle_ventas_doctora');

            // Agregar Ã­ndice
            await connection.execute(`
                CREATE INDEX idx_detalle_ventas_doctora ON detalle_ventas(doctora_id)
            `);
            console.log('âœ… Ãndice creado: idx_detalle_ventas_doctora');
        } else {
            console.log('âœ… Campo doctora_id ya existe en detalle_ventas');
        }







        // ============================================================================
        // MIGRACIÃ“N: EXPANDIR TABLA TURNOS PARA MÃ“DULO FINANCIERO
        // ============================================================================
        console.log('ðŸ’° Expandiendo tabla turnos para mÃ³dulo financiero...');

        // Verificar quÃ© campos ya existen en turnos
        const [turnosColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'turnos' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        const existingColumns = turnosColumns.map(col => col.COLUMN_NAME);
        console.log('ðŸ“‹ Columnas actuales en turnos:', existingColumns.join(', '));

        // PASO 1: Conteo de billetes y monedas
        if (!existingColumns.includes('efectivo_billetes')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_billetes JSON COMMENT 'Conteo billetes apertura: {"200":5, "100":10, ...}'
            `);
            console.log('âœ… Agregado: efectivo_billetes');
        }

        if (!existingColumns.includes('efectivo_monedas')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_monedas JSON COMMENT 'Conteo monedas apertura: {"1":20, "0.50":15, ...}'
            `);
            console.log('âœ… Agregado: efectivo_monedas');
        }

        if (!existingColumns.includes('efectivo_inicial_total')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_inicial_total DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total efectivo inicial calculado'
            `);
            console.log('âœ… Agregado: efectivo_inicial_total');
        }

        if (!existingColumns.includes('efectivo_final_billetes')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_final_billetes JSON COMMENT 'Conteo billetes cierre'
            `);
            console.log('âœ… Agregado: efectivo_final_billetes');
        }

        if (!existingColumns.includes('efectivo_final_monedas')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_final_monedas JSON COMMENT 'Conteo monedas cierre'
            `);
            console.log('âœ… Agregado: efectivo_final_monedas');
        }

        if (!existingColumns.includes('efectivo_final_total')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_final_total DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total efectivo final calculado'
            `);
            console.log('âœ… Agregado: efectivo_final_total');
        }

        // PASO 2: Totales del dÃ­a (algunos ya existen, agregamos los que faltan)
        if (!existingColumns.includes('venta_total')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN venta_total DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total ventas del turno'
            `);
            console.log('âœ… Agregado: venta_total');
        }

        if (!existingColumns.includes('ventas_efectivo')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN ventas_efectivo DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total ventas en efectivo'
            `);
            console.log('âœ… Agregado: ventas_efectivo');
        }

        if (!existingColumns.includes('ventas_tarjeta')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN ventas_tarjeta DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total ventas con tarjeta'
            `);
            console.log('âœ… Agregado: ventas_tarjeta');
        }

        if (!existingColumns.includes('ventas_transferencia')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN ventas_transferencia DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total ventas por transferencia'
            `);
            console.log('âœ… Agregado: ventas_transferencia');
        }

        // total_gastos ya existe en tu schema actual
        
        if (!existingColumns.includes('total_comisiones_pagadas')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_comisiones_pagadas DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total comisiones pagadas en efectivo'
            `);
            console.log('âœ… Agregado: total_comisiones_pagadas');
        }

        if (!existingColumns.includes('total_vouchers')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_vouchers DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total vouchers registrados'
            `);
            console.log('âœ… Agregado: total_vouchers');
        }

        if (!existingColumns.includes('total_transferencias')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_transferencias DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total transferencias registradas'
            `);
            console.log('âœ… Agregado: total_transferencias');
        }

        if (!existingColumns.includes('total_depositos')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_depositos DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total depÃ³sitos recibidos'
            `);
            console.log('âœ… Agregado: total_depositos');
        }

        // PASO 3: Impuestos desglosados
        if (!existingColumns.includes('impuesto_efectivo')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN impuesto_efectivo DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Impuesto 16% sobre efectivo'
            `);
            console.log('âœ… Agregado: impuesto_efectivo');
        }

        if (!existingColumns.includes('impuesto_tarjeta')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN impuesto_tarjeta DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Impuesto 21.04% sobre tarjeta'
            `);
            console.log('âœ… Agregado: impuesto_tarjeta');
        }

        if (!existingColumns.includes('impuesto_transferencia')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN impuesto_transferencia DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Impuesto 16% sobre transferencias'
            `);
            console.log('âœ… Agregado: impuesto_transferencia');
        }

        if (!existingColumns.includes('impuesto_depositos')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN impuesto_depositos DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Impuesto 16% sobre depÃ³sitos'
            `);
            console.log('âœ… Agregado: impuesto_depositos');
        }

        // PASO 4: Ventas netas y depÃ³sito
        if (!existingColumns.includes('ventas_netas')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN ventas_netas DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Venta total - impuestos'
            `);
            console.log('âœ… Agregado: ventas_netas');
        }

        if (!existingColumns.includes('total_a_depositar')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_a_depositar DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto final para depositar'
            `);
            console.log('âœ… Agregado: total_a_depositar');
        }

        // PASO 5: Cuadre y diferencias
        if (!existingColumns.includes('efectivo_esperado')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN efectivo_esperado DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Efectivo que deberÃ­a haber'
            `);
            console.log('âœ… Agregado: efectivo_esperado');
        }

        if (!existingColumns.includes('diferencia_efectivo')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN diferencia_efectivo DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Diferencia: fÃ­sico - esperado'
            `);
            console.log('âœ… Agregado: diferencia_efectivo');
        }

        if (!existingColumns.includes('diferencia_vouchers')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN diferencia_vouchers DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Diferencia vouchers vs ventas tarjeta'
            `);
            console.log('âœ… Agregado: diferencia_vouchers');
        }

        if (!existingColumns.includes('diferencia_transferencias')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN diferencia_transferencias DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Diferencia transferencias'
            `);
            console.log('âœ… Agregado: diferencia_transferencias');
        }

        // PASO 6: AutorizaciÃ³n
        if (!existingColumns.includes('requiere_autorizacion')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN requiere_autorizacion BOOLEAN DEFAULT FALSE COMMENT 'TRUE si hay diferencias'
            `);
            console.log('âœ… Agregado: requiere_autorizacion');
        }

        if (!existingColumns.includes('autorizado_por')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN autorizado_por INT NULL COMMENT 'ID usuario admin que autorizÃ³'
            `);
            console.log('âœ… Agregado: autorizado_por');
        }

        if (!existingColumns.includes('justificacion_diferencias')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN justificacion_diferencias TEXT NULL COMMENT 'Motivo de las diferencias'
            `);
            console.log('âœ… Agregado: justificacion_diferencias');
        }

        if (!existingColumns.includes('fecha_autorizacion')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN fecha_autorizacion TIMESTAMP NULL COMMENT 'CuÃ¡ndo se autorizÃ³'
            `);
            console.log('âœ… Agregado: fecha_autorizacion');
        }

        // PASO 7: Agregar foreign key si no existe
        console.log('ðŸ”— Verificando foreign key fk_turnos_autorizado_por...');
        const [fks] = await connection.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'turnos' 
            AND CONSTRAINT_NAME = 'fk_turnos_autorizado_por'
            AND TABLE_SCHEMA = DATABASE()
        `);

        if (fks.length === 0 && existingColumns.includes('autorizado_por')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD CONSTRAINT fk_turnos_autorizado_por 
                FOREIGN KEY (autorizado_por) REFERENCES usuarios(id)
            `);
            console.log('âœ… Foreign key creada: fk_turnos_autorizado_por');
        } else {
            console.log('âœ… Foreign key ya existe o campo no disponible');
        }

        // PASO 8: Crear Ã­ndices si no existen
        console.log('ðŸ“Š Creando Ã­ndices para optimizaciÃ³n...');
        
        const [indexes] = await connection.execute(`
            SHOW INDEX FROM turnos WHERE Key_name = 'idx_turnos_estado'
        `);
        
        if (indexes.length === 0) {
            await connection.execute(`CREATE INDEX idx_turnos_estado ON turnos(estado)`);
            console.log('âœ… Ãndice creado: idx_turnos_estado');
        }

        const [indexes2] = await connection.execute(`
            SHOW INDEX FROM turnos WHERE Key_name = 'idx_turnos_fecha_apertura'
        `);
        
        if (indexes2.length === 0) {
            await connection.execute(`CREATE INDEX idx_turnos_fecha_apertura ON turnos(fecha_apertura)`);
            console.log('âœ… Ãndice creado: idx_turnos_fecha_apertura');
        }

        const [indexes3] = await connection.execute(`
            SHOW INDEX FROM turnos WHERE Key_name = 'idx_turnos_fecha_cierre'
        `);
        
        if (indexes3.length === 0) {
            await connection.execute(`CREATE INDEX idx_turnos_fecha_cierre ON turnos(fecha_cierre)`);
            console.log('âœ… Ãndice creado: idx_turnos_fecha_cierre');
        }

        const [indexes4] = await connection.execute(`
            SHOW INDEX FROM turnos WHERE Key_name = 'idx_turnos_usuario'
        `);
        
        if (indexes4.length === 0) {
            await connection.execute(`CREATE INDEX idx_turnos_usuario ON turnos(usuario_id)`);
            console.log('âœ… Ãndice creado: idx_turnos_usuario');
        }

        console.log('âœ… Tabla turnos expandida exitosamente para mÃ³dulo financiero');

        // ========================================================================
        // NUEVAS TABLAS PARA MÓDULO DE COMISIONES
        // ========================================================================
        console.log('\n💰 Creando tablas para módulo de comisiones...');

        // TABLA: PAGOS_COMISIONES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pagos_comisiones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                doctora_id INT NOT NULL,
                fecha_corte DATE NOT NULL COMMENT 'Fecha hasta la cual se calculan comisiones',
                fecha_pago DATE NOT NULL COMMENT 'Fecha en que se realizó el pago',
                monto_total DECIMAL(10,2) NOT NULL COMMENT 'Total pagado en comisiones',
                cantidad_ventas INT NOT NULL COMMENT 'Número de ventas incluidas',
                efectivo_disponible BOOLEAN DEFAULT TRUE COMMENT 'Si había efectivo para pagar',
                estado ENUM('pendiente', 'pagado', 'acumulado') DEFAULT 'pendiente',
                observaciones TEXT NULL,
                turno_id INT NULL COMMENT 'Turno en el que se pagó (si aplica)',
                usuario_registro_id INT NOT NULL COMMENT 'Usuario que registró el pago',
                pdf_generado BOOLEAN DEFAULT FALSE,
                pdf_url VARCHAR(500) NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (doctora_id) REFERENCES doctoras(id) ON DELETE CASCADE,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL,
                FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_doctora_fecha (doctora_id, fecha_corte),
                INDEX idx_estado (estado),
                INDEX idx_fecha_pago (fecha_pago)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla creada: pagos_comisiones');

        // TABLA: DETALLE_PAGOS_COMISIONES
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS detalle_pagos_comisiones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                pago_comision_id INT NOT NULL,
                venta_id INT NOT NULL,
                detalle_venta_id INT NOT NULL,
                producto_nombre VARCHAR(200) NOT NULL,
                cantidad INT NOT NULL,
                monto_venta DECIMAL(10,2) NOT NULL,
                porcentaje_comision DECIMAL(5,2) NOT NULL,
                monto_comision DECIMAL(10,2) NOT NULL,
                fecha_venta TIMESTAMP NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pago_comision_id) REFERENCES pagos_comisiones(id) ON DELETE CASCADE,
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
                FOREIGN KEY (detalle_venta_id) REFERENCES detalle_ventas(id) ON DELETE CASCADE,
                INDEX idx_pago_comision (pago_comision_id),
                INDEX idx_venta (venta_id),
                INDEX idx_fecha_venta (fecha_venta)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla creada: detalle_pagos_comisiones');

        // AGREGAR CAMPO A DETALLE_VENTAS
        console.log('\n🔧 Agregando campo pago_comision_id a detalle_ventas...');
        
        const [detalleColumns] = await connection.execute(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'detalle_ventas' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        const existingDetalleColumns = detalleColumns.map(col => col.COLUMN_NAME);
        
        if (!existingDetalleColumns.includes('pago_comision_id')) {
            await connection.execute(`
                ALTER TABLE detalle_ventas 
                ADD COLUMN pago_comision_id INT NULL 
                COMMENT 'ID del pago si esta comisión ya fue pagada'
            `);
            console.log('✅ Agregado: pago_comision_id a detalle_ventas');
            
            // Agregar foreign key
            await connection.execute(`
                ALTER TABLE detalle_ventas 
                ADD FOREIGN KEY (pago_comision_id) REFERENCES pagos_comisiones(id) ON DELETE SET NULL
            `);
            console.log('✅ Foreign key agregada: pago_comision_id');
        } else {
            console.log('⚠️  Campo pago_comision_id ya existe en detalle_ventas');
        }

        // ========================================================================
        // NUEVAS TABLAS PARA MÓDULO DE LABORATORIOS (GANANCIAS EXTRAS)
        // ========================================================================
        console.log('\n🧪 Creando tabla para ganancias de laboratorios...');

        // TABLA: GANANCIAS_LABORATORIOS
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ganancias_laboratorios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                concepto VARCHAR(200) NOT NULL COMMENT 'Descripción de la ganancia',
                monto DECIMAL(10,2) NOT NULL,
                fecha_ganancia DATE NOT NULL COMMENT 'Fecha en que se obtuvo la ganancia',
                laboratorio_origen VARCHAR(200) NULL COMMENT 'Nombre del laboratorio si aplica',
                tipo_ganancia ENUM('bono', 'incentivo', 'devolucion', 'otro') DEFAULT 'otro',
                incluir_en_cierre BOOLEAN DEFAULT TRUE COMMENT 'Si se incluye en reporte de cierre',
                turno_id INT NULL COMMENT 'Turno asociado si se registró durante uno',
                usuario_registro_id INT NOT NULL,
                observaciones TEXT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL,
                FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_fecha_ganancia (fecha_ganancia),
                INDEX idx_incluir_cierre (incluir_en_cierre),
                INDEX idx_turno (turno_id),
                INDEX idx_tipo (tipo_ganancia)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabla creada: ganancias_laboratorios');

        // ========================================================================
        // AGREGAR CAMPOS A TURNOS PARA COMISIONES Y LABORATORIOS
        // ========================================================================
        console.log('\n🔧 Agregando campos de comisiones y laboratorios a turnos...');

        // Refrescar columnas existentes
        const [turnosColumnsRefresh] = await connection.execute(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'turnos' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        const existingTurnosColumns = turnosColumnsRefresh.map(col => col.COLUMN_NAME);

        // Campo: total_comisiones_pendientes
        if (!existingTurnosColumns.includes('total_comisiones_pendientes')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_comisiones_pendientes DECIMAL(10,2) DEFAULT 0.00 
                COMMENT 'Comisiones generadas pero no pagadas en este turno'
            `);
            console.log('✅ Agregado: total_comisiones_pendientes');
        }

        // Campo: total_comisiones_pagadas
        if (!existingTurnosColumns.includes('total_comisiones_pagadas')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_comisiones_pagadas DECIMAL(10,2) DEFAULT 0.00 
                COMMENT 'Comisiones efectivamente pagadas en este turno'
            `);
            console.log('✅ Agregado: total_comisiones_pagadas');
        }

        // Campo: total_ganancias_laboratorios
        if (!existingTurnosColumns.includes('total_ganancias_laboratorios')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN total_ganancias_laboratorios DECIMAL(10,2) DEFAULT 0.00 
                COMMENT 'Ganancias de laboratorios registradas en este turno'
            `);
            console.log('✅ Agregado: total_ganancias_laboratorios');
        }

        // Campo: incluir_laboratorios_reporte
        if (!existingTurnosColumns.includes('incluir_laboratorios_reporte')) {
            await connection.execute(`
                ALTER TABLE turnos 
                ADD COLUMN incluir_laboratorios_reporte BOOLEAN DEFAULT TRUE 
                COMMENT 'Si se incluyen laboratorios en el reporte de cierre'
            `);
            console.log('✅ Agregado: incluir_laboratorios_reporte');
        }


        // Verificar estructura final de turnos
        const [turnosColumnsFinal] = await connection.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'turnos' 
            AND TABLE_SCHEMA = DATABASE()
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('\nðŸ“‹ Estructura final de tabla turnos:');
        turnosColumnsFinal.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
        });

        console.log(`\nðŸ’° Total de campos en turnos: ${turnosColumnsFinal.length}`);





        // Verificar tablas creadas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('ðŸ“‹ Tablas en la base de datos:');
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        // Verificar doctoras insertadas
        const [doctoras] = await connection.execute('SELECT * FROM doctoras');
        console.log('\nðŸ‘©â€âš•ï¸ Doctoras en el sistema:');
        doctoras.forEach(doc => {
            console.log(`   - ${doc.nombre} (ID: ${doc.id})`);
        });

        console.log('\nðŸŽ‰ Â¡MigraciÃ³n completada exitosamente!');
        console.log('ðŸ“Š Base de datos lista para el Sistema Hidrocolon con Comisiones por Doctora');
        
    } catch (error) {
        console.error('âŒ Error en la migraciÃ³n:', error.message);
        console.error('ðŸ” Detalle del error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('ðŸ”Œ ConexiÃ³n cerrada');
        }
    }
}

runMigration();