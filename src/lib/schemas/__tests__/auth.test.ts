import { describe, it, expect } from 'vitest';
import { LoginRequestSchema, LoginResponseSchema, UserSchema } from '../auth';

describe('Auth Schemas', () => {
  describe('LoginRequestSchema', () => {
    it('should validate login request with correct email and password', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = LoginRequestSchema.parse(validLogin);
      expect(result).toEqual(validLogin);
    });

    it('should fail validation for invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123',
      };

      expect(() => LoginRequestSchema.parse(invalidLogin)).toThrow();
    });

    it('should fail validation for short password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: '1234567', // 7文字
      };

      expect(() => LoginRequestSchema.parse(invalidLogin)).toThrow();
    });

    it('should fail validation for missing fields', () => {
      const incompleteLogin = {
        email: 'user@example.com',
      };

      expect(() => LoginRequestSchema.parse(incompleteLogin)).toThrow();
    });
  });

  describe('LoginResponseSchema', () => {
    it('should validate complete login response', () => {
      const validResponse = {
        token: 'eyJhbGciOiJIUzI1NiIs...',
        expires_at: '2025-07-28T12:00:00Z',
        user: {
          id: 1,
          name: '山田太郎',
          email: 'yamada@example.com',
          department: '営業1課',
          is_manager: false,
        },
      };

      const result = LoginResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should fail validation for invalid user ID', () => {
      const invalidResponse = {
        token: 'eyJhbGciOiJIUzI1NiIs...',
        expires_at: '2025-07-28T12:00:00Z',
        user: {
          id: 0, // 0は無効
          name: '山田太郎',
          email: 'yamada@example.com',
          department: '営業1課',
          is_manager: false,
        },
      };

      expect(() => LoginResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should fail validation for invalid user email', () => {
      const invalidResponse = {
        token: 'eyJhbGciOiJIUzI1NiIs...',
        expires_at: '2025-07-28T12:00:00Z',
        user: {
          id: 1,
          name: '山田太郎',
          email: 'invalid-email',
          department: '営業1課',
          is_manager: false,
        },
      };

      expect(() => LoginResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('UserSchema', () => {
    it('should validate user with all required fields', () => {
      const validUser = {
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: true,
      };

      const result = UserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it('should fail validation for negative ID', () => {
      const invalidUser = {
        id: -1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: false,
      };

      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });

    it('should fail validation for empty name', () => {
      const invalidUser = {
        id: 1,
        name: '',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: false,
      };

      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });

    it('should fail validation for non-boolean is_manager', () => {
      const invalidUser = {
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: 'true', // 文字列は無効
      };

      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });
  });
});
