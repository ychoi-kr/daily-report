import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Sidebar } from '../Sidebar';
import type { User, MenuItem } from '@/types/layout';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/reports',
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

describe('Sidebar', () => {
  const mockUser: User = {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    isManager: false,
  };

  const mockManagerUser: User = {
    ...mockUser,
    isManager: true,
  };

  const testMenuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'ホーム',
      href: '/',
      icon: <span>Home Icon</span>,
    },
    {
      id: 'reports',
      label: '日報管理',
      href: '/reports',
      icon: <span>Reports Icon</span>,
    },
    {
      id: 'admin',
      label: '管理者メニュー',
      href: '/admin',
      icon: <span>Admin Icon</span>,
      requiredRole: 'manager',
    },
  ];

  it('renders all menu items for regular user', () => {
    render(<Sidebar user={mockUser} menuItems={testMenuItems} />);
    
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('日報管理')).toBeInTheDocument();
    expect(screen.queryByText('管理者メニュー')).not.toBeInTheDocument();
  });

  it('renders admin menu items for manager user', () => {
    render(<Sidebar user={mockManagerUser} menuItems={testMenuItems} />);
    
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('日報管理')).toBeInTheDocument();
    expect(screen.getByText('管理者メニュー')).toBeInTheDocument();
  });

  it('highlights active menu item based on current pathname', () => {
    render(<Sidebar user={mockUser} menuItems={testMenuItems} />);
    
    const reportsLink = screen.getByText('日報管理').closest('a');
    expect(reportsLink).toHaveClass('bg-primary');
  });

  it('expands and collapses submenu items', () => {
    const menuWithChildren: MenuItem[] = [
      {
        id: 'parent',
        label: '親メニュー',
        href: '#',
        icon: <span>Parent Icon</span>,
        children: [
          {
            id: 'child1',
            label: '子メニュー1',
            href: '/child1',
            icon: <span>Child1 Icon</span>,
          },
          {
            id: 'child2',
            label: '子メニュー2',
            href: '/child2',
            icon: <span>Child2 Icon</span>,
          },
        ],
      },
    ];

    render(<Sidebar user={mockUser} menuItems={menuWithChildren} />);
    
    // Initially children should not be visible
    expect(screen.queryByText('子メニュー1')).not.toBeInTheDocument();
    
    // Click parent to expand
    const parentButton = screen.getByText('親メニュー').closest('button');
    fireEvent.click(parentButton!);
    
    // Children should now be visible
    expect(screen.getByText('子メニュー1')).toBeInTheDocument();
    expect(screen.getByText('子メニュー2')).toBeInTheDocument();
    
    // Click again to collapse
    fireEvent.click(parentButton!);
    
    // Children should be hidden again
    expect(screen.queryByText('子メニュー1')).not.toBeInTheDocument();
  });

  it('displays badge when menu item has badge property', () => {
    const menuWithBadge: MenuItem[] = [
      {
        id: 'notifications',
        label: '通知',
        href: '/notifications',
        icon: <span>Bell Icon</span>,
        badge: 5,
      },
    ];

    render(<Sidebar user={mockUser} menuItems={menuWithBadge} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles collapse and expand functionality', () => {
    const mockOnCollapse = vi.fn();
    
    render(
      <Sidebar
        user={mockUser}
        menuItems={testMenuItems}
        isCollapsed={false}
        onCollapse={mockOnCollapse}
      />
    );
    
    const collapseButton = screen.getByLabelText(/collapse sidebar/i);
    fireEvent.click(collapseButton);
    
    expect(mockOnCollapse).toHaveBeenCalledWith(true);
  });

  it('applies collapsed styles when isCollapsed is true', () => {
    const { container } = render(
      <Sidebar
        user={mockUser}
        menuItems={testMenuItems}
        isCollapsed={true}
      />
    );
    
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-16');
  });

  it('applies expanded styles when isCollapsed is false', () => {
    const { container } = render(
      <Sidebar
        user={mockUser}
        menuItems={testMenuItems}
        isCollapsed={false}
      />
    );
    
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-64');
  });

  it('filters nested menu items based on user role', () => {
    const nestedMenu: MenuItem[] = [
      {
        id: 'parent',
        label: '親メニュー',
        href: '#',
        icon: <span>Parent Icon</span>,
        children: [
          {
            id: 'public',
            label: '公開メニュー',
            href: '/public',
            icon: <span>Public Icon</span>,
          },
          {
            id: 'admin',
            label: '管理者メニュー',
            href: '/admin',
            icon: <span>Admin Icon</span>,
            requiredRole: 'manager',
          },
        ],
      },
    ];

    // Test with regular user
    const { rerender } = render(<Sidebar user={mockUser} menuItems={nestedMenu} />);
    
    const parentButton = screen.getByText('親メニュー').closest('button');
    fireEvent.click(parentButton!);
    
    expect(screen.getByText('公開メニュー')).toBeInTheDocument();
    expect(screen.queryByText('管理者メニュー')).not.toBeInTheDocument();
    
    // Test with manager user
    rerender(<Sidebar user={mockManagerUser} menuItems={nestedMenu} />);
    
    fireEvent.click(screen.getByText('親メニュー').closest('button')!);
    
    expect(screen.getByText('公開メニュー')).toBeInTheDocument();
    expect(screen.getByText('管理者メニュー')).toBeInTheDocument();
  });
});