'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ReportDetailView } from '@/components/reports/ReportDetailView';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Suspense, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ReportDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ReportDetailContent({ params }: ReportDetailPageProps) {
  const router = useRouter();
  const { user, isManager, logout } = useAuth();
  const { id } = use(params);
  const reportId = parseInt(id, 10);

  if (isNaN(reportId)) {
    router.push('/reports');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <DashboardLayout
      isManager={isManager}
      userName={user?.name || ''}
      onLogout={handleLogout}
    >
      <ReportDetailView reportId={reportId} />
    </DashboardLayout>
  );
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      }>
        <ReportDetailContent params={params} />
      </Suspense>
    </AuthProvider>
  );
}