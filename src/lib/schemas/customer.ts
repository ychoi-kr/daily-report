import { z } from 'zod';

// 顧客の基本情報
export const CustomerSchema = z.object({
  id: z.number().int().positive(),
  company_name: z
    .string()
    .min(1, '会社名は必須です')
    .max(200, '会社名は200文字以内で入力してください'),
  contact_person: z
    .string()
    .min(1, '担当者名は必須です')
    .max(100, '担当者名は100文字以内で入力してください'),
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .max(20, '電話番号は20文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
});

// 顧客詳細（住所と作成・更新日時を含む）
export const CustomerDetailSchema = CustomerSchema.extend({
  address: z.string().max(500, '住所は500文字以内で入力してください'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// 顧客作成リクエスト
export const CreateCustomerRequestSchema = z.object({
  company_name: z
    .string()
    .min(1, '会社名は必須です')
    .max(200, '会社名は200文字以内で入力してください'),
  contact_person: z
    .string()
    .min(1, '担当者名は必須です')
    .max(100, '担当者名は100文字以内で入力してください'),
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .max(20, '電話番号は20文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  address: z
    .string()
    .max(500, '住所は500文字以内で入力してください')
    .optional(),
});

// 顧客更新リクエスト
export const UpdateCustomerRequestSchema = z.object({
  company_name: z
    .string()
    .min(1, '会社名は必須です')
    .max(200, '会社名は200文字以内で入力してください')
    .optional(),
  contact_person: z
    .string()
    .min(1, '担当者名は必須です')
    .max(100, '担当者名は100文字以内で入力してください')
    .optional(),
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .max(20, '電話番号は20文字以内で入力してください')
    .optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  address: z
    .string()
    .max(500, '住所は500文字以内で入力してください')
    .optional(),
});

// 顧客一覧クエリ
export const CustomerQuerySchema = z.object({
  search: z.string().optional(), // 会社名/担当者名で検索
});

// 顧客作成レスポンス
export const CreateCustomerResponseSchema = CustomerDetailSchema.omit({
  updated_at: true,
});

// 顧客更新レスポンス
export const UpdateCustomerResponseSchema = CustomerDetailSchema;

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerDetail = z.infer<typeof CustomerDetailSchema>;
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;
export type CreateCustomerResponse = z.infer<
  typeof CreateCustomerResponseSchema
>;
export type UpdateCustomerResponse = z.infer<
  typeof UpdateCustomerResponseSchema
>;
