import axios, {AxiosInstance} from 'axios';
import Cookies from 'js-cookie';
import {RegisterResponse, RegisterRequest, User, PublicData, LoginRequest, LoginResponse } from '@/types/auth'

class ApiClient {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        });

        // Interceptor para agregar el token a las peticiones
        this.api.interceptors.request.use((config) => {
            const token = Cookies.get('auth-token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Interceptor para manejar errores de autenticacion
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        )
    }

    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const response = await this.api.post<RegisterResponse>('/api/register', data);
        return response.data;
    }

    async getPublicUserData(username: string): Promise<PublicData> {
        const response = await this.api.get<PublicData>(`/api/user/${username}/public`);
        return response.data;
    }

    // Nuevo método para login con ZK proof
    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await this.api.post<LoginResponse>('/api/login', data);
        
        // Si el login es exitoso, guardar el token
        if (response.data.success && response.data.token) {
            Cookies.set('auth-token', response.data.token, { 
                expires: 7, // 7 días
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        }
        
        return response.data;
    }

    async getProfile(): Promise<User> {
        const response = await this.api.get<{user: User}>('/api/profile');
        return response.data.user;
    }

    logout(): void {
        Cookies.remove('auth-token');
    }

    getToken(): string | undefined {
        return Cookies.get('auth-token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export const apiClient = new ApiClient();