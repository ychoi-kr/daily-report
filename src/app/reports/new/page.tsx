'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportForm } from '@/components/reports/ReportForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function NewReportPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [reportDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            setAuthError('로그인이 필요합니다');
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          } else {
            setAuthError('인증 오류가 발생했습니다');
          }
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthError('인증 확인에 실패했습니다');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

  // 인증 확인 중
  if (isAuthenticated === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 인증 오류
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {authError || '이 페이지에 접근할 권한이 없습니다'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/login">
              <Button variant="outline">로그인 페이지로</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                보고 목록으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>

        {/* 일일 보고 작성 폼 */}
        <ReportForm
          reportDate={reportDate}
          onCancel={() => router.push('/reports')}
        />
      </div>
    </div>
  );
}