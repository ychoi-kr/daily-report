import { z } from 'zod';

// Customer validation schema
export const customerSchema = z.object({
  company_name: z
    .string()
    .min(1, '会社名は必須項目です')
    .max(100, '会社名は100文字以内で入力してください'),
  contact_person: z
    .string()
    .min(1, '担当者名は必須項目です')
    .max(50, '担当者名は50文字以内で入力してください'),
  phone: z
    .string()
    .min(1, '電話番号は必須項目です')
    .regex(/^[\d-+()]+$/, '有効な電話番号を入力してください')
    .max(20, '電話番号は20文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスは必須項目です')
    .email('有効なメールアドレスを入力してください')
    .max(100, 'メールアドレスは100文字以内で入力してください'),
  address: z
    .string()
    .max(200, '住所は200文字以内で入力してください')
    .optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export type Customer = {
  id: number;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  created_at: string;
  updated_at: string;
};

export type CustomerListResponse = {
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
};