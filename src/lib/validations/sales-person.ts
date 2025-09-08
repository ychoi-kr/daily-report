import { z } from 'zod';

/**
 * 営業担当者の作成用スキーマ
 */
export const createSalesPersonSchema = z.object({
  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(50, '氏名は50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレス形式で入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      'パスワードは大文字・小文字・数字を含む必要があります'
    ),
  department: z
    .string()
    .max(50, '部署は50文字以内で入力してください')
    .optional()
    .default(''),
  is_manager: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

/**
 * 営業担当者の更新用スキーマ
 */
export const updateSalesPersonSchema = z.object({
  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(50, '氏名は50文字以内で入力してください')
    .optional(),
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレス形式で入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください')
    .optional(),
  department: z
    .string()
    .max(50, '部署は50文字以内で入力してください')
    .optional(),
  is_manager: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

/**
 * パスワードリセット用スキーマ
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(100, 'パスワードは100文字以内で入力してください')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        'パスワードは大文字・小文字・数字を含む必要があります'
      ),
    confirmPassword: z.string().min(1, '確認用パスワードは必須です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

/**
 * 検索用スキーマ
 */
export const searchSalesPersonSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  is_manager: z.boolean().optional(),
  is_active: z.boolean().optional(),
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(100).default(20),
});

// 型定義のエクスポート
export type CreateSalesPersonInput = z.infer<typeof createSalesPersonSchema>;
export type UpdateSalesPersonInput = z.infer<typeof updateSalesPersonSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SearchSalesPersonInput = z.infer<typeof searchSalesPersonSchema>;