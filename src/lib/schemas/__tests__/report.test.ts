import { describe, it, expect } from 'vitest';
import {
  CreateReportRequestSchema,
  UpdateReportRequestSchema,
  VisitRecordInputSchema,
  CreateCommentRequestSchema,
} from '../report';

describe('Report Schemas', () => {
  describe('VisitRecordInputSchema', () => {
    it('should validate visit record with all fields', () => {
      const validVisit = {
        customer_id: 1,
        visit_time: '10:00',
        visit_content: '新商品の提案を実施しました',
      };

      const result = VisitRecordInputSchema.parse(validVisit);
      expect(result).toEqual(validVisit);
    });

    it('should validate visit record without visit_time', () => {
      const validVisit = {
        customer_id: 1,
        visit_content: '新商品の提案を実施しました',
      };

      const result = VisitRecordInputSchema.parse(validVisit);
      expect(result).toEqual(validVisit);
    });

    it('should fail validation for empty visit_content', () => {
      const invalidVisit = {
        customer_id: 1,
        visit_content: '',
      };

      expect(() => VisitRecordInputSchema.parse(invalidVisit)).toThrow();
    });

    it('should fail validation for visit_content over 500 characters', () => {
      const invalidVisit = {
        customer_id: 1,
        visit_content: 'a'.repeat(501),
      };

      expect(() => VisitRecordInputSchema.parse(invalidVisit)).toThrow();
    });

    it('should fail validation for invalid customer_id', () => {
      const invalidVisit = {
        customer_id: 0,
        visit_content: '新商品の提案を実施しました',
      };

      expect(() => VisitRecordInputSchema.parse(invalidVisit)).toThrow();
    });

    it('should fail validation for invalid visit_time format', () => {
      const invalidVisit = {
        customer_id: 1,
        visit_time: '25:00',
        visit_content: '新商品の提案を実施しました',
      };

      expect(() => VisitRecordInputSchema.parse(invalidVisit)).toThrow();
    });
  });

  describe('CreateReportRequestSchema', () => {
    it('should validate complete report request', () => {
      const validRequest = {
        report_date: '2025-07-27',
        problem: '新規開拓の進捗が遅れている',
        plan: 'ABC商事への見積もり作成を行う',
        visits: [
          {
            customer_id: 1,
            visit_time: '10:00',
            visit_content: '新商品の提案を実施',
          },
          {
            customer_id: 2,
            visit_content: '既存システムの保守相談',
          },
        ],
      };

      const result = CreateReportRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should fail validation for invalid report_date format', () => {
      const invalidRequest = {
        report_date: '2025/07/27',
        problem: '新規開拓の進捗が遅れている',
        plan: 'ABC商事への見積もり作成を行う',
        visits: [
          {
            customer_id: 1,
            visit_content: '新商品の提案を実施',
          },
        ],
      };

      expect(() => CreateReportRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation for empty problem', () => {
      const invalidRequest = {
        report_date: '2025-07-27',
        problem: '',
        plan: 'ABC商事への見積もり作成を行う',
        visits: [
          {
            customer_id: 1,
            visit_content: '新商品の提案を実施',
          },
        ],
      };

      expect(() => CreateReportRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation for problem over 1000 characters', () => {
      const invalidRequest = {
        report_date: '2025-07-27',
        problem: 'a'.repeat(1001),
        plan: 'ABC商事への見積もり作成を行う',
        visits: [
          {
            customer_id: 1,
            visit_content: '新商品の提案を実施',
          },
        ],
      };

      expect(() => CreateReportRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation for empty visits array', () => {
      const invalidRequest = {
        report_date: '2025-07-27',
        problem: '新規開拓の進捗が遅れている',
        plan: 'ABC商事への見積もり作成を行う',
        visits: [],
      };

      expect(() => CreateReportRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('UpdateReportRequestSchema', () => {
    it('should validate partial update with some fields', () => {
      const validRequest = {
        problem: '更新された課題',
        visits: [
          {
            id: 1,
            customer_id: 1,
            visit_content: '更新された訪問内容',
          },
        ],
      };

      const result = UpdateReportRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should validate empty update request', () => {
      const emptyRequest = {};

      const result = UpdateReportRequestSchema.parse(emptyRequest);
      expect(result).toEqual({});
    });

    it('should fail validation for invalid problem length', () => {
      const invalidRequest = {
        problem: 'a'.repeat(1001),
      };

      expect(() => UpdateReportRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('CreateCommentRequestSchema', () => {
    it('should validate comment request', () => {
      const validRequest = {
        comment: '新規開拓については明日相談しましょう。',
      };

      const result = CreateCommentRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should fail validation for empty comment', () => {
      const invalidRequest = {
        comment: '',
      };

      expect(() => CreateCommentRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should fail validation for comment over 500 characters', () => {
      const invalidRequest = {
        comment: 'a'.repeat(501),
      };

      expect(() => CreateCommentRequestSchema.parse(invalidRequest)).toThrow();
    });
  });
});
