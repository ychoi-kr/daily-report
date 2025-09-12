import { test, expect } from '@playwright/test';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { TEST_USERS, TEST_REPORT_DATA } from './utils/test-data';
import { login } from './utils/auth-helper';

test.describe('コメント機能', () => {
  let reportDetailPage: ReportDetailPage;
  const existingReportId = 1; // 実際の実装では動的に取得

  test.beforeEach(async ({ page }) => {
    reportDetailPage = new ReportDetailPage(page);
  });

  test('管理者による日報へのコメント投稿', async ({ page }) => {
    // 管理者でログイン
    await login(page, 'MANAGER_USER');
    
    // 日報詳細画面に移動
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // コメントフォームが表示されることを確認（管理者のみ）
    await reportDetailPage.expectCommentFormVisible();
    
    // コメントを投稿
    const commentText = TEST_REPORT_DATA.COMMENT_TEXT;
    await reportDetailPage.postComment(commentText);
    
    // 投稿されたコメントが表示されることを確認
    const manager = TEST_USERS.MANAGER_USER;
    await reportDetailPage.expectComment(manager.name, commentText);
  });

  test('一般ユーザーはコメント投稿できない', async ({ page }) => {
    // 一般ユーザーでログイン
    await login(page, 'REGULAR_USER');
    
    // 日報詳細画面に移動
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // コメントフォームが表示されないことを確認
    await reportDetailPage.expectCommentFormNotVisible();
  });

  test('複数のコメント投稿', async ({ page }) => {
    // 管理者でログイン
    await login(page, 'MANAGER_USER');
    
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    const manager = TEST_USERS.MANAGER_USER;
    
    // 1件目のコメント
    const comment1 = 'お疲れ様でした。良い活動内容ですね。';
    await reportDetailPage.postComment(comment1);
    await reportDetailPage.expectComment(manager.name, comment1);
    
    // 2件目のコメント
    const comment2 = '次回の訪問も頑張ってください。';
    await reportDetailPage.postComment(comment2);
    await reportDetailPage.expectComment(manager.name, comment2);
    
    // コメント数を確認
    await reportDetailPage.expectCommentCount(2);
  });

  test('コメントのバリデーション - 空のコメント', async ({ page }) => {
    await login(page, 'MANAGER_USER');
    
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // 空のコメントで投稿を試行
    await reportDetailPage.postComment('');
    
    // バリデーションエラーが表示されることを確認
    await reportDetailPage.expectCommentValidationError();
    
    // または、投稿ボタンが無効になることを確認
    await reportDetailPage.expectPostButtonDisabled();
  });

  test('コメントの文字数制限確認', async ({ page }) => {
    await login(page, 'MANAGER_USER');
    
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // 文字数制限を超える文字列を入力
    const { VALIDATION_TEST_DATA } = await import('./utils/test-data');
    const longComment = VALIDATION_TEST_DATA.MAX_LENGTH_EXCEEDED.comment;
    
    await reportDetailPage.postComment(longComment);
    
    // バリデーションエラーが表示されることを確認
    await reportDetailPage.expectCommentValidationError('500文字以内');
  });

  test('コメント表示の時系列確認', async ({ page }) => {
    // 事前に複数のコメントが存在する状態を作る（実際の実装では事前にAPIで作成）
    await login(page, 'MANAGER_USER');
    
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // 新しいコメントを追加
    const newComment = '新しく追加されたコメントです。';
    await reportDetailPage.postComment(newComment);
    
    // 最新のコメントが一番上（または下）に表示されることを確認
    const manager = TEST_USERS.MANAGER_USER;
    await reportDetailPage.expectComment(manager.name, newComment);
  });

  test('長文コメントの表示確認', async ({ page }) => {
    await login(page, 'MANAGER_USER');
    
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // 長文のコメントを投稿
    const longComment = '長文のテストコメントです。'.repeat(20); // 400文字程度
    await reportDetailPage.postComment(longComment);
    
    // コメントが正常に表示されることを確認
    const manager = TEST_USERS.MANAGER_USER;
    await reportDetailPage.expectComment(manager.name, longComment);
  });

  test('HTMLタグのエスケープ確認', async ({ page }) => {
    await login(page, 'MANAGER_USER');
    
    await reportDetailPage.goto(existingReportId);
    await reportDetailPage.expectPageLoaded();
    
    // HTMLタグを含むコメントを投稿
    const htmlComment = '<script>alert("XSS")</script>テストコメント<b>太字</b>';
    await reportDetailPage.postComment(htmlComment);
    
    // HTMLタグがエスケープされて表示されることを確認
    const manager = TEST_USERS.MANAGER_USER;
    
    // スクリプトが実行されていないことを確認
    const alerts = page.locator('text=XSS');
    await expect(alerts).not.toBeVisible();
    
    // HTMLタグがテキストとして表示されることを確認
    await reportDetailPage.expectComment(manager.name, htmlComment);
  });
});