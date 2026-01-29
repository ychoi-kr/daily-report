'use client';

import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  const { user, isManager, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      isManager={isManager}
      userName={user.name}
      onLogout={logout}
    >
      <div className="space-y-6">
        <PageHeader title="대시보드" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                이번 달 일일 보고 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                이번 달 방문 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                읽지 않은 코멘트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">확인 필요</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 주 일정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">건의 방문 예정</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>최근 일일 보고 및 방문 기록</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      2025/09/04 - ABC상사 방문
                    </p>
                    <p className="text-sm text-muted-foreground">
                      신상품 제안을 실시했습니다
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      2025/09/03 - XYZ공업 방문
                    </p>
                    <p className="text-sm text-muted-foreground">
                      기존 시스템 유지보수 상담
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      2025/09/02 - DEF주식회사 방문
                    </p>
                    <p className="text-sm text-muted-foreground">
                      계약 갱신 미팅
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>이번 주 목표</CardTitle>
              <CardDescription>이번 주 달성하고 싶은 목표</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">신규 개척</span>
                  <span className="text-sm font-medium">5/10 건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">기존 고객 관리</span>
                  <span className="text-sm font-medium">8/12 건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">제안서 작성</span>
                  <span className="text-sm font-medium">3/5 건</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
