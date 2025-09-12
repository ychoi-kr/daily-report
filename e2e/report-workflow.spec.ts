import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { TEST_USERS, TEST_REPORT_DATA } from './utils/test-data';
import { login } from './utils/auth-helper';

test.describe('日報業務フロー', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にデータベースの状態をリセット（実装は後で）
  });

  test('日報作成から詳細表示まで（一般ユーザー）', async ({ page }) => {
    // ログイン
    await login(page, 'REGULAR_USER');
    
    const reportsPage = new ReportsPage(page);
    const reportFormPage = new ReportFormPage(page);
    const reportDetailPage = new ReportDetailPage(page);
    
    // 日報一覧画面に移動
    await reportsPage.goto();
    await reportsPage.expectPageLoaded();
    
    // 新規日報作成画面に移動
    await reportsPage.clickNewReport();
    await reportFormPage.expectPageLoaded();
    
    // 日報データを入力
    const reportData = TEST_REPORT_DATA.BASIC_REPORT;
    await reportFormPage.fillReportData({
      problem: reportData.problem,
      plan: reportData.plan,
      visits: [
        {
          customerName: 'ABC商事',
          visitTime: reportData.visits[0].visitTime,
          visitContent: reportData.visits[0].visitContent,
        },
        {
          customerName: 'XYZ工業', 
          visitTime: reportData.visits[1].visitTime,
          visitContent: reportData.visits[1].visitContent,
        },
      ],
    });
    
    // 訪問記録の数を確認
    await reportFormPage.expectVisitRecordCount(2);
    
    // 保存
    await reportFormPage.save();
    await reportFormPage.expectSaveSuccess();
    
    // 日報詳細画面で内容を確認
    const user = TEST_USERS.REGULAR_USER;
    await reportDetailPage.expectReportData({
      reportDate: reportData.reportDate,
      salesPersonName: user.name,
      problem: reportData.problem,
      plan: reportData.plan,
    });
    
    // 訪問記録を確認
    await reportDetailPage.expectVisitRecord('ABC商事', reportData.visits[0].visitContent);
    await reportDetailPage.expectVisitRecord('XYZ工業', reportData.visits[1].visitContent);
    await reportDetailPage.expectVisitRecordCount(2);
    
    // 一般ユーザーは自分の日報を編集できる
    await reportDetailPage.expectEditButtonVisible();
  });

  test('日報編集フロー（一般ユーザー）', async ({ page }) => {
    // 前提として日報が作成済みの状態を作る（実際の実装では事前にAPIで作成）
    await login(page, 'REGULAR_USER');
    
    const reportFormPage = new ReportFormPage(page);
    const reportDetailPage = new ReportDetailPage(page);
    
    // 既存の日報IDを取得（テストデータから）
    const reportId = 1; // 実際の実装では動的に取得
    
    // 日報詳細画面に移動
    await reportDetailPage.goto(reportId);
    await reportDetailPage.expectPageLoaded();
    
    // 編集画面に移動
    await reportDetailPage.clickEdit();
    await reportFormPage.expectPageLoaded();
    
    // 内容を変更
    const updatedProblem = '更新されたテスト用の課題・相談事項です。';
    const updatedPlan = '更新されたテスト用の明日の計画です。';
    
    await reportFormPage.fillProblem(updatedProblem);
    await reportFormPage.fillPlan(updatedPlan);
    
    // 保存
    await reportFormPage.save();
    await reportFormPage.expectSaveSuccess();
    
    // 更新された内容を確認
    const user = TEST_USERS.REGULAR_USER;
    await reportDetailPage.expectReportData({
      reportDate: '2025-09-12',
      salesPersonName: user.name,
      problem: updatedProblem,
      plan: updatedPlan,
    });
  });

  test('日報検索フロー', async ({ page }) => {
    await login(page, 'REGULAR_USER');
    
    const reportsPage = new ReportsPage(page);
    
    await reportsPage.goto();
    await reportsPage.expectPageLoaded();
    
    // 日付範囲で検索
    await reportsPage.searchByDateRange('2025-09-01', '2025-09-30');
    
    // 検索結果に期待する日報が含まれていることを確認
    const user = TEST_USERS.REGULAR_USER;
    await reportsPage.expectReportInList('2025-09-12', user.name);
  });

  test('訪問記録の追加と削除', async ({ page }) => {
    await login(page, 'REGULAR_USER');
    
    const reportFormPage = new ReportFormPage(page);
    
    await reportFormPage.goto();
    await reportFormPage.expectPageLoaded();
    
    // 基本情報を入力
    const reportData = TEST_REPORT_DATA.BASIC_REPORT;
    await reportFormPage.fillProblem(reportData.problem);
    await reportFormPage.fillPlan(reportData.plan);
    
    // 訪問記録を3件追加
    await reportFormPage.addVisitRecord('ABC商事', '10:00', '1件目の訪問記録');
    await reportFormPage.addVisitRecord('XYZ工業', '14:00', '2件目の訪問記録');
    await reportFormPage.addVisitRecord('DEF株式会社', '16:00', '3件目の訪問記録');
    
    await reportFormPage.expectVisitRecordCount(3);
    
    // 2件目を削除
    await reportFormPage.removeVisitRecord(1);
    await reportFormPage.expectVisitRecordCount(2);
    
    // 保存して確認
    await reportFormPage.save();
    
    const reportDetailPage = new ReportDetailPage(page);
    await reportDetailPage.expectVisitRecordCount(2);
    await reportDetailPage.expectVisitRecord('ABC商事', '1件目の訪問記録');
    await reportDetailPage.expectVisitRecord('DEF株式会社', '3件目の訪問記録');
  });

  test('日報一覧のページネーション', async ({ page }) => {
    // 大量のテストデータが存在する前提（実際の実装では事前にAPIで作成）
    await login(page, 'REGULAR_USER');
    
    const reportsPage = new ReportsPage(page);
    
    await reportsPage.goto();
    await reportsPage.expectPageLoaded();
    
    // 1ページ目の表示件数を確認
    await reportsPage.expectReportCount(20); // デフォルトは20件表示
    
    // 2ページ目に移動（ページネーション機能があることを確認）
    // 実際のページネーション操作は、UIの実装に応じて調整
  });

  test('日報作成時のバリデーション', async ({ page }) => {
    await login(page, 'REGULAR_USER');
    
    const reportFormPage = new ReportFormPage(page);
    
    await reportFormPage.goto();
    await reportFormPage.expectPageLoaded();
    
    // 必須項目が空のまま保存を試行
    await reportFormPage.save();
    
    // バリデーションエラーが表示されることを確認
    await reportFormPage.expectValidationError('problem');
    await reportFormPage.expectValidationError('plan');
    
    // 保存ボタンが無効化されることを確認
    await reportFormPage.expectSaveButtonDisabled();
  });

  test('文字数制限の確認', async ({ page }) => {
    await login(page, 'REGULAR_USER');
    
    const reportFormPage = new ReportFormPage(page);
    
    await reportFormPage.goto();
    await reportFormPage.expectPageLoaded();
    
    // 文字数制限を超える文字列を入力
    const { VALIDATION_TEST_DATA } = await import('./utils/test-data');
    
    await reportFormPage.fillProblem(VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.problem);
    await reportFormPage.fillPlan(VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.plan);
    
    // バリデーションエラーが表示されることを確認
    await reportFormPage.expectValidationError('problem', '1000文字以内');
    await reportFormPage.expectValidationError('plan', '1000文字以内');
  });
});