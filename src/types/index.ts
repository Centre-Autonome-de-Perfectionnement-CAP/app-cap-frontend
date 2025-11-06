/**
 * Types de base de l'application
 */

// Types d'API
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: number;
  success?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

// Types d'authentification
export interface User {
  id: number;
  last_name: string;
  first_name: string;
  name?: string; // For backward compatibility
  email: string;
  phone?: string;
  rib_number?: string;
  rib?: string;
  photo?: string;
  ifu_number?: string;
  ifu?: string;
  bank?: string;
  role?: string;
  role_display_name?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// Types HTTP
export type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestOptions {
  method: RequestMethod;
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

// Types de navigation
export interface NavItem {
  component?: string;
  name: string;
  to?: string;
  icon?: string;
  badge?: {
    color: string;
    text: string;
  };
  items?: NavItem[];
}

// Types de route
export interface RouteConfig {
  path: string;
  exact?: boolean; // Deprecated: Not used in React Router v6+
  name: string;
  element?: React.ComponentType<any>;
}

// Ré-export des types des modules
export * from './inscription.types.ts';
export * from './finance.types.ts';
export * from './cours.types.ts';
