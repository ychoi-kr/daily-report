import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import SalesPersonsPage from './page';

// Mock components
vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

vi.mock('@/components/sales-persons/new-sales-person-dialog', () => ({
  NewSalesPersonDialog: ({ open, onOpenChange, onSuccess }: any) => (
    <div data-testid="new-dialog" data-open={open}>
      <button onClick={() => onOpenChange(false)}>Close</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}));

vi.mock('@/components/sales-persons/edit-sales-person-dialog', () => ({
  EditSalesPersonDialog: ({ open, salesPerson, onOpenChange, onSuccess }: any) => (
    <div data-testid="edit-dialog" data-open={open}>
      <span>{salesPerson?.name}</span>
      <button onClick={() => onOpenChange(false)}>Close</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}));

vi.mock('@/components/sales-persons/password-reset-dialog', () => ({
  PasswordResetDialog: ({ open, salesPerson, onOpenChange }: any) => (
    <div data-testid="password-dialog" data-open={open}>
      <span>{salesPerson?.name}</span>
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SalesPersonsPage', () => {
  const mockSalesPersons = [
    {
      id: 1,
      name: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      is_manager: false,
      is_active: true,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: '田中花子',
      email: 'tanaka@example.com',
      department: '営業2課',
      is_manager: true,
      is_active: true,
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z',
    },
    {
      id: 3,
      name: '佐藤次郎',
      email: 'sato@example.com',
      department: '営業1課',
      is_manager: false,
      is_active: false,
      created_at: '2025-01-03T00:00:00.000Z',
      updated_at: '2025-01-03T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockSalesPersons }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('営業担当者一覧が正常に表示される', async () => {
    // Act
    render(<SalesPersonsPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('営業担当者管理')).toBeInTheDocument();
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect(screen.getByText('田中花子')).toBeInTheDocument();
      expect(screen.getByText('佐藤次郎')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/sales-persons');
  });

  it('管理者と一般ユーザーのバッジが正しく表示される', async () => {
    // Act
    render(<SalesPersonsPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('管理者')).toBeInTheDocument();
      expect(screen.getAllByText('一般')).toHaveLength(2);
    });
  });

  it('アクティブ・非アクティブのステータスが正しく表示される', async () => {
    // Act
    render(<SalesPersonsPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByText('有効')).toHaveLength(2);
      expect(screen.getByText('無効')).toBeInTheDocument();
    });
  });

  it('検索機能が動作する', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
    });

    // Act
    const searchInput = screen.getByPlaceholderText('氏名、メール、部署で検索...');
    await user.type(searchInput, '山田');

    // Assert
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
    expect(screen.queryByText('田中花子')).not.toBeInTheDocument();
    expect(screen.queryByText('佐藤次郎')).not.toBeInTheDocument();
  });

  it('新規登録ダイアログが開く', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('新規登録')).toBeInTheDocument();
    });

    // Act
    const newButton = screen.getByText('新規登録');
    await user.click(newButton);

    // Assert
    expect(screen.getByTestId('new-dialog')).toHaveAttribute('data-open', 'true');
  });

  it('編集ダイアログが開く', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
    });

    // Act
    const moreButtons = screen.getAllByRole('button', { name: 'メニューを開く' });
    await user.click(moreButtons[0]);

    const editButton = screen.getByText('編集');
    await user.click(editButton);

    // Assert
    const editDialog = screen.getByTestId('edit-dialog');
    expect(editDialog).toHaveAttribute('data-open', 'true');
    expect(editDialog).toHaveTextContent('山田太郎');
  });

  it('パスワードリセットダイアログが開く', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
    });

    // Act
    const moreButtons = screen.getAllByRole('button', { name: 'メニューを開く' });
    await user.click(moreButtons[0]);

    const resetButton = screen.getByText('パスワードリセット');
    await user.click(resetButton);

    // Assert
    const passwordDialog = screen.getByTestId('password-dialog');
    expect(passwordDialog).toHaveAttribute('data-open', 'true');
    expect(passwordDialog).toHaveTextContent('山田太郎');
  });

  it('アカウント状態切り替えが動作する', async () => {
    // Arrange
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockSalesPersons }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockSalesPersons }),
      });

    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
    });

    // Act
    const moreButtons = screen.getAllByRole('button', { name: 'メニューを開く' });
    await user.click(moreButtons[0]);

    const toggleButton = screen.getByText('アカウント無効化');
    await user.click(toggleButton);

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/sales-persons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    });
  });

  it('API エラー時にエラーメッセージが表示される', async () => {
    // Arrange
    const mockToast = vi.fn();
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });

    mockFetch.mockRejectedValue(new Error('API Error'));

    // Act
    render(<SalesPersonsPage />);

    // Assert
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'エラー',
        description: 'API Error',
        variant: 'destructive',
      });
    });
  });

  it('データが空の場合のメッセージが表示される', async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    // Act
    render(<SalesPersonsPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('営業担当者が見つかりません')).toBeInTheDocument();
    });
  });

  it('ローディング状態が正しく表示される', () => {
    // Arrange
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // 永続的に pending状態
    );

    // Act
    render(<SalesPersonsPage />);

    // Assert
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('検索結果の件数が正しく表示される', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('3名の営業担当者')).toBeInTheDocument();
    });

    // Act
    const searchInput = screen.getByPlaceholderText('氏名、メール、部署で検索...');
    await user.type(searchInput, '営業1課');

    // Assert
    expect(screen.getByText('2名の営業担当者')).toBeInTheDocument();
  });

  it('ダイアログの成功コールバックが正しく動作する', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SalesPersonsPage />);

    await waitFor(() => {
      expect(screen.getByText('新規登録')).toBeInTheDocument();
    });

    // 新規登録ダイアログを開く
    const newButton = screen.getByText('新規登録');
    await user.click(newButton);

    // Act - 成功コールバックを実行
    const successButton = screen.getByText('Success');
    fireEvent.click(successButton);

    // Assert - 再度 API が呼ばれることを確認
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2); // 初期ロード + 成功後のリロード
    });
  });
});