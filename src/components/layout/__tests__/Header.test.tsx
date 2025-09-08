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
    expect(screen.getByText('営業日報システム')).toBeInTheDocument();
  });

  it('displays user information when user is logged in', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    // Click on user menu button
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    // Check user details are displayed
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.department!)).toBeInTheDocument();
  });

  it('shows manager badge for manager users', () => {
    const managerUser = { ...mockUser, isManager: true };
    render(<Header user={managerUser} onLogout={mockOnLogout} />);
    
    // Click on user menu button
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    expect(screen.getByText('管理者')).toBeInTheDocument();
  });

  it('displays login button when user is not logged in', () => {
    render(<Header />);
    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });

  it('calls onLogout when logout is clicked', () => {
    render(<Header user={mockUser} onLogout={mockOnLogout} />);
    
    // Click on user menu button
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    // Click logout
    const logoutButton = screen.getByText('ログアウト');
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
    
    const avatar = screen.getByText('山田');
    expect(avatar).toBeInTheDocument();
  });

  it('has theme toggle button', () => {
    render(<Header user={mockUser} />);
    
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });
});