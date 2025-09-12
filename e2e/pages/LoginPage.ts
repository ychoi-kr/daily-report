import { Page, expect, Locator } from '@playwright/test';

/**
 * ログイン画面のページオブジェクト
 */
export class LoginPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailField = page.locator('input[name="email"], input[type="email"]');
    this.passwordField = page.locator('input[name="password"], input[type="password"]');
    this.loginButton = page.locator('button[type="submit"], button:has-text("ログイン")');
    this.errorMessage = page.locator('[role="alert"], .error-message, text=エラー');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailField.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordField.fill(password);
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async expectErrorMessage(message?: string): Promise<void> {
    await expect(this.errorMessage.first()).toBeVisible();
    if (message) {
      await expect(this.page.locator(`text=${message}`)).toBeVisible();
    }
  }

  async expectLoginButtonDisabled(): Promise<void> {
    await expect(this.loginButton).toBeDisabled();
  }

  async expectValidationError(fieldName: string): Promise<void> {
    const validationError = this.page.locator(
      `[data-testid="${fieldName}-error"], .field-error:near(input[name="${fieldName}"])`
    );
    await expect(validationError).toBeVisible();
  }
}