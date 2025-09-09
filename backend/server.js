const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { UltraHonkBackend } = require('@aztec/bb.js');
const { Noir } = require('@noir-lang/noir_js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Middleware - UPDATED with size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Simulacion de base de datos en memoria
const users = new Map();

// Cargar el circuito compilado para verificación
let assertCommitmentCircuit = null;
let assertCommitmentBackend = null;

async function initializeZKVerification() {
    try {
        console.log('Inicializando verificación ZK en el servidor...');
        
        // Cargar el circuito compilado (necesitarás copiar assertCommitment.json al backend)
        const assertCommitment = require('./circuits/assertCommitment.json');
        
        assertCommitmentBackend = new UltraHonkBackend(assertCommitment.bytecode);
        assertCommitmentCircuit = new Noir(assertCommitment, assertCommitmentBackend);
        
        console.log('Verificación ZK inicializada correctamente en el servidor');
        return true;
    } catch (error) {
        console.error('Error inicializando verificación ZK:', error);
        return false;
    }
}

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido'
            });
        }
        req.user = user;
        next();
    });
}

// Endpoint de registro (existente)
app.post('/api/register', async (req, res) => {
    try {
        const {username, commitment, salt} = req.body;

        if (!username || !commitment || !salt) {
            return res.status(400).json({
                success: false,
                message: 'Username, commitment y salt son requeridos'
            });
        }

        if (users.has(username)) {
            return res.status(409).json({
                success: false,
                message: 'El usuario ya existe'
            });
        }

        users.set(username, {
            username,
            commitment,
            salt,
            createdAt: new Date().toISOString()
        });

        console.log(`Usuario registrado: ${username}`);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente'
        });
    } catch(error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para obtener datos públicos (existente)
app.get('/api/user/:username/public', (req, res) => {
    try {
        const {username} = req.params;

        const user = users.get(username);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                username: user.username,
                commitment: user.commitment,
                salt: user.salt
            }
        });
    } catch (error) {
        console.error('Error obteniendo datos publicos', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Nuevo endpoint de login con verificación ZK
app.post('/api/login', async (req, res) => {
    try {
        const { username, proof, publicSignals } = req.body;

        // Debug logging
        console.log('Received proof data:', JSON.stringify(proof, null, 2));

        // Validaciones básicas
        if (!username || !proof || !publicSignals) {
            return res.status(400).json({
                success: false,
                message: 'Username, proof y publicSignals son requeridos'
            });
        }

        // Verificar que el usuario existe
        const user = users.get(username);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que el commitment en las señales públicas coincide con el almacenado
        if (publicSignals.stored_commitment !== user.commitment) {
            return res.status(400).json({
                success: false,
                message: 'Commitment no coincide'
            });
        }

        // Verificar que el salt coincide
        if (publicSignals.salt !== user.salt) {
            return res.status(400).json({
                success: false,
                message: 'Salt no coincide'
            });
        }

        // Verificar la prueba ZK
        if (!assertCommitmentCircuit) {
            return res.status(500).json({
                success: false,
                message: 'Sistema de verificación ZK no inicializado'
            });
        }

        console.log('Verificando prueba ZK para usuario:', username);
        
        try {
            // CORREGIDO: Convertir la prueba al formato esperado si es necesario
            const proofData = Array.isArray(proof) ? proof : [proof];
            
            console.log('Verificando prueba con formato:', proofData);
            const isValidProof = await assertCommitmentBackend.verifyProof(proofData);
            
            if (!isValidProof) {
                return res.status(401).json({
                    success: false,
                    message: 'Prueba ZK inválida'
                });
            }

            console.log('Prueba ZK verificada exitosamente para:', username);

            // Generar JWT token
            const token = jwt.sign(
                { 
                    username: user.username,
                    loginTime: new Date().toISOString()
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                token: token,
                user: {
                    username: user.username
                }
            });

        } catch (proofError) {
            console.error('Error verificando prueba ZK:', proofError);
            console.error('Detalles del error:', proofError.stack);
            return res.status(401).json({
                success: false,
                message: 'Error verificando credenciales',
                details: proofError.message
            });
        }

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint protegido de perfil
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const user = users.get(req.user.username);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: {
                username: user.username,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para listar usuarios (desarrollo)
app.get('/api/users', (req, res) => {
    try {
        const userList = Array.from(users.values()).map(user => ({
            username: user.username,
            createdAt: user.createdAt
        }));

        res.json({
            success: true,
            users: userList,
            total: userList.length
        });
    } catch (error) {
        console.error('Error obteniendo usuarios', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Inicializar servidor
async function startServer() {
    // Inicializar verificación ZK
    const zkInitialized = await initializeZKVerification();
    
    if (!zkInitialized) {
        console.warn('Advertencia: Verificación ZK no pudo inicializarse. El login con ZK no funcionará.');
    }

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
        console.log(`Verificación ZK: ${zkInitialized ? 'Activada' : 'Desactivada'}`);
    });
}

startServer();

module.exports = app;