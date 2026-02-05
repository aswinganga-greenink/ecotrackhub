import { MonthlyData, User, UserRole } from '@/types/carbon';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Types for API responses
export interface ApiResponse<T> {
  items?: T[];
  total?: number;
  page?: number;
  size?: number;
  pages?: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  email?: string;
  password: string;
  role?: string;
  panchayat_id?: string;
}

export interface CarbonMetricsResponse {
  totalEmissions: number;
  totalOffsets: number;
  netFootprint: number;
  isNeutral: boolean;
}

export interface SectorEmission {
  sector: string;
  emission: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  emissions: number;
  offsets: number;
  net: number;
}

export interface ForecastItem {
  month: string;
  year: number;
  predicted_emission: number;
}

export interface PredictionResponse {
  forecast: ForecastItem[];
  recommendations: string[];
}

export interface Panchayat {
  id: string;
  name: string;
  district: string;
  state: string;
  totalPopulation: number;
}

// HTTP client with authentication
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async signUp(userData: SignUpRequest): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Data endpoints
  async getMonthlyData(params: {
    page?: number;
    size?: number;
    userId?: string;
    panchayatId?: string;
    month?: string;
    year?: number;
  } = {}): Promise<ApiResponse<MonthlyData>> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/data/${queryString ? `?${queryString}` : ''}`;

    return this.request<ApiResponse<MonthlyData>>(endpoint);
  }

  async createMonthlyData(data: Omit<MonthlyData, 'id' | 'createdAt'>): Promise<MonthlyData> {
    return this.request<MonthlyData>('/data/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMonthlyData(id: string, data: Partial<MonthlyData>): Promise<MonthlyData> {
    return this.request<MonthlyData>(`/data/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMonthlyData(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/data/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalyticsMetrics(params: {
    userId?: string;
    panchayatId?: string;
    month?: string;
    year?: number;
  } = {}): Promise<CarbonMetricsResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/analytics/metrics${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<any>(endpoint);
    return {
      totalEmissions: response.total_emissions,
      totalOffsets: response.total_offsets,
      netFootprint: response.net_footprint,
      isNeutral: response.is_neutral
    };
  }

  async getAnalyticsSectors(params: {
    userId?: string;
    panchayatId?: string;
    month?: string;
    year?: number;
  } = {}): Promise<SectorEmission[]> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/analytics/sectors${queryString ? `?${queryString}` : ''}`;

    return this.request<SectorEmission[]>(endpoint);
  }

  async getAnalyticsTrends(params: {
    userId?: string;
    panchayatId?: string;
    year?: number;
  } = {}): Promise<MonthlyTrend[]> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/analytics/trends${queryString ? `?${queryString}` : ''}`;

    return this.request<MonthlyTrend[]>(endpoint);
  }

  async getPredictions(): Promise<PredictionResponse> {
    return this.request<PredictionResponse>('/analytics/predictions');
  }

  // Panchayat endpoints
  async getPanchayats(params: {
    skip?: number;
    limit?: number;
  } = {}): Promise<Panchayat[]> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/panchayats/${queryString ? `?${queryString}` : ''}`;

    return this.request<Panchayat[]>(endpoint);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export the client as default API interface
export const api = apiClient;
