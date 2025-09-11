import { describe, it, expect } from 'vitest';
import { PasswordUtil } from '../password';

describe('PasswordUtil', () => {
  const testPassword = 'TestPassword123';

  describe('hashPassword', () => {
    it('パスワードをハッシュ化できる', async () => {
      const hashedPassword = await PasswordUtil.hashPassword(testPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcryptハッシュの長さ確認
    });

    it('同じパスワードでも毎回異なるハッシュを生成する', async () => {
      const hash1 = await PasswordUtil.hashPassword(testPassword);
      const hash2 = await PasswordUtil.hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    }, 10000); // 10秒のタイムアウト
  });

  describe('verifyPassword', () => {
    it('正しいパスワードに対してtrueを返す', async () => {
      const hashedPassword = await PasswordUtil.hashPassword(testPassword);
      const isValid = await PasswordUtil.verifyPassword(
        testPassword,
        hashedPassword
      );

      expect(isValid).toBe(true);
    }, 10000); // 10秒のタイムアウト

    it('誤ったパスワードに対してfalseを返す', async () => {
      const hashedPassword = await PasswordUtil.hashPassword(testPassword);
      const isValid = await PasswordUtil.verifyPassword(
        'WrongPassword',
        hashedPassword
      );

      expect(isValid).toBe(false);
    });

    it('空文字列のパスワードに対してfalseを返す', async () => {
      const hashedPassword = await PasswordUtil.hashPassword(testPassword);
      const isValid = await PasswordUtil.verifyPassword('', hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('強いパスワードに対して有効であることを返す', () => {
      const result = PasswordUtil.validatePasswordStrength('StrongPassword123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('短すぎるパスワードに対してエラーを返す', () => {
      const result = PasswordUtil.validatePasswordStrength('Abc1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'パスワードは8文字以上である必要があります'
      );
    });

    it('大文字が含まれていないパスワードに対してエラーを返す', () => {
      const result = PasswordUtil.validatePasswordStrength('password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'パスワードには大文字を含む必要があります'
      );
    });

    it('小文字が含まれていないパスワードに対してエラーを返す', () => {
      const result = PasswordUtil.validatePasswordStrength('PASSWORD123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'パスワードには小文字を含む必要があります'
      );
    });

    it('数字が含まれていないパスワードに対してエラーを返す', () => {
      const result = PasswordUtil.validatePasswordStrength('Password');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードには数字を含む必要があります');
    });

    it('複数の条件に違反する場合、全てのエラーを返す', () => {
      const result = PasswordUtil.validatePasswordStrength('abc');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'パスワードは8文字以上である必要があります'
      );
      expect(result.errors).toContain(
        'パスワードには大文字を含む必要があります'
      );
      expect(result.errors).toContain('パスワードには数字を含む必要があります');
      expect(result.errors.length).toBe(3);
    });
  });

  describe('integration test', () => {
    it('ハッシュ化と検証の統合テスト', async () => {
      const password = 'TestPassword123';

      // ハッシュ化
      const hashedPassword = await PasswordUtil.hashPassword(password);

      // 強度チェック
      const strengthResult = PasswordUtil.validatePasswordStrength(password);
      expect(strengthResult.isValid).toBe(true);

      // 検証
      const isValid = await PasswordUtil.verifyPassword(
        password,
        hashedPassword
      );
      expect(isValid).toBe(true);

      // 誤ったパスワードでの検証
      const isInvalid = await PasswordUtil.verifyPassword(
        'WrongPassword',
        hashedPassword
      );
      expect(isInvalid).toBe(false);
    }, 10000); // 10秒のタイムアウト
  });
});
