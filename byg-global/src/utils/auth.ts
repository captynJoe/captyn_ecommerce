import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthResponse {
  user: any | null;
  error: string | null;
}

// Email/Password Sign In
export const emailPasswordSignIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Email/Password sign-in error:', error);
    return {
      user: null,
      error: error.message || 'Failed to sign in with email and password'
    };
  }
};

// Google Sign In with Redirect
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Handle redirect result
export const handleRedirectResult = async (): Promise<AuthResponse> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return { user: result.user, error: null };
    }
    return { user: null, error: null };
  } catch (error: any) {
    console.error('Redirect result error:', error);
    return {
      user: null,
      error: error.message || 'Failed to complete Google sign-in'
    };
  }
};

// Sign Out
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};
