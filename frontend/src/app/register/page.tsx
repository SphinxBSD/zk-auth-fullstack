// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prepareRegistrationData } from '../../utils/zkUtils';

interface RegistrationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      showMessage('El nombre de usuario es requerido', 'error');
      return false;
    }

    if (!formData.email.trim()) {
      showMessage('El email es requerido', 'error');
      return false;
    }

    if (!formData.password) {
      showMessage('La contraseña es requerida', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage('Las contraseñas no coinciden', 'error');
      return false;
    }

    if (formData.password.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Iniciando proceso de registro ZK...');
      
      // Verificar si el usuario ya existe
      const existingUsers = JSON.parse(localStorage.getItem('zkUsers') || '[]');
      const userExists = existingUsers.some((user: any) => user.username === formData.username);
      
      if (userExists) {
        showMessage('El nombre de usuario ya está registrado', 'error');
        return;
      }

      // Preparar datos de registro usando el circuito getCommitment
      const registrationResult = await prepareRegistrationData(
        formData.username,
        formData.email,
        formData.password
      );

      if (!registrationResult.success) {
        showMessage(`Error preparando registro: ${registrationResult.error}`, 'error');
        return;
      }

      console.log('Commitment generado:', registrationResult.commitment);
      console.log('Salt generado:', registrationResult.salt);

      // Simular envío al servidor (en tu caso real, enviarías a tu API de Node.js)
      const userData = {
        username: registrationResult.username,
        commitment: registrationResult.commitment,
        salt: registrationResult.salt,
        timestamp: new Date().toISOString()
      };

      // Guardar en localStorage para demo (en producción esto estaría en tu backend)
      const updatedUsers = [...existingUsers, userData];
      localStorage.setItem('zkUsers', JSON.stringify(updatedUsers));

      console.log('Usuario registrado exitosamente:', userData.username);
      showMessage('¡Registro exitoso! Usuario creado con commitment ZK.', 'success');

      // Limpiar formulario
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Redirigir al home después de 2 segundos
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error durante el registro:', error);
      showMessage(`Error durante el registro: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registro ZK
            </h1>
            <p className="text-gray-600">
              Crear cuenta con pruebas de conocimiento cero
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario <span className="text-green-600">(Público)</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Elige un nombre de usuario"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este campo será visible públicamente
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-600">(Privado)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nunca se almacena en texto plano, solo en el commitment ZK
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña <span className="text-red-600">(Privada)</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nunca se almacena en texto plano, solo en el commitment ZK
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirma tu contraseña"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                  } text-white`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando Commitment ZK...
                    </span>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 mb-4">
              ¿Ya tienes cuenta?
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Iniciar Sesión
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

          {/* ZK Process Info */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              ¿Cómo funciona el registro ZK?
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                <p>Generates un <strong>salt</strong> único y aleatorio</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                <p>Calcula un <strong>commitment</strong> usando: <code className="bg-blue-100 px-1 rounded">hash(email, password, salt)</code></p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
                <p>Se almacenan solo: <strong>username</strong>, <strong>commitment</strong> y <strong>salt</strong></p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
                <p><strong>Tu email y contraseña NUNCA se almacenan</strong> en texto plano</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}