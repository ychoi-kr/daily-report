import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// ログインリクエスト
export const LoginRequestSchema = z
  .object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  })
  .openapi('LoginRequest', {
    description: 'ログインリクエスト',
    example: {
      email: 'yamada@example.com',
      password: 'password123',
    },
  });

// ログインレスポンス
export const LoginResponseSchema = z.object({
  token: z.string(),
  expires_at: z.string().datetime(),
  user: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    email: z.string().email(),
    department: z.string(),
    is_manager: z.boolean(),
  }),
});

// ユーザー情報
export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  department: z.string(),
  is_manager: z.boolean(),
});

// ログアウトは204 No Content のため、スキーマ不要

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type User = z.infer<typeof UserSchema>;
