import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, FRONTEND_ROUTES, UserRole } from '@/constants';
import authService from '@/services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  nom: string | null;
  prenoms: string | null;
  userId: number | null;
  login: (token: string, userNom: string, userPrenoms: string, userRole: UserRole, userId?: number) => void;
  logout: () => Promise<void>;
}

interface AuthContextProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [nom, setNom] = useState<string | null>(null);
  const [prenoms, setPrenoms] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    const storedNom = localStorage.getItem(STORAGE_KEYS.NOM);
    const storedPrenoms = localStorage.getItem(STORAGE_KEYS.PRENOMS);
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

    if (storedToken && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
      setNom(storedNom);
      setPrenoms(storedPrenoms);
      setUserId(storedUserId ? parseInt(storedUserId) : null);
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userNom: string, userPrenoms: string, userRole: UserRole, uid?: number): void => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.NOM, userNom);
    localStorage.setItem(STORAGE_KEYS.PRENOMS, userPrenoms);
    localStorage.setItem(STORAGE_KEYS.ROLE, userRole);
    if (uid !== undefined) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, uid.toString());
      setUserId(uid);
    }

    setNom(userNom);
    setPrenoms(userPrenoms);
    setRole(userRole);
    setIsAuthenticated(true);

    navigate(FRONTEND_ROUTES.PORTAIL);
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ROLE);
      localStorage.removeItem(STORAGE_KEYS.NOM);
      localStorage.removeItem(STORAGE_KEYS.PRENOMS);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);

      setIsAuthenticated(false);
      setRole(null);
      setNom(null);
      setPrenoms(null);
      setUserId(null);
      
      navigate(FRONTEND_ROUTES.PORTAIL);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    role,
    nom,
    prenoms,
    userId,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

export { AuthContext };
