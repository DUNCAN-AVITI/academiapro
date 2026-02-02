
import { User, UserRole } from '../types';
import { apiClient } from './client';

class AuthService {
  private SESSION_KEY = 'token';
  private USER_KEY = 'academia_user_cache';

  public async login(email: string, password: string): Promise<User | null> {
    try {
      console.log('AuthService: Attempting login for', email);
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('AuthService: Login response received', response);

      if (response.token && response.user) {
        localStorage.setItem(this.SESSION_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        console.log('AuthService: Login successful, token stored');
        return response.user;
      }
      console.log('AuthService: No token or user in response');
      return null;
    } catch (error) {
      console.error("AuthService: Login failed", error);
      throw error;
    }
  }

  public register = async (data: any): Promise<User | null> => {
    try {
      const response = await apiClient.post('/auth/register', data);
      if (response.token && response.user) {
        localStorage.setItem(this.SESSION_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        return response.user;
      }
      return null;
    } catch (error) {
      console.error("Register failed", error);
      throw error;
    }
  }

  public logout() {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  public getCurrentUser(): User | null {
    const token = localStorage.getItem(this.SESSION_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!token || !userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Helper to re-validate user from server if needed (async)
  public async fetchMe(): Promise<User | null> {
    try {
      const user = await apiClient.get('/auth/me');
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch (e) {
      this.logout();
    }
    return null;
  }

  public canAccess(requiredRoles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? requiredRoles.includes(user.role) : false;
  }
}

export const authService = new AuthService();
