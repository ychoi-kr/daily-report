// Simplified API client for Issue #4
// This is a basic implementation to demonstrate the concept

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ field?: string; message?: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Basic API client
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }

    const error = errorData.error || {};
    throw new ApiError(
      response.status,
      error.code || 'API_ERROR',
      error.message || 'An error occurred',
      error.details
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    async login(credentials: { email: string; password: string }) {
      return apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    async logout() {
      await apiRequest('/api/v1/auth/logout', {
        method: 'POST',
      });
    },

    async getMe() {
      return apiRequest('/api/v1/auth/me');
    },
  },

  reports: {
    async getAll(params?: {
      start_date?: string;
      end_date?: string;
      sales_person_id?: number;
      page?: number;
      per_page?: number;
    }) {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const query = searchParams.toString();
      return apiRequest(`/api/v1/reports${query ? `?${query}` : ''}`);
    },

    async create(reportData: {
      report_date: string;
      problem: string;
      plan: string;
      visits: Array<{
        customer_id: number;
        visit_time?: string;
        visit_content: string;
      }>;
    }) {
      return apiRequest('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    },
  },

  customers: {
    async getAll(params?: {
      search?: string;
      page?: number;
      per_page?: number;
    }) {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const query = searchParams.toString();
      return apiRequest(`/api/v1/customers${query ? `?${query}` : ''}`);
    },

    async getById(id: number) {
      return apiRequest(`/api/v1/customers/${id}`);
    },

    async create(customerData: {
      company_name: string;
      contact_person: string;
      phone: string;
      email: string;
      address?: string;
    }) {
      return apiRequest('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
    },

    async update(
      id: number,
      customerData: {
        company_name: string;
        contact_person: string;
        phone: string;
        email: string;
        address?: string;
      }
    ) {
      return apiRequest(`/api/v1/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      });
    },

    async delete(id: number) {
      return apiRequest(`/api/v1/customers/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
