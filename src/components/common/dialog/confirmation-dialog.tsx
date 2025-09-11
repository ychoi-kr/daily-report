'use client';

import React, { useState, useCallback, createContext, useContext } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type DialogType = 'confirm' | 'warning' | 'error' | 'info' | 'success';

interface ConfirmationOptions {
  title: string;
  description: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  showDialog: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(options);
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  }, []);

  const showDialog = useCallback((options: ConfirmationOptions) => {
    setOptions(options);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (options?.onConfirm) {
      try {
        await options.onConfirm();
      } catch (error) {
        console.error('Error in confirmation action:', error);
      }
    }
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  }, [options, resolvePromise]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) {
      options.onCancel();
    }
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [options, resolvePromise]);

  const getIcon = () => {
    if (!options?.type) return null;

    const icons = {
      confirm: <Info className="h-6 w-6 text-primary" />,
      warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
      error: <XCircle className="h-6 w-6 text-red-600" />,
      info: <Info className="h-6 w-6 text-blue-600" />,
      success: <CheckCircle className="h-6 w-6 text-green-600" />,
    };

    return icons[options.type];
  };

  const getButtonVariant = () => {
    if (options?.confirmButtonVariant) return options.confirmButtonVariant;
    
    const variants: Record<DialogType, 'default' | 'destructive'> = {
      confirm: 'default',
      warning: 'destructive',
      error: 'destructive',
      info: 'default',
      success: 'default',
    };

    return options?.type ? variants[options.type] : 'default';
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, showDialog }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {getIcon()}
              {options?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {options?.showCancel !== false && (
              <AlertDialogCancel onClick={handleCancel}>
                {options?.cancelText || 'キャンセル'}
              </AlertDialogCancel>
            )}
            <AlertDialogAction 
              onClick={handleConfirm}
              className={getButtonVariant() === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {options?.confirmText || '確認'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>
  );
}

// Standalone confirmation dialog component
interface StandaloneConfirmationDialogProps extends ConfirmationOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  type = 'confirm',
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmButtonVariant,
  onConfirm,
  onCancel,
  showCancel = true,
}: StandaloneConfirmationDialogProps) {
  const handleConfirm = async () => {
    if (onConfirm) {
      try {
        await onConfirm();
      } catch (error) {
        console.error('Error in confirmation action:', error);
      }
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const getIcon = () => {
    const icons = {
      confirm: <Info className="h-6 w-6 text-primary" />,
      warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
      error: <XCircle className="h-6 w-6 text-red-600" />,
      info: <Info className="h-6 w-6 text-blue-600" />,
      success: <CheckCircle className="h-6 w-6 text-green-600" />,
    };

    return icons[type];
  };

  const getButtonVariant = () => {
    if (confirmButtonVariant) return confirmButtonVariant;
    
    const variants: Record<DialogType, 'default' | 'destructive'> = {
      confirm: 'default',
      warning: 'destructive',
      error: 'destructive',
      info: 'default',
      success: 'default',
    };

    return variants[type];
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction 
            onClick={handleConfirm}
            className={getButtonVariant() === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Preset confirmation dialogs
export function usePresetDialogs() {
  const { confirm } = useConfirmation();

  return {
    confirmDelete: (itemName: string) =>
      confirm({
        title: '削除の確認',
        description: `「${itemName}」を削除してもよろしいですか？この操作は取り消すことができません。`,
        type: 'warning',
        confirmText: '削除',
        confirmButtonVariant: 'destructive',
      }),

    confirmSave: (hasChanges: boolean = true) =>
      hasChanges
        ? confirm({
            title: '変更の保存',
            description: '変更を保存してもよろしいですか？',
            type: 'confirm',
            confirmText: '保存',
          })
        : Promise.resolve(true),

    confirmLeave: () =>
      confirm({
        title: '未保存の変更',
        description: '保存されていない変更があります。このまま離れてもよろしいですか？',
        type: 'warning',
        confirmText: '離れる',
        cancelText: '留まる',
      }),

    confirmAction: (action: string, description?: string) =>
      confirm({
        title: `${action}の確認`,
        description: description || `${action}を実行してもよろしいですか？`,
        type: 'confirm',
        confirmText: '実行',
      }),

    showError: (errorMessage: string) =>
      confirm({
        title: 'エラー',
        description: errorMessage,
        type: 'error',
        confirmText: '閉じる',
        showCancel: false,
      }),

    showSuccess: (message: string) =>
      confirm({
        title: '成功',
        description: message,
        type: 'success',
        confirmText: '閉じる',
        showCancel: false,
      }),

    showInfo: (message: string) =>
      confirm({
        title: 'お知らせ',
        description: message,
        type: 'info',
        confirmText: '閉じる',
        showCancel: false,
      }),
  };
}