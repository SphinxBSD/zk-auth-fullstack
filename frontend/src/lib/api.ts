import axios, {AxiosInstance} from 'axios';
import Cookies from 'js-cookie';
import {RegisterResponse, RegisterRequest, User } from '@/types/auth'

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

    // Should define RegisterRequest, AuthResponse
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const response = await this.api.post<RegisterResponse>('/api/register', data);
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