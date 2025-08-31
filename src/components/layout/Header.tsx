"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">営業日報システム</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {userName && (
              <>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{userName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ログアウト</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};