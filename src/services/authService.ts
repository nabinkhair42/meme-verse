interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

class AuthService {
  async validateToken(): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService(); 