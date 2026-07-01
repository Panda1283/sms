const API_BASE = '/api';

export class ApiService {
  static getToken(): string | null {
    return localStorage.getItem('school_jwt_token');
  }

  static setToken(token: string) {
    localStorage.setItem('school_jwt_token', token);
  }

  static removeToken() {
    localStorage.removeItem('school_jwt_token');
  }

  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Map adblock-sensitive paths to clean keywords to bypass browser adblockers
    let mappedEndpoint = endpoint;
    if (endpoint.includes('notifications')) {
      mappedEndpoint = mappedEndpoint.replace(/notifications/g, 'bulletins');
    }
    if (endpoint.includes('bookmarks')) {
      mappedEndpoint = mappedEndpoint.replace(/bookmarks/g, 'favs');
    }
    if (endpoint.includes('analytics')) {
      mappedEndpoint = mappedEndpoint.replace(/analytics/g, 'insights');
    }
    const url = `${API_BASE}${mappedEndpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        let errMsg = 'An error occurred';
        try {
          const errData = await response.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      // If response is empty (like 204 No Content), return true/empty
      if (response.status === 204) {
        return true;
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  static get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  static delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
