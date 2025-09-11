'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function Spinner({ 
  size = 'md', 
  className, 
  label = '読み込み中...',
  fullScreen = false 
}: SpinnerProps) {
  const spinnerContent = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

interface ProgressSpinnerProps extends SpinnerProps {
  progress?: number;
  showPercentage?: boolean;
}

export function ProgressSpinner({
  size = 'md',
  className,
  label = '処理中...',
  progress = 0,
  showPercentage = true,
  fullScreen = false,
}: ProgressSpinnerProps) {
  const progressContent = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
        {showPercentage && progress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      {progress > 0 && (
        <div className="w-48 bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {progressContent}
      </div>
    );
  }

  return progressContent;
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText = '処理中...',
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={isLoading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'px-4 py-2 rounded-md font-medium transition-colors',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </button>
  );
}