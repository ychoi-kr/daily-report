import { Page, expect, Locator } from '@playwright/test';

/**
 * 日報一覧画面のページオブジェクト
 */
export class ReportsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newReportButton: Locator;
  readonly searchForm: Locator;
  readonly startDateField: Locator;
  readonly endDateField: Locator;
  readonly salesPersonField: Locator;
  readonly searchButton: Locator;
  readonly reportTable: Locator;
  readonly reportRows: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("日報一覧")');
    this.newReportButton = page.locator('button:has-text("新規日報作成")');
    this.searchForm = page.locator('form, [data-testid="search-form"]');
    this.startDateField = page.locator('input[name="startDate"], input[type="date"]:first');
    this.endDateField = page.locator('input[name="endDate"], input[type="date"]:last');
    this.salesPersonField = page.locator('select[name="salesPersonId"]');
    this.searchButton = page.locator('button:has-text("検索")');
    this.reportTable = page.locator('table, [data-testid="report-table"]');
    this.reportRows = page.locator('tbody tr, [data-testid="report-row"]');
    this.pagination = page.locator('[data-testid="pagination"], .pagination');
  }

  async goto(): Promise<void> {
    await this.page.goto('/reports');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.newReportButton).toBeVisible();
    await expect(this.reportTable).toBeVisible();
  }

  async clickNewReport(): Promise<void> {
    await this.newReportButton.click();
    await expect(this.page).toHaveURL('/reports/new');
  }

  async searchByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.startDateField.fill(startDate);
    await this.endDateField.fill(endDate);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchBySalesPerson(salesPersonId: string): Promise<void> {
    await this.salesPersonField.selectOption(salesPersonId);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickReportDetail(reportDate: string): Promise<void> {
    const detailLink = this.page.locator(`tr:has-text("${reportDate}") button:has-text("詳細")`);
    await detailLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectReportInList(reportDate: string, salesPersonName: string): Promise<void> {
    const reportRow = this.page.locator(`tr:has-text("${reportDate}"):has-text("${salesPersonName}")`);
    await expect(reportRow).toBeVisible();
  }

  async expectNoReports(): Promise<void> {
    const noDataMessage = this.page.locator('text=データがありません, text=日報が見つかりません');
    await expect(noDataMessage).toBeVisible();
  }

  async expectReportCount(count: number): Promise<void> {
    await expect(this.reportRows).toHaveCount(count);
  }

  async expectManagerColumnsVisible(): Promise<void> {
    // 管理者の場合、営業担当者の列が表示される
    await expect(this.page.locator('th:has-text("営業担当")')).toBeVisible();
  }

  async expectManagerColumnsNotVisible(): Promise<void> {
    // 一般ユーザーの場合、営業担当者の列は表示されない
    await expect(this.page.locator('th:has-text("営業担当")')).toBeHidden();
  }
}