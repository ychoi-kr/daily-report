import { Page, expect, Locator } from '@playwright/test';

/**
 * 日報詳細画面のページオブジェクト
 */
export class ReportDetailPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly reportDate: Locator;
  readonly salesPersonName: Locator;
  readonly editButton: Locator;
  readonly problemSection: Locator;
  readonly planSection: Locator;
  readonly visitRecordsSection: Locator;
  readonly commentsSection: Locator;
  readonly commentForm: Locator;
  readonly commentTextArea: Locator;
  readonly postCommentButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("日報詳細")');
    this.reportDate = page.locator('[data-testid="report-date"], .report-date');
    this.salesPersonName = page.locator('[data-testid="sales-person"], .sales-person');
    this.editButton = page.locator('button:has-text("編集")');
    this.problemSection = page.locator('[data-testid="problem-section"], section:has-text("課題")');
    this.planSection = page.locator('[data-testid="plan-section"], section:has-text("計画")');
    this.visitRecordsSection = page.locator('[data-testid="visit-records"], section:has-text("訪問記録")');
    this.commentsSection = page.locator('[data-testid="comments"], section:has-text("コメント")');
    this.commentForm = page.locator('[data-testid="comment-form"], .comment-form');
    this.commentTextArea = page.locator('textarea[name="comment"]');
    this.postCommentButton = page.locator('button:has-text("投稿")');
    this.backButton = page.locator('button:has-text("戻る")');
  }

  async goto(reportId: number): Promise<void> {
    await this.page.goto(`/reports/${reportId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.problemSection).toBeVisible();
    await expect(this.planSection).toBeVisible();
  }

  async expectReportData(data: {
    reportDate: string;
    salesPersonName: string;
    problem: string;
    plan: string;
  }): Promise<void> {
    await expect(this.reportDate).toContainText(data.reportDate);
    await expect(this.salesPersonName).toContainText(data.salesPersonName);
    await expect(this.problemSection).toContainText(data.problem);
    await expect(this.planSection).toContainText(data.plan);
  }

  async expectVisitRecord(customerName: string, visitContent: string): Promise<void> {
    const visitRecord = this.visitRecordsSection.locator(`text=${customerName}`).locator('..');
    await expect(visitRecord).toBeVisible();
    await expect(visitRecord).toContainText(visitContent);
  }

  async expectVisitRecordCount(count: number): Promise<void> {
    const visitItems = this.visitRecordsSection.locator('.visit-item, [data-testid="visit-item"]');
    await expect(visitItems).toHaveCount(count);
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await expect(this.page).toHaveURL(/\/reports\/\d+\/edit/);
  }

  async expectEditButtonVisible(): Promise<void> {
    await expect(this.editButton).toBeVisible();
  }

  async expectEditButtonNotVisible(): Promise<void> {
    await expect(this.editButton).not.toBeVisible();
  }

  async expectCommentFormVisible(): Promise<void> {
    await expect(this.commentForm).toBeVisible();
    await expect(this.commentTextArea).toBeVisible();
    await expect(this.postCommentButton).toBeVisible();
  }

  async expectCommentFormNotVisible(): Promise<void> {
    await expect(this.commentForm).not.toBeVisible();
  }

  async postComment(comment: string): Promise<void> {
    await this.commentTextArea.fill(comment);
    await this.postCommentButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectComment(managerName: string, comment: string): Promise<void> {
    const commentItem = this.commentsSection.locator(
      `.comment-item:has-text("${managerName}"):has-text("${comment}"), [data-testid="comment"]:has-text("${managerName}"):has-text("${comment}")`
    );
    await expect(commentItem).toBeVisible();
  }

  async expectCommentCount(count: number): Promise<void> {
    const commentItems = this.commentsSection.locator('.comment-item, [data-testid="comment"]');
    await expect(commentItems).toHaveCount(count);
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
    await expect(this.page).toHaveURL('/reports');
  }

  async expectCommentValidationError(message?: string): Promise<void> {
    const errorLocator = this.page.locator('[data-testid="comment-error"], .comment-error');
    await expect(errorLocator).toBeVisible();
    
    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  }

  async expectPostButtonDisabled(): Promise<void> {
    await expect(this.postCommentButton).toBeDisabled();
  }
}