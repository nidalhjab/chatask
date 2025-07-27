// Authentication configuration and utilities

export interface AuthUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  isAnonymous?: boolean;
}

// Firebase User interface (will be properly imported after npm install)
interface FirebaseUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  isAnonymous?: boolean;
}

export const mapFirebaseUser = (user: FirebaseUser | null): AuthUser | null => {
  if (!user) return null;
  
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    isAnonymous: user.isAnonymous,
  };
};

export const generateGuestDisplayName = (): string => {
  const adjectives = ['Curious', 'Thoughtful', 'Creative', 'Bright', 'Clever', 'Quick', 'Smart', 'Wise'];
  const nouns = ['Explorer', 'Thinker', 'Learner', 'User', 'Visitor', 'Guest', 'Friend', 'Student'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  
  return `${adjective} ${noun} ${number}`;
};

export const AUTH_ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  ANONYMOUS_SIGNIN_FAILED: 'Anonymous sign-in failed. Please try again.',
  SIGNOUT_FAILED: 'Sign-out failed. Please try again.',
} as const;

export type AuthErrorType = keyof typeof AUTH_ERRORS; 