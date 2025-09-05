export interface User {
    username: string;
    commitment: string;
    salt: string;
    createdAt: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
}

export interface RegisterRequest {
    username: string;
    commitment: string;
    salt: string;
}

export interface ApiError {
  message: string;
}