import { Page, expect, Locator } from '@playwright/test';

/**
 * マスタ管理画面の共通ページオブジェクト
 */
export class MasterManagementPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newButton: Locator;
  readonly searchField: Locator;
  readonly searchButton: Locator;
  readonly dataTable: Locator;
  readonly tableRows: Locator;

  constructor(page: Page, pageType: 'customers' | 'sales-persons') {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.newButton = page.locator('button:has-text("新規登録"), button:has-text("新規")');
    this.searchField = page.locator('input[name="search"], input[placeholder*="検索"]');
    this.searchButton = page.locator('button:has-text("検索")');
    this.dataTable = page.locator('table, [data-testid="data-table"]');
    this.tableRows = page.locator('tbody tr, [data-testid="table-row"]');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.newButton).toBeVisible();
    await expect(this.dataTable).toBeVisible();
  }

  async clickNew(): Promise<void> {
    await this.newButton.click();
  }

  async search(keyword: string): Promise<void> {
    await this.searchField.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectRowCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }

  async expectRowVisible(text: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: text });
    await expect(row).toBeVisible();
  }

  async clickEditRow(identifier: string): Promise<void> {
    const editButton = this.page.locator(`tr:has-text("${identifier}") button:has-text("編集")`);
    await editButton.click();
  }

  async clickDeleteRow(identifier: string): Promise<void> {
    const deleteButton = this.page.locator(`tr:has-text("${identifier}") button:has-text("削除")`);
    await deleteButton.click();
  }

  async expectNoData(): Promise<void> {
    const noDataMessage = this.page.locator('text=データがありません, text=登録されていません');
    await expect(noDataMessage).toBeVisible();
  }
}

/**
 * 顧客マスタ管理画面のページオブジェクト
 */
export class CustomersPage extends MasterManagementPage {
  constructor(page: Page) {
    super(page, 'customers');
  }

  async goto(): Promise<void> {
    await this.page.goto('/customers');
    await this.page.waitForLoadState('networkidle');
  }

  async expectCustomerInList(companyName: string, contactPerson: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: companyName }).filter({ hasText: contactPerson });
    await expect(row).toBeVisible();
  }

  async addCustomer(customerData: {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
  }): Promise<void> {
    await this.clickNew();
    
    // モーダルまたは新規登録フォームでの入力
    await this.page.locator('input[name="companyName"]').fill(customerData.companyName);
    await this.page.locator('input[name="contactPerson"]').fill(customerData.contactPerson);
    await this.page.locator('input[name="phone"]').fill(customerData.phone);
    await this.page.locator('input[name="email"]').fill(customerData.email);
    await this.page.locator('textarea[name="address"]').fill(customerData.address);
    
    const saveButton = this.page.locator('button:has-text("保存"), button[type="submit"]');
    await saveButton.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async editCustomer(currentCompanyName: string, newData: {
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<void> {
    await this.clickEditRow(currentCompanyName);
    
    // フィールドを更新
    if (newData.companyName) {
      await this.page.locator('input[name="companyName"]').fill(newData.companyName);
    }
    if (newData.contactPerson) {
      await this.page.locator('input[name="contactPerson"]').fill(newData.contactPerson);
    }
    if (newData.phone) {
      await this.page.locator('input[name="phone"]').fill(newData.phone);
    }
    if (newData.email) {
      await this.page.locator('input[name="email"]').fill(newData.email);
    }
    if (newData.address) {
      await this.page.locator('textarea[name="address"]').fill(newData.address);
    }
    
    const saveButton = this.page.locator('button:has-text("保存"), button[type="submit"]');
    await saveButton.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async deleteCustomer(companyName: string): Promise<void> {
    await this.clickDeleteRow(companyName);
    
    // 確認ダイアログで削除を実行
    const confirmButton = this.page.locator('button:has-text("削除"), button:has-text("はい")');
    await confirmButton.click();
    
    await this.page.waitForLoadState('networkidle');
  }
}

/**
 * 営業担当者マスタ管理画面のページオブジェクト
 */
export class SalesPersonsPage extends MasterManagementPage {
  constructor(page: Page) {
    super(page, 'sales-persons');
  }

  async goto(): Promise<void> {
    await this.page.goto('/sales-persons');
    await this.page.waitForLoadState('networkidle');
  }

  async expectSalesPersonInList(name: string, department: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: name }).filter({ hasText: department });
    await expect(row).toBeVisible();
  }

  async addSalesPerson(salesPersonData: {
    name: string;
    email: string;
    password: string;
    department: string;
    isManager: boolean;
  }): Promise<void> {
    await this.clickNew();
    
    // 新規登録フォームでの入力
    await this.page.locator('input[name="name"]').fill(salesPersonData.name);
    await this.page.locator('input[name="email"]').fill(salesPersonData.email);
    await this.page.locator('input[name="password"]').fill(salesPersonData.password);
    await this.page.locator('input[name="department"]').fill(salesPersonData.department);
    
    const managerCheckbox = this.page.locator('input[name="isManager"], input[type="checkbox"]');
    if (salesPersonData.isManager) {
      await managerCheckbox.check();
    } else {
      await managerCheckbox.uncheck();
    }
    
    const saveButton = this.page.locator('button:has-text("保存"), button[type="submit"]');
    await saveButton.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async editSalesPerson(currentName: string, newData: {
    name?: string;
    email?: string;
    department?: string;
    isManager?: boolean;
  }): Promise<void> {
    await this.clickEditRow(currentName);
    
    // フィールドを更新
    if (newData.name) {
      await this.page.locator('input[name="name"]').fill(newData.name);
    }
    if (newData.email) {
      await this.page.locator('input[name="email"]').fill(newData.email);
    }
    if (newData.department) {
      await this.page.locator('input[name="department"]').fill(newData.department);
    }
    if (newData.isManager !== undefined) {
      const managerCheckbox = this.page.locator('input[name="isManager"], input[type="checkbox"]');
      if (newData.isManager) {
        await managerCheckbox.check();
      } else {
        await managerCheckbox.uncheck();
      }
    }
    
    const saveButton = this.page.locator('button:has-text("保存"), button[type="submit"]');
    await saveButton.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async deleteSalesPerson(name: string): Promise<void> {
    await this.clickDeleteRow(name);
    
    // 確認ダイアログで削除を実行
    const confirmButton = this.page.locator('button:has-text("削除"), button:has-text("はい")');
    await confirmButton.click();
    
    await this.page.waitForLoadState('networkidle');
  }
}