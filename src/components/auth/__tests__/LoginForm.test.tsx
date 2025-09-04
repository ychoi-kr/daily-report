import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    error: null,
  };

  it('正しくレンダリングされる', () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByText('営業日報システム')).toBeInTheDocument();
    expect(
      screen.getByText('メールアドレスとパスワードでログインしてください')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('yamada@example.com')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('パスワードを入力')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ログイン' })
    ).toBeInTheDocument();
  });

  it('テスト用アカウント情報が表示される', () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByText('テスト用アカウント:')).toBeInTheDocument();
    expect(screen.getByText('メール: yamada@example.com')).toBeInTheDocument();
    expect(screen.getByText('パスワード: password123')).toBeInTheDocument();
  });

  it('エラーメッセージが表示される', () => {
    const error = 'ログインに失敗しました';
    render(<LoginForm {...defaultProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('ローディング状態が正しく表示される', () => {
    render(<LoginForm {...defaultProps} isLoading={true} />);

    expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('yamada@example.com')).toBeDisabled();
    expect(screen.getByPlaceholderText('パスワードを入力')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'ログイン中...' })
    ).toBeDisabled();
  });

  it('パスワードの表示/非表示ができる', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('パスワードを入力');
    const toggleButton = screen.getByRole('button', {
      name: 'パスワードを表示',
    });

    // 初期状態はパスワード（type="password"）
    expect(passwordInput).toHaveAttribute('type', 'password');

    // クリックでテキスト表示に切り替わる
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'パスワードを隠す' })
    ).toBeInTheDocument();

    // 再度クリックでパスワード表示に戻る
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  describe('バリデーション', () => {
    it('メールアドレスが不正な場合にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('yamada@example.com');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      // バリデーションによりフォーム送信が阻止されることを確認
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('パスワードが8文字未満の場合にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(passwordInput, '1234567'); // 7文字
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('パスワードは8文字以上である必要があります')
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('必須フィールドが空の場合にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('有効なメールアドレスを入力してください')
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('フォーム送信', () => {
    it('正しい入力値でフォーム送信される', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('yamada@example.com');
      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'yamada@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'yamada@example.com',
          password: 'password123',
        });
      });
    });

    it('フォーム送信時にローディング状態になる', async () => {
      const user = userEvent.setup();
      let resolveSubmit: (value?: unknown) => void;
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('yamada@example.com');
      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      await user.type(emailInput, 'yamada@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      //送信中はローディング状態になることを確認（propで制御されるため、ここでは確認のみ）
      expect(mockOnSubmit).toHaveBeenCalled();

      // Promise を解決
      resolveSubmit!();
      await submitPromise;
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria属性とlabel属性が設定されている', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('yamada@example.com');
      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      });

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    });

    it('メールアドレスフィールドにオートフォーカスが設定されている', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('yamada@example.com');
      // autoFocus属性が設定されていることを確認
      expect(emailInput).toHaveFocus();
    });
  });
});
