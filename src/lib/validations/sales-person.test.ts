import { describe, it, expect } from 'vitest';
import {
  createSalesPersonSchema,
  updateSalesPersonSchema,
  resetPasswordSchema,
  searchSalesPersonSchema,
} from './sales-person';

describe('Sales Person Validation Schemas', () => {
  describe('createSalesPersonSchema', () => {
    it('有効なデータで成功する', () => {
      const validData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        password: 'Password123',
        department: '営業1課',
        is_manager: false,
        is_active: true,
      };

      const result = createSalesPersonSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('必須項目が不足している場合エラー', () => {
      const invalidData = {
        email: 'yamada@example.com',
        password: 'Password123',
        // name, departmentが不足
      };

      const result = createSalesPersonSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map((e) => e.path[0]);
        expect(errors).toContain('name');
        expect(errors).toContain('department');
      }
    });

    it('メールアドレスの形式チェック', () => {
      const testCases = [
        { email: 'invalid-email', shouldPass: false },
        { email: 'test@', shouldPass: false },
        { email: '@example.com', shouldPass: false },
        { email: 'test@example', shouldPass: false },
        { email: 'test@example.com', shouldPass: true },
        { email: 'test.name+tag@example.co.jp', shouldPass: true },
      ];

      testCases.forEach(({ email, shouldPass }) => {
        const data = {
          name: '山田太郎',
          email,
          password: 'Password123',
          department: '営業1課',
        };

        const result = createSalesPersonSchema.safeParse(data);
        expect(result.success).toBe(shouldPass);
      });
    });

    it('パスワードの複雑性チェック', () => {
      const testCases = [
        { password: 'password', shouldPass: false }, // 大文字・数字なし
        { password: 'PASSWORD', shouldPass: false }, // 小文字・数字なし
        { password: '12345678', shouldPass: false }, // 文字なし
        { password: 'Password', shouldPass: false }, // 数字なし
        { password: 'password123', shouldPass: false }, // 大文字なし
        { password: 'PASSWORD123', shouldPass: false }, // 小文字なし
        { password: 'Password123', shouldPass: true }, // すべて含む
        { password: 'MySecure123', shouldPass: true }, // すべて含む
      ];

      testCases.forEach(({ password, shouldPass }) => {
        const data = {
          name: '山田太郎',
          email: 'yamada@example.com',
          password,
          department: '営業1課',
        };

        const result = createSalesPersonSchema.safeParse(data);
        expect(result.success).toBe(shouldPass);
      });
    });

    it('文字数制限チェック', () => {
      const baseData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        password: 'Password123',
        department: '営業1課',
      };

      // 氏名の文字数制限
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          name: '',
        }).success
      ).toBe(false);
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          name: 'a'.repeat(101),
        }).success
      ).toBe(false);
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          name: 'a'.repeat(100),
        }).success
      ).toBe(true);

      // メールアドレスの文字数制限
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          email: 'a'.repeat(250) + '@example.com',
        }).success
      ).toBe(false);

      // パスワードの文字数制限
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          password: 'Pass1', // 7文字（8文字未満）
        }).success
      ).toBe(false);
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          password: 'P'.repeat(101) + 'a1', // 101文字を超える
        }).success
      ).toBe(false);

      // 部署の文字数制限
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          department: '',
        }).success
      ).toBe(false);
      expect(
        createSalesPersonSchema.safeParse({
          ...baseData,
          department: 'a'.repeat(101),
        }).success
      ).toBe(false);
    });

    it('デフォルト値が正しく設定される', () => {
      const minimalData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        password: 'Password123',
        department: '営業1課',
      };

      const result = createSalesPersonSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_manager).toBe(false);
        expect(result.data.is_active).toBe(true);
      }
    });
  });

  describe('updateSalesPersonSchema', () => {
    it('部分的な更新データで成功する', () => {
      const updateData = {
        name: '山田次郎',
        is_manager: true,
      };

      const result = updateSalesPersonSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('空のオブジェクトでも成功する', () => {
      const result = updateSalesPersonSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('不正なメールアドレスでエラー', () => {
      const updateData = {
        email: 'invalid-email',
      };

      const result = updateSalesPersonSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('一致するパスワードで成功する', () => {
      const data = {
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('パスワードが一致しない場合エラー', () => {
      const data = {
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      };

      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (e) => e.path.includes('confirmPassword')
        );
        expect(confirmPasswordError?.message).toBe('パスワードが一致しません');
      }
    });

    it('確認用パスワードが空の場合エラー', () => {
      const data = {
        password: 'NewPassword123',
        confirmPassword: '',
      };

      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('パスワードの複雑性チェックが機能する', () => {
      const data = {
        password: 'simple',
        confirmPassword: 'simple',
      };

      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('searchSalesPersonSchema', () => {
    it('すべてのパラメータが有効', () => {
      const searchData = {
        search: '山田',
        department: '営業課',
        is_manager: true,
        is_active: false,
        page: 2,
        per_page: 10,
      };

      const result = searchSalesPersonSchema.safeParse(searchData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(searchData);
      }
    });

    it('空のパラメータでデフォルト値が設定される', () => {
      const result = searchSalesPersonSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.per_page).toBe(20);
      }
    });

    it('ページ番号の境界値チェック', () => {
      // 不正な値
      expect(searchSalesPersonSchema.safeParse({ page: 0 }).success).toBe(false);
      expect(searchSalesPersonSchema.safeParse({ page: -1 }).success).toBe(false);

      // 有効な値
      expect(searchSalesPersonSchema.safeParse({ page: 1 }).success).toBe(true);
      expect(searchSalesPersonSchema.safeParse({ page: 100 }).success).toBe(true);
    });

    it('1ページあたりの件数の境界値チェック', () => {
      // 不正な値
      expect(searchSalesPersonSchema.safeParse({ per_page: 0 }).success).toBe(false);
      expect(searchSalesPersonSchema.safeParse({ per_page: 101 }).success).toBe(false);

      // 有効な値
      expect(searchSalesPersonSchema.safeParse({ per_page: 1 }).success).toBe(true);
      expect(searchSalesPersonSchema.safeParse({ per_page: 100 }).success).toBe(true);
    });

    it('ブール値の変換が正しく動作する', () => {
      const testCases = [
        { input: { is_manager: true }, expected: true },
        { input: { is_manager: false }, expected: false },
        { input: { is_active: true }, expected: true },
        { input: { is_active: false }, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = searchSalesPersonSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          if ('is_manager' in input) {
            expect(result.data.is_manager).toBe(expected);
          }
          if ('is_active' in input) {
            expect(result.data.is_active).toBe(expected);
          }
        }
      });
    });
  });
});