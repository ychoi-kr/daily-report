'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/sales-person';
import type { SalesPerson } from '@/types/api';
import { Loader2, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesPerson: SalesPerson;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  salesPerson,
}: PasswordResetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/sales-persons/${salesPerson.id}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: data.password }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error?.message || 'パスワードのリセットに失敗しました'
        );
      }

      toast({
        title: '成功',
        description: `${salesPerson.name}のパスワードをリセットしました`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'エラー',
        description:
          error instanceof Error
            ? error.message
            : 'パスワードのリセットに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            パスワードリセット
          </DialogTitle>
          <DialogDescription>
            {salesPerson.name}のパスワードを新しく設定します。
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            パスワードをリセットすると、対象ユーザーは新しいパスワードでのみログインできるようになります。
            必ず安全な方法でパスワードを共有してください。
          </AlertDescription>
        </Alert>

        {/* 対象ユーザー情報 */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">対象ユーザー</span>
          </div>
          <div className="space-y-1 text-sm">
            <div>
              <strong>氏名:</strong> {salesPerson.name}
            </div>
            <div>
              <strong>メール:</strong> {salesPerson.email}
            </div>
            <div>
              <strong>部署:</strong> {salesPerson.department}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新しいパスワード *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword
                            ? 'パスワードを非表示'
                            : 'パスワードを表示'}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    8文字以上、大文字・小文字・数字を含む
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード確認 *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword
                            ? 'パスワードを非表示'
                            : 'パスワードを表示'}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    確認のため同じパスワードを入力してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                パスワードリセット
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}