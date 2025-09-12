import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// 日報バリデーションスキーマを定義
export const ReportCreateSchema = z.object({
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  problem: z.string().min(1, '課題・相談事項は必須項目です').max(1000, '課題・相談事項は1000文字以内で入力してください'),
  plan: z.string().min(1, '明日の計画は必須項目です').max(1000, '明日の計画は1000文字以内で入力してください'),
  visits: z.array(
    z.object({
      customer_id: z.number().int().positive('顧客IDは正の整数である必要があります'),
      visit_content: z.string().min(1, '訪問内容は必須項目です').max(500, '訪問内容は500文字以内で入力してください'),
      visit_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '訪問時刻は HH:MM 形式で入力してください').optional().or(z.literal('')),
    })
  ).min(1, '最低1件の訪問記録が必要です'),
});

export const ReportUpdateSchema = z.object({
  problem: z.string().min(1, '課題・相談事項は必須項目です').max(1000, '課題・相談事項は1000文字以内で入力してください').optional(),
  plan: z.string().min(1, '明日の計画は必須項目です').max(1000, '明日の計画は1000文字以内で入力してください').optional(),
  visits: z.array(
    z.object({
      id: z.number().int().positive().optional(),
      customer_id: z.number().int().positive('顧客IDは正の整数である必要があります'),
      visit_content: z.string().min(1, '訪問内容は必須項目です').max(500, '訪問内容は500文字以内で入力してください'),
      visit_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '訪問時刻は HH:MM 形式で入力してください').optional().or(z.literal('')),
    })
  ).optional(),
});

export const CommentCreateSchema = z.object({
  comment: z.string().min(1, 'コメントは必須項目です').max(500, 'コメントは500文字以内で入力してください'),
});

// 日付バリデーション関数
export function validateReportDate(dateString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 基本フォーマットチェック
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    errors.push('日付はYYYY-MM-DD形式で入力してください');
    return { isValid: false, errors };
  }

  const date = new Date(dateString);
  const today = new Date();
  
  // 有効な日付かチェック
  if (isNaN(date.getTime())) {
    errors.push('有効な日付を入力してください');
  }

  // 未来の日付チェック
  if (date > today) {
    errors.push('未来の日付は入力できません');
  }

  // 過去90日以内チェック
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(today.getDate() - 90);
  if (date < ninetyDaysAgo) {
    errors.push('90日以前の日報は作成できません');
  }

  return { isValid: errors.length === 0, errors };
}

// 訪問時刻バリデーション関数
export function validateVisitTime(timeString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!timeString || timeString === '') {
    return { isValid: true, errors }; // 任意項目のため、空文字は有効
  }

  // 時刻フォーマットチェック
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
    errors.push('時刻はHH:MM形式で入力してください（例: 09:30）');
    return { isValid: false, errors };
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  
  // 営業時間チェック（8:00-20:00）
  if (hours < 8 || hours > 20) {
    errors.push('訪問時刻は営業時間内（08:00-20:00）で入力してください');
  }

  return { isValid: errors.length === 0, errors };
}

