import { z } from 'zod';

// 営業担当者の基本情報
export const SalesPersonSchema = z.object({
  id: z.number().int().positive(),
  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(100, '氏名は100文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  department: z
    .string()
    .min(1, '部署は必須です')
    .max(100, '部署は100文字以内で入力してください'),
  is_manager: z.boolean(),
});

// 営業担当者詳細（作成・更新日時を含む）
export const SalesPersonDetailSchema = SalesPersonSchema.extend({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// 営業担当者作成リクエスト
export const CreateSalesPersonRequestSchema = z.object({
  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(100, '氏名は100文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  department: z
    .string()
    .min(1, '部署は必須です')
    .max(100, '部署は100文字以内で入力してください'),
  is_manager: z.boolean(),
});

// 営業担当者更新リクエスト
export const UpdateSalesPersonRequestSchema = z.object({
  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(100, '氏名は100文字以内で入力してください')
    .optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  department: z
    .string()
    .min(1, '部署は必須です')
    .max(100, '部署は100文字以内で入力してください')
    .optional(),
  is_manager: z.boolean().optional(),
});

// 営業担当者一覧クエリ
export const SalesPersonQuerySchema = z.object({
  department: z.string().optional(),
  is_manager: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined))
    .refine((val) => val === undefined || typeof val === 'boolean', {
      message: 'is_manager must be true or false',
    }),
});

// 営業担当者作成レスポンス
export const CreateSalesPersonResponseSchema = SalesPersonSchema.extend({
  created_at: z.string().datetime(),
});

// 営業担当者更新レスポンス
export const UpdateSalesPersonResponseSchema = SalesPersonSchema.extend({
  updated_at: z.string().datetime(),
});

export type SalesPerson = z.infer<typeof SalesPersonSchema>;
export type SalesPersonDetail = z.infer<typeof SalesPersonDetailSchema>;
export type CreateSalesPersonRequest = z.infer<
  typeof CreateSalesPersonRequestSchema
>;
export type UpdateSalesPersonRequest = z.infer<
  typeof UpdateSalesPersonRequestSchema
>;
export type SalesPersonQuery = z.infer<typeof SalesPersonQuerySchema>;
export type CreateSalesPersonResponse = z.infer<
  typeof CreateSalesPersonResponseSchema
>;
export type UpdateSalesPersonResponse = z.infer<
  typeof UpdateSalesPersonResponseSchema
>;
