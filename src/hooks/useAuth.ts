'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoginRequest, LoginResponse, User } from '@/lib/schemas/auth';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          if (response.status === 401) {
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          } else if (
            response.status === 400 &&
            errorData?.error?.code === 'VALIDATION_ERROR'
          ) {
            throw new Error('入力値が不正です');
          } else {
            throw new Error('ログインに失敗しました');
          }
        }

        const loginResponse: LoginResponse = await response.json();
        setUser(loginResponse.user);

        // ログイン成功後、ダッシュボードにリダイレクト
        router.push('/dashboard');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'ログインに失敗しました';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
      router.push('/login');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'ログアウトに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}
