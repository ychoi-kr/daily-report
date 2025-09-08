'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  FileText,
  Users,
  Building,
  Home,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';
import type { MobileMenuProps, MenuItem } from '@/types/layout';

// Default menu items (same as sidebar)
const defaultMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'ホーム',
    href: '/',
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 'reports',
    label: '日報管理',
    href: '/reports',
    icon: <FileText className="h-4 w-4" />,
    children: [
      {
        id: 'reports-list',
        label: '日報一覧',
        href: '/reports',
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        id: 'reports-new',
        label: '日報作成',
        href: '/reports/new',
        icon: <PlusCircle className="h-4 w-4" />,
      },
      {
        id: 'reports-calendar',
        label: 'カレンダー表示',
        href: '/reports/calendar',
        icon: <Calendar className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'analytics',
    label: '分析・レポート',
    href: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    badge: 'New',
  },
  {
    id: 'master-data',
    label: 'マスタ管理',
    href: '#',
    icon: <Settings className="h-4 w-4" />,
    requiredRole: 'manager',
    children: [
      {
        id: 'customers',
        label: '顧客管理',
        href: '/customers',
        icon: <Building className="h-4 w-4" />,
      },
      {
        id: 'sales-persons',
        label: '営業担当者管理',
        href: '/sales-persons',
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'help',
    label: 'ヘルプ',
    href: '/help',
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

export const MobileMenu: React.FC<MobileMenuProps> = ({
  user,
  menuItems = defaultMenuItems,
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter((item) => {
      // Check role-based access
      if (item.requiredRole === 'manager' && !user?.isManager) {
        return false;
      }
      if (item.requiredRole === 'admin' && !user?.isManager) {
        return false;
      }
      // Filter children recursively
      if (item.children) {
        item.children = filterMenuItems(item.children);
      }
      return true;
    });
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = pathname === item.href || 
      (hasChildren && item.children.some(child => pathname === child.href));

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between px-4 py-2 text-sm font-medium',
              depth > 0 && 'pl-8',
              isActive && 'bg-accent'
            )}
            onClick={() => toggleExpanded(item.id)}
          >
            <div className="flex items-center">
              {item.icon}
              <span className="ml-3">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2">
                  {item.badge}
                </Badge>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isExpanded && (
            <div className="space-y-1">
              {item.children.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          depth > 0 && 'pl-8',
          pathname === item.href
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {item.icon}
        <span className="ml-3">{item.label}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>営業日報システム</span>
          </SheetTitle>
        </SheetHeader>
        
        {user && (
          <div className="border-b px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {(user.department || user.isManager) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.department && (
                  <Badge variant="secondary" className="text-xs">
                    {user.department}
                  </Badge>
                )}
                {user.isManager && (
                  <Badge className="text-xs">管理者</Badge>
                )}
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {filteredMenuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && item.requiredRole && (
                  <Separator className="my-2" />
                )}
                {renderMenuItem(item)}
              </React.Fragment>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};