import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '../Header';
import type { User } from '@/types/layout';

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
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

describe('Header', () => {
  const mockUser: User = {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    isManager: false,
  };

  const mockOnLogout = vi.fn();
  const mockOnMobileMenuToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders system title', () => {
    render(<Header />);
    expect(screen.getByText('영업 일일 보고 시스템')).toBeInTheDocument();
  });

  it('displays user information when user is logged in', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);

    // User information should be displayed in the dropdown content
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.department!)).toBeInTheDocument();
  });

  it('shows manager badge for manager users', () => {
    const managerUser = { ...mockUser, isManager: true };
    render(<Header user={managerUser} onLogout={mockOnLogout} />);

    expect(screen.getByText('관리자')).toBeInTheDocument();
  });

  it('displays login button when user is not logged in', () => {
    render(<Header />);
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('calls onLogout when logout is clicked', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);

    // Click logout
    const logoutButton = screen.getByText('로그아웃');
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('shows mobile menu button when showMobileMenuButton is true', () => {
    render(
      <Header
        user={mockUser}
        showMobileMenuButton={true}
        onMobileMenuToggle={mockOnMobileMenuToggle}
      />
    );

    const mobileMenuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('hides mobile menu button when showMobileMenuButton is false', () => {
    render(
      <Header
        user={mockUser}
        showMobileMenuButton={false}
        onMobileMenuToggle={mockOnMobileMenuToggle}
      />
    );

    const mobileMenuButton = screen.queryByRole('button', { name: /toggle menu/i });
    expect(mobileMenuButton).not.toBeInTheDocument();
  });

  it('calls onMobileMenuToggle when mobile menu button is clicked', () => {
    render(
      <Header
        user={mockUser}
        showMobileMenuButton={true}
        onMobileMenuToggle={mockOnMobileMenuToggle}
      />
    );

    const mobileMenuButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(mobileMenuButton);

    expect(mockOnMobileMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('displays user initials in avatar when no avatar URL is provided', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);

    const avatar = screen.getByText('山');
    expect(avatar).toBeInTheDocument();
  });

  it('has theme toggle button', () => {
    render(<Header user={mockUser} />);

    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });
});