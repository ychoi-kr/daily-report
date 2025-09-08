/**
 * Layout component types for the daily report system
 */

import { ReactNode } from 'react';

/**
 * User information for display in header
 */
export interface User {
  id: number;
  name: string;
  email: string;
  department?: string;
  isManager: boolean;
  avatarUrl?: string;
}

/**
 * Navigation menu item
 */
export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  requiredRole?: 'user' | 'manager' | 'admin';
  children?: MenuItem[];
  isActive?: boolean;
}

/**
 * Layout component props
 */
export interface LayoutProps {
  children: ReactNode;
  user?: User | null;
}

/**
 * Header component props
 */
export interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
  showMobileMenuButton?: boolean;
  onMobileMenuToggle?: () => void;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  user?: User | null;
  menuItems?: MenuItem[];
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * Mobile menu component props
 */
export interface MobileMenuProps {
  user?: User | null;
  menuItems?: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Footer component props
 */
export interface FooterProps {
  className?: string;
  showVersion?: boolean;
}

/**
 * Main layout component props
 */
export interface MainLayoutProps {
  children: ReactNode;
  user?: User | null;
  menuItems?: MenuItem[];
  onLogout?: () => void;
  showFooter?: boolean;
}

/**
 * Theme type
 */
export type Theme = 'light' | 'dark' | 'system';