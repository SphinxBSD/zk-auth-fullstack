// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface StoredUser {
  username: string;
  commitment: string;
  salt: string;
}

export default function HomePage() {
  const { user, logout, loading} = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Bienvenido
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Por favor inicia sesión o regístrate para continuar
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 block text-center"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200 block text-center"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
}