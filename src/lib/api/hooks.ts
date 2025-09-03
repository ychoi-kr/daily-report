/**
 * React Query hooks for API operations
 * このファイルは将来的にReact Queryを導入する際に使用するためのプレースホルダーです
 */

import { useState, useCallback } from 'react';
import { api, ApiError } from './simple-client';

// 基本的なAPIフック用の型定義
type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
};

// 汎用的なAPIフックのベース実装
function useApiState<T>(): [
  ApiState<T>,
  {
    setData: (data: T | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: ApiError | null) => void;
    reset: () => void;
  },
] {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: ApiError | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return [state, { setData, setLoading, setError, reset }];
}

// 認証フック
export function useAuth() {
  const [authState, { setData, setLoading, setError }] = useApiState<any>();

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.auth.login(credentials);
        setData(result);
        return result;
      } catch (error) {
        setError(error as ApiError);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await api.auth.logout();
      setData(null);
    } catch (error) {
      setError(error as ApiError);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  const getMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.auth.getMe();
      setData(result);
      return result;
    } catch (error) {
      setError(error as ApiError);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  return {
    ...authState,
    login,
    logout,
    getMe,
  };
}

// 日報フック
export function useReports() {
  const [reportsState, { setData, setLoading, setError }] = useApiState<any>();

  const fetchReports = useCallback(
    async (params?: {
      start_date?: string;
      end_date?: string;
      sales_person_id?: number;
      page?: number;
      per_page?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.reports.getAll(params);
        setData(result);
        return result;
      } catch (error) {
        setError(error as ApiError);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  const createReport = useCallback(
    async (reportData: {
      report_date: string;
      problem: string;
      plan: string;
      visits: Array<{
        customer_id: number;
        visit_time?: string;
        visit_content: string;
      }>;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.reports.create(reportData);
        return result;
      } catch (error) {
        setError(error as ApiError);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  return {
    ...reportsState,
    fetchReports,
    createReport,
  };
}

// 顧客フック
export function useCustomers() {
  const [customersState, { setData, setLoading, setError }] =
    useApiState<any>();

  const fetchCustomers = useCallback(
    async (params?: { search?: string; page?: number; per_page?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.customers.getAll(params);
        setData(result);
        return result;
      } catch (error) {
        setError(error as ApiError);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  return {
    ...customersState,
    fetchCustomers,
  };
}

// 営業担当者フック
export function useSalesPersons() {
  const [salesPersonsState, { setData, setLoading, setError }] =
    useApiState<any>();

  const fetchSalesPersons = useCallback(
    async (params?: { department?: string; is_manager?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        // salesPersons は simple-client で実装されていないため、プレースホルダー
        console.log('fetchSalesPersons called with:', params);
        const result = { data: [], pagination: {} };
        setData(result);
        return result;
      } catch (error) {
        setError(error as ApiError);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  return {
    ...salesPersonsState,
    fetchSalesPersons,
  };
}

// 汎用的な非同期操作フック
export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await operation();
        return result;
      } catch (error) {
        setError(error as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    execute,
    reset: useCallback(() => {
      setLoading(false);
      setError(null);
    }, []),
  };
}
