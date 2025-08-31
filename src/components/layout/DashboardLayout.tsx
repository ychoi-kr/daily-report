"use client"

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  isManager?: boolean;
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName,
  isManager = false,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} onLogout={onLogout} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar isManager={isManager} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};