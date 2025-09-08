import { z } from 'zod';

// 顧客検索パラメータ
export const searchCustomerSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

// 顧客作成スキーマ
export const createCustomerSchema = z.object({
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
    .max(20, '電話番号は20文字以内で入力してください')
    .regex(
      /^[\d\-\(\)\+\s]+$/,
      '電話番号は数字、ハイフン、括弧、プラス記号のみ使用できます'
    ),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(100, 'メールアドレスは100文字以内で入力してください'),
  address: z
    .string()
    .max(500, '住所は500文字以内で入力してください')
    .optional(),
});

// 顧客更新スキーマ
export const updateCustomerSchema = z.object({
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
    .regex(
      /^[\d\-\(\)\+\s]+$/,
      '電話番号は数字、ハイフン、括弧、プラス記号のみ使用できます'
    )
    .optional(),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(100, 'メールアドレスは100文字以内で入力してください')
    .optional(),
  address: z
    .string()
    .max(500, '住所は500文字以内で入力してください')
    .optional(),
});