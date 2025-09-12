# 営業日報システム - パフォーマンステスト

## 概要

このディレクトリには、営業日報システムのパフォーマンステストスクリプトが含まれています。
k6を使用して負荷テストを実行し、システムが性能要件を満たしているかを確認します。

## 性能目標

- **日報一覧表示**: 3秒以内
- **API応答時間**: 1秒以内（95パーセンタイル）
- **同時ユーザー数**: 100ユーザー
- **エラー率**: 1%未満

## 必要な環境

- Node.js 18.x以上
- npm または yarn
- k6（負荷テストツール）
- PostgreSQL（テスト用データベース）

## k6のインストール

### macOS
```bash
brew install k6
```

### Ubuntu/Debian
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows
```bash
choco install k6
```

詳細は[k6公式ドキュメント](https://k6.io/docs/getting-started/installation/)を参照してください。

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. データベースのマイグレーション
```bash
npx prisma migrate deploy
```

3. テストデータの生成
```bash
./performance-tests/run-performance-tests.sh --setup
```

## テストの実行

### すべてのテストを実行
```bash
./performance-tests/run-performance-tests.sh --all
```

### 特定のテストのみ実行
```bash
./performance-tests/run-performance-tests.sh --test api-response-time
```

### 利用可能なテスト

| テスト名 | 説明 | 主な検証項目 |
|---------|------|------------|
| api-response-time | APIエンドポイントの応答時間測定 | 各APIの応答が1秒以内 |
| reports-list-performance | 日報一覧表示の性能テスト | 一覧表示が3秒以内 |
| reports-create-performance | 日報作成処理の性能テスト | 作成処理が2秒以内 |
| search-performance | 検索処理の性能テスト | 検索が2-3秒以内 |
| concurrent-load-test | 同時100ユーザーアクセステスト | エラー率1%未満 |

## テストデータ管理

### 大量テストデータの生成
```bash
npx ts-node performance-tests/utils/seed-large-dataset.ts [sales_persons] [customers] [days]
```

例：100人の営業担当者、500社の顧客、90日分の日報を生成
```bash
npx ts-node performance-tests/utils/seed-large-dataset.ts 100 500 90
```

### テストデータのクリーンアップ
```bash
npx ts-node performance-tests/utils/cleanup-test-data.ts
```

### データベースのリセット（全データ削除）
```bash
npx ts-node performance-tests/utils/cleanup-test-data.ts reset
```

## 結果の分析

テスト実行後、自動的に結果が分析され、レポートが生成されます。

### レポートの場所
- JSON形式: `performance-tests/reports/performance-report-*.json`
- HTML形式: `performance-tests/reports/performance-report-*.html`
- Markdown形式: `performance-tests/reports/performance-report-*.md`

### 手動で分析を実行
```bash
./performance-tests/run-performance-tests.sh --analyze
```

## CI/CD統合

GitHub ActionsやGitLab CIなどで自動実行する場合：

```bash
./performance-tests/run-performance-tests.sh --ci
```

このモードでは：
1. テストデータの自動セットアップ
2. すべてのテストの実行
3. 結果の分析とレポート生成
4. テストデータのクリーンアップ
5. CI用の結果ファイル生成（`results/ci-result.txt`）

### GitHub Actions設定例

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時に実行
  workflow_dispatch:

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install k6
        run: |
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Start server
        run: npm run dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000/api/health
      
      - name: Run performance tests
        run: ./performance-tests/run-performance-tests.sh --ci
        env:
          BASE_URL: http://localhost:3000
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: performance-test-results
          path: |
            performance-tests/results/
            performance-tests/reports/
```

## トラブルシューティング

### k6が見つからない
```bash
Error: k6 is not installed
```
→ k6をインストールしてください（上記の「k6のインストール」を参照）

### サーバーに接続できない
```bash
Error: Server is not running at http://localhost:3000
```
→ アプリケーションサーバーを起動してください：
```bash
npm run dev
```

### データベース接続エラー
```bash
Error: Can't reach database server
```
→ PostgreSQLが起動していることを確認し、環境変数`DATABASE_URL`を設定してください

### メモリ不足エラー
```bash
FATAL ERROR: JavaScript heap out of space
```
→ Node.jsのメモリ制限を増やしてください：
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

## パフォーマンス改善のヒント

テストで性能問題が検出された場合の改善案：

1. **データベースの最適化**
   - インデックスの追加
   - クエリの最適化
   - 接続プールの調整

2. **キャッシュの導入**
   - Redis等のインメモリキャッシュ
   - CDNの利用
   - ブラウザキャッシュの活用

3. **非同期処理の活用**
   - 重い処理のバックグラウンド実行
   - キューシステムの導入

4. **フロントエンドの最適化**
   - 遅延ローディング
   - バンドルサイズの削減
   - 画像の最適化

## 参考資料

- [k6公式ドキュメント](https://k6.io/docs/)
- [k6のベストプラクティス](https://k6.io/docs/testing-guides/test-types/)
- [パフォーマンステストのガイドライン](https://k6.io/docs/testing-guides/)