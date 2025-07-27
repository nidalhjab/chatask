import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnonymousSignIn } from '../api/auth';
import LoadingSpinner from './LoadingSpinner';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { cleanFirebaseError } from '../utils/errorUtils';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  
  const anonymousSignInMutation = useAnonymousSignIn();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700">
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    const handleAnonymousSignIn = async () => {
      try {
        setError('');
        await anonymousSignInMutation.mutateAsync();
      } catch (error: any) {
        const cleanedError = cleanFirebaseError(error);
        setError(cleanedError);
      }
    };

    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Chatask</h1>
            <p className="text-gray-600 text-sm">Sign in to start chatting</p>
          </div>

          <div className="flex border-b mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-2 text-center font-medium transition-all duration-200 ${
                isLogin 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-2 text-center font-medium transition-all duration-200 ${
                !isLogin 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? <LoginForm /> : <SignUpForm />}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleAnonymousSignIn}
              disabled={anonymousSignInMutation.isPending}
              className="w-full mt-4 py-3 px-6 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {anonymousSignInMutation.isPending ? <LoadingSpinner /> : 'Continue as Guest'}
            </button>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider; 