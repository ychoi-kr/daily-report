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

  // salesPerson이 변경되면 폼 업데이트
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
          responseData.error?.message || '영업 담당자 업데이트에 실패했습니다'
        );
      }

      toast({
        title: '성공',
        description: '영업 담당자 정보를 업데이트했습니다',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating sales person:', error);
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '영업 담당자 업데이트에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 작성일시 포맷
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>영업 담당자 편집</DialogTitle>
          <DialogDescription>
            {salesPerson.name}의 정보를 편집합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 계정 정보 표시 */}
        <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">계정 정보</span>
            {salesPerson.is_active ? (
              <Badge variant="outline" className="text-green-600">
                활성
              </Badge>
            ) : (
              <Badge variant="destructive">비활성</Badge>
            )}
          </div>
          {salesPerson.created_at && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              생성일: {formatDate(salesPerson.created_at)}
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
                  <FormLabel>이름 *</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" {...field} />
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
                  <FormLabel>이메일 *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    로그인 시 사용할 이메일 주소
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
                  <FormLabel>부서</FormLabel>
                  <FormControl>
                    <Input placeholder="영업1팀" {...field} />
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
                    <FormLabel>관리자 권한 부여</FormLabel>
                    <FormDescription>
                      관리자는 다른 영업 담당자의 일일 보고에 코멘트할 수 있습니다
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
                    <FormLabel>계정 활성화</FormLabel>
                    <FormDescription>
                      비활성화하면 로그인할 수 없게 됩니다
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
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                업데이트
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}