-- =====================================================
-- MIGRACIÓN HIDROCOLON - COMPATIBLE CON RAILWAY
-- =====================================================

-- 1. TABLA ROLES
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABLA USUARIOS
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
);

-- 3. TABLA PRESENTACIONES
CREATE TABLE IF NOT EXISTS presentaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA LABORATORIOS
CREATE TABLE IF NOT EXISTS laboratorios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA EXTRAS
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
);

-- 6. TABLA MEDICAMENTOS
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
);

-- 7. TABLA MEDICAMENTOS_EXTRAS
CREATE TABLE IF NOT EXISTS medicamentos_extras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicamento_id INT NOT NULL,
    extra_id INT NOT NULL,
    cantidad_requerida INT DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (extra_id) REFERENCES extras(id) ON DELETE CASCADE,
    UNIQUE KEY unique_medicamento_extra (medicamento_id, extra_id)
);

-- 8. TABLA SERVICIOS
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
);

-- 9. TABLA SERVICIOS_MEDICAMENTOS
CREATE TABLE IF NOT EXISTS servicios_medicamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    servicio_id INT NOT NULL,
    medicamento_id INT NOT NULL,
    cantidad_requerida INT DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE
);

-- 10. TABLA JORNADAS_ULTRASONIDOS
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
);

-- 11. TABLA COMBOS_PROMOCIONES
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
);

-- 12. TABLA PACIENTES
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
);

-- 13. TABLA TURNOS
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
);

-- 14. TABLA VENTAS
CREATE TABLE IF NOT EXISTS ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    turno_id INT NOT NULL,
    paciente_id INT,
    usuario_vendedor_id INT NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'mixto') NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    efectivo_recibido DECIMAL(10,2) DEFAULT 0.00,
    efectivo_cambio DECIMAL(10,2) DEFAULT 0.00,
    tarjeta_monto DECIMAL(10,2) DEFAULT 0.00,
    transferencia_monto DECIMAL(10,2) DEFAULT 0.00,
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
);

-- 15. TABLA DETALLE_VENTAS
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
);

-- 16. TABLA VOUCHERS_TARJETA
CREATE TABLE IF NOT EXISTS vouchers_tarjeta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    turno_id INT NOT NULL,
    numero_voucher VARCHAR(100) NOT NULL,
    paciente_nombre VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
    INDEX idx_numero_voucher (numero_voucher)
);

-- 17. TABLA TRANSFERENCIAS
CREATE TABLE IF NOT EXISTS transferencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    turno_id INT NOT NULL,
    numero_boleta VARCHAR(100) NOT NULL,
    paciente_nombre VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
    INDEX idx_numero_boleta (numero_boleta)
);

-- 18. TABLA GASTOS
CREATE TABLE IF NOT EXISTS gastos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    turno_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    tipo_gasto ENUM('administrativo', 'compras', 'mantenimiento', 'personal', 'servicios', 'otros') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE,
    INDEX idx_tipo_gasto (tipo_gasto)
);

-- 19. TABLA NOTIFICACIONES
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
);

-- 20. TABLA BITACORA
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
);

-- 21. TABLA MOVIMIENTOS_INVENTARIO
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
);

-- DATOS INICIALES
INSERT INTO roles (nombre, descripcion, permisos) VALUES 
('administrador', 'Acceso completo al sistema', '{"all": true}'),
('vendedor', 'Acceso a ventas y carrito únicamente', '{"ventas": true, "carrito": true, "cierre": true}');

INSERT INTO presentaciones (nombre, descripcion) VALUES 
('Unidad', 'Producto unitario'),
('Ampollas', 'Medicamento en ampollas'),
('Frasco 250 ml', 'Frasco de 250 mililitros'),
('Frasco Pastillas', 'Frasco con pastillas'),
('Frasco 500 ml', 'Frasco de 500 mililitros'),
('Frasco Polvo', 'Frasco con polvo'),
('Frasco Jarabe', 'Frasco con jarabe');

INSERT INTO laboratorios (nombre, descripcion) VALUES 
('Farmex', 'Laboratorio Farmex'),
('Bonin', 'Laboratorio Bonin'),
('Dipronat', 'Laboratorio Dipronat'),
('Reckeweg', 'Laboratorio Reckeweg'),
('Praxis', 'Laboratorio Praxis'),
('Adeph', 'Laboratorio Adeph'),
('Hidrocolon', 'Laboratorio propio Hidrocolon');

INSERT INTO usuarios (usuario, password_hash, rol_id, nombres, apellidos) VALUES 
('admin@hidrocolon.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'Administrador', 'Sistema');