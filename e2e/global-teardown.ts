import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 グローバルクリーンアップを開始...');

  try {
    // テスト用に作成されたデータのクリーンアップ
    console.log('🗑️  テストデータのクリーンアップ...');
    
    // 実際の実装では、テスト中に作成されたデータを削除
    // await cleanupTestReports();
    // await cleanupTestComments();
    // await cleanupTestCustomers();
    
    console.log('✅ グローバルクリーンアップ完了');
    
  } catch (error) {
    console.error('❌ グローバルクリーンアップ中にエラーが発生:', error);
    // クリーンアップエラーは致命的でない場合があるので、警告として扱う
  }
}

export default globalTeardown;