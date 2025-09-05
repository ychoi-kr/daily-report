'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  updateSalesPersonSchema,
  type UpdateSalesPersonInput,
} from '@/lib/validations/sales-person';
import type { SalesPerson } from '@/types/api';
import { Loader2, Calendar } from 'lucide-react';

interface EditSalesPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesPerson: SalesPerson;
  onSuccess: () => void;
}

export function EditSalesPersonDialog({
  open,
  onOpenChange,
  salesPerson,
  onSuccess,
}: EditSalesPersonDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(updateSalesPersonSchema),
    defaultValues: {
      name: salesPerson.name,
      email: salesPerson.email,
      department: salesPerson.department,
      is_manager: salesPerson.is_manager,
      is_active: salesPerson.is_active,
    },
  });

  // salesPersonが変更されたらフォームを更新
  useEffect(() => {
    if (salesPerson) {
      form.reset({
        name: salesPerson.name,
        email: salesPerson.email,
        department: salesPerson.department,
        is_manager: salesPerson.is_manager,
        is_active: salesPerson.is_active,
      });
    }
  }, [salesPerson, form]);

  const onSubmit = async (data: UpdateSalesPersonInput) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/sales-persons/${salesPerson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error?.message || '営業担当者の更新に失敗しました'
        );
      }

      toast({
        title: '成功',
        description: '営業担当者の情報を更新しました',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating sales person:', error);
      toast({
        title: 'エラー',
        description:
          error instanceof Error
            ? error.message
            : '営業担当者の更新に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 作成日時のフォーマット
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>営業担当者の編集</DialogTitle>
          <DialogDescription>
            {salesPerson.name}の情報を編集します。
          </DialogDescription>
        </DialogHeader>

        {/* アカウント情報表示 */}
        <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">アカウント情報</span>
            {salesPerson.is_active ? (
              <Badge variant="outline" className="text-green-600">
                有効
              </Badge>
            ) : (
              <Badge variant="destructive">無効</Badge>
            )}
          </div>
          {salesPerson.created_at && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              作成日: {formatDate(salesPerson.created_at)}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            ID: {salesPerson.id}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>氏名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="山田太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="yamada@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    ログイン時に使用するメールアドレス
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>部署 *</FormLabel>
                  <FormControl>
                    <Input placeholder="営業1課" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_manager"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>管理者権限を付与</FormLabel>
                    <FormDescription>
                      管理者は他の営業担当者の日報にコメントできます
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>アカウント有効</FormLabel>
                    <FormDescription>
                      無効にするとログインできなくなります
                    </FormDescription>
                  </div>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                更新
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}