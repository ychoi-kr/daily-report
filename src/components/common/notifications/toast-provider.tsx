'use client';

import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

export function ToastProvider() {
  return <Toaster />;
}

// Custom toast notification helper
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface ShowToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast notification hook with predefined styles
export function useNotification() {
  const { toast } = useToast();

  const showToast = ({
    title,
    description,
    type = 'default',
    duration = 4000,
    action,
  }: ShowToastOptions) => {
    const icons = {
      success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      error: <XCircle className="h-5 w-5 text-red-600" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      info: <Info className="h-5 w-5 text-blue-600" />,
      default: null,
    };

    const classNames = {
      success: 'border-green-200 bg-green-50',
      error: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50',
      default: '',
    };

    return toast({
      title: (
        <div className="flex items-center gap-2">
          {icons[type]}
          <span>{title}</span>
        </div>
      ),
      description,
      duration,
      className: classNames[type],
      action: action
        ? {
            altText: action.label,
            onClick: action.onClick,
            children: action.label,
          }
        : undefined,
    });
  };

  return {
    success: (title: string, description?: string) =>
      showToast({ title, description, type: 'success' }),
    error: (title: string, description?: string) =>
      showToast({ title, description, type: 'error' }),
    warning: (title: string, description?: string) =>
      showToast({ title, description, type: 'warning' }),
    info: (title: string, description?: string) =>
      showToast({ title, description, type: 'info' }),
    show: showToast,
  };
}

// Promise-based toast notifications
interface PromiseToastOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
}

export function usePromiseToast() {
  const notification = useNotification();

  async function promise<T>(
    promiseFn: Promise<T>,
    options: PromiseToastOptions<T>
  ): Promise<T> {
    const toastId = notification.info(options.loading);

    try {
      const result = await promiseFn;
      const successMessage =
        typeof options.success === 'function'
          ? options.success(result)
          : options.success;
      notification.success(successMessage);
      return result;
    } catch (error) {
      const errorMessage =
        typeof options.error === 'function'
          ? options.error(error as Error)
          : options.error;
      notification.error(errorMessage);
      throw error;
    }
  }

  return { promise };
}

// Global toast notifications (can be called from anywhere)
let globalToast: ReturnType<typeof useToast>['toast'] | null = null;

export function setGlobalToast(toastFn: ReturnType<typeof useToast>['toast']) {
  globalToast = toastFn;
}

export const notify = {
  success: (title: string, description?: string) => {
    if (globalToast) {
      globalToast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>{title}</span>
          </div>
        ),
        description,
        className: 'border-green-200 bg-green-50',
      });
    }
  },
  error: (title: string, description?: string) => {
    if (globalToast) {
      globalToast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>{title}</span>
          </div>
        ),
        description,
        className: 'border-red-200 bg-red-50',
      });
    }
  },
  warning: (title: string, description?: string) => {
    if (globalToast) {
      globalToast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span>{title}</span>
          </div>
        ),
        description,
        className: 'border-yellow-200 bg-yellow-50',
      });
    }
  },
  info: (title: string, description?: string) => {
    if (globalToast) {
      globalToast({
        title: (
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
          </div>
        ),
        description,
        className: 'border-blue-200 bg-blue-50',
      });
    }
  },
};

// Component to initialize global toast
export function GlobalToastInitializer() {
  const { toast } = useToast();
  
  useEffect(() => {
    setGlobalToast(toast);
  }, [toast]);
  
  return null;
}