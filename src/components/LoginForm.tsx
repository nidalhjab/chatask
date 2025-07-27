import React, { useState } from 'react';
import {
  useForm,
  AnyFieldApi,
} from '@tanstack/react-form';
import { useLogin } from '../api/auth';
import LoadingSpinner from './LoadingSpinner';
import { cleanFirebaseError } from '../utils/errorUtils';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid && (
        <em className="text-red-600 text-sm mt-1 block">{field.state.meta.errors.join(', ')}</em>
      )}
      {field.state.meta.isValidating && <em>Validating...</em>}
    </>
  );
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [globalError, setGlobalError] = useState('');
  const loginMutation = useLogin();

  const clearGlobalError = () => {
    if (globalError) {
      setGlobalError('');
    }
  };

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value, {
        onSuccess: () => {
          onSuccess?.();
          setGlobalError('');
        },
        onError: (error: any) => {
          const errorMessage = cleanFirebaseError(error);
          setGlobalError(errorMessage);
          onError?.(errorMessage);
        },
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="mb-6"
    >
      <div className="mb-5">
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Email is required' : undefined,
          }}
        >
          {(field) => (
            <>
              <label htmlFor={field.name} className="block mb-2 text-gray-700 font-medium text-sm">Email</label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  clearGlobalError();
                }}
                type="email"
                placeholder="Enter your email"
                className={`w-full p-3 border border-gray-300 rounded-md text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:shadow-sm ${
                  field.state.meta.isTouched && !field.state.meta.isValid 
                    ? 'border-red-600 focus:border-red-600 focus:shadow-red-100' 
                    : ''
                }`}
              />
              <FieldInfo field={field} />
            </>
          )}
        </form.Field>
      </div>

      <div className="mb-5">
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Password is required'
                : value.length < 6
                ? 'Password must be at least 6 characters'
                : undefined,
          }}
        >
          {(field) => (
            <>
              <label htmlFor={field.name} className="block mb-2 text-gray-700 font-medium text-sm">Password</label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  clearGlobalError();
                }}
                type="password"
                placeholder="Enter your password"
                className={`w-full p-3 border border-gray-300 rounded-md text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:shadow-sm ${
                  field.state.meta.isTouched && !field.state.meta.isValid 
                    ? 'border-red-600 focus:border-red-600 focus:shadow-red-100' 
                    : ''
                }`}
              />
              <FieldInfo field={field} />
            </>
          )}
        </form.Field>
      </div>

      {globalError && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-md mb-4 text-sm">{globalError}</div>}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => {
          const isDisabled = 
            !canSubmit || 
            loginMutation.isPending || 
            isSubmitting;

          return (
            <button 
              type="submit" 
              disabled={isDisabled}
              className={`w-full py-3 px-6 border-none rounded-md text-base font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                isDisabled 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {loginMutation.isPending || isSubmitting ? <LoadingSpinner /> : 'Login'}
            </button>
          );
        }}
      </form.Subscribe>
    </form>
  );
};

export default LoginForm;
