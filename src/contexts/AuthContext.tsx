// src/contexts/AuthContext.tsx
// Modification : après login, les rôles direction sont redirigés vers /demandes/cap
// (espace isolé CAP Demandes) — les autres rôles vont au portail comme avant.

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, FRONTEND_ROUTES, UserRole } from '@/constants';
import authService from '@/services/auth.service';

// Rôles qui ont un espace dédié CAP Demandes (pas le portail principal)
const CAP_DIRECTION_ROLES: string[] = [
  'sec-da',
  'directrice-adjointe',
  'sec-dir',
  'directeur',
]

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  nom: string | null;
  prenoms: string | null;
  login: (token: string, userNom: string, userPrenoms: string, userRole: UserRole) => void;
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

  const navigate = useNavigate();

  useEffect(() => {
    const storedToken  = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedRole   = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    const storedNom    = localStorage.getItem(STORAGE_KEYS.NOM);
    const storedPrenoms = localStorage.getItem(STORAGE_KEYS.PRENOMS);

    if (storedToken && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
      setNom(storedNom);
      setPrenoms(storedPrenoms);
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userNom: string, userPrenoms: string, userRole: UserRole): void => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.NOM, userNom);
    localStorage.setItem(STORAGE_KEYS.PRENOMS, userPrenoms);
    localStorage.setItem(STORAGE_KEYS.ROLE, userRole);

    setNom(userNom);
    setPrenoms(userPrenoms);
    setRole(userRole);
    setIsAuthenticated(true);

    // Redirection selon le rôle
    if (CAP_DIRECTION_ROLES.includes(userRole as string)) {
      // Espace CAP Demandes isolé — pas le portail principal
      navigate(FRONTEND_ROUTES.DEMANDES_CAP);
    } else {
      navigate(FRONTEND_ROUTES.PORTAIL);
    }
  };

  const logout = async (): Promise<void> => {
    const currentRole = role as string | null;

    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ROLE);
      localStorage.removeItem(STORAGE_KEYS.NOM);
      localStorage.removeItem(STORAGE_KEYS.PRENOMS);

      setIsAuthenticated(false);
      setRole(null);
      setNom(null);
      setPrenoms(null);

      // Rediriger vers la bonne page de login selon le rôle qui se déconnecte
      if (currentRole && CAP_DIRECTION_ROLES.includes(currentRole)) {
        navigate(FRONTEND_ROUTES.DEMANDES_CAP_LOGIN);
      } else {
        navigate(FRONTEND_ROUTES.LOGIN);
      }
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    role,
    nom,
    prenoms,
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
