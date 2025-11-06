import HttpService from './http.service.ts';
import { AUTH_ROUTES } from '@/constants';
import type { User, LoginCredentials, ResetPasswordPayload, ApiResponse } from '@/types';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ProfileUpdatePayload {
  name?: string;
  email?: string;
  [key: string]: any;
}

class AuthService {
  login = async (payload: LoginCredentials): Promise<LoginResponse> => {
    return await HttpService.post<LoginResponse>(AUTH_ROUTES.LOGIN, payload);
  };

  logout = async (): Promise<void> => {
    return await HttpService.post<void>(AUTH_ROUTES.LOGOUT);
  };

  forgotPassword = async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
    return await HttpService.post<ForgotPasswordResponse>(AUTH_ROUTES.PASSWORD_FORGOT, payload);
  };

  resetPassword = async (credentials: ResetPasswordPayload): Promise<ApiResponse> => {
    return await HttpService.post<ApiResponse>(AUTH_ROUTES.PASSWORD_RESET, credentials);
  };

  getProfile = async (user: string): Promise<User> => {
    const endpoint = user === 'admin' ? AUTH_ROUTES.ME : AUTH_ROUTES.ME_ECOLE;
    return await HttpService.get<User>(endpoint);
  };

  updateProfile = async (newInfo: ProfileUpdatePayload): Promise<User> => {
    return await HttpService.put<User>(AUTH_ROUTES.UPDATE_PROFILE, newInfo);
  };
}

export default new AuthService();
