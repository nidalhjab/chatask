import { useMutation } from '@tanstack/react-query';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { cleanFirebaseError } from '../utils/errorUtils';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignUpFormData {
  email: string;
  password: string;
}

// Login mutation
export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ email, password }: LoginFormData) => {
      const auth = getFirebaseAuth();
      try {
        return await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        const cleanedError = new Error(cleanFirebaseError(error));
        throw cleanedError;
      }
    },
  });
};

// Sign up mutation
export const useSignUp = () => {
  return useMutation({
    mutationFn: async ({ email, password }: SignUpFormData) => {
      const auth = getFirebaseAuth();
      try {
        return await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        const cleanedError = new Error(cleanFirebaseError(error));
        throw cleanedError;
      }
    },
  });
};

// Anonymous sign in mutation
export const useAnonymousSignIn = () => {
  return useMutation({
    mutationFn: async () => {
      const auth = getFirebaseAuth();
      try {
        return await signInAnonymously(auth);
      } catch (error) {
        const cleanedError = new Error(cleanFirebaseError(error));
        throw cleanedError;
      }
    },
    onError: (error: any) => {
      console.error('Error signing in anonymously:', error);
    },
  });
};

// Sign out mutation
export const useSignOut = () => {
  return useMutation({
    mutationFn: async () => {
      const auth = getFirebaseAuth();
      try {
        return await firebaseSignOut(auth);
      } catch (error) {
        const cleanedError = new Error(cleanFirebaseError(error));
        throw cleanedError;
      }
    },
  });
}; 