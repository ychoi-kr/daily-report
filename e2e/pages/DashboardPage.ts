import { Page, expect, Locator } from '@playwright/test';

/**
 * ダッシュボード画面のページオブジェクト
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly userName: Locator;
  readonly logoutButton: Locator;
  readonly reportsCard: Locator;
  readonly visitsCard: Locator;
  readonly commentsCard: Locator;
  readonly scheduleCard: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, [data-testid="page-title"]');
    this.userName = page.locator('[data-testid="user-name"], .user-info');
    this.logoutButton = page.locator('button:has-text("ログアウト")');
    this.reportsCard = page.locator('text=今月の日報数').locator('..');
    this.visitsCard = page.locator('text=今月の訪問件数').locator('..');
    this.commentsCard = page.locator('text=未読コメント').locator('..');
    this.scheduleCard = page.locator('text=今週の予定').locator('..');
    this.navigationMenu = page.locator('nav, [data-testid="navigation"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toContainText('ダッシュボード');
    await expect(this.reportsCard).toBeVisible();
    await expect(this.visitsCard).toBeVisible();
  }

  async expectUserName(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  async navigateToReports(): Promise<void> {
    const reportsLink = this.page.locator('a[href="/reports"], button:has-text("日報")');
    await reportsLink.click();
    await expect(this.page).toHaveURL('/reports');
  }

  async navigateToCustomers(): Promise<void> {
    const customersLink = this.page.locator('a[href="/customers"], button:has-text("顧客")');
    await customersLink.click();
    await expect(this.page).toHaveURL('/customers');
  }

  async navigateToSalesPersons(): Promise<void> {
    const salesPersonsLink = this.page.locator('a[href="/sales-persons"], button:has-text("営業担当")');
    await salesPersonsLink.click();
    await expect(this.page).toHaveURL('/sales-persons');
  }

  async expectManagerMenuVisible(): Promise<void> {
    await expect(this.page.locator('text=営業担当者管理, text=顧客管理')).toBeVisible();
  }

  async expectManagerMenuNotVisible(): Promise<void> {
    await expect(this.page.locator('text=営業担当者管理, text=顧客管理')).toBeHidden();
  }
}