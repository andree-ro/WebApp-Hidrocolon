// src/utils/validators.js
// Validadores de entrada para Sistema Hidrocolon
// Valida y sanitiza todos los datos de entrada del sistema

class Validators {
    constructor() {
        // Expresiones regulares para validaciones
        this.patterns = {
            // Formato: [rol][iniciales]@hidrocolon.com
            userEmail: /^[a-zA-Z]+[a-zA-Z0-9]*@hidrocolon\.com$/,
            
            // Contraseña: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
            
            // Solo letras y espacios para nombres
            name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
            
            // Teléfono guatemalteco: +502 XXXXXXXX o XXXXXXXX
            phone: /^(\+502\s?)?[2-9]\d{7}$/,
            
            // DPI guatemalteco: 13 dígitos
            dpi: /^\d{13}$/,
            
            // JWT Token format
            jwtToken: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
        };

        // Lista de contraseñas comunes prohibidas
        this.commonPasswords = [
            'password', 'password123', '123456', '123456789', 'qwerty',
            'abc123', 'password1', 'admin', 'administrador', 'hidrocolon',
            'guatemala', '12345678', 'admin123', 'user123', 'test123'
        ];

        console.log('✅ Validadores inicializados');
    }

    // Sanitizar cadena de texto
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return '';
        }

        return str
            .trim() // Eliminar espacios
            .replace(/[<>]/g, '') // Eliminar caracteres peligrosos
            .substring(0, 255); // Limitar longitud
    }

    // Validar formato de email del sistema
    validateUserEmail(usuario) {
        const sanitized = this.sanitizeString(usuario).toLowerCase();
        
        const validation = {
            isValid: false,
            value: sanitized,
            errors: []
        };

        // Verificar que no esté vacío
        if (!sanitized) {
            validation.errors.push('El usuario es requerido');
            return validation;
        }

        // Verificar longitud
        if (sanitized.length < 5 || sanitized.length > 50) {
            validation.errors.push('El usuario debe tener entre 5 y 50 caracteres');
        }

        // Verificar formato
        if (!this.patterns.userEmail.test(sanitized)) {
            validation.errors.push('Formato inválido. Use: [rol][iniciales]@hidrocolon.com');
        }

        // Verificar dominio
        if (!sanitized.endsWith('@hidrocolon.com')) {
            validation.errors.push('Debe usar el dominio @hidrocolon.com');
        }

        // Verificar que tenga al menos 2 caracteres antes del @
        const [localPart] = sanitized.split('@');
        if (localPart && localPart.length < 2) {
            validation.errors.push('Debe incluir al menos el rol e iniciales');
        }

        validation.isValid = validation.errors.length === 0;
        return validation;
    }

    // Validar contraseña
    validatePassword(password) {
        const validation = {
            isValid: false,
            errors: [],
            strength: 0 // 0-100
        };

        // Verificar que no esté vacía
        if (!password) {
            validation.errors.push('La contraseña es requerida');
            return validation;
        }

        // Verificar longitud mínima
        if (password.length < 8) {
            validation.errors.push('La contraseña debe tener al menos 8 caracteres');
        } else {
            validation.strength += 20;
        }

        // Verificar longitud máxima
        if (password.length > 128) {
            validation.errors.push('La contraseña no puede exceder 128 caracteres');
        }

        // Verificar mayúsculas
        if (!/[A-Z]/.test(password)) {
            validation.errors.push('Debe incluir al menos una letra mayúscula');
        } else {
            validation.strength += 20;
        }

        // Verificar minúsculas
        if (!/[a-z]/.test(password)) {
            validation.errors.push('Debe incluir al menos una letra minúscula');
        } else {
            validation.strength += 20;
        }

        // Verificar números
        if (!/\d/.test(password)) {
            validation.errors.push('Debe incluir al menos un número');
        } else {
            validation.strength += 20;
        }

        // Verificar caracteres especiales (opcional pero suma puntos)
        if (/[@$!%*?&]/.test(password)) {
            validation.strength += 20;
        }

        // Verificar que no sea una contraseña común
        if (this.commonPasswords.includes(password.toLowerCase())) {
            validation.errors.push('Esta contraseña es muy común. Use una más segura');
            validation.strength = Math.min(validation.strength, 30);
        }

        // Verificar que no contenga el usuario
        // (Se validará en el controlador cuando tengamos ambos datos)

        validation.isValid = validation.errors.length === 0;
        return validation;
    }

    // Validar datos de login
    validateLoginData(data) {
        const validation = {
            isValid: false,
            data: {},
            errors: []
        };

        // Validar usuario
        const usuarioValidation = this.validateUserEmail(data.usuario);
        if (!usuarioValidation.isValid) {
            validation.errors.push(...usuarioValidation.errors);
        } else {
            validation.data.usuario = usuarioValidation.value;
        }

        // Validar contraseña (menos estricta para login)
        if (!data.password) {
            validation.errors.push('La contraseña es requerida');
        } else if (data.password.length > 128) {
            validation.errors.push('Contraseña demasiado larga');
        } else {
            validation.data.password = data.password; // No sanitizar contraseñas
        }

        validation.isValid = validation.errors.length === 0;
        return validation;
    }

    // Validar nombres
    validateName(name, fieldName = 'nombre') {
        const sanitized = this.sanitizeString(name);
        
        const validation = {
            isValid: false,
            value: sanitized,
            errors: []
        };

        if (!sanitized) {
            validation.errors.push(`El ${fieldName} es requerido`);
            return validation;
        }

        if (sanitized.length < 2) {
            validation.errors.push(`El ${fieldName} debe tener al menos 2 caracteres`);
        }

        if (sanitized.length > 50) {
            validation.errors.push(`El ${fieldName} no puede exceder 50 caracteres`);
        }

        if (!this.patterns.name.test(sanitized)) {
            validation.errors.push(`El ${fieldName} solo puede contener letras y espacios`);
        }

        validation.isValid = validation.errors.length === 0;
        return validation;
    }

    // Validar JWT Token
    validateJWTToken(token) {
        const validation = {
            isValid: false,
            errors: []
        };

        if (!token) {
            validation.errors.push('Token requerido');
            return validation;
        }

        // Remover "Bearer " si está presente
        const cleanToken = token.replace(/^Bearer\s+/i, '');

        if (!this.patterns.jwtToken.test(cleanToken)) {
            validation.errors.push('Formato de token inválido');
        }

        // Verificar longitud aproximada de JWT
        if (cleanToken.length < 100 || cleanToken.length > 2048) {
            validation.errors.push('Longitud de token inválida');
        }

        validation.isValid = validation.errors.length === 0;
        validation.token = cleanToken;
        return validation;
    }

    // Validar datos para crear usuario
    validateCreateUser(data) {
        const validation = {
            isValid: false,
            data: {},
            errors: []
        };

        // Validar usuario/email
        const usuarioValidation = this.validateUserEmail(data.usuario);
        if (!usuarioValidation.isValid) {
            validation.errors.push(...usuarioValidation.errors);
        } else {
            validation.data.usuario = usuarioValidation.value;
        }

        // Validar contraseña (estricta para creación)
        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.isValid) {
            validation.errors.push(...passwordValidation.errors);
        } else {
            validation.data.password = data.password;
        }

        // Verificar que la contraseña no contenga el usuario
        if (data.usuario && data.password) {
            const userPart = data.usuario.split('@')[0].toLowerCase();
            if (data.password.toLowerCase().includes(userPart)) {
                validation.errors.push('La contraseña no puede contener el nombre de usuario');
            }
        }

        // Validar nombres
        const nombresValidation = this.validateName(data.nombres, 'nombres');
        if (!nombresValidation.isValid) {
            validation.errors.push(...nombresValidation.errors);
        } else {
            validation.data.nombres = nombresValidation.value;
        }

        // Validar apellidos
        const apellidosValidation = this.validateName(data.apellidos, 'apellidos');
        if (!apellidosValidation.isValid) {
            validation.errors.push(...apellidosValidation.errors);
        } else {
            validation.data.apellidos = apellidosValidation.value;
        }

        // Validar rol_id
        if (!data.rol_id) {
            validation.errors.push('El rol es requerido');
        } else {
            const rolId = parseInt(data.rol_id);
            if (isNaN(rolId) || rolId < 1) {
                validation.errors.push('ID de rol inválido');
            } else {
                validation.data.rol_id = rolId;
            }
        }

        validation.isValid = validation.errors.length === 0;
        return validation;
    }

    // Validar parámetros de paginación
    validatePagination(query) {
        const validation = {
            isValid: true,
            data: {
                page: 1,
                limit: 10,
                offset: 0
            },
            errors: []
        };

        // Validar página
        if (query.page) {
            const page = parseInt(query.page);
            if (isNaN(page) || page < 1) {
                validation.errors.push('Número de página inválido');
                validation.isValid = false;
            } else if (page > 1000) {
                validation.errors.push('Número de página demasiado alto');
                validation.isValid = false;
            } else {
                validation.data.page = page;
            }
        }

        // Validar límite
        if (query.limit) {
            const limit = parseInt(query.limit);
            if (isNaN(limit) || limit < 1) {
                validation.errors.push('Límite inválido');
                validation.isValid = false;
            } else if (limit > 100) {
                validation.errors.push('Límite máximo es 100');
                validation.isValid = false;
            } else {
                validation.data.limit = limit;
            }
        }

        // Calcular offset
        validation.data.offset = (validation.data.page - 1) * validation.data.limit;

        return validation;
    }

    // Sanitizar entrada para búsquedas
    sanitizeSearchTerm(term) {
        if (!term) return '';
        
        return this.sanitizeString(term)
            .replace(/[%_]/g, '\\$&') // Escapar wildcards de SQL
            .substring(0, 100); // Limitar longitud de búsqueda
    }

    // Validar ID numérico
    validateId(id, fieldName = 'ID') {
        const validation = {
            isValid: false,
            value: null,
            errors: []
        };

        if (!id) {
            validation.errors.push(`${fieldName} es requerido`);
            return validation;
        }

        const numId = parseInt(id);
        if (isNaN(numId) || numId < 1) {
            validation.errors.push(`${fieldName} debe ser un número válido mayor a 0`);
        } else if (numId > 2147483647) { // MySQL INT max
            validation.errors.push(`${fieldName} demasiado grande`);
        } else {
            validation.value = numId;
            validation.isValid = true;
        }

        return validation;
    }

    // Validar headers de autenticación
    validateAuthHeaders(headers) {
        const validation = {
            isValid: false,
            token: null,
            errors: []
        };

        // Verificar que existe el header Authorization
        const authHeader = headers.authorization || headers.Authorization;
        
        if (!authHeader) {
            validation.errors.push('Header de autorización requerido');
            return validation;
        }

        // Verificar formato "Bearer token"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            validation.errors.push('Formato de autorización inválido. Use: Bearer <token>');
            return validation;
        }

        // Validar el token
        const tokenValidation = this.validateJWTToken(parts[1]);
        if (!tokenValidation.isValid) {
            validation.errors.push(...tokenValidation.errors);
            return validation;
        }

        validation.isValid = true;
        validation.token = tokenValidation.token;
        return validation;
    }

    // Obtener fortaleza de contraseña en texto
    getPasswordStrengthText(score) {
        if (score >= 80) return 'Muy fuerte';
        if (score >= 60) return 'Fuerte';
        if (score >= 40) return 'Moderada';
        if (score >= 20) return 'Débil';
        return 'Muy débil';
    }
}

// Exportar instancia única
module.exports = new Validators();