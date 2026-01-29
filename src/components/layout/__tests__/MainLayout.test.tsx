import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MainLayout } from '../MainLayout';
import type { User } from '@/types/layout';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock next/link
vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

// Mock dropdown menu components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick} role="menuitem">{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

describe('MainLayout', () => {
  const mockUser: User = {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    isManager: false,
  };

  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all layout components', () => {
    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check header is rendered
    expect(screen.getByText('영업 일일 보고 시스템')).toBeInTheDocument();

    // Check content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Check footer is rendered
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} 영업 일일 보고 시스템. All rights reserved.`))
      .toBeInTheDocument();
  });

  it('passes user prop to child components', () => {
    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Click on user menu button in header
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);

    // Check user info is displayed
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it('toggles mobile menu when mobile menu button is clicked', () => {
    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Mobile menu should not be initially visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click mobile menu button
    const mobileMenuButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(mobileMenuButton);

    // Mobile menu should now be visible (Sheet component creates a dialog role)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides footer when showFooter is false', () => {
    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout} showFooter={false}>
        <div>Test Content</div>
      </MainLayout>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.queryByText(`© ${currentYear} 영업 일일 보고 시스템. All rights reserved.`))
      .not.toBeInTheDocument();
  });

  it('shows footer when showFooter is true', () => {
    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout} showFooter={true}>
        <div>Test Content</div>
      </MainLayout>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} 영업 일일 보고 시스템. All rights reserved.`))
      .toBeInTheDocument();
  });

  it('calls onLogout when logout is triggered', async () => {
    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Click on user menu button
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);

    // Click logout
    const logoutButton = screen.getByText('로그아웃');
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  }, 10000);

  it('renders children content correctly', () => {
    const TestComponent = () => (
      <div>
        <h1>Test Title</h1>
        <p>Test paragraph</p>
        <button>Test Button</button>
      </div>
    );

    render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <TestComponent />
      </MainLayout>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('maintains layout structure with different content', () => {
    const { rerender } = render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Content 1</div>
      </MainLayout>
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();

    rerender(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Content 2</div>
      </MainLayout>
    );

    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();

    // Layout components should still be present
    expect(screen.getByText('영업 일일 보고 시스템')).toBeInTheDocument();
  });

  it('handles undefined user gracefully', () => {
    render(
      <MainLayout user={undefined} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Should show login button instead of user menu
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument();
  });

  it('sidebar collapse functionality works', () => {
    const { container } = render(
      <MainLayout user={mockUser} onLogout={mockOnLogout}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Find collapse button
    const collapseButton = screen.getByLabelText(/collapse sidebar/i);

    // Initially sidebar should be expanded (w-64)
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-64');

    // Click to collapse
    fireEvent.click(collapseButton);

    // Sidebar should now be collapsed (w-16)
    expect(sidebar).toHaveClass('w-16');
  });
});