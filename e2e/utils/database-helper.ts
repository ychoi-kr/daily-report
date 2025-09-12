import { Page } from '@playwright/test';

/**
 * データベース関連のヘルパー関数
 * テストデータのセットアップとクリーンアップを行う
 */

export async function seedTestData(page: Page): Promise<void> {
  // テスト用のデータをセットアップする
  // 実際の実装では、APIエンドポイントまたは直接データベースにアクセスして
  // テストデータを投入する
  
  // 例: APIを使用してテストデータを作成
  await page.request.post('/api/test/seed', {
    data: {
      action: 'seed',
      users: true,
      customers: true,
      reports: false, // テストで動的に作成するため、初期データは作成しない
    },
  });
}

export async function cleanupTestData(page: Page): Promise<void> {
  // テスト後のクリーンアップ
  // テスト中に作成されたデータを削除する
  
  await page.request.post('/api/test/cleanup', {
    data: {
      action: 'cleanup',
      tables: ['daily_reports', 'visit_records', 'manager_comments'],
    },
  });
}

export async function createTestReport(
  page: Page,
  reportData: {
    salesPersonId: number;
    reportDate: string;
    problem: string;
    plan: string;
    visits?: Array<{
      customerId: number;
      visitTime?: string;
      visitContent: string;
    }>;
  }
): Promise<{ reportId: number }> {
  const response = await page.request.post('/api/reports', {
    data: reportData,
  });
  
  if (!response.ok()) {
    throw new Error(`Failed to create test report: ${response.status()}`);
  }
  
  const result = await response.json();
  return { reportId: result.id };
}

export async function deleteTestReport(page: Page, reportId: number): Promise<void> {
  await page.request.delete(`/api/reports/${reportId}`);
}

export async function createTestComment(
  page: Page,
  reportId: number,
  comment: string
): Promise<{ commentId: number }> {
  const response = await page.request.post(`/api/reports/${reportId}/comments`, {
    data: { comment },
  });
  
  if (!response.ok()) {
    throw new Error(`Failed to create test comment: ${response.status()}`);
  }
  
  const result = await response.json();
  return { commentId: result.id };
}