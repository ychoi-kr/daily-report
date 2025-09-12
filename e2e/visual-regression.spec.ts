import { test, expect } from '@playwright/test';
import { login } from './utils/auth-helper';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { CustomersPage } from './pages/MasterManagementPage';

test.describe('ビジュアル回帰テスト', () => {
  test.describe('認証画面', () => {
    test('ログイン画面のスクリーンショット', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      
      // 完全なページスクリーンショット
      await expect(page).toHaveScreenshot('login-page.png');
      
      // エラー状態のスクリーンショット
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await expect(page).toHaveScreenshot('login-page-error.png');
    });
  });

  test.describe('ダッシュボード', () => {
    test('一般ユーザーダッシュボードのスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.expectPageLoaded();
      
      // ダッシュボード全体のスクリーンショット
      await expect(page).toHaveScreenshot('dashboard-regular-user.png');
      
      // 個別カードのスクリーンショット
      await expect(dashboardPage.reportsCard).toHaveScreenshot('dashboard-reports-card.png');
      await expect(dashboardPage.visitsCard).toHaveScreenshot('dashboard-visits-card.png');
    });

    test('管理者ダッシュボードのスクリーンショット', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.expectPageLoaded();
      
      // 管理者用ダッシュボードのスクリーンショット
      await expect(page).toHaveScreenshot('dashboard-manager.png');
    });
  });

  test.describe('日報機能', () => {
    test('日報一覧画面のスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      await reportsPage.expectPageLoaded();
      
      // 日報一覧のスクリーンショット
      await expect(page).toHaveScreenshot('reports-list.png');
      
      // 検索フォーム部分のスクリーンショット
      await expect(reportsPage.searchForm).toHaveScreenshot('reports-search-form.png');
      
      // テーブル部分のスクリーンショット
      await expect(reportsPage.reportTable).toHaveScreenshot('reports-table.png');
    });

    test('日報作成画面のスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      await reportFormPage.expectPageLoaded();
      
      // 空の日報作成フォームのスクリーンショット
      await expect(page).toHaveScreenshot('report-form-empty.png');
      
      // データ入力後のスクリーンショット
      await reportFormPage.fillProblem('テスト用の課題内容です。');
      await reportFormPage.fillPlan('テスト用の計画内容です。');
      await reportFormPage.addVisitRecord('ABC商事', '10:00', 'テスト訪問内容です。');
      
      await expect(page).toHaveScreenshot('report-form-filled.png');
      
      // バリデーションエラー状態のスクリーンショット
      await reportFormPage.goto();
      await reportFormPage.save();
      await expect(page).toHaveScreenshot('report-form-validation-error.png');
    });

    test('日報詳細画面のスクリーンショット', async ({ page }) => {
      // 事前に日報データが存在することを前提
      await login(page, 'REGULAR_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.goto(1);
      await reportDetailPage.expectPageLoaded();
      
      // 日報詳細のスクリーンショット
      await expect(page).toHaveScreenshot('report-detail.png');
      
      // 問題セクションのスクリーンショット
      await expect(reportDetailPage.problemSection).toHaveScreenshot('report-problem-section.png');
      
      // 訪問記録セクションのスクリーンショット
      await expect(reportDetailPage.visitRecordsSection).toHaveScreenshot('report-visits-section.png');
    });

    test('コメント機能のスクリーンショット', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.goto(1);
      await reportDetailPage.expectPageLoaded();
      
      // コメントフォームのスクリーンショット
      await expect(reportDetailPage.commentForm).toHaveScreenshot('comment-form.png');
      
      // コメント投稿後のスクリーンショット
      await reportDetailPage.postComment('テストコメントです。');
      await expect(reportDetailPage.commentsSection).toHaveScreenshot('comments-section-with-comment.png');
    });
  });

  test.describe('マスタ管理', () => {
    test('顧客マスタ一覧のスクリーンショット', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const customersPage = new CustomersPage(page);
      await customersPage.goto();
      await customersPage.expectPageLoaded();
      
      // 顧客マスタ一覧のスクリーンショット
      await expect(page).toHaveScreenshot('customers-list.png');
      
      // 新規登録ボタンクリック後のモーダル/フォームのスクリーンショット
      await customersPage.clickNew();
      await expect(page).toHaveScreenshot('customer-new-form.png');
    });
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイル表示のスクリーンショット', async ({ page }) => {
      // モバイルビューポートに設定
      await page.setViewportSize({ width: 375, height: 812 });
      
      await login(page, 'REGULAR_USER');
      
      // ダッシュボードのモバイル表示
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(page).toHaveScreenshot('dashboard-mobile.png');
      
      // 日報一覧のモバイル表示
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      await expect(page).toHaveScreenshot('reports-list-mobile.png');
      
      // 日報作成フォームのモバイル表示
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      await expect(page).toHaveScreenshot('report-form-mobile.png');
    });

    test('タブレット表示のスクリーンショット', async ({ page }) => {
      // タブレットビューポートに設定
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(page).toHaveScreenshot('dashboard-tablet.png');
    });
  });

  test.describe('テーマとダークモード', () => {
    test('ライトテーマのスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // ライトテーマに設定
      await page.evaluate(() => {
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(page).toHaveScreenshot('dashboard-light-theme.png');
    });

    test('ダークテーマのスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // ダークテーマに設定
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      });
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(page).toHaveScreenshot('dashboard-dark-theme.png');
    });
  });

  test.describe('エラー状態のスクリーンショット', () => {
    test('ネットワークエラー表示のスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // APIリクエストを失敗させる
      await page.route('/api/reports*', (route) => {
        route.abort('connectionfailed');
      });
      
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      
      // エラー表示のスクリーンショット
      await expect(page).toHaveScreenshot('network-error-state.png');
    });

    test('バリデーションエラー表示のスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      
      // バリデーションエラーを発生させる
      await reportFormPage.save();
      
      // バリデーションエラー表示のスクリーンショット
      await expect(page).toHaveScreenshot('validation-error-state.png');
    });

    test('権限エラー表示のスクリーンショット', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // 権限のないページにアクセス
      await page.goto('/customers');
      
      // 権限エラー表示のスクリーンショット
      await expect(page).toHaveScreenshot('authorization-error-state.png');
    });
  });

  test.describe('ローディング状態のスクリーンショット', () => {
    test('フォーム送信中のローディング状態', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      
      await reportFormPage.fillProblem('テスト課題');
      await reportFormPage.fillPlan('テスト計画');
      
      // APIレスポンスを遅延させる
      await page.route('/api/reports', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        route.continue();
      });
      
      // 送信ボタンをクリック
      await reportFormPage.saveButton.click();
      
      // ローディング状態のスクリーンショット
      await expect(page).toHaveScreenshot('form-loading-state.png');
    });

    test('データ読み込み中のローディング状態', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // APIレスポンスを遅延させる
      await page.route('/api/reports*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.continue();
      });
      
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      
      // ローディング状態のスクリーンショット
      await expect(page).toHaveScreenshot('data-loading-state.png');
    });
  });
});