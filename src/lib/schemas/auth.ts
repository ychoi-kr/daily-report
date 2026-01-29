import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// ログインリクエスト
export const LoginRequestSchema = z
  .object({
    email: z.string().email('유효한 이메일 주소를 입력해주세요'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  })
  .openapi('LoginRequest', {
    description: '로그인 리퀘스트',
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
  name: z.string().min(1, '이름은 필수입니다'),
  email: z.string().email(),
  department: z.string(),
  is_manager: z.boolean(),
});

// ログアウトは204 No Content のため、スキーマ不要

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type User = z.infer<typeof UserSchema>;
