'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { FooterProps } from '@/types/layout';

export const Footer: React.FC<FooterProps> = ({
  className,
  showVersion = true,
}) => {
  const currentYear = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

  return (
    <footer
      className={cn(
        'border-t bg-background py-6 text-center text-sm text-muted-foreground',
        className
      )}
    >
      <div className="container px-4">
        <div className="flex flex-col items-center justify-between space-y-2 md:flex-row md:space-y-0">
          <div className="flex flex-col items-center space-y-1 md:flex-row md:space-x-4 md:space-y-0">
            <p>© {currentYear} 영업 일일 보고 시스템. All rights reserved.</p>
            {showVersion && (
              <p className="text-xs">
                Version {version}
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <a
              href="/help"
              className="hover:text-foreground transition-colors"
              aria-label="Help"
            >
              도움말
            </a>
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors"
              aria-label="Privacy Policy"
            >
              개인정보처리방침
            </a>
            <a
              href="/terms"
              className="hover:text-foreground transition-colors"
              aria-label="Terms of Service"
            >
              이용약관
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};