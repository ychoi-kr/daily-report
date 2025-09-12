import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TEST_USERS, VALIDATION_TEST_DATA } from './utils/test-data';

test.describe('認証機能', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('正常ログイン（一般ユーザー）', async ({ page }) => {
    await loginPage.goto();
    
    const user = TEST_USERS.REGULAR_USER;
    await loginPage.login(user.email, user.password);
    
    // ダッシュボードまたは日報一覧画面に遷移することを確認
    await expect(page).toHaveURL(/\/(dashboard|reports)/);
    await dashboardPage.expectUserName(user.name);
  });

  test('正常ログイン（管理者）', async ({ page }) => {
    await loginPage.goto();
    
    const user = TEST_USERS.MANAGER_USER;
    await loginPage.login(user.email, user.password);
    
    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL(/\/(dashboard|reports)/);
    await dashboardPage.expectUserName(user.name);
  });

  test('ログイン失敗 - 無効なメールアドレス', async () => {
    await loginPage.goto();
    
    const invalidUser = TEST_USERS.INVALID_USER;
    await loginPage.login(invalidUser.email, invalidUser.password);
    
    // エラーメッセージが表示されることを確認
    await loginPage.expectErrorMessage();
    
    // ログイン画面に留まることを確認
    await expect(loginPage.page).toHaveURL('/login');
  });

  test('ログイン失敗 - 無効なパスワード', async () => {
    await loginPage.goto();
    
    const user = TEST_USERS.REGULAR_USER;
    await loginPage.login(user.email, 'WrongPassword123!');
    
    // エラーメッセージが表示されることを確認
    await loginPage.expectErrorMessage();
    
    // ログイン画面に留まることを確認
    await expect(loginPage.page).toHaveURL('/login');
  });

  test('バリデーションエラー - 空のフィールド', async () => {
    await loginPage.goto();
    
    // 空のまま送信を試行
    await loginPage.clickLogin();
    
    // バリデーションエラーが表示されることを確認
    await loginPage.expectValidationError('email');
    await loginPage.expectValidationError('password');
  });

  test('バリデーションエラー - 無効なメールアドレス形式', async () => {
    await loginPage.goto();
    
    for (const invalidEmail of VALIDATION_TEST_DATA.INVALID_EMAIL_FORMATS) {
      await loginPage.fillEmail(invalidEmail);
      await loginPage.fillPassword('Test1234!');
      
      // ログインボタンが無効になることを確認
      await loginPage.expectLoginButtonDisabled();
      
      // または、バリデーションエラーが表示されることを確認
      await loginPage.expectValidationError('email');
    }
  });

  test('ログアウト機能', async ({ page }) => {
    // まずログインする
    await loginPage.goto();
    const user = TEST_USERS.REGULAR_USER;
    await loginPage.login(user.email, user.password);
    
    // ダッシュボードに遷移後、ログアウト
    await dashboardPage.clickLogout();
    
    // ログイン画面にリダイレクトされることを確認
    await expect(page).toHaveURL('/login');
  });

  test('認証が必要な画面への直接アクセス', async ({ page }) => {
    // ログインせずに日報画面にアクセス
    await page.goto('/reports');
    
    // ログイン画面にリダイレクトされることを確認
    await expect(page).toHaveURL('/login');
  });

  test('セッション維持確認', async ({ page }) => {
    // ログイン
    await loginPage.goto();
    const user = TEST_USERS.REGULAR_USER;
    await loginPage.login(user.email, user.password);
    
    // ページをリロード
    await page.reload();
    
    // ログイン状態が維持されていることを確認
    await expect(page).toHaveURL(/\/(dashboard|reports)/);
    await dashboardPage.expectUserName(user.name);
  });
});