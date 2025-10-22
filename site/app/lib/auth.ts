import { useState, useEffect } from 'react';
import { 
  type User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser extends User {
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user has admin claims
          const tokenResult = await getIdTokenResult(firebaseUser);
          const isAdmin = tokenResult.claims.admin === true;
          
          setUser({
            ...firebaseUser,
            isAdmin
          });
        } catch (error) {
          console.error('Error getting user token:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await getIdToken(user);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    getAuthToken,
    isAdmin: user?.isAdmin || false
  };
}