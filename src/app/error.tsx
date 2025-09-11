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
          エラーが発生しました
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          申し訳ございません。予期しないエラーが発生しました。
          しばらく時間をおいてから再度お試しいただくか、
          問題が解決しない場合はシステム管理者にお問い合わせください。
        </p>

        {/* Error details in development */}
        {isDevelopment && error && (
          <Alert variant="destructive" className="mb-6 text-left">
            <Bug className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold mb-1">開発環境エラー詳細:</p>
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
            もう一度試す
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              ホームへ戻る
            </Button>
          </Link>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">
              サポートへお問い合わせの際は、以下のエラーIDをお伝えください：
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
