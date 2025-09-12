import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { CustomersPage, SalesPersonsPage } from './pages/MasterManagementPage';
import { TEST_USERS } from './utils/test-data';
import { login, expectUnauthorized } from './utils/auth-helper';

test.describe('権限制御テスト', () => {
  test.describe('一般ユーザーの権限', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'REGULAR_USER');
    });

    test('ダッシュボード - 一般ユーザー表示確認', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      await dashboardPage.goto();
      await dashboardPage.expectPageLoaded();
      
      const user = TEST_USERS.REGULAR_USER;
      await dashboardPage.expectUserName(user.name);
      
      // 管理者メニューが表示されないことを確認
      await dashboardPage.expectManagerMenuNotVisible();
    });

    test('日報一覧 - 自分の日報のみ表示', async ({ page }) => {
      const reportsPage = new ReportsPage(page);
      
      await reportsPage.goto();
      await reportsPage.expectPageLoaded();
      
      // 営業担当者選択フィールドが表示されないことを確認（一般ユーザーは自分の分のみ）
      await reportsPage.expectManagerColumnsNotVisible();
    });

    test('日報作成 - 正常に作成可能', async ({ page }) => {
      const reportsPage = new ReportsPage(page);
      const reportFormPage = new ReportFormPage(page);
      
      await reportsPage.goto();
      await reportsPage.clickNewReport();
      
      await reportFormPage.expectPageLoaded();
      
      // 日報作成フォームが正常に表示されることを確認
      await reportFormPage.fillProblem('一般ユーザーの課題テスト');
      await reportFormPage.fillPlan('一般ユーザーの計画テスト');
      
      await reportFormPage.save();
      await reportFormPage.expectSaveSuccess();
    });

    test('自分の日報詳細 - 編集ボタンが表示される', async ({ page }) => {
      const reportDetailPage = new ReportDetailPage(page);
      
      // 自分が作成した日報のIDを指定（実際の実装では動的に取得）
      const myReportId = 1;
      
      await reportDetailPage.goto(myReportId);
      await reportDetailPage.expectPageLoaded();
      
      // 編集ボタンが表示されることを確認
      await reportDetailPage.expectEditButtonVisible();
      
      // コメントフォームは表示されないことを確認（一般ユーザー）
      await reportDetailPage.expectCommentFormNotVisible();
    });

    test('他人の日報詳細 - 編集ボタンが表示されない', async ({ page }) => {
      const reportDetailPage = new ReportDetailPage(page);
      
      // 他の人が作成した日報のIDを指定
      const othersReportId = 2;
      
      await reportDetailPage.goto(othersReportId);
      await reportDetailPage.expectPageLoaded();
      
      // 編集ボタンが表示されないことを確認
      await reportDetailPage.expectEditButtonNotVisible();
      
      // コメントフォームは表示されないことを確認
      await reportDetailPage.expectCommentFormNotVisible();
    });

    test('マスタ管理へのアクセス制限 - 顧客マスタ', async ({ page }) => {
      // 顧客マスタ管理画面に直接アクセス
      await page.goto('/customers');
      
      // アクセス拒否または権限エラーページが表示されることを確認
      await expectUnauthorized(page);
    });

    test('マスタ管理へのアクセス制限 - 営業担当者マスタ', async ({ page }) => {
      // 営業担当者マスタ管理画面に直接アクセス
      await page.goto('/sales-persons');
      
      // アクセス拒否または権限エラーページが表示されることを確認
      await expectUnauthorized(page);
    });

    test('ナビゲーションメニュー - 管理者限定メニューが非表示', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      await dashboardPage.goto();
      
      // マスタ管理関連のナビゲーションリンクが表示されないことを確認
      const customerManagementLink = page.locator('a[href="/customers"], text=顧客管理');
      const salesPersonManagementLink = page.locator('a[href="/sales-persons"], text=営業担当者管理');
      
      await expect(customerManagementLink).not.toBeVisible();
      await expect(salesPersonManagementLink).not.toBeVisible();
    });
  });

  test.describe('管理者の権限', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'MANAGER_USER');
    });

    test('ダッシュボード - 管理者表示確認', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      await dashboardPage.goto();
      await dashboardPage.expectPageLoaded();
      
      const user = TEST_USERS.MANAGER_USER;
      await dashboardPage.expectUserName(user.name);
      
      // 管理者メニューが表示されることを確認
      await dashboardPage.expectManagerMenuVisible();
    });

    test('日報一覧 - 全ての日報を表示可能', async ({ page }) => {
      const reportsPage = new ReportsPage(page);
      
      await reportsPage.goto();
      await reportsPage.expectPageLoaded();
      
      // 営業担当者選択フィールドが表示されることを確認（管理者は全員の分を閲覧可能）
      await reportsPage.expectManagerColumnsVisible();
    });

    test('他人の日報詳細 - コメント投稿が可能', async ({ page }) => {
      const reportDetailPage = new ReportDetailPage(page);
      
      // 他の人が作成した日報のIDを指定
      const othersReportId = 1;
      
      await reportDetailPage.goto(othersReportId);
      await reportDetailPage.expectPageLoaded();
      
      // 編集ボタンは表示されない（作成者ではないため）
      await reportDetailPage.expectEditButtonNotVisible();
      
      // コメントフォームが表示されることを確認（管理者）
      await reportDetailPage.expectCommentFormVisible();
      
      // コメントを投稿
      const commentText = '管理者からのテストコメントです。';
      await reportDetailPage.postComment(commentText);
      
      // 投稿されたコメントが表示されることを確認
      const manager = TEST_USERS.MANAGER_USER;
      await reportDetailPage.expectComment(manager.name, commentText);
    });

    test('自分の日報詳細 - 編集とコメントの両方が可能', async ({ page }) => {
      const reportDetailPage = new ReportDetailPage(page);
      
      // 管理者自身が作成した日報のIDを指定
      const myReportId = 3;
      
      await reportDetailPage.goto(myReportId);
      await reportDetailPage.expectPageLoaded();
      
      // 編集ボタンが表示されることを確認（作成者のため）
      await reportDetailPage.expectEditButtonVisible();
      
      // コメントフォームも表示されることを確認（管理者のため）
      await reportDetailPage.expectCommentFormVisible();
    });

    test('顧客マスタ管理アクセス', async ({ page }) => {
      const customersPage = new CustomersPage(page);
      
      await customersPage.goto();
      await customersPage.expectPageLoaded();
      
      // ページが正常に表示されることを確認
      await expect(page).toHaveURL('/customers');
    });

    test('営業担当者マスタ管理アクセス', async ({ page }) => {
      const salesPersonsPage = new SalesPersonsPage(page);
      
      await salesPersonsPage.goto();
      await salesPersonsPage.expectPageLoaded();
      
      // ページが正常に表示されることを確認
      await expect(page).toHaveURL('/sales-persons');
    });

    test('日報の営業担当者絞り込み検索', async ({ page }) => {
      const reportsPage = new ReportsPage(page);
      
      await reportsPage.goto();
      await reportsPage.expectPageLoaded();
      
      // 特定の営業担当者で絞り込み
      await reportsPage.searchBySalesPerson('1'); // 営業担当者ID
      
      // 検索結果が表示されることを確認
      await expect(page.locator('tbody tr')).toHaveCount({ min: 1 });
    });

    test('ナビゲーションメニュー - 全てのメニューが表示', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      await dashboardPage.goto();
      
      // マスタ管理関連のナビゲーションリンクが表示されることを確認
      const customerManagementLink = page.locator('a[href="/customers"], text=顧客管理');
      const salesPersonManagementLink = page.locator('a[href="/sales-persons"], text=営業担当者管理');
      
      await expect(customerManagementLink).toBeVisible();
      await expect(salesPersonManagementLink).toBeVisible();
      
      // ナビゲーションリンクをクリックして実際に画面遷移することを確認
      await dashboardPage.navigateToCustomers();
      await expect(page).toHaveURL('/customers');
      
      await dashboardPage.navigateToSalesPersons();
      await expect(page).toHaveURL('/sales-persons');
    });
  });

  test.describe('権限エラーシナリオ', () => {
    test('未ログインユーザーの保護されたページアクセス', async ({ page }) => {
      // ログインせずに各ページに直接アクセス
      const protectedUrls = [
        '/dashboard',
        '/reports',
        '/reports/new',
        '/reports/1',
        '/customers',
        '/sales-persons',
      ];
      
      for (const url of protectedUrls) {
        await page.goto(url);
        
        // ログイン画面にリダイレクトされることを確認
        await expect(page).toHaveURL('/login');
      }
    });

    test('無効なトークンでのアクセス', async ({ page }) => {
      // 無効なトークンをローカルストレージに設定
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'invalid-token-12345');
      });
      
      await page.goto('/dashboard');
      
      // ログイン画面にリダイレクトされるか、エラーページが表示されることを確認
      await expect(page).toHaveURL('/login');
    });

    test('期限切れトークンでのアクセス', async ({ page }) => {
      // 期限切れのトークンをローカルストレージに設定（実際の実装に応じて調整）
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'expired-token-12345');
      });
      
      await page.goto('/dashboard');
      
      // ログイン画面にリダイレクトされることを確認
      await expect(page).toHaveURL('/login');
    });

    test('権限不足時の適切なエラー表示', async ({ page }) => {
      // 一般ユーザーでログイン
      await login(page, 'REGULAR_USER');
      
      // 権限のないページに直接アクセス
      await page.goto('/customers');
      
      // 適切なエラーメッセージまたは権限エラーページが表示されることを確認
      await expectUnauthorized(page);
    });

    test('セッションタイムアウト後のアクセス', async ({ page }) => {
      // ログイン
      await login(page, 'REGULAR_USER');
      
      // セッションを無効化（実際の実装では、サーバーサイドでセッションを削除）
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
      });
      
      // ページをリロード
      await page.reload();
      
      // ログイン画面にリダイレクトされることを確認
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('クロスユーザーアクセステスト', () => {
    test('ユーザーAで作成した日報をユーザーBが編集しようとする', async ({ page }) => {
      // ユーザーAで日報を作成（実際の実装では事前にAPIで作成）
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      await reportFormPage.fillProblem('ユーザーAの日報');
      await reportFormPage.fillPlan('ユーザーAの計画');
      await reportFormPage.save();
      
      // 作成された日報のIDを取得（実際の実装では動的に取得）
      const reportId = 1;
      
      // ログアウトして別のユーザーでログイン（異なる一般ユーザー）
      await page.goto('/login');
      
      // 別のユーザーでログイン（テストデータに別ユーザーが必要）
      // 実際の実装では、TEST_USERSに複数の一般ユーザーを定義する
      
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.goto(reportId);
      
      // 編集ボタンが表示されないことを確認
      await reportDetailPage.expectEditButtonNotVisible();
      
      // 編集ページに直接アクセスしてもエラーになることを確認
      await page.goto(`/reports/${reportId}/edit`);
      await expectUnauthorized(page);
    });
  });
});