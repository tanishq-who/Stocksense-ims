import { apiClient } from './client';
import {
  User,
  LoginCredentials,
  SignupCredentials,
  LoginResponse,
  PasswordResetRequestInput,
  PasswordResetRequestResponse,
  PasswordResetVerifyInput,
  AuthMessageResponse,
} from '../types/auth';

/**
 * Service for communicating with backend authentication endpoints.
 * All endpoints map directly to existing FastAPI routes.
 */
export const authService = {
  /**
   * Register a new user account.
   * Maps to POST /auth/signup
   */
  async signup(credentials: SignupCredentials): Promise<User> {
    return apiClient<User>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Authenticate with email and password to receive a JWT access token.
   * Maps to POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Fetch current authenticated user profile using Bearer JWT.
   * Maps to GET /auth/me
   */
  async getMe(): Promise<User> {
    return apiClient<User>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Request a 6-digit password reset OTP sent to the user's email.
   * Maps to POST /auth/password-reset/request
   */
  async requestPasswordReset(
    data: PasswordResetRequestInput
  ): Promise<PasswordResetRequestResponse> {
    return apiClient<PasswordResetRequestResponse>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Verify 6-digit OTP and reset account password.
   * Maps to POST /auth/password-reset/verify
   */
  async verifyPasswordReset(
    data: PasswordResetVerifyInput
  ): Promise<AuthMessageResponse> {
    return apiClient<AuthMessageResponse>('/auth/password-reset/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
