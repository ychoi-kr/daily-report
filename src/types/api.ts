/**
 * API関連の型定義
 */

// 共通レスポンス型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// ページネーション
export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ユーザー関連
export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  is_manager: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  user: User;
}

// 日報関連
export interface Report {
  id: number;
  report_date: string;
  sales_person_id: number;
  sales_person?: User;
  problem: string;
  plan: string;
  visits?: Visit[];
  comments?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface ReportSummary {
  id: number;
  report_date: string;
  sales_person: {
    id: number;
    name: string;
  };
  visit_count: number;
  has_comments: boolean;
  created_at: string;
}

export interface CreateReportDto {
  report_date: string;
  problem: string;
  plan: string;
  visits: CreateVisitDto[];
}

export interface UpdateReportDto {
  problem?: string;
  plan?: string;
  visits?: UpdateVisitDto[];
}

// 訪問記録関連
export interface Visit {
  id: number;
  report_id: number;
  customer_id: number;
  customer?: Customer;
  visit_content: string;
  visit_time?: string;
  created_at: string;
}

export interface CreateVisitDto {
  customer_id: number;
  visit_content: string;
  visit_time?: string;
}

export interface UpdateVisitDto extends CreateVisitDto {
  id?: number;
}

// 顧客関連
export interface Customer {
  id: number;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

// コメント関連
export interface Comment {
  id: number;
  report_id: number;
  manager_id: number;
  manager?: User;
  comment: string;
  created_at: string;
}

export interface CreateCommentDto {
  comment: string;
}

// 営業担当者関連
export interface SalesPerson extends User {
  password?: never; // パスワードは含まない
  is_active: boolean; // 営業担当者では必須
}

export interface CreateSalesPersonDto {
  name: string;
  email: string;
  password: string;
  department: string;
  is_manager: boolean;
  is_active?: boolean;
}

export interface UpdateSalesPersonDto {
  name?: string;
  email?: string;
  department?: string;
  is_manager?: boolean;
  is_active?: boolean;
}

// HTTPメソッド型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// APIエンドポイント定義
export const API_ENDPOINTS = {
  // 認証
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  // 日報
  REPORTS: {
    LIST: '/reports',
    DETAIL: (id: number) => `/reports/${id}`,
    CREATE: '/reports',
    UPDATE: (id: number) => `/reports/${id}`,
    DELETE: (id: number) => `/reports/${id}`,
    COMMENTS: (id: number) => `/reports/${id}/comments`,
  },
  // 営業担当者
  SALES_PERSONS: {
    LIST: '/sales-persons',
    DETAIL: (id: number) => `/sales-persons/${id}`,
    CREATE: '/sales-persons',
    UPDATE: (id: number) => `/sales-persons/${id}`,
    DELETE: (id: number) => `/sales-persons/${id}`,
  },
  // 顧客
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id: number) => `/customers/${id}`,
    CREATE: '/customers',
    UPDATE: (id: number) => `/customers/${id}`,
    DELETE: (id: number) => `/customers/${id}`,
  },
} as const;
