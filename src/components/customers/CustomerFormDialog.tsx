'use client';

import React, { useEffect } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Customer, CustomerFormData, customerSchema } from '@/lib/types/customer';
import { Textarea } from '@/components/ui/textarea';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
  mode,
}: CustomerFormDialogProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && customer) {
        form.reset({
          company_name: customer.company_name,
          contact_person: customer.contact_person,
          phone: customer.phone,
          email: customer.email,
          address: customer.address || '',
        });
      } else {
        form.reset({
          company_name: '',
          contact_person: '',
          phone: '',
          email: '',
          address: '',
        });
      }
    }
  }, [open, customer, mode, form]);

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '顧客新規登録' : '顧客情報編集'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? '新しい顧客情報を登録します。必須項目を入力してください。'
              : '顧客情報を編集します。必要な項目を修正してください。'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>会社名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC商事" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当者名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="山田太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話番号 *</FormLabel>
                  <FormControl>
                    <Input placeholder="03-1234-5678" {...field} />
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
                    <Input type="email" placeholder="example@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>住所</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="東京都千代田区..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '処理中...' : (mode === 'create' ? '登録' : '更新')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}