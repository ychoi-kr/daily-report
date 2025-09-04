import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../useAuth';

// Next.js router のモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// fetch のモック
global.fetch = vi.fn();

describe('useAuth', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (fetch as any).mockClear();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('login', () => {
    it('正常なログインが成功する', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          token: 'mock-token',
          expires_at: '2025-09-04T15:00:00Z',
          user: {
            id: 1,
            name: '山田太郎',
            email: 'yamada@example.com',
            department: '営業1課',
            is_manager: false,
          },
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'yamada@example.com',
          password: 'password123',
        });
      });

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'yamada@example.com',
          password: 'password123',
        }),
      });

      expect(result.current.user).toEqual({
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: false,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('認証エラー（401）が正しく処理される', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'AUTH_INVALID_CREDENTIALS',
            message: 'メールアドレスまたはパスワードが正しくありません',
          },
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpassword',
          });
        } catch {
          // エラーは期待される動作
        }
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(
        'メールアドレスまたはパスワードが正しくありません'
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('バリデーションエラー（400）が正しく処理される', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力値が不正です',
          },
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            email: 'invalid-email',
            password: '123',
          });
        } catch {
          // エラーは期待される動作
        }
      });

      expect(result.current.error).toBe('入力値が不正です');
    });

    it('ネットワークエラーが正しく処理される', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            email: 'yamada@example.com',
            password: 'password123',
          });
        } catch {
          // エラーは期待される動作
        }
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('ローディング状態が正しく管理される', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          token: 'mock-token',
          expires_at: '2025-09-04T15:00:00Z',
          user: {
            id: 1,
            name: '山田太郎',
            email: 'yamada@example.com',
            department: '営業1課',
            is_manager: false,
          },
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'yamada@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('正常なログアウトが成功する', async () => {
      const mockResponse = {
        ok: true,
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('ログアウト中にエラーが発生した場合の処理', async () => {
      (fetch as any).mockRejectedValue(new Error('Logout error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.logout();
        } catch {
          // エラーは期待される動作
        }
      });

      expect(result.current.error).toBe('Logout error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('エラーがクリアされる', () => {
      const { result } = renderHook(() => useAuth());

      // clearError 関数が正しく呼び出せることを確認
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
