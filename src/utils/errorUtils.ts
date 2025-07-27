/**
 * Cleans up Firebase error messages by removing Firebase prefixes and formatting them for user display
 */
export const cleanFirebaseError = (error: any): string => {
  if (!error) return 'An unexpected error occurred';
  
  let message = error.message || error.toString();
  
  // Remove "Firebase: Error (auth/...)" prefix and extract the error code
  const firebaseErrorMatch = message.match(/Firebase: Error \(auth\/([^)]+)\)/);
  if (firebaseErrorMatch) {
    const errorCode = firebaseErrorMatch[1];
    return formatAuthErrorCode(errorCode);
  }
  
  // Remove "FirebaseError: " prefix if present
  message = message.replace(/^FirebaseError:\s*/, '');
  
  // Remove "(auth/...)" patterns and just return the error code
  const authErrorMatch = message.match(/\(auth\/([^)]+)\)/);
  if (authErrorMatch) {
    const errorCode = authErrorMatch[1];
    return formatAuthErrorCode(errorCode);
  }
  
  return message;
};

/**
 * Formats Firebase auth error codes into user-friendly messages
 */
const formatAuthErrorCode = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'invalid-credential': 'Invalid email or password',
    'user-not-found': 'No account found with this email',
    'wrong-password': 'Incorrect password',
    'email-already-in-use': 'An account with this email already exists',
    'weak-password': 'Password should be at least 6 characters',
    'invalid-email': 'Please enter a valid email address',
    'user-disabled': 'This account has been disabled',
    'too-many-requests': 'Too many failed attempts. Please try again later',
    'network-request-failed': 'Network error. Please check your connection',
    'internal-error': 'Internal error. Please try again later',
    'invalid-verification-code': 'Invalid verification code',
    'invalid-verification-id': 'Invalid verification ID',
    'missing-verification-code': 'Please enter the verification code',
    'missing-verification-id': 'Missing verification ID',
    'quota-exceeded': 'Quota exceeded. Please try again later',
    'app-deleted': 'App has been deleted',
    'app-not-authorized': 'App not authorized',
    'argument-error': 'Invalid argument provided',
    'invalid-api-key': 'Invalid API key',
    'invalid-user-token': 'User token is invalid',
    'operation-not-allowed': 'This operation is not allowed',
    'requires-recent-login': 'Please log in again to continue',
    'unauthorized-domain': 'Domain is not authorized',
  };
  
  return errorMessages[errorCode] || errorCode.replace(/-/g, ' ');
}; 