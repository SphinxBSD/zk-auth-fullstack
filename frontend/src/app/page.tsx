// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateLoginProof, verifyLoginProof } from '../utils/zkUtils';

interface StoredUser {
  username: string;
  commitment: string;
  salt: string;
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loginData, setLoginData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // Cargar usuarios registrados del localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('zkUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Buscar el usuario en el almacenamiento local
      const user = users.find(u => u.username === loginData.username);
      if (!user) {
        showMessage('Usuario no encontrado', 'error');
        return;
      }

      console.log('Iniciando proceso de login ZK...');
      console.log('Usuario encontrado:', user.username);

      // Generar prueba ZK usando el circuito assertCommitment
      const proofResult = await generateLoginProof(
        loginData.email,
        loginData.password,
        user.salt,
        user.commitment
      );

      if (!proofResult.success) {
        showMessage(`Error generando prueba ZK: ${proofResult.error}`, 'error');
        return;
      }

      // Verificar la prueba
      const isValidProof = await verifyLoginProof(proofResult.proof);

      if (isValidProof) {
        showMessage('¡Login exitoso! Credenciales verificadas con ZK.', 'success');
        console.log('Login ZK exitoso para usuario:', loginData.username);
      } else {
        showMessage('Credenciales incorrectas', 'error');
      }

    } catch (error) {
      console.error('Error durante el login:', error);
      showMessage(`Error durante el login: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema ZK Auth
            </h1>
            <p className="text-gray-600">
              Autenticación con Pruebas de Conocimiento Cero
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Iniciar Sesión
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu usuario"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Privado)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña (Privada)
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                } text-white`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando con ZK...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              ¿No tienes cuenta?
            </p>
            <Link
              href="/register"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Registrarse
            </Link>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {users.length > 0 && (
            <div className="mt-8 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Usuarios Registrados (Debug)
              </h3>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <div><strong>Usuario:</strong> {user.username}</div>
                    <div><strong>Commitment:</strong> {user.commitment.slice(0, 20)}...</div>
                    <div><strong>Salt:</strong> {user.salt.slice(0, 20)}...</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}