export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  expires_in_minutes: number;
  dev_otp?: string | null;
  otp?: string | null;
}

export interface PasswordResetVerifyInput {
  email: string;
  otp: string;
  new_password: string;
}

export interface AuthMessageResponse {
  message: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
