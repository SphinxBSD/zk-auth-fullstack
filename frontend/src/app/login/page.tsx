'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateLoginProof } from '@/utils/zkUtils';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Limpiar error al cambiar inputs
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Obtener datos públicos del usuario
            console.log('Obteniendo datos públicos para:', formData.username);
            const publicData = await apiClient.getPublicUserData(formData.username);
            
            if (!publicData.success) {
                throw new Error('Usuario no encontrado');
            }

            console.log('Datos públicos obtenidos:', publicData.data);

            // 2. Generar prueba ZK
            console.log('Generando prueba ZK...');
            const proofResult = await generateLoginProof(
                formData.email,
                formData.password,
                publicData.data.salt,
                publicData.data.commitment
            );

            if (!proofResult.success) {
                throw new Error(`Error generando prueba: ${proofResult.error}`);
            }

            console.log('Prueba ZK generada exitosamente');

            // 3. Enviar prueba al servidor para autenticación
            const loginResponse = await apiClient.login({
                username: formData.username,
                proof: proofResult.proof,
                publicSignals: proofResult.publicSignals
            });

            if (loginResponse.success) {
                console.log('Login exitoso');
                router.push('/'); // Redirigir al dashboard
            } else {
                throw new Error(loginResponse.message || 'Login fallido');
            }

        } catch (error) {
            console.error('Error en login:', error);
            setError(error instanceof Error ? error.message : 'Error desconocido en el login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Autenticación con Zero-Knowledge
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Nombre de usuario
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ingresa tu nombre de usuario"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
                        </button>
                    </div>

                    <div className="text-center">
                        <a 
                            href="/register" 
                            className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                            ¿No tienes cuenta? Regístrate
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}