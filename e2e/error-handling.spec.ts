import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { CustomersPage } from './pages/MasterManagementPage';
import { TEST_USERS, VALIDATION_TEST_DATA } from './utils/test-data';
import { login } from './utils/auth-helper';

test.describe('エラーハンドリング', () => {
  test.describe('バリデーションエラー', () => {
    test('ログインフォームのバリデーション', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      
      // 空の値でのログイン試行
      await loginPage.clickLogin();
      
      // バリデーションエラーが表示されることを確認
      await loginPage.expectValidationError('email');
      await loginPage.expectValidationError('password');
      
      // 無効なメールアドレス形式
      for (const invalidEmail of VALIDATION_TEST_DATA.INVALID_EMAIL_FORMATS) {
        await loginPage.fillEmail(invalidEmail);
        await loginPage.fillPassword('TestPassword123!');
        
        // バリデーションエラーまたはボタン無効化を確認
        try {
          await loginPage.expectValidationError('email');
        } catch {
          // バリデーションエラーが表示されない場合は、ボタンが無効化されていることを確認
          await loginPage.expectLoginButtonDisabled();
        }
      }
    });

    test('日報作成フォームのバリデーション', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      await reportFormPage.expectPageLoaded();
      
      // 必須項目が空のまま保存を試行
      await reportFormPage.save();
      
      // バリデーションエラーが表示されることを確認
      await reportFormPage.expectValidationError('problem');
      await reportFormPage.expectValidationError('plan');
      
      // 文字数制限を超える入力
      await reportFormPage.fillProblem(VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.problem);
      await reportFormPage.fillPlan(VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.plan);
      
      await reportFormPage.save();
      
      // 文字数制限エラーが表示されることを確認
      await reportFormPage.expectValidationError('problem', '1000文字以内');
      await reportFormPage.expectValidationError('plan', '1000文字以内');
    });

    test('訪問記録のバリデーション', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      // 基本項目を入力
      await reportFormPage.fillProblem('テスト課題');
      await reportFormPage.fillPlan('テスト計画');
      
      // 訪問記録を追加（顧客を選択せず、内容も空）
      await reportFormPage.addVisitRecord('', '', '');
      
      await reportFormPage.save();
      
      // 訪問記録のバリデーションエラーが表示されることを確認
      const customerError = page.locator('[data-testid="customer-error"], .customer-error');
      const contentError = page.locator('[data-testid="visitContent-error"], .visit-content-error');
      
      await expect(customerError.first()).toBeVisible();
      await expect(contentError.first()).toBeVisible();
      
      // 文字数制限を超える訪問内容
      await reportFormPage.addVisitRecord('ABC商事', '10:00', VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.visitContent);
      
      await reportFormPage.save();
      
      // 文字数制限エラーが表示されることを確認
      const longContentError = page.locator('text=500文字以内');
      await expect(longContentError.first()).toBeVisible();
    });

    test('コメント投稿のバリデーション', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      
      // 既存の日報詳細画面に移動
      await reportDetailPage.goto(1);
      await reportDetailPage.expectPageLoaded();
      
      // 空のコメントで投稿を試行
      await reportDetailPage.postComment('');
      
      // バリデーションエラーが表示されることを確認
      await reportDetailPage.expectCommentValidationError();
      
      // 文字数制限を超えるコメント
      await reportDetailPage.postComment(VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.comment);
      
      // 文字数制限エラーが表示されることを確認
      await reportDetailPage.expectCommentValidationError('500文字以内');
    });

    test('顧客マスタのバリデーション', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const customersPage = new CustomersPage(page);
      
      await customersPage.goto();
      await customersPage.clickNew();
      
      // 必須項目を空のまま保存を試行
      const saveButton = page.locator('button:has-text("保存"), button[type="submit"]');
      await saveButton.click();
      
      // バリデーションエラーが表示されることを確認
      const companyNameError = page.locator('[data-testid="companyName-error"], .field-error');
      const contactPersonError = page.locator('[data-testid="contactPerson-error"], .field-error');
      
      await expect(companyNameError.first()).toBeVisible();
      await expect(contactPersonError.first()).toBeVisible();
      
      // 無効なメールアドレス形式
      await page.locator('input[name="email"]').fill('invalid-email-format');
      await saveButton.click();
      
      const emailError = page.locator('[data-testid="email-error"], .email-error');
      await expect(emailError.first()).toBeVisible();
    });
  });

  test.describe('ネットワークエラー', () => {
    test('ログイン時のネットワークエラー', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      
      // ネットワークリクエストを失敗させる
      await page.route('/api/auth/login', (route) => {
        route.abort('connectionfailed');
      });
      
      const user = TEST_USERS.REGULAR_USER;
      await loginPage.login(user.email, user.password);
      
      // ネットワークエラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=接続エラー, text=ネットワークエラー, text=サーバーに接続できません');
      await expect(errorMessage.first()).toBeVisible();
    });

    test('日報保存時のネットワークエラー', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      // 日報データを入力
      await reportFormPage.fillProblem('テスト課題');
      await reportFormPage.fillPlan('テスト計画');
      
      // 保存APIを失敗させる
      await page.route('/api/reports', (route) => {
        route.abort('connectionfailed');
      });
      
      await reportFormPage.save();
      
      // エラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=保存に失敗, text=エラーが発生, text=ネットワークエラー');
      await expect(errorMessage.first()).toBeVisible();
    });

    test('コメント投稿時のネットワークエラー', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      
      await reportDetailPage.goto(1);
      await reportDetailPage.expectPageLoaded();
      
      // コメント投稿APIを失敗させる
      await page.route('/api/reports/*/comments', (route) => {
        route.abort('connectionfailed');
      });
      
      await reportDetailPage.postComment('テストコメント');
      
      // エラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=コメント投稿に失敗, text=エラーが発生');
      await expect(errorMessage.first()).toBeVisible();
    });

    test('データ取得時のネットワークエラー', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // 日報一覧APIを失敗させる
      await page.route('/api/reports*', (route) => {
        route.abort('connectionfailed');
      });
      
      await page.goto('/reports');
      
      // エラーメッセージまたはリトライボタンが表示されることを確認
      const errorMessage = page.locator('text=データの取得に失敗, text=エラーが発生, text=再試行');
      await expect(errorMessage.first()).toBeVisible();
    });
  });

  test.describe('サーバーエラー', () => {
    test('500エラーのハンドリング', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      
      // サーバーエラーを発生させる
      await page.route('/api/auth/login', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'INTERNAL_ERROR',
              message: 'サーバーエラーが発生しました',
            },
          }),
        });
      });
      
      const user = TEST_USERS.REGULAR_USER;
      await loginPage.login(user.email, user.password);
      
      // サーバーエラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=サーバーエラー, text=しばらく時間をおいて');
      await expect(errorMessage.first()).toBeVisible();
    });

    test('404エラーのハンドリング', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // 存在しない日報IDでアクセス
      const reportDetailPage = new ReportDetailPage(page);
      
      await page.route('/api/reports/99999', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'NOT_FOUND',
              message: 'リソースが見つかりません',
            },
          }),
        });
      });
      
      await reportDetailPage.goto(99999);
      
      // 404エラーページまたはメッセージが表示されることを確認
      const errorMessage = page.locator('text=見つかりません, text=存在しません, text=404');
      await expect(errorMessage.first()).toBeVisible();
    });

    test('401認証エラーのハンドリング', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // セッション切れをシミュレート
      await page.route('/api/reports*', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'UNAUTHORIZED',
              message: '認証が必要です',
            },
          }),
        });
      });
      
      await page.goto('/reports');
      
      // ログイン画面にリダイレクトされることを確認
      await expect(page).toHaveURL('/login');
    });

    test('403権限エラーのハンドリング', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // 権限エラーを発生させる
      await page.route('/api/customers*', (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'FORBIDDEN',
              message: 'この操作を行う権限がありません',
            },
          }),
        });
      });
      
      await page.goto('/customers');
      
      // 権限エラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=権限がありません, text=403, text=アクセスが拒否');
      await expect(errorMessage.first()).toBeVisible();
    });
  });

  test.describe('UIエラーケース', () => {
    test('必須フィールドの視覚的フィードバック', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      // 必須フィールドをフォーカス後、空のまま他の場所をクリック
      await reportFormPage.problemField.focus();
      await reportFormPage.planField.focus();
      
      // フィールドがエラー状態（赤枠など）になることを確認
      await expect(reportFormPage.problemField).toHaveClass(/error|invalid|border-red/);
    });

    test('フォーム送信中のローディング状態', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      await reportFormPage.fillProblem('テスト課題');
      await reportFormPage.fillPlan('テスト計画');
      
      // APIレスポンスを遅延させる
      await page.route('/api/reports', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.continue();
      });
      
      // 保存ボタンをクリック
      const saveButton = reportFormPage.saveButton;
      await saveButton.click();
      
      // ローディング状態（ボタン無効化、スピナー表示など）を確認
      await expect(saveButton).toBeDisabled();
      
      const loadingIndicator = page.locator('.loading, .spinner, text=保存中');
      await expect(loadingIndicator.first()).toBeVisible();
    });

    test('重複送信の防止', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      await reportFormPage.fillProblem('テスト課題');
      await reportFormPage.fillPlan('テスト計画');
      
      // APIレスポンスを遅延させる
      await page.route('/api/reports', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        route.continue();
      });
      
      // 保存ボタンを連続でクリック
      const saveButton = reportFormPage.saveButton;
      await Promise.all([
        saveButton.click(),
        saveButton.click(),
        saveButton.click(),
      ]);
      
      // 1回目のクリック後、ボタンが無効化されていることを確認
      await expect(saveButton).toBeDisabled();
    });

    test('セッション切れ時の適切な処理', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      await reportFormPage.fillProblem('長時間作業したテスト課題');
      await reportFormPage.fillPlan('長時間作業したテスト計画');
      
      // セッション切れをシミュレート
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
      });
      
      // 保存を試行
      await reportFormPage.save();
      
      // ログイン画面にリダイレクトまたは認証エラーメッセージが表示されることを確認
      const authError = page.locator('text=セッションが切れました, text=再ログインしてください');
      
      try {
        await expect(authError.first()).toBeVisible();
      } catch {
        // エラーメッセージが表示されない場合は、ログイン画面にリダイレクトされることを確認
        await expect(page).toHaveURL('/login');
      }
    });
  });

  test.describe('データ整合性エラー', () => {
    test('同時編集による競合エラー', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      
      await reportDetailPage.goto(1);
      await reportDetailPage.clickEdit();
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.fillProblem('更新されたテスト課題');
      
      // 別のユーザーが先に更新したことをシミュレート
      await page.route('/api/reports/1', (route) => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'CONFLICT',
              message: 'データが他のユーザーによって更新されています',
            },
          }),
        });
      });
      
      await reportFormPage.save();
      
      // 競合エラーメッセージが表示されることを確認
      const conflictMessage = page.locator('text=他のユーザー, text=更新されています, text=競合');
      await expect(conflictMessage.first()).toBeVisible();
    });

    test('重複データ作成エラー', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      
      await reportFormPage.goto();
      
      await reportFormPage.fillProblem('同じ日付の日報テスト');
      await reportFormPage.fillPlan('同じ日付の日報テスト計画');
      
      // 同一日付の日報がすでに存在することをシミュレート
      await page.route('/api/reports', (route) => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'DUPLICATE_REPORT',
              message: '同じ日付の日報が既に存在します',
            },
          }),
        });
      });
      
      await reportFormPage.save();
      
      // 重複エラーメッセージが表示されることを確認
      const duplicateMessage = page.locator('text=同じ日付の日報が既に存在, text=重複');
      await expect(duplicateMessage.first()).toBeVisible();
    });
  });
});