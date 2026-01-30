'use client';

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center max-w-md px-4">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>
            <FileQuestion className="relative h-24 w-24 text-primary/80" />
          </div>
        </div>

        {/* Error code */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          페이지를 찾을 수 없습니다
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          찾으시는 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          URL을 확인하시거나 홈페이지에서 찾아보세요.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전 페이지로 돌아가기
          </Button>
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Additional help */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            문제가 해결되지 않는 경우
          </p>
          <Link
            href="/contact"
            className="text-sm text-primary hover:underline"
          >
            시스템 관리자에게 문의하세요
          </Link>
        </div>
      </div>
    </div>
  );
}
