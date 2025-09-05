import { z } from 'zod';
import { DateStringSchema, TimeStringSchema } from './common';

// 訪問記録
export const VisitRecordSchema = z.object({
  id: z.number().int().positive(),
  customer: z.object({
    id: z.number().int().positive(),
    company_name: z.string(),
  }),
  visit_time: z.string().nullable().optional(),
  visit_content: z
    .string()
    .min(1, '訪問内容は必須です')
    .max(500, '訪問内容は500文字以内で入力してください'),
});

// 訪問記録作成・更新用
export const VisitRecordInputSchema = z.object({
  id: z.number().int().positive().optional(), // 更新時のみ使用
  customer_id: z.number().int().positive(),
  visit_time: TimeStringSchema.optional().nullable(),
  visit_content: z
    .string()
    .min(1, '訪問内容は必須です')
    .max(500, '訪問内容は500文字以内で入力してください'),
});

// 上長コメント
export const ManagerCommentSchema = z.object({
  id: z.number().int().positive(),
  manager: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  comment: z.string(),
  created_at: z.string().datetime(),
});

// ページネーション情報
export const PaginationSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total_pages: z.number().int().min(0),
});

// 日報一覧項目
export const DailyReportListItemSchema = z.object({
  id: z.number().int().positive(),
  report_date: DateStringSchema,
  sales_person: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  visit_count: z.number().int().min(0),
  has_comments: z.boolean(),
  created_at: z.string().datetime(),
});

// 日報一覧レスポンス
export const DailyReportListResponseSchema = z.object({
  data: z.array(DailyReportListItemSchema),
  pagination: PaginationSchema,
});

// 日報詳細
export const DailyReportDetailSchema = z.object({
  id: z.number().int().positive(),
  report_date: DateStringSchema,
  sales_person: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    email: z.string().email(),
  }),
  problem: z
    .string()
    .min(1, '課題・相談事項は必須です')
    .max(1000, '課題・相談事項は1000文字以内で入力してください'),
  plan: z
    .string()
    .min(1, '明日の計画は必須です')
    .max(1000, '明日の計画は1000文字以内で入力してください'),
  visits: z.array(VisitRecordSchema),
  comments: z.array(ManagerCommentSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// 日報作成リクエスト
export const CreateReportRequestSchema = z.object({
  report_date: DateStringSchema,
  problem: z
    .string()
    .min(1, '課題・相談事項は必須です')
    .max(1000, '課題・相談事項は1000文字以内で入力してください'),
  plan: z
    .string()
    .min(1, '明日の計画は必須です')
    .max(1000, '明日の計画は1000文字以内で入力してください'),
  visits: z.array(VisitRecordInputSchema).min(1, '訪問記録は最低1件必要です'),
});

// 日報更新リクエスト
export const UpdateReportRequestSchema = z.object({
  problem: z
    .string()
    .min(1, '課題・相談事項は必須です')
    .max(1000, '課題・相談事項は1000文字以内で入力してください')
    .optional(),
  plan: z
    .string()
    .min(1, '明日の計画は必須です')
    .max(1000, '明日の計画は1000文字以内で入力してください')
    .optional(),
  visits: z.array(VisitRecordInputSchema).optional(),
});

// 日報一覧クエリ
export const ReportQuerySchema = z.object({
  start_date: DateStringSchema.optional(),
  end_date: DateStringSchema.optional(),
  sales_person_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val > 0, {
      message: 'sales_person_id must be a positive integer',
    }),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: 'page must be a positive integer',
    }),
  per_page: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'per_page must be between 1 and 100',
    }),
});

// 日報作成レスポンス
export const CreateReportResponseSchema = z.object({
  id: z.number().int().positive(),
  report_date: DateStringSchema,
  sales_person_id: z.number().int().positive(),
  problem: z.string(),
  plan: z.string(),
  created_at: z.string().datetime(),
});

// 日報更新レスポンス
export const UpdateReportResponseSchema = z.object({
  id: z.number().int().positive(),
  report_date: DateStringSchema,
  sales_person_id: z.number().int().positive(),
  problem: z.string(),
  plan: z.string(),
  updated_at: z.string().datetime(),
});

// コメント作成リクエスト
export const CreateCommentRequestSchema = z.object({
  comment: z
    .string()
    .min(1, 'コメントは必須です')
    .max(500, 'コメントは500文字以内で入力してください'),
});

// コメント作成レスポンス
export const CreateCommentResponseSchema = z.object({
  id: z.number().int().positive(),
  report_id: z.number().int().positive(),
  manager_id: z.number().int().positive(),
  comment: z.string(),
  created_at: z.string().datetime(),
});

export type VisitRecord = z.infer<typeof VisitRecordSchema>;
export type VisitRecordInput = z.infer<typeof VisitRecordInputSchema>;
export type ManagerComment = z.infer<typeof ManagerCommentSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type DailyReportListItem = z.infer<typeof DailyReportListItemSchema>;
export type DailyReportListResponse = z.infer<typeof DailyReportListResponseSchema>;
export type DailyReportDetail = z.infer<typeof DailyReportDetailSchema>;
export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;
export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
export type CreateReportResponse = z.infer<typeof CreateReportResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>;
