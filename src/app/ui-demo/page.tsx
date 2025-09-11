'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Import our custom components
import { Spinner, ProgressSpinner, LoadingButton } from '@/components/common/loading/spinner';
import {
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  ListSkeleton,
  DailyReportSkeleton,
  MasterListSkeleton,
  DashboardSkeleton,
} from '@/components/common/loading/skeleton-variants';
import { ErrorBoundary, ErrorBoundaryWrapper } from '@/components/common/error/error-boundary';
import { useNotification, usePromiseToast } from '@/components/common/notifications/toast-provider';
import { ConfirmationDialog, useConfirmation, usePresetDialogs } from '@/components/common/dialog/confirmation-dialog';

// Component that throws an error for testing
function ErrorComponent() {
  throw new Error('This is a test error!');
}

// Component with error state
function ErrorTrigger() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    return <ErrorComponent />;
  }

  return (
    <Button onClick={() => setShouldError(true)} variant="destructive">
      トリガーエラー（Error Boundaryのテスト）
    </Button>
  );
}

export default function UIDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const notification = useNotification();
  const { promise } = usePromiseToast();
  const { confirm } = useConfirmation();
  const presetDialogs = usePresetDialogs();

  // Simulate async operation
  const simulateAsync = (success = true) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (success) {
          resolve('Operation completed successfully');
        } else {
          reject(new Error('Operation failed'));
        }
      }, 2000);
    });
  };

  // Simulate progress
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">UI コンポーネントデモ</h1>
        <p className="text-muted-foreground">
          営業日報システムで使用するローディング、エラー、通知コンポーネントのデモページです。
        </p>
      </div>

      <Tabs defaultValue="loading" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="loading">Loading</TabsTrigger>
          <TabsTrigger value="skeleton">Skeleton</TabsTrigger>
          <TabsTrigger value="error">Error</TabsTrigger>
          <TabsTrigger value="toast">Toast</TabsTrigger>
          <TabsTrigger value="dialog">Dialog</TabsTrigger>
        </TabsList>

        {/* Loading Components */}
        <TabsContent value="loading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spinner Components</CardTitle>
              <CardDescription>Various spinner and loading states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center space-y-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-muted-foreground">Small</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Spinner size="md" />
                  <span className="text-sm text-muted-foreground">Medium</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Spinner size="lg" />
                  <span className="text-sm text-muted-foreground">Large</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Spinner size="xl" />
                  <span className="text-sm text-muted-foreground">Extra Large</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Progress Spinner</h3>
                <div className="flex flex-col items-center space-y-4">
                  <ProgressSpinner progress={progress} label="データを処理中..." />
                  <Button onClick={simulateProgress}>Start Progress</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Loading Button</h3>
                <div className="flex gap-4">
                  <LoadingButton
                    isLoading={isLoading}
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 2000);
                    }}
                  >
                    保存
                  </LoadingButton>
                  <LoadingButton
                    isLoading={isLoading}
                    loadingText="送信中..."
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 2000);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    送信
                  </LoadingButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skeleton Components */}
        <TabsContent value="skeleton" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Screens</CardTitle>
              <CardDescription>Loading placeholders for different content types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Table Skeleton</h3>
                <TableSkeleton rows={3} columns={4} />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Card Skeleton</h3>
                <div className="grid grid-cols-3 gap-4">
                  <CardSkeleton />
                  <CardSkeleton showImage={true} />
                  <CardSkeleton lines={5} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Form Skeleton</h3>
                <div className="max-w-md">
                  <FormSkeleton fields={3} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">List Skeleton</h3>
                <ListSkeleton items={3} showAvatar={true} showActions={true} />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Daily Report Skeleton</h3>
                <DailyReportSkeleton />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Components */}
        <TabsContent value="error" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
              <CardDescription>Error boundaries and error states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Error Boundary</h3>
                <ErrorBoundaryWrapper
                  onError={(error, errorInfo) => {
                    console.log('Error caught:', error, errorInfo);
                  }}
                >
                  <ErrorTrigger />
                </ErrorBoundaryWrapper>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Error Pages</h3>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => window.open('/404', '_blank')}>
                    View 404 Page
                  </Button>
                  <Button variant="outline" onClick={() => window.open('/error-test', '_blank')}>
                    View 500 Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Toast Notifications */}
        <TabsContent value="toast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <CardDescription>Various notification types and styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => notification.success('成功', '操作が正常に完了しました。')}
                >
                  Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => notification.error('エラー', '操作に失敗しました。')}
                >
                  Error Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => notification.warning('警告', '注意が必要です。')}
                >
                  Warning Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => notification.info('情報', 'お知らせがあります。')}
                >
                  Info Toast
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Promise Toast</h3>
                <div className="flex gap-4">
                  <Button
                    onClick={() =>
                      promise(simulateAsync(true), {
                        loading: 'データを保存中...',
                        success: '保存が完了しました！',
                        error: '保存に失敗しました。',
                      })
                    }
                  >
                    Success Promise
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      promise(simulateAsync(false), {
                        loading: 'データを削除中...',
                        success: '削除が完了しました！',
                        error: '削除に失敗しました。',
                      })
                    }
                  >
                    Failed Promise
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Toast with Action</h3>
                <Button
                  onClick={() =>
                    notification.show({
                      title: 'アクション付き通知',
                      description: '元に戻すことができます。',
                      type: 'info',
                      action: {
                        label: '元に戻す',
                        onClick: () => console.log('Undo clicked'),
                      },
                    })
                  }
                >
                  Show Toast with Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirmation Dialogs */}
        <TabsContent value="dialog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirmation Dialogs</CardTitle>
              <CardDescription>Various confirmation dialog types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: '確認',
                      description: 'この操作を実行してもよろしいですか？',
                      type: 'confirm',
                    });
                    if (confirmed) {
                      notification.success('確認されました');
                    }
                  }}
                >
                  Basic Confirmation
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    const confirmed = await presetDialogs.confirmDelete('重要なデータ');
                    if (confirmed) {
                      notification.success('削除されました');
                    }
                  }}
                >
                  Delete Confirmation
                </Button>
                <Button
                  onClick={() => presetDialogs.showInfo('これは情報メッセージです。')}
                >
                  Info Dialog
                </Button>
                <Button
                  onClick={() => presetDialogs.showSuccess('操作が正常に完了しました！')}
                >
                  Success Dialog
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => presetDialogs.showError('エラーが発生しました。')}
                >
                  Error Dialog
                </Button>
                <Button
                  onClick={async () => {
                    const confirmed = await presetDialogs.confirmLeave();
                    if (confirmed) {
                      notification.info('ページを離れます');
                    }
                  }}
                >
                  Unsaved Changes
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Standalone Dialog</h3>
                <Button onClick={() => setDialogOpen(true)}>Open Standalone Dialog</Button>
                <ConfirmationDialog
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  title="スタンドアロンダイアログ"
                  description="これは独立したダイアログコンポーネントです。"
                  type="info"
                  onConfirm={() => {
                    notification.success('確認されました');
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}