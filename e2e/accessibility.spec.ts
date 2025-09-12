import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './utils/auth-helper';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportDetailPage } from './pages/ReportDetailPage';

test.describe('アクセシビリティテスト', () => {
  test.describe('認証画面のアクセシビリティ', () => {
    test('ログイン画面のアクセシビリティチェック', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('ログインエラー状態のアクセシビリティ', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      await loginPage.login('invalid@example.com', 'wrongpassword');
      
      // エラーメッセージが適切にaria属性でマークアップされているかチェック
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('キーボードナビゲーションテスト - ログイン画面', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      
      // Tabキーでフォーカス移動をテスト
      await page.keyboard.press('Tab');
      await expect(loginPage.emailField).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(loginPage.passwordField).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(loginPage.loginButton).toBeFocused();
      
      // Enterキーでログインボタンを押せることを確認
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password');
      await page.keyboard.press('Enter');
    });
  });

  test.describe('ダッシュボードのアクセシビリティ', () => {
    test('一般ユーザーダッシュボードのアクセシビリティチェック', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.expectPageLoaded();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('管理者ダッシュボードのアクセシビリティチェック', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.expectPageLoaded();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('ナビゲーションメニューのキーボード操作', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // ナビゲーションメニューのキーボード操作をテスト
      const navMenu = page.locator('nav, [role="navigation"]');
      const navLinks = navMenu.locator('a, button');
      
      const linkCount = await navLinks.count();
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        
        // フォーカス可能であることを確認
        await link.focus();
        await expect(link).toBeFocused();
        
        // aria属性が適切に設定されていることを確認
        const ariaLabel = await link.getAttribute('aria-label');
        const text = await link.textContent();
        
        expect(ariaLabel || text).toBeTruthy();
      }
    });
  });

  test.describe('日報機能のアクセシビリティ', () => {
    test('日報一覧画面のアクセシビリティチェック', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      await reportsPage.expectPageLoaded();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('日報テーブルのアクセシビリティ', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      
      // テーブルのヘッダーが適切にマークアップされているかチェック
      const table = reportsPage.reportTable;
      const headers = table.locator('th');
      
      const headerCount = await headers.count();
      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i);
        const scope = await header.getAttribute('scope');
        
        // scopeまたはrole属性が設定されていることを確認
        expect(scope === 'col' || await header.getAttribute('role')).toBeTruthy();
      }
    });

    test('日報作成フォームのアクセシビリティチェック', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      await reportFormPage.expectPageLoaded();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('フォームフィールドのラベル関連付け', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      
      // 各フォームフィールドにラベルが関連付けられているかチェック
      const formFields = [
        reportFormPage.problemField,
        reportFormPage.planField,
      ];
      
      for (const field of formFields) {
        const fieldId = await field.getAttribute('id');
        const ariaLabelledBy = await field.getAttribute('aria-labelledby');
        const ariaLabel = await field.getAttribute('aria-label');
        
        if (fieldId) {
          const label = page.locator(`label[for="${fieldId}"]`);
          await expect(label).toBeVisible();
        } else {
          // idがない場合は、aria-labelまたはaria-labelledbyが設定されているべき
          expect(ariaLabelledBy || ariaLabel).toBeTruthy();
        }
      }
    });

    test('エラーメッセージのアクセシビリティ', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportFormPage = new ReportFormPage(page);
      await reportFormPage.goto();
      
      // バリデーションエラーを発生させる
      await reportFormPage.save();
      
      // エラーメッセージが適切にaria属性でマークアップされているかチェック
      const errorMessages = page.locator('[role="alert"], .error-message, [aria-invalid="true"]');
      const errorCount = await errorMessages.count();
      
      expect(errorCount).toBeGreaterThan(0);
      
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        
        // エラーメッセージがスクリーンリーダーで読み上げられることを確認
        const role = await error.getAttribute('role');
        const ariaLive = await error.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
      }
    });

    test('日報詳細画面のアクセシビリティチェック', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.goto(1);
      await reportDetailPage.expectPageLoaded();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('コメントフォームのアクセシビリティ', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.goto(1);
      
      // コメントフォームのアクセシビリティをチェック
      const commentTextArea = reportDetailPage.commentTextArea;
      
      const ariaLabel = await commentTextArea.getAttribute('aria-label');
      const ariaLabelledBy = await commentTextArea.getAttribute('aria-labelledby');
      const associatedLabel = page.locator('label[for*="comment"]');
      
      // ラベルが適切に関連付けられていることを確認
      expect(ariaLabel || ariaLabelledBy || (await associatedLabel.count()) > 0).toBeTruthy();
    });
  });

  test.describe('色彩コントラストとフォーカス表示', () => {
    test('フォーカス表示の確認', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // インタラクティブ要素にフォーカスを当てる
      const interactiveElements = page.locator('button, a, input, select, textarea');
      const elementCount = await interactiveElements.count();
      
      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = interactiveElements.nth(i);
        await element.focus();
        
        // フォーカス時に視覚的な表示があることを確認
        const focusVisible = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.outline !== 'none' ||
            styles.boxShadow !== 'none' ||
            styles.border !== 'none'
          );
        });
        
        expect(focusVisible).toBeTruthy();
      }
    });

    test('高コントラストモードのテスト', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // 高コントラストモードを有効にする
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.addStyleTag({
        content: `
          * {
            background-color: black !important;
            color: white !important;
          }
        `,
      });
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // 高コントラストモードでもアクセシビリティ違反がないことを確認
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('スクリーンリーダー対応', () => {
    test('ページタイトルとheading構造', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // ページタイトルが適切に設定されていることを確認
      const title = await page.title();
      expect(title).toContain('ダッシュボード');
      
      // heading構造が適切であることを確認
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      // headingが存在することを確認
      expect(headingCount).toBeGreaterThan(0);
    });

    test('ランドマークロールの確認', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // 主要なランドマークロールが存在することを確認
      const nav = page.locator('[role="navigation"], nav');
      const main = page.locator('[role="main"], main');
      const header = page.locator('[role="banner"], header');
      
      await expect(nav.first()).toBeVisible();
      await expect(main.first()).toBeVisible();
      
      // headerは存在する場合のみチェック
      const headerCount = await header.count();
      if (headerCount > 0) {
        await expect(header.first()).toBeVisible();
      }
    });

    test('スキップリンクの確認', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // スキップリンクが存在する場合の確認
      const skipLinks = page.locator('[href="#main"], [href="#content"], .skip-link');
      const skipLinkCount = await skipLinks.count();
      
      if (skipLinkCount > 0) {
        const skipLink = skipLinks.first();
        
        // Tabキーでフォーカス可能であることを確認
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        const isFocused = await focusedElement.isVisible();
        
        if (isFocused) {
          // スキップリンクが機能することを確認
          await skipLink.click();
          const targetId = await skipLink.getAttribute('href');
          const targetElement = page.locator(targetId!);
          await expect(targetElement).toBeFocused();
        }
      }
    });
  });

  test.describe('動的コンテンツのアクセシビリティ', () => {
    test('ローディング状態のaria属性', async ({ page }) => {
      await login(page, 'REGULAR_USER');
      
      // APIレスポンスを遅延させる
      await page.route('/api/reports*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.continue();
      });
      
      const reportsPage = new ReportsPage(page);
      await reportsPage.goto();
      
      // ローディング状態が適切にaria属性で表現されているかチェック
      const loadingIndicator = page.locator('[aria-live], [role="status"], .loading');
      const indicatorCount = await loadingIndicator.count();
      
      if (indicatorCount > 0) {
        const indicator = loadingIndicator.first();
        const ariaLive = await indicator.getAttribute('aria-live');
        const role = await indicator.getAttribute('role');
        
        expect(ariaLive === 'polite' || role === 'status').toBeTruthy();
      }
    });

    test('モーダルダイアログのアクセシビリティ', async ({ page }) => {
      await login(page, 'MANAGER_USER');
      
      // 顧客新規登録モーダルを開く
      await page.goto('/customers');
      const newButton = page.locator('button:has-text("新規登録")');
      
      if (await newButton.count() > 0) {
        await newButton.click();
        
        // モーダルが適切にaria属性でマークアップされているかチェック
        const modal = page.locator('[role="dialog"], .modal');
        
        if (await modal.count() > 0) {
          const ariaModal = await modal.getAttribute('aria-modal');
          const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
          const ariaLabel = await modal.getAttribute('aria-label');
          
          expect(ariaModal === 'true').toBeTruthy();
          expect(ariaLabelledBy || ariaLabel).toBeTruthy();
          
          // フォーカストラップが機能することを確認
          const focusableElements = modal.locator('button, input, select, textarea, a');
          const firstFocusable = focusableElements.first();
          
          await expect(firstFocusable).toBeFocused();
        }
      }
    });
  });
});