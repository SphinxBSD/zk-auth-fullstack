// zkUtils.js
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

// Importar circuitos compilados
import getCommitment from '../circuits/getCommitment.json';
import assertCommitment from '../circuits/assertCommitment.json';

// Convertir string a Field hexadecimal compatible con Noir
function stringToField(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    // Noir Fields son de ~254 bits, así que limitamos a 31 bytes para estar seguros
    const truncatedBytes = bytes.slice(0, 31);
    let result = BigInt(0);
    for (let i = 0; i < truncatedBytes.length; i++) {
        result = result * BigInt(256) + BigInt(truncatedBytes[i]);
    }
    return `0x${result.toString(16)}`;
}

// Generar salt aleatorio como Field hexadecimal
function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    let result = BigInt(0);
    
    for (let i = 0; i < array.length; i++) {
        result = result * BigInt(256) + BigInt(array[i]);
    }
    
    return `0x${result.toString(16)}`;
}

// Clase para manejar ambos circuitos ZK
class ZKAuthSystem {
    constructor() {
        this.commitmentCircuit = null;
        this.assertCircuit = null;
        this.commitmentBackend = null;
        this.assertBackend = null;
        this.initialized = false;
    }

    // Inicializar ambos circuitos
    async initialize() {
        try {
            console.log('Inicializando circuitos ZK...');
            
            // Inicializar circuito para generar commitment
            console.log('Inicializando getCommitment...');
            this.commitmentBackend = new UltraHonkBackend(getCommitment.bytecode);
            this.commitmentCircuit = new Noir(getCommitment, this.commitmentBackend);
            
            // Inicializar circuito para validar commitment
            console.log('Inicializando assertCommitment...');
            this.assertBackend = new UltraHonkBackend(assertCommitment.bytecode);
            this.assertCircuit = new Noir(assertCommitment, this.assertBackend);
            
            this.initialized = true;
            console.log('Ambos circuitos ZK inicializados correctamente');
            
            return true;
        } catch (error) {
            console.error('Error inicializando circuitos ZK:', error);
            this.initialized = false;
            return false;
        }
    }

    // Generar commitment usando getCommitment (para registro)
    async generateCommitment(email, password, salt = null) {
        if (!this.initialized) {
            throw new Error('Sistema ZK no inicializado. Llama initialize() primero.');
        }

        try {
            // Generar salt si no se proporciona
            if (!salt) {
                salt = generateSalt();
            }

            console.log('Generando commitment con getCommitment...');
            console.log('Email field:', stringToField(email));
            console.log('Password field:', stringToField(password));
            console.log('Salt:', salt);

            // Preparar inputs para el circuito getCommitment
            const input = {
                email: stringToField(email),
                password: stringToField(password),
                salt: salt
            };

            // Ejecutar el circuito para obtener el commitment
            const { returnValue } = await this.commitmentCircuit.execute(input);
            
            const commitment = returnValue;
            console.log('Commitment generado:', commitment);

            return {
                commitment: commitment,
                salt: salt,
                success: true
            };

        } catch (error) {
            console.error('Error generando commitment:', error);
            return {
                commitment: null,
                salt: salt,
                success: false,
                error: error.message
            };
        }
    }

    // Generar prueba ZK usando assertCommitment (para login)
    async generateLoginProof(email, password, salt, storedCommitment) {
        if (!this.initialized) {
            throw new Error('Sistema ZK no inicializado. Llama initialize() primero.');
        }

        try {
            console.log('Generando prueba de login con assertCommitment...');

            const input = {
                email: stringToField(email),
                password: stringToField(password),
                salt: salt,
                stored_commitment: storedCommitment
            };

            // Generar la prueba usando el circuito de aserción
            const proof = await this.assertCircuit.generateProof(input);
            
            console.log('Prueba de login generada exitosamente');
            
            return {
                proof: proof,
                publicSignals: {
                    salt: salt,
                    stored_commitment: storedCommitment
                },
                success: true
            };

        } catch (error) {
            console.error('Error generando prueba de login:', error);
            return {
                proof: null,
                publicSignals: null,
                success: false,
                error: error.message
            };
        }
    }

    // Verificar prueba de login
    async verifyLoginProof(proof) {
        if (!this.initialized) {
            throw new Error('Sistema ZK no inicializado. Llama initialize() primero.');
        }

        try {
            console.log('Verificando prueba de login...');
            
            const isValid = await this.assertCircuit.verifyProof(proof);
            
            console.log('Resultado de verificación:', isValid);
            return isValid;

        } catch (error) {
            console.error('Error verificando prueba de login:', error);
            return false;
        }
    }

    // Método para probar que el commitment es correcto localmente (sin generar prueba)
    async validateCommitment(email, password, salt, expectedCommitment) {
        if (!this.initialized) {
            throw new Error('Sistema ZK no inicializado. Llama initialize() primero.');
        }

        try {
            // Generar commitment con las credenciales
            const result = await this.generateCommitment(email, password, salt);
            
            if (!result.success) {
                return false;
            }

            // Comparar con el esperado
            const isValid = result.commitment === expectedCommitment;
            console.log('Validación local del commitment:', isValid);
            
            return isValid;

        } catch (error) {
            console.error('Error validando commitment:', error);
            return false;
        }
    }
}

// Instancia singleton del sistema ZK
let zkSystemInstance = null;

// Función para obtener instancia inicializada del sistema ZK
async function getZKSystem() {
    if (!zkSystemInstance) {
        zkSystemInstance = new ZKAuthSystem();
        const initialized = await zkSystemInstance.initialize();
        
        if (!initialized) {
            throw new Error('No se pudo inicializar el sistema ZK');
        }
    }
    
    return zkSystemInstance;
}

// Función simplificada para generar commitment (para registro)
async function quickGenerateCommitment(email, password, salt = null) {
    try {
        const zkSystem = await getZKSystem();
        return await zkSystem.generateCommitment(email, password, salt);
    } catch (error) {
        console.error('Error en quickGenerateCommitment:', error);
        return {
            commitment: null,
            salt: salt,
            success: false,
            error: error.message
        };
    }
}

// Función para preparar datos de registro
async function prepareRegistrationData(username, email, password) {
    try {
        // Generar commitment usando el circuito getCommitment
        const result = await quickGenerateCommitment(email, password);
        
        if (!result.success) {
            throw new Error(`Error generando commitment: ${result.error}`);
        }

        return {
            username: username,
            commitment: result.commitment,
            salt: result.salt,
            success: true
        };

    } catch (error) {
        console.error('Error preparando datos de registro:', error);
        return {
            username: username,
            commitment: null,
            salt: null,
            success: false,
            error: error.message
        };
    }
}

// Función para generar prueba de login
async function generateLoginProof(email, password, salt, storedCommitment) {
    try {
        const zkSystem = await getZKSystem();
        return await zkSystem.generateLoginProof(email, password, salt, storedCommitment);
    } catch (error) {
        console.error('Error en generateLoginProof:', error);
        return {
            proof: null,
            publicSignals: null,
            success: false,
            error: error.message
        };
    }
}

// Función para verificar prueba de login
async function verifyLoginProof(proof) {
    try {
        const zkSystem = await getZKSystem();
        return await zkSystem.verifyLoginProof(proof);
    } catch (error) {
        console.error('Error en verifyLoginProof:', error);
        return false;
    }
}

// Exports
export {
    stringToField,
    generateSalt,
    ZKAuthSystem,
    getZKSystem,
    quickGenerateCommitment,
    prepareRegistrationData,
    generateLoginProof,
    verifyLoginProof
};

// Export por defecto
export default ZKAuthSystem;