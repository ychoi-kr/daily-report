'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
    
    // In production, you might want to send this to a logging service
    // Example: logErrorToService(error, error.digest);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center max-w-lg px-4">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-destructive/20 rounded-full"></div>
            <AlertTriangle className="relative h-24 w-24 text-destructive/80" />
          </div>
        </div>

        {/* Error code */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text text-transparent mb-4">
          500
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          오류가 발생했습니다
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          죄송합니다. 예기치 않은 오류가 발생했습니다.
          잠시 후 다시 시도해 주시거나,
          문제가 해결되지 않는 경우 시스템 관리자에게 문의하세요.
        </p>

        {/* Error details in development */}
        {isDevelopment && error && (
          <Alert variant="destructive" className="mb-6 text-left">
            <Bug className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold mb-1">개발 환경 오류 상세:</p>
              <p className="text-sm font-mono break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Digest: {error.digest}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">
              지원팀에 문의 시 아래 오류 ID를 알려주세요:
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {error.digest}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
