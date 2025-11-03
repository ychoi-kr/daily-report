---
name: lint-checker
description: エージェントがTypeScriptやJavaScriptファイルを編集・作成した後に、ESLintで構文チェックを行い、エラーがあれば自動修正を試みます。編集完了後のコード品質チェックに使用してください。
---

# Lint Checker Skill

このスキルは、ファイル編集後のコード品質を自動的にチェックし、問題があれば修正します。

## 使用タイミング

以下の状況で自動的に使用されます：
- TypeScript/JavaScriptファイルの編集完了後
- 新規ファイルの作成後
- コードのリファクタリング後
- ユーザーが「Linterを実行して」と依頼した時

## 実行内容

### 1. 変更ファイルの特定

```bash
git status --short
```

編集されたファイルを特定します。

### 2. Linterの実行

```bash
npx eslint <変更されたファイル>
```

または、プロジェクト全体をチェックする場合：

```bash
npm run lint
```

### 3. 自動修正の試行

修正可能なエラーがある場合：

```bash
npx eslint --fix <ファイル>
```

または：

```bash
npm run lint:fix
```

### 4. TypeScript型チェック

TypeScriptファイルの場合、型エラーもチェック：

```bash
npm run typecheck
```

または：

```bash
npx tsc --noEmit
```

### 5. 結果の報告

#### エラーがない場合
✓ Linterチェック完了: すべての問題が解決されました

#### エラーが残っている場合
- ファイル名と行番号を明示
- エラーの内容を説明
- 修正方法を提案

## 重要な注意事項

- **自動修正優先**: 可能な限り`--fix`オプションで自動修正
- **明確な報告**: 修正できない問題は具体的な解決策を提示
- **プロジェクト設定の尊重**: `.eslintrc`や`tsconfig.json`の設定に従う
- **設定がない場合**: Linter設定がない場合はスキップし、その旨を報告

## 実行例

```bash
# 変更ファイルの確認
git status --short

# Linter実行
npx eslint src/components/Button.tsx

# 自動修正
npx eslint --fix src/components/Button.tsx

# 型チェック
npm run typecheck
```

## 期待される出力

### 成功時
```
✓ Linterチェック完了
- 3件の問題を自動修正しました
- 型エラーはありません
```

### エラー時
```
⚠ Linterエラーが見つかりました

src/components/Button.tsx:15:7
  error: 'unusedVariable' is assigned a value but never used

修正方法: この変数を削除するか、使用してください
```
