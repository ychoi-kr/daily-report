"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  Users,
  Building,
  Home,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  isManager?: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  requiresManager?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'ホーム',
    href: '/',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: '日報一覧',
    href: '/reports',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: '日報作成',
    href: '/reports/new',
    icon: <PlusCircle className="h-4 w-4" />,
  },
  {
    title: '顧客管理',
    href: '/customers',
    icon: <Building className="h-4 w-4" />,
    requiresManager: true,
  },
  {
    title: '営業担当者管理',
    href: '/sales-persons',
    icon: <Users className="h-4 w-4" />,
    requiresManager: true,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isManager = false }) => {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(
    item => !item.requiresManager || isManager
  );

  return (
    <aside className="w-64 border-r bg-background">
      <nav className="space-y-1 p-4">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};