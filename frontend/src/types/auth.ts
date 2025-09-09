export interface User {
    username: string;
    createdAt: string;
}

export interface RegisterRequest {
    username: string;
    commitment: string;
    salt: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
}

export interface PublicData {
    success: boolean;
    data: {
        username: string;
        commitment: string;
        salt: string;
    };
}

// Nuevos tipos para login
export interface LoginRequest {
    username: string;
    proof: any; // La prueba zk-SNARK serializada
    publicSignals: {
        salt: string;
        stored_commitment: string;
    };
}

export interface LoginResponse {
    success: boolean;
    message?: string;
    token?: string;
    user?: {
        username: string;
    };
}

export interface ZKProofResult {
    proof: any;
    publicSignals: {
        salt: string;
        stored_commitment: string;
    };
    success: boolean;
    error?: string;
}