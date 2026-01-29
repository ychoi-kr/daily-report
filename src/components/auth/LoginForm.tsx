'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginRequestSchema, type LoginRequest } from '@/lib/schemas/auth';

interface LoginFormProps {
  onSubmit: (data: LoginRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: LoginRequest) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // エラーは親コンポーネントで処理
      console.error('Login form submission error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">영업 일일 보고 시스템</h1>
        <p className="text-muted-foreground">
          이메일과 비밀번호로 로그인해주세요
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="yamada@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="비밀번호 입력"
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        <p>테스트용 계정:</p>
        <div className="mt-2">
          <p className="font-semibold">일반 사용자:</p>
          <p>메일: yamada@example.com</p>
          <p>비밀번호: Password123</p>
        </div>
        <div className="mt-2">
          <p className="font-semibold">관리자:</p>
          <p>메일: tanaka@example.com</p>
          <p>비밀번호: Password123</p>
        </div>
      </div>
    </div>
  );
}
