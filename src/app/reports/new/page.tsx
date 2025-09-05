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

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            setAuthError('ログインが必要です');
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          } else {
            setAuthError('認証エラーが発生しました');
          }
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthError('認証チェックに失敗しました');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

  // 認証チェック中
  if (isAuthenticated === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 認証エラー
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {authError || 'このページにアクセスする権限がありません'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/login">
              <Button variant="outline">ログインページへ</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                日報一覧へ戻る
              </Button>
            </Link>
          </div>
        </div>

        {/* 日報作成フォーム */}
        <ReportForm
          reportDate={reportDate}
          onCancel={() => router.push('/reports')}
        />
      </div>
    </div>
  );
}