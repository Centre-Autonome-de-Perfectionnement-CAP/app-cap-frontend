import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, FRONTEND_ROUTES, UserRole } from '@/constants';
import authService from '@/services/auth.service';

// Interface User (à garder telle quelle)
export interface User {
  id: number
  first_name: string
  last_name: string
  prenoms?: string
  nom?: string
  email: string
  phone?: string | null
  role: string
  role_display_name: string
  role_id?: number | null
  user_type: 'user' | 'professor' | 'responsable'
  classes?: ClassByYear[]
}

// Types pour les classes
export interface ClassGroup {
  id: number;
  group_name: string | null;
  study_level: string | number;
  filiere: string;
  cycle?: string;
  total_etudiants: number;
  academic_year_id: number;
  academic_year_name: string;
  validation_average?: number | string;
}

export interface ClassByYear {
  academic_year_id: number;
  academic_year_name: string;
  classes: ClassGroup[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  nom: string | null;
  prenoms: string | null;
  user: User | null; 
  login: (token: string, userNom: string, userPrenoms: string, userRole: UserRole) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void; 
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
  const [user, setUser] = useState<User | null>(null); 

  const navigate = useNavigate();

  // Restauration de session depuis localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    const storedNom = localStorage.getItem(STORAGE_KEYS.NOM);
    const storedPrenoms = localStorage.getItem(STORAGE_KEYS.PRENOMS);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER); // Récupérer l'utilisateur complet

    if (storedToken && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
      setNom(storedNom);
      setPrenoms(storedPrenoms);
      
      // Restaurer l'utilisateur complet si disponible
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Erreur lors du parsing de l\'utilisateur:', error);
        }
      }
    }
    setIsLoading(false);
  }, []);

  // Login : stockage + redirection selon le rôle
  const login = (
    token: string,
    userNom: string,
    userPrenoms: string,
    userRole: UserRole
  ): void => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.NOM, userNom);
    localStorage.setItem(STORAGE_KEYS.PRENOMS, userPrenoms);
    localStorage.setItem(STORAGE_KEYS.ROLE, userRole);

    setNom(userNom);
    setPrenoms(userPrenoms);
    setRole(userRole);
    setIsAuthenticated(true);

    // Redirection selon le rôle
    if ((userRole as string) === 'responsable') {
      navigate(FRONTEND_ROUTES.RESPONSABLE_DASHBOARD);
    } else {
      navigate(FRONTEND_ROUTES.PORTAIL);
    }
  };

  // Mise à jour partielle des données utilisateur
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      // Mettre à jour les champs individuels si nécessaire
      if (userData.nom) {
        setNom(userData.nom);
        localStorage.setItem(STORAGE_KEYS.NOM, userData.nom);
      }
      if (userData.prenoms) {
        setPrenoms(userData.prenoms);
        localStorage.setItem(STORAGE_KEYS.PRENOMS, userData.prenoms);
      }
      if (userData.role) {
        setRole(userData.role as UserRole);
        localStorage.setItem(STORAGE_KEYS.ROLE, userData.role);
      }
    }
  };

  // Logout
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
      localStorage.removeItem(STORAGE_KEYS.USER);

      setIsAuthenticated(false);
      setRole(null);
      setNom(null);
      setPrenoms(null);
      setUser(null);

      navigate(FRONTEND_ROUTES.LOGIN);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    role,
    nom,
    prenoms,
    user, // Ajout de user dans la valeur du contexte
    login,
    logout,
    updateUser, // Ajout de updateUser
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