'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  Users,
  Building,
  Home,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { SidebarProps, MenuItem } from '@/types/layout';

// Default menu items
const defaultMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    href: '/',
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 'reports',
    label: '일일 보고 관리',
    href: '/reports',
    icon: <FileText className="h-4 w-4" />,
    children: [
      {
        id: 'reports-list',
        label: '일일 보고 목록',
        href: '/reports',
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        id: 'reports-new',
        label: '일일 보고 작성',
        href: '/reports/new',
        icon: <PlusCircle className="h-4 w-4" />,
      },
      {
        id: 'reports-calendar',
        label: '캘린더 보기',
        href: '/reports/calendar',
        icon: <Calendar className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'analytics',
    label: '분석/리포트',
    href: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    badge: 'New',
  },
  {
    id: 'master-data',
    label: '마스터 관리',
    href: '#',
    icon: <Settings className="h-4 w-4" />,
    requiredRole: 'manager',
    children: [
      {
        id: 'customers',
        label: '고객 관리',
        href: '/customers',
        icon: <Building className="h-4 w-4" />,
      },
      {
        id: 'sales-persons',
        label: '영업 담당자 관리',
        href: '/sales-persons',
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'help',
    label: '도움말',
    href: '/help',
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  menuItems = defaultMenuItems,
  isCollapsed = false,
  onCollapse,
  className,
}) => {
  const pathname = usePathname();
  // Initialize with 'reports' and 'master-data' menus expanded by default
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['reports', 'master-data']));

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
    return items
      .filter((item) => {
        // Check role-based access
        if (item.requiredRole === 'manager' && !user?.isManager) {
          return false;
        }
        if (item.requiredRole === 'admin' && !user?.isManager) {
          return false;
        }
        return true;
      })
      .map((item) => {
        // Filter children recursively without mutating the original
        if (item.children) {
          return {
            ...item,
            children: filterMenuItems(item.children),
          };
        }
        return item;
      });
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = pathname === item.href ||
      (hasChildren && item.children?.some(child => pathname === child.href));

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.id}>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start px-3 py-2 text-sm font-medium',
              depth > 0 && 'pl-8',
              isActive && 'bg-accent'
            )}
            onClick={() => toggleExpanded(item.id)}
          >
            {item.icon}
            <span className="ml-3 flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-2">
                {item.badge}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          depth > 0 && 'pl-8',
          pathname === item.href
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {item.icon}
        {!isCollapsed && (
          <>
            <span className="ml-3">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredMenuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && item.requiredRole && <Separator className="my-2" />}
              {renderMenuItem(item)}
            </React.Fragment>
          ))}
        </nav>
      </ScrollArea>

      {onCollapse && (
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => onCollapse(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </aside>
  );
};
