import { Page, expect, Locator } from '@playwright/test';

/**
 * 日報作成・編集画面のページオブジェクト
 */
export class ReportFormPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly reportDateField: Locator;
  readonly problemField: Locator;
  readonly planField: Locator;
  readonly addVisitButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly visitRecords: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("日報"), h1:has-text("作成"), h1:has-text("編集")');
    this.reportDateField = page.locator('input[name="reportDate"], input[type="date"]');
    this.problemField = page.locator('textarea[name="problem"]');
    this.planField = page.locator('textarea[name="plan"]');
    this.addVisitButton = page.locator('button:has-text("訪問記録を追加")');
    this.saveButton = page.locator('button:has-text("保存")');
    this.cancelButton = page.locator('button:has-text("キャンセル")');
    this.visitRecords = page.locator('[data-testid="visit-record"], .visit-record');
  }

  async goto(): Promise<void> {
    await this.page.goto('/reports/new');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoEdit(reportId: number): Promise<void> {
    await this.page.goto(`/reports/${reportId}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.problemField).toBeVisible();
    await expect(this.planField).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async fillProblem(problem: string): Promise<void> {
    await this.problemField.fill(problem);
  }

  async fillPlan(plan: string): Promise<void> {
    await this.planField.fill(plan);
  }

  async addVisitRecord(
    customerName: string,
    visitTime: string,
    visitContent: string
  ): Promise<void> {
    await this.addVisitButton.click();
    
    const visitRecord = this.visitRecords.last();
    const customerField = visitRecord.locator('select[name*="customer"], select:has(option)');
    const timeField = visitRecord.locator('input[name*="time"], input[type="time"]');
    const contentField = visitRecord.locator('textarea[name*="content"]');
    
    await customerField.selectOption({ label: customerName });
    await timeField.fill(visitTime);
    await contentField.fill(visitContent);
  }

  async removeVisitRecord(index: number): Promise<void> {
    const visitRecord = this.visitRecords.nth(index);
    const deleteButton = visitRecord.locator('button:has-text("削除")');
    await deleteButton.click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectValidationError(fieldName: string, message?: string): Promise<void> {
    const errorLocator = this.page.locator(
      `[data-testid="${fieldName}-error"], .field-error:near(input[name="${fieldName}"], textarea[name="${fieldName}"])`
    );
    await expect(errorLocator).toBeVisible();
    
    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  }

  async expectSaveButtonDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }

  async expectSaveSuccess(): Promise<void> {
    // 保存成功後は日報詳細画面または一覧画面に遷移する
    await expect(this.page).toHaveURL(/\/reports\/\d+|\/reports$/);
  }

  async expectVisitRecordCount(count: number): Promise<void> {
    await expect(this.visitRecords).toHaveCount(count);
  }

  async fillReportData(data: {
    problem: string;
    plan: string;
    visits: Array<{
      customerName: string;
      visitTime: string;
      visitContent: string;
    }>;
  }): Promise<void> {
    await this.fillProblem(data.problem);
    await this.fillPlan(data.plan);
    
    for (const visit of data.visits) {
      await this.addVisitRecord(visit.customerName, visit.visitTime, visit.visitContent);
    }
  }
}