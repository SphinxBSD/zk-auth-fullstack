const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Simulacion de base de datos en memoria
const users = new Map();

// Endpoint de registro
app.post('/api/register', async (req, res) => {
    try {
        const {username, commitment, salt} = req.body;

        // Validaciones basicas
        if (!username || !commitment || !salt) {
            return res.status(400).json({
                success: false,
                message: 'Username, commitment y salt son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        if (users.has(username)) {
            return res.status(409).json({
                success: false,
                message: 'El usuario ya existe'
            });
        }

        // Almacenar usuario
        users.set(username, {
            username,
            commitment,
            salt,
            createdAt: new Date().toISOString()
        });

        console.log(`Usuario registrado: ${username}`);
        console.log(`Commitment: ${commitment}`);
        console.log(`Salt: ${salt}`);

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

// Endpoint para obtener datos públicos de un usuario (para login)
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

// Endpoint para listar usuarios registrados (desarrollo)
app.get('/api/users', (req, res)=>{
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
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
//   console.log('Usuario por defecto: admin@example.com, password: admin123');
});

module.exports = app;