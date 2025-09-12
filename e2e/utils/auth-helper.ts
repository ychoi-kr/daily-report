import { Page, expect } from '@playwright/test';
import { TEST_USERS } from './test-data';

/**
 * 認証関連のヘルパー関数
 */

export async function login(
  page: Page,
  userType: keyof typeof TEST_USERS
): Promise<void> {
  const user = TEST_USERS[userType];
  
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // ログインフォームの要素を取得
  const emailField = page.locator('input[name="email"], input[type="email"]');
  const passwordField = page.locator('input[name="password"], input[type="password"]');
  const loginButton = page.locator('button[type="submit"], button:has-text("ログイン")');
  
  // ログイン情報を入力
  await emailField.fill(user.email);
  await passwordField.fill(user.password);
  
  // ログインボタンをクリック
  await loginButton.click();
  
  // ログイン成功を確認（ダッシュボードまたは日報一覧画面に遷移）
  await expect(page).toHaveURL(/\/(dashboard|reports)/);
  
  // ユーザー名が表示されることを確認
  await expect(page.locator('text=' + user.name).first()).toBeVisible();
}

export async function logout(page: Page): Promise<void> {
  // ログアウトボタンを探してクリック
  const logoutButton = page.locator('button:has-text("ログアウト")');
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
  
  // ログイン画面にリダイレクトされることを確認
  await expect(page).toHaveURL('/login');
}

export async function expectLoginRequired(page: Page): Promise<void> {
  // 認証が必要な場合、ログイン画面にリダイレクトされることを確認
  await expect(page).toHaveURL('/login');
}

export async function expectUnauthorized(page: Page): Promise<void> {
  // 権限エラーのメッセージまたは403エラーが表示されることを確認
  const errorMessage = page.locator('text=権限がありません, text=403, text=Forbidden');
  await expect(errorMessage.first()).toBeVisible();
}