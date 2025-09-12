# E2Eテスト（Playwright）

営業日報システムのエンドツーエンドテストです。Playwrightを使用して、実際のユーザー操作をシミュレートし、アプリケーション全体の動作を検証します。

## 🚀 テスト実行方法

### 事前準備

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **Playwrightブラウザのインストール**
   ```bash
   npm run playwright:install
   ```

3. **アプリケーションの起動**
   ```bash
   npm run dev
   ```

### テスト実行コマンド

```bash
# 全てのE2Eテストを実行
npm run test:e2e

# UIモードでテストを実行（対話的）
npm run test:e2e:ui

# デバッグモードでテストを実行
npm run test:e2e:debug

# ヘッド付きモードでテスト実行（ブラウザを表示）
npm run test:e2e:headed

# テストレポートを表示
npm run test:e2e:report

# 特定のテストファイルのみ実行
npx playwright test auth.spec.ts

# 特定のブラウザでのみ実行
npx playwright test --project chromium
npx playwright test --project firefox
npx playwright test --project webkit
```

## 📁 テストファイル構成

```
e2e/
├── pages/                    # ページオブジェクト
│   ├── LoginPage.ts         # ログイン画面
│   ├── DashboardPage.ts     # ダッシュボード
│   ├── ReportsPage.ts       # 日報一覧
│   ├── ReportFormPage.ts    # 日報作成/編集
│   ├── ReportDetailPage.ts  # 日報詳細
│   └── MasterManagementPage.ts # マスタ管理
├── utils/                   # ユーティリティ
│   ├── test-data.ts        # テストデータ定義
│   ├── auth-helper.ts      # 認証ヘルパー
│   └── database-helper.ts  # データベースヘルパー
├── auth.spec.ts            # 認証機能テスト
├── report-workflow.spec.ts # 日報業務フローテスト
├── comment-workflow.spec.ts # コメント機能テスト
├── master-management.spec.ts # マスタ管理テスト
├── authorization.spec.ts   # 権限制御テスト
├── error-handling.spec.ts  # エラーハンドリングテスト
├── visual-regression.spec.ts # ビジュアル回帰テスト
├── accessibility.spec.ts   # アクセシビリティテスト
├── global-setup.ts         # グローバルセットアップ
└── global-teardown.ts      # グローバルクリーンアップ
```

## 🧪 テストカテゴリ

### 1. 認証機能テスト (`auth.spec.ts`)
- ログイン成功/失敗
- バリデーションエラー
- ログアウト機能
- セッション維持

### 2. 日報業務フローテスト (`report-workflow.spec.ts`)
- 日報作成から詳細表示まで
- 日報編集フロー
- 日報検索機能
- 訪問記録の追加/削除
- バリデーション確認

### 3. コメント機能テスト (`comment-workflow.spec.ts`)
- 管理者による日報へのコメント投稿
- 一般ユーザーのコメント制限
- 複数コメント投稿
- コメントバリデーション

### 4. マスタ管理テスト (`master-management.spec.ts`)
- 顧客マスタCRUD操作
- 営業担当者マスタCRUD操作
- 検索機能
- バリデーション確認
- アクセス権限制御

### 5. 権限制御テスト (`authorization.spec.ts`)
- 一般ユーザー権限確認
- 管理者権限確認
- 権限エラーシナリオ
- クロスユーザーアクセステスト

### 6. エラーハンドリングテスト (`error-handling.spec.ts`)
- バリデーションエラー
- ネットワークエラー
- サーバーエラー（404, 500, 401, 403）
- UIエラーケース
- データ整合性エラー

### 7. ビジュアル回帰テスト (`visual-regression.spec.ts`)
- 各画面のスクリーンショット比較
- レスポンシブデザイン確認
- テーマ切り替え確認
- エラー状態の表示確認

### 8. アクセシビリティテスト (`accessibility.spec.ts`)
- WCAG準拠チェック
- キーボードナビゲーション
- スクリーンリーダー対応
- 色彩コントラスト
- フォーカス管理

## 🎯 テストデータ

`utils/test-data.ts`で定義されているテストデータ：

### テストユーザー
- **一般ユーザー**: yamada@example.com / Test1234!
- **管理者**: tanaka@example.com / Manager123!

### テスト顧客
- ABC商事（佐藤一郎）
- XYZ工業（鈴木二郎）
- DEF株式会社（高橋三郎）

## 🔧 設定とカスタマイズ

### Playwright設定 (`playwright.config.ts`)

主要な設定項目：

```typescript
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',
  
  // 並列実行の有効化
  fullyParallel: true,
  
  // ベースURL
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  
  // 対象ブラウザ
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' },
  ],
});
```

### 環境変数

テスト実行時に使用できる環境変数：

```bash
BASE_URL=http://localhost:3000  # アプリケーションURL
NODE_ENV=test                   # テスト環境
```

## 📊 レポートとスクリーンショット

### HTMLレポート
テスト実行後、`playwright-report/`ディレクトリにHTMLレポートが生成されます。

```bash
npm run test:e2e:report
```

### スクリーンショット・動画
- 失敗時のスクリーンショット: `test-results/`
- 失敗時の動画記録: `test-results/`
- トレースファイル: `test-results/`

## 🚀 CI/CD統合

GitHub Actionsワークフロー (`.github/workflows/e2e-tests.yml`) が設定済み：

- プルリクエスト/プッシュ時の自動実行
- 複数ブラウザでの並列実行
- テストレポート・アーティファクトの保存
- 失敗時のスクリーンショット・動画保存

## 💡 ベストプラクティス

### 1. ページオブジェクトパターンの使用
```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login(email, password);
```

### 2. 明確なテスト名
```typescript
test('日報作成から詳細表示まで（一般ユーザー）', async ({ page }) => {
  // テスト内容
});
```

### 3. 適切な待機処理
```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

### 4. テストデータの管理
```typescript
import { TEST_USERS, TEST_CUSTOMERS } from './utils/test-data';
const user = TEST_USERS.REGULAR_USER;
```

### 5. エラーハンドリング
```typescript
await page.route('/api/reports', (route) => {
  route.abort('connectionfailed');
});
```

## 🐛 トラブルシューティング

### よくある問題

1. **タイムアウトエラー**
   - `actionTimeout`や`navigationTimeout`を調整
   - 適切な待機処理の追加

2. **要素が見つからない**
   - セレクタの確認
   - ページの読み込み完了を待機

3. **テストの不安定性**
   - 明示的な待機の追加
   - テスト間の依存関係を排除

4. **認証エラー**
   - テストユーザーの存在確認
   - セッション管理の確認

### デバッグ方法

```bash
# デバッグモードでテスト実行
npm run test:e2e:debug

# 特定のテストをヘッド付きで実行
npx playwright test auth.spec.ts --headed

# トレース表示
npx playwright show-trace trace.zip
```

## 📚 参考リンク

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwrightベストプラクティス](https://playwright.dev/docs/best-practices)
- [アクセシビリティテスト](https://playwright.dev/docs/accessibility-testing)