describe('Report Validations', () => {
  describe('ReportCreateSchema', () => {
    it('有効なデータで検証が通る', () => {
      const validData = {
        report_date: '2025-01-15',
        problem: 'テスト課題です',
        plan: 'テスト計画です',
        visits: [
          {
            customer_id: 1,
            visit_content: '訪問内容です',
            visit_time: '10:30',
          },
        ],
      };

      const result = ReportCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('必須項目が欠けている場合にエラーを返す', () => {
      const invalidData = {
        report_date: '2025-01-15',
        problem: '',
        plan: 'テスト計画です',
        visits: [],
      };

      const result = ReportCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('課題・相談事項は必須項目です');
        expect(errors).toContain('最低1件の訪問記録が必要です');
      }
    });

    it('文字数制限を超過した場合にエラーを返す', () => {
      const invalidData = {
        report_date: '2025-01-15',
        problem: 'a'.repeat(1001), // 1001文字
        plan: 'テスト計画です',
        visits: [
          {
            customer_id: 1,
            visit_content: 'b'.repeat(501), // 501文字
            visit_time: '10:30',
          },
        ],
      };

      const result = ReportCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('課題・相談事項は1000文字以内で入力してください');
        expect(errors).toContain('訪問内容は500文字以内で入力してください');
      }
    });

    it('不正な日付フォーマットでエラーを返す', () => {
      const invalidData = {
        report_date: '2025/01/15', // スラッシュ区切り
        problem: 'テスト課題です',
        plan: 'テスト計画です',
        visits: [
          {
            customer_id: 1,
            visit_content: '訪問内容です',
          },
        ],
      };

      const result = ReportCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('日付はYYYY-MM-DD形式で入力してください');
      }
    });

    it('不正な訪問時刻フォーマットでエラーを返す', () => {
      const invalidData = {
        report_date: '2025-01-15',
        problem: 'テスト課題です',
        plan: 'テスト計画です',
        visits: [
          {
            customer_id: 1,
            visit_content: '訪問内容です',
            visit_time: '25:70', // 無効な時刻
          },
        ],
      };

      const result = ReportCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('訪問時刻は HH:MM 形式で入力してください');
      }
    });

    it('負の顧客IDでエラーを返す', () => {
      const invalidData = {
        report_date: '2025-01-15',
        problem: 'テスト課題です',
        plan: 'テスト計画です',
        visits: [
          {
            customer_id: -1, // 負の値
            visit_content: '訪問内容です',
          },
        ],
      };

      const result = ReportCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('顧客IDは正の整数である必要があります');
      }
    });
  });

  describe('ReportUpdateSchema', () => {
    it('部分的な更新データで検証が通る', () => {
      const partialData = {
        problem: '更新された課題',
      };

      const result = ReportUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('空のオブジェクトで検証が通る', () => {
      const emptyData = {};

      const result = ReportUpdateSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it('訪問記録の更新で検証が通る', () => {
      const updateData = {
        visits: [
          {
            id: 1,
            customer_id: 1,
            visit_content: '更新された訪問内容',
            visit_time: '14:00',
          },
          {
            customer_id: 2,
            visit_content: '新しい訪問内容',
          },
        ],
      };

      const result = ReportUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('不正なデータで検証が失敗する', () => {
      const invalidData = {
        problem: '', // 空文字
        visits: [
          {
            customer_id: 0, // ゼロ
            visit_content: '',
          },
        ],
      };

      const result = ReportUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CommentCreateSchema', () => {
    it('有効なコメントで検証が通る', () => {
      const validData = {
        comment: 'これは有効なコメントです。',
      };

      const result = CommentCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('空のコメントでエラーを返す', () => {
      const invalidData = {
        comment: '',
      };

      const result = CommentCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('コメントは必須項目です');
      }
    });

    it('文字数制限を超過したコメントでエラーを返す', () => {
      const invalidData = {
        comment: 'x'.repeat(501), // 501文字
      };

      const result = CommentCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('コメントは500文字以内で入力してください');
      }
    });
  });

  describe('validateReportDate', () => {
    it('有効な今日の日付で成功する', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = validateReportDate(today);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('不正なフォーマットでエラーを返す', () => {
      const result = validateReportDate('2025/01/15');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('日付はYYYY-MM-DD形式で入力してください');
    });

    it('無効な日付でエラーを返す', () => {
      const result = validateReportDate('2025-13-32');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('有効な日付を入力してください');
    });

    it('未来の日付でエラーを返す', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      const result = validateReportDate(tomorrowString);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('未来の日付は入力できません');
    });

    it('90日以前の日付でエラーを返す', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91);
      const oldDateString = oldDate.toISOString().split('T')[0];
      
      const result = validateReportDate(oldDateString);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('90日以前の日報は作成できません');
    });
  });

  describe('validateVisitTime', () => {
    it('有効な時刻で成功する', () => {
      const validTimes = ['09:30', '14:15', '08:00', '20:00', '12:00'];
      
      validTimes.forEach(time => {
        const result = validateVisitTime(time);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('空文字で成功する（任意項目）', () => {
      const result = validateVisitTime('');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('不正な時刻フォーマットでエラーを返す', () => {
      const invalidTimes = ['9:30', '14:5', '25:00', '12:60', 'abc', '1400'];
      
      invalidTimes.forEach(time => {
        const result = validateVisitTime(time);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('時刻はHH:MM形式で入力してください（例: 09:30）');
      });
    });

    it('営業時間外でエラーを返す', () => {
      const outsideHours = ['07:59', '20:01', '06:00', '22:00'];
      
      outsideHours.forEach(time => {
        const result = validateVisitTime(time);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('訪問時刻は営業時間内（08:00-20:00）で入力してください');
      });
    });

    it('営業時間境界値で成功する', () => {
      const boundaryTimes = ['08:00', '20:00'];
      
      boundaryTimes.forEach(time => {
        const result = validateVisitTime(time);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('複数のエラーを正しく報告する', () => {
      const result = validateVisitTime('25:70');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('時刻はHH:MM形式で入力してください（例: 09:30）');
    });
  });

  describe('境界値テスト', () => {
    it('文字数制限の境界値をテストする', () => {
      // 1000文字ちょうど（課題・計画）
      const exactly1000 = 'a'.repeat(1000);
      const problem1000 = ReportCreateSchema.shape.problem.safeParse(exactly1000);
      expect(problem1000.success).toBe(true);

      const over1000 = 'a'.repeat(1001);
      const problemOver1000 = ReportCreateSchema.shape.problem.safeParse(over1000);
      expect(problemOver1000.success).toBe(false);

      // 500文字ちょうど（訪問内容）
      const exactly500 = 'b'.repeat(500);
      const visitContentSchema = ReportCreateSchema.shape.visits.element.shape.visit_content;
      const visitContent500 = visitContentSchema.safeParse(exactly500);
      expect(visitContent500.success).toBe(true);

      const over500 = 'b'.repeat(501);
      const visitContentOver500 = visitContentSchema.safeParse(over500);
      expect(visitContentOver500.success).toBe(false);
    });

    it('顧客IDの境界値をテストする', () => {
      const customerIdSchema = ReportCreateSchema.shape.visits.element.shape.customer_id;
      
      // 正の整数
      expect(customerIdSchema.safeParse(1).success).toBe(true);
      expect(customerIdSchema.safeParse(999999).success).toBe(true);
      
      // 不正な値
      expect(customerIdSchema.safeParse(0).success).toBe(false);
      expect(customerIdSchema.safeParse(-1).success).toBe(false);
      expect(customerIdSchema.safeParse(1.5).success).toBe(false);
    });

    it('時刻の境界値をテストする', () => {
      const timeSchema = ReportCreateSchema.shape.visits.element.shape.visit_time;
      
      // 有効な境界値
      expect(timeSchema.safeParse('00:00').success).toBe(true);
      expect(timeSchema.safeParse('23:59').success).toBe(true);
      expect(timeSchema.safeParse('').success).toBe(true);
      
      // 無効な境界値
      expect(timeSchema.safeParse('24:00').success).toBe(false);
      expect(timeSchema.safeParse('23:60').success).toBe(false);
    });
  });

  describe('特殊文字とエンコーディングテスト', () => {
    it('日本語文字を正しく処理する', () => {
      const validData = {
        report_date: '2025-01-15',
        problem: 'これは日本語の課題です。特殊文字も含みます：！？＠＃',
        plan: '明日の計画：顧客A社への訪問（午前10時）',
        visits: [
          {
            customer_id: 1,
            visit_content: 'お客様との打ち合わせ内容について。資料の説明を行いました。',
            visit_time: '10:30',
          },
        ],
      };

      const result = ReportCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('特殊文字を含む文字数制限をテストする', () => {
      // 日本語文字も1文字としてカウントされることを確認
      const japaneseChars = 'あ'.repeat(1000);
      const result = ReportCreateSchema.shape.problem.safeParse(japaneseChars);
      expect(result.success).toBe(true);

      const tooManyJapaneseChars = 'あ'.repeat(1001);
      const tooManyResult = ReportCreateSchema.shape.problem.safeParse(tooManyJapaneseChars);
      expect(tooManyResult.success).toBe(false);
    });
  });
});