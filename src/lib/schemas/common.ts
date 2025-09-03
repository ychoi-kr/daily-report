import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// 共通エラーレスポンス
export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z
        .array(
          z.object({
            field: z.string(),
            message: z.string(),
          })
        )
        .optional(),
    }),
  })
  .openapi('ErrorResponse', {
    description: 'エラーレスポンス',
    example: {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラーが発生しました',
        details: [
          {
            field: 'email',
            message: '有効なメールアドレスを入力してください',
          },
        ],
      },
    },
  });

// ページネーション
export const PaginationSchema = z
  .object({
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    per_page: z.number().int().min(1).max(100),
    total_pages: z.number().int().min(0),
  })
  .openapi('Pagination', {
    description: 'ページネーション情報',
    example: {
      total: 100,
      page: 1,
      per_page: 20,
      total_pages: 5,
    },
  });

// ページネーションクエリ
export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, { message: 'Page must be >= 1' }),
  per_page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, {
      message: 'per_page must be between 1 and 100',
    }),
});

// 日付形式バリデーション
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// 時刻形式バリデーション（HH:MM）
export const TimeStringSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');

// ID パラメータ
export const IdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: 'ID must be a positive integer' }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
