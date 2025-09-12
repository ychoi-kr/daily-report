import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 グローバルセットアップを開始...');

  // ブラウザを起動してアプリケーションが起動しているかチェック
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // ベースURLが設定されているかチェック
    const baseURL = config.webServer?.url || config.use?.baseURL || 'http://localhost:3000';
    
    console.log(`🔗 アプリケーション接続テスト: ${baseURL}`);
    
    // アプリケーションが起動しているかチェック（最大10回リトライ）
    let connected = false;
    for (let i = 0; i < 10; i++) {
      try {
        const response = await page.goto(baseURL);
        if (response && response.status() < 400) {
          connected = true;
          break;
        }
      } catch (error) {
        console.log(`⏳ 接続待機中... (${i + 1}/10)`);
        await page.waitForTimeout(2000);
      }
    }
    
    if (!connected) {
      throw new Error('アプリケーションサーバーに接続できませんでした');
    }
    
    console.log('✅ アプリケーションサーバーへの接続を確認');
    
    // テスト用データベースの初期化（実際の実装では必要に応じて）
    console.log('🔧 テストデータの準備...');
    
    // テスト用ユーザーが存在するかチェック（実際の実装では必要に応じて）
    // await seedTestUsers();
    // await seedTestCustomers();
    
    console.log('✅ グローバルセットアップ完了');
    
  } finally {
    await browser.close();
  }
}

export default globalSetup;