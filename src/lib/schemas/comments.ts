import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// コメント作成リクエスト
export const CreateCommentRequestSchema = z
  .object({
    comment: z
      .string()
      .min(1, 'コメントは必須項目です')
      .max(500, 'コメントは500文字以内で入力してください'),
  })
  .openapi('CreateCommentRequest', {
    description: '日報へのコメント作成リクエスト',
    example: {
      comment: '新規開拓については明日相談しましょう。',
    },
  });

// コメント情報
export const CommentSchema = z
  .object({
    id: z.number().int().positive(),
    report_id: z.number().int().positive(),
    manager_id: z.number().int().positive(),
    manager: z.object({
      id: z.number().int().positive(),
      name: z.string(),
    }),
    comment: z.string(),
    created_at: z.string().datetime(),
  })
  .openapi('Comment', {
    description: '日報コメント情報',
    example: {
      id: 1,
      report_id: 1,
      manager_id: 2,
      manager: {
        id: 2,
        name: '田中部長',
      },
      comment: '新規開拓については明日相談しましょう。',
      created_at: '2025-07-27T18:00:00Z',
    },
  });

// コメント一覧レスポンス
export const CommentsListResponseSchema = z
  .object({
    data: z.array(CommentSchema),
  })
  .openapi('CommentsListResponse', {
    description: '日報コメント一覧レスポンス',
  });

// コメント作成レスポンス
export const CreateCommentResponseSchema = CommentSchema.openapi('CreateCommentResponse', {
  description: '日報コメント作成レスポンス',
});

// エラーレスポンス
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
        message: '入力値が不正です',
        details: [
          {
            field: 'comment',
            message: 'コメントは必須項目です',
          },
        ],
      },
    },
  });

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type CommentsListResponse = z.infer<typeof CommentsListResponseSchema>;
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;