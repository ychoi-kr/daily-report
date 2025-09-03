# 営業日報システム OpenAPI & Zodスキーマ セットアップ

## 概要

営業日報システムのIssue#4「【基盤】OpenAPI仕様定義とZodスキーマ生成」が完了しました。
このドキュメントでは、実装された機能の使用方法を説明します。

## 実装された機能

### 1. Zodスキーマ定義

- **場所**: `src/lib/schemas/`
- **内容**:
  - 共通スキーマ (`common.ts`)
  - 認証スキーマ (`auth.ts`) 
  - 営業担当者スキーマ (`sales-person.ts`)
  - 顧客スキーマ (`customer.ts`)
  - 日報スキーマ (`report.ts`)

### 2. OpenAPI仕様書生成

- **場所**: `openapi.json`
- **生成方法**: `npm run openapi:generate`
- **カバー範囲**:
  - 認証API (`/auth/login`, `/auth/logout`, `/auth/me`)
  - 日報API (`/reports` CRUD + `/reports/{id}/comments`)
  - 営業担当者API (`/sales-persons` CRUD)
  - 顧客API (`/customers` CRUD)

### 3. TypeScript型定義自動生成

- **場所**: `src/types/api-generated.ts`, `src/types/api-utilities.ts`
- **生成方法**: `npm run api:types`
- **機能**: OpenAPI仕様から型安全なTypeScript型を自動生成

### 4. APIクライアント

- **場所**: `src/lib/api/`
- **機能**:
  - 型安全なAPIクライアント (`client.ts`)
  - React Hook用のユーティリティ (`hooks.ts`)
  - 統合エラーハンドリング

## 使用方法

### NPMスクリプト

```bash
# OpenAPI仕様書を生成
npm run openapi:generate

# TypeScript型定義を生成
npm run api:types

# 上記2つを連続実行
npm run api:generate
```

### APIクライアントの使用

```typescript
import { api, setAuthToken } from '@/lib/api';

// ログイン
const loginResponse = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// トークンを設定
setAuthToken(loginResponse.token);

// 日報を作成
const report = await api.reports.create({
  report_date: '2025-07-27',
  problem: '新規開拓の進捗が遅れている',
  plan: 'ABC商事への見積もり作成',
  visits: [
    {
      customer_id: 1,
      visit_time: '10:00',
      visit_content: '新商品の提案を実施'
    }
  ]
});
```

### Zodスキーマでのバリデーション

```typescript
import { CreateReportRequestSchema } from '@/lib/schemas';

// リクエストデータのバリデーション
try {
  const validatedData = CreateReportRequestSchema.parse(formData);
  // バリデーション成功時の処理
} catch (error) {
  // バリデーションエラーの処理
  console.error('Validation error:', error);
}
```

### React Hooksの使用

```typescript
import { useAuth, useReports } from '@/lib/api';

function MyComponent() {
  const { data: user, loading, login } = useAuth();
  const { data: reports, fetchReports } = useReports();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
    } catch (error) {
      // エラーハンドリング
    }
  };

  // ...
}
```

## ファイル構造

```
src/lib/
├── schemas/           # Zodスキーマ定義
│   ├── common.ts     # 共通スキーマ
│   ├── auth.ts       # 認証スキーマ
│   ├── sales-person.ts # 営業担当者スキーマ
│   ├── customer.ts   # 顧客スキーマ
│   ├── report.ts     # 日報スキーマ
│   └── index.ts      # エクスポート
├── api/              # APIクライアント
│   ├── client.ts     # メインクライアント
│   ├── hooks.ts      # React Hooks
│   └── index.ts      # エクスポート
└── openapi-simple.ts # OpenAPI仕様生成

src/types/
├── api-generated.ts  # 自動生成された型定義
└── api-utilities.ts  # 型ユーティリティ

scripts/
├── generate-openapi.ts # OpenAPI仕様生成スクリプト
└── generate-api-types.ts # 型定義生成スクリプト

examples/
└── api-usage.ts      # 使用例
```

## テスト

```bash
# スキーマのテスト
npm test -- src/lib/schemas/__tests__/

# APIクライアントのテスト  
npm test -- src/lib/api/__tests__/

# 全テスト実行
npm test
```

## エラーハンドリング

APIクライアントは統合されたエラーハンドリングを提供します：

```typescript
import { ApiError } from '@/lib/api';

try {
  await api.reports.create(reportData);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error [${error.code}]:`, error.message);
    
    // HTTPステータスコード別の処理
    switch (error.status) {
      case 400: // バリデーションエラー
        if (error.details) {
          error.details.forEach(detail => {
            console.error(`${detail.field}: ${detail.message}`);
          });
        }
        break;
      case 401: // 認証エラー
        // ログイン画面にリダイレクト
        break;
      case 403: // 権限エラー
        // 権限不足のメッセージ表示
        break;
      case 409: // 競合エラー（重複など）
        // 競合の解決方法を提示
        break;
    }
  }
}
```

## 今後の拡張

1. **React Query統合**: `src/lib/api/hooks.ts`にReact Queryベースの実装を追加
2. **Swagger UI**: 開発用のSwagger UIページの追加
3. **API Mock**: テスト用のモックサーバーの実装
4. **バリデーションミドルウェア**: Next.js APIルート用のZodバリデーションミドルウェア

## 注意事項

- 現在のOpenAPI仕様は簡略版です。必要に応じて詳細を追加してください
- APIクライアントは`openapi-fetch`を使用しており、型安全性を提供します
- ZodスキーマはフロントエンドでのバリデーションとOpenAPI仕様生成の両方に使用されます
- 環境変数`NEXT_PUBLIC_API_BASE_URL`でAPIベースURLを設定できます

## サポート

詳細な使用例は`examples/api-usage.ts`を参照してください。
質問や問題がある場合は、プロジェクトのIssueを作成してください。