'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo, this.state.errorId);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription>
                申し訳ございません。予期しないエラーが発生しました。
                問題が解決しない場合は、システム管理者にお問い合わせください。
              </AlertDescription>
            </Alert>

            {/* Error details in development mode */}
            {this.props.showDetails !== false && process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-lg border bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">エラー詳細 (開発環境のみ表示)</p>
                <div className="text-xs space-y-1">
                  <p className="font-mono text-destructive">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <details className="cursor-pointer">
                      <summary className="text-muted-foreground hover:text-foreground">
                        スタックトレース
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-muted-foreground overflow-auto max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  エラーID: {this.state.errorId}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                もう一度試す
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                ページを再読み込み
              </Button>
            </div>

            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                ホームへ戻る
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export function ErrorBoundaryWrapper({ 
  children, 
  resetKeys = [],
  resetOnPropsChange = false,
  ...props 
}: ErrorBoundaryWrapperProps) {
  const [resetCount, setResetCount] = React.useState(0);

  // Reset error boundary when keys change
  React.useEffect(() => {
    if (resetOnPropsChange) {
      setResetCount(prev => prev + 1);
    }
  }, resetKeys);

  return (
    <ErrorBoundary key={resetCount} {...props}>
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}