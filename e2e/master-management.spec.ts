import { test, expect } from '@playwright/test';
import { CustomersPage, SalesPersonsPage } from './pages/MasterManagementPage';
import { TEST_CUSTOMERS } from './utils/test-data';
import { login } from './utils/auth-helper';

test.describe('マスタ管理機能', () => {
  test.describe('顧客マスタ管理', () => {
    let customersPage: CustomersPage;

    test.beforeEach(async ({ page }) => {
      customersPage = new CustomersPage(page);
      // 管理者でログイン（マスタ管理は管理者のみアクセス可能）
      await login(page, 'MANAGER_USER');
    });

    test('顧客マスタ一覧表示', async ({ page }) => {
      await customersPage.goto();
      await customersPage.expectPageLoaded();
      
      // 既存の顧客データが表示されることを確認
      for (const customer of TEST_CUSTOMERS) {
        await customersPage.expectCustomerInList(customer.companyName, customer.contactPerson);
      }
    });

    test('顧客新規登録', async ({ page }) => {
      await customersPage.goto();
      
      const newCustomer = {
        companyName: 'テスト株式会社',
        contactPerson: 'テスト太郎',
        phone: '03-0000-0000',
        email: 'test@test.co.jp',
        address: 'テスト県テスト市テスト1-1-1',
      };
      
      await customersPage.addCustomer(newCustomer);
      
      // 登録された顧客が一覧に表示されることを確認
      await customersPage.expectCustomerInList(newCustomer.companyName, newCustomer.contactPerson);
    });

    test('顧客情報編集', async ({ page }) => {
      await customersPage.goto();
      
      const originalCustomer = TEST_CUSTOMERS[0];
      const updatedData = {
        contactPerson: '佐藤次郎（更新）',
        phone: '03-9999-9999',
      };
      
      await customersPage.editCustomer(originalCustomer.companyName, updatedData);
      
      // 更新された情報が表示されることを確認
      await customersPage.expectCustomerInList(originalCustomer.companyName, updatedData.contactPerson!);
    });

    test('顧客削除', async ({ page }) => {
      await customersPage.goto();
      
      // テスト用の顧客を事前に作成
      const testCustomer = {
        companyName: '削除テスト株式会社',
        contactPerson: '削除テスト太郎',
        phone: '03-0000-0000',
        email: 'delete-test@test.co.jp',
        address: 'テスト県テスト市テスト1-1-1',
      };
      
      await customersPage.addCustomer(testCustomer);
      await customersPage.expectCustomerInList(testCustomer.companyName, testCustomer.contactPerson);
      
      // 削除実行
      await customersPage.deleteCustomer(testCustomer.companyName);
      
      // 削除された顧客が一覧に表示されないことを確認
      const deletedRow = page.locator(`tr:has-text("${testCustomer.companyName}")`);
      await expect(deletedRow).not.toBeVisible();
    });

    test('顧客検索機能', async ({ page }) => {
      await customersPage.goto();
      
      // 特定の顧客名で検索
      const searchKeyword = 'ABC';
      await customersPage.search(searchKeyword);
      
      // 検索結果に該当する顧客のみが表示されることを確認
      await customersPage.expectRowVisible('ABC商事');
      
      // 該当しない顧客が表示されないことを確認
      const nonMatchingRow = page.locator('tr:has-text("XYZ工業")');
      await expect(nonMatchingRow).not.toBeVisible();
    });

    test('顧客登録時のバリデーション', async ({ page }) => {
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
    });
  });

  test.describe('営業担当者マスタ管理', () => {
    let salesPersonsPage: SalesPersonsPage;

    test.beforeEach(async ({ page }) => {
      salesPersonsPage = new SalesPersonsPage(page);
      // 管理者でログイン
      await login(page, 'MANAGER_USER');
    });

    test('営業担当者一覧表示', async ({ page }) => {
      await salesPersonsPage.goto();
      await salesPersonsPage.expectPageLoaded();
      
      // 既存の営業担当者が表示されることを確認
      await salesPersonsPage.expectSalesPersonInList('山田太郎', '営業1課');
      await salesPersonsPage.expectSalesPersonInList('田中部長', '営業部');
    });

    test('営業担当者新規登録', async ({ page }) => {
      await salesPersonsPage.goto();
      
      const newSalesPerson = {
        name: 'テスト営業',
        email: 'test-sales@example.com',
        password: 'TestPass123!',
        department: 'テスト営業課',
        isManager: false,
      };
      
      await salesPersonsPage.addSalesPerson(newSalesPerson);
      
      // 登録された営業担当者が一覧に表示されることを確認
      await salesPersonsPage.expectSalesPersonInList(newSalesPerson.name, newSalesPerson.department);
    });

    test('営業担当者情報編集', async ({ page }) => {
      await salesPersonsPage.goto();
      
      const originalName = '山田太郎';
      const updatedData = {
        name: '山田太郎（更新）',
        department: '営業2課',
        isManager: true,
      };
      
      await salesPersonsPage.editSalesPerson(originalName, updatedData);
      
      // 更新された情報が表示されることを確認
      await salesPersonsPage.expectSalesPersonInList(updatedData.name, updatedData.department);
      
      // 管理者フラグが更新されていることを確認（UIに管理者表示があれば）
      const managerIndicator = page.locator(`tr:has-text("${updatedData.name}"):has-text("管理者")`);
      await expect(managerIndicator).toBeVisible();
    });

    test('営業担当者削除', async ({ page }) => {
      await salesPersonsPage.goto();
      
      // テスト用の営業担当者を事前に作成
      const testSalesPerson = {
        name: '削除テスト営業',
        email: 'delete-test@example.com',
        password: 'TestPass123!',
        department: 'テスト営業課',
        isManager: false,
      };
      
      await salesPersonsPage.addSalesPerson(testSalesPerson);
      await salesPersonsPage.expectSalesPersonInList(testSalesPerson.name, testSalesPerson.department);
      
      // 削除実行
      await salesPersonsPage.deleteSalesPerson(testSalesPerson.name);
      
      // 削除された営業担当者が一覧に表示されないことを確認
      const deletedRow = page.locator(`tr:has-text("${testSalesPerson.name}")`);
      await expect(deletedRow).not.toBeVisible();
    });

    test('営業担当者登録時のバリデーション', async ({ page }) => {
      await salesPersonsPage.goto();
      await salesPersonsPage.clickNew();
      
      // 必須項目を空のまま保存を試行
      const saveButton = page.locator('button:has-text("保存"), button[type="submit"]');
      await saveButton.click();
      
      // バリデーションエラーが表示されることを確認
      const nameError = page.locator('[data-testid="name-error"], .field-error');
      const emailError = page.locator('[data-testid="email-error"], .field-error');
      const passwordError = page.locator('[data-testid="password-error"], .field-error');
      
      await expect(nameError.first()).toBeVisible();
      await expect(emailError.first()).toBeVisible();
      await expect(passwordError.first()).toBeVisible();
    });

    test('重複メールアドレスの登録エラー', async ({ page }) => {
      await salesPersonsPage.goto();
      
      const duplicateSalesPerson = {
        name: '重複テスト',
        email: 'yamada@example.com', // 既存ユーザーと同じメールアドレス
        password: 'TestPass123!',
        department: 'テスト営業課',
        isManager: false,
      };
      
      await salesPersonsPage.addSalesPerson(duplicateSalesPerson);
      
      // 重複エラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=既に存在, text=重複, text=既に登録');
      await expect(errorMessage.first()).toBeVisible();
    });
  });

  test('一般ユーザーのマスタ管理アクセス制限', async ({ page }) => {
    // 一般ユーザーでログイン
    await login(page, 'REGULAR_USER');
    
    // 顧客マスタ管理画面に直接アクセス
    await page.goto('/customers');
    
    // アクセス拒否または権限エラーが表示されることを確認
    const errorMessage = page.locator('text=権限がありません, text=403, text=Forbidden');
    await expect(errorMessage.first()).toBeVisible();
    
    // 営業担当者マスタ管理画面に直接アクセス
    await page.goto('/sales-persons');
    
    // アクセス拒否または権限エラーが表示されることを確認
    await expect(errorMessage.first()).toBeVisible();
  });
});