'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Info, AlertCircle, Settings } from 'lucide-react';
import type { User } from '@/types/layout';

export default function LayoutDemoPage() {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    isManager: false,
  });

  const [showFooter, setShowFooter] = useState(true);

  const handleLogout = () => {
    alert('ログアウト処理が実行されました');
    setCurrentUser(null);
  };

  const toggleUserRole = () => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        isManager: !currentUser.isManager,
      });
    }
  };

  const loginAsUser = () => {
    setCurrentUser({
      id: 1,
      name: '山田太郎',
      email: 'yamada@example.com',
      department: '営業1課',
      isManager: false,
    });
  };

  const loginAsManager = () => {
    setCurrentUser({
      id: 2,
      name: '田中部長',
      email: 'tanaka@example.com',
      department: '営業部',
      isManager: true,
    });
  };

  return (
    <MainLayout
      user={currentUser}
      onLogout={handleLogout}
      showFooter={showFooter}
    >
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">レイアウトデモ</h1>
          <p className="text-muted-foreground">
            共通レイアウトコンポーネントのデモンストレーション
          </p>
        </div>

        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              デモコントロール
            </CardTitle>
            <CardDescription>
              レイアウトの動作を確認するための設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">ユーザー切り替え:</p>
                <div className="flex gap-2">
                  <Button
                    onClick={loginAsUser}
                    variant={currentUser && !currentUser.isManager ? 'default' : 'outline'}
                    size="sm"
                  >
                    一般ユーザー
                  </Button>
                  <Button
                    onClick={loginAsManager}
                    variant={currentUser?.isManager ? 'default' : 'outline'}
                    size="sm"
                  >
                    管理者
                  </Button>
                  <Button
                    onClick={() => setCurrentUser(null)}
                    variant={!currentUser ? 'default' : 'outline'}
                    size="sm"
                  >
                    未ログイン
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">レイアウト設定:</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowFooter(!showFooter)}
                    variant="outline"
                    size="sm"
                  >
                    フッター: {showFooter ? 'ON' : 'OFF'}
                  </Button>
                  {currentUser && (
                    <Button
                      onClick={toggleUserRole}
                      variant="outline"
                      size="sm"
                    >
                      権限切替
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Current User Info */}
            {currentUser && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>現在のユーザー情報</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <div>名前: {currentUser.name}</div>
                  <div>メール: {currentUser.email}</div>
                  <div>部署: {currentUser.department}</div>
                  <div className="flex items-center gap-2">
                    権限: {currentUser.isManager ? (
                      <Badge>管理者</Badge>
                    ) : (
                      <Badge variant="secondary">一般ユーザー</Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Feature Showcase */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">機能一覧</TabsTrigger>
            <TabsTrigger value="responsive">レスポンシブ</TabsTrigger>
            <TabsTrigger value="accessibility">アクセシビリティ</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>実装済み機能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>ヘッダーコンポーネント（ロゴ、ユーザー情報、ログアウト）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>サイドバーメニュー（階層構造、権限制御）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>モバイルメニュー（レスポンシブ対応）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>フッターコンポーネント</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>ダークモード対応</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>TypeScript型定義</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>レスポンシブデザイン</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>ブレークポイント</AlertTitle>
                  <AlertDescription className="mt-2">
                    <ul className="list-disc list-inside space-y-1">
                      <li>モバイル: 〜768px（モバイルメニュー表示）</li>
                      <li>タブレット: 768px〜1024px</li>
                      <li>デスクトップ: 1024px〜（サイドバー表示）</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  ブラウザのウィンドウサイズを変更して、レスポンシブデザインを確認してください。
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>アクセシビリティ機能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>WAI-ARIA属性の実装</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>キーボードナビゲーション対応</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>スクリーンリーダー対応</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>適切なコントラスト比</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>フォーカス表示</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sample Content Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>サンプルカード 1</CardTitle>
              <CardDescription>レイアウト内のコンテンツ例</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                このカードはレイアウト内でのコンテンツ表示を確認するためのサンプルです。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>サンプルカード 2</CardTitle>
              <CardDescription>グリッドレイアウトの確認</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                レスポンシブグリッドが正しく動作していることを確認できます。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>サンプルカード 3</CardTitle>
              <CardDescription>ダークモード対応</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                右上のテーマ切り替えボタンでダークモードを試してください。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}