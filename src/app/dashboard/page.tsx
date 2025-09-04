'use client';

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
  // TODO: 実際の認証状態とユーザー情報を取得
  const isManager = false;
  const userName = '山田太郎';

  const handleLogout = () => {
    // TODO: ログアウト処理
    console.log('Logout clicked');
  };

  return (
    <DashboardLayout
      isManager={isManager}
      userName={userName}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <PageHeader title="ダッシュボード" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今月の日報数
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
                今月の訪問件数
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
                未読コメント
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">要確認</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今週の予定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">件の訪問予定</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>最近の活動</CardTitle>
              <CardDescription>最近の日報と訪問記録</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      2025/09/04 - ABC商事訪問
                    </p>
                    <p className="text-sm text-muted-foreground">
                      新商品の提案を実施しました
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      2025/09/03 - XYZ工業訪問
                    </p>
                    <p className="text-sm text-muted-foreground">
                      既存システムの保守相談
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      2025/09/02 - DEF株式会社訪問
                    </p>
                    <p className="text-sm text-muted-foreground">
                      契約更新の打ち合わせ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>今週の目標</CardTitle>
              <CardDescription>今週達成したい目標</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">新規開拓</span>
                  <span className="text-sm font-medium">5/10 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">既存顧客フォロー</span>
                  <span className="text-sm font-medium">8/12 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">提案書作成</span>
                  <span className="text-sm font-medium">3/5 件</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
