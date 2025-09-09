'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prepareRegistrationData } from '../../utils/zkUtils';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface RegistrationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type MessageType = 'success' | 'error' | '';

// Components
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const MessageAlert = ({ message, type }: { message: string; type: MessageType }) => {
  if (!message) return null;
  
  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl max-w-md transform transition-all duration-300 backdrop-blur-xl border ${
      type === 'success' 
        ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
        : 'bg-red-500/90 border-red-400/50 text-white'
    }`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

const ProcessStep = ({ number, children }: { number: number; children: React.ReactNode }) => (
  <div className="flex items-start group">
    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white mr-4 mt-1 shadow-lg group-hover:scale-110 group-hover:shadow-cyan-500/25 transition-all duration-300">
      {number}
    </div>
    <div className="flex-1 text-slate-300 leading-relaxed">{children}</div>
  </div>
);

const InputField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  minLength,
  isPrivate = false,
  helpText 
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  isPrivate?: boolean;
  helpText?: string;
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-semibold text-slate-200">
      {label} 
      <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${
        isPrivate 
          ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
      }`}>
        {isPrivate ? 'Privado' : 'Público'}
      </span>
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600/50 text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 backdrop-blur-sm hover:border-slate-500/70 hover:bg-slate-700/70"
      placeholder={placeholder}
    />
    {helpText && (
      <p className="text-xs text-slate-400 flex items-center">
        <svg className="w-3 h-3 mr-1 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        {helpText}
      </p>
    )}
  </div>
);

// Main component
export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('');
  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Utility functions
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const validations = [
      { condition: !formData.username.trim(), message: 'El nombre de usuario es requerido' },
      { condition: !formData.email.trim(), message: 'El email es requerido' },
      { condition: !formData.password, message: 'La contraseña es requerida' },
      { condition: formData.password !== formData.confirmPassword, message: 'Las contraseñas no coinciden' },
      { condition: formData.password.length < 6, message: 'La contraseña debe tener al menos 6 caracteres' }
    ];

    for (const validation of validations) {
      if (validation.condition) {
        showMessage(validation.message, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log('Iniciando proceso de registro ZK...');

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

      await register(
        registrationResult.username,
        registrationResult.commitment,
        registrationResult.salt
      );

      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      showMessage('¡Cuenta creada exitosamente!', 'success');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error: any) {
      showMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <MessageAlert message={message} type={messageType} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/30 to-pink-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl shadow-2xl shadow-cyan-500/25 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-3">
                Registro ZK
              </h1>
              <p className="text-slate-400 text-lg">
                Crear cuenta con pruebas de conocimiento cero
              </p>
            </div>

            {/* Registration Form */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 mb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Nombre de Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Elige un nombre de usuario único"
                  required
                  helpText="Este campo será visible públicamente"
                />

                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                  isPrivate
                  helpText="Nunca se almacena en texto plano, solo en el commitment ZK"
                />

                <InputField
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  isPrivate
                  helpText="Nunca se almacena en texto plano, solo en el commitment ZK"
                />

                <InputField
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirma tu contraseña"
                  required
                  minLength={6}
                />

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transform transition-all duration-200 ${
                      isLoading
                        ? 'bg-slate-600 cursor-not-allowed scale-95'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <LoadingSpinner />
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
            <div className="text-center mb-8">
              <p className="text-slate-400 mb-4">¿Ya tienes cuenta?</p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-slate-200 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-700/50 transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Iniciar Sesión
              </Link>
            </div>

            {/* ZK Process Info */}
            <div className="bg-gradient-to-r from-slate-800/60 to-purple-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¿Cómo funciona el registro ZK?
              </h3>
              
              <div className="space-y-4">
                <ProcessStep number={1}>
                  <p>Se genera un <strong className="text-cyan-300">salt</strong> único y aleatorio para mayor seguridad</p>
                </ProcessStep>
                
                <ProcessStep number={2}>
                  <p>Se calcula un <strong className="text-cyan-300">commitment</strong> usando: <code className="bg-slate-700/50 px-2 py-1 rounded text-cyan-200 font-mono text-sm border border-slate-600/50">hash(email, password, salt)</code></p>
                </ProcessStep>
                
                <ProcessStep number={3}>
                  <p>Se almacenan únicamente: <strong className="text-cyan-300">username</strong>, <strong className="text-cyan-300">commitment</strong> y <strong className="text-cyan-300">salt</strong></p>
                </ProcessStep>
                
                <ProcessStep number={4}>
                  <p><strong className="text-emerald-300">Tu email y contraseña NUNCA se almacenan</strong> en texto plano en nuestros servidores</p>
                </ProcessStep>
              </div>

              <div className="mt-6 p-4 bg-emerald-500/20 rounded-xl border border-emerald-400/30 backdrop-blur-sm">
                <div className="flex items-center text-emerald-200">
                  <svg className="w-5 h-5 mr-2 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">Máxima privacidad garantizada con tecnología Zero-Knowledge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}