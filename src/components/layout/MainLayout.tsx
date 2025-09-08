'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { MobileMenu } from './MobileMenu';
import { cn } from '@/lib/utils';
import type { MainLayoutProps } from '@/types/layout';

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  menuItems,
  onLogout,
  showFooter = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <Header
        user={user}
        onLogout={onLogout}
        showMobileMenuButton={true}
        onMobileMenuToggle={handleMobileMenuToggle}
      />

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar
          user={user}
          menuItems={menuItems}
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
        />

        {/* Mobile Menu */}
        <MobileMenu
          user={user}
          menuItems={menuItems}
          isOpen={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
        />

        {/* Main content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            'bg-background'
          )}
        >
          <div className="container mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};
