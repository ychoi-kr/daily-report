import { describe, it, expect } from 'vitest';
import {
  ErrorResponseSchema,
  PaginationSchema,
  PaginationQuerySchema,
  DateStringSchema,
  TimeStringSchema,
  IdParamSchema,
} from '../common';

describe('Common Schemas', () => {
  describe('ErrorResponseSchema', () => {
    it('should validate error response with all fields', () => {
      const validError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'email',
              message: 'Invalid email format',
            },
          ],
        },
      };

      const result = ErrorResponseSchema.parse(validError);
      expect(result).toEqual(validError);
    });

    it('should validate error response without details', () => {
      const validError = {
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };

      const result = ErrorResponseSchema.parse(validError);
      expect(result).toEqual(validError);
    });

    it('should fail validation for missing required fields', () => {
      const invalidError = {
        error: {
          code: 'ERROR_CODE',
        },
      };

      expect(() => ErrorResponseSchema.parse(invalidError)).toThrow();
    });
  });

  describe('PaginationSchema', () => {
    it('should validate pagination with valid values', () => {
      const validPagination = {
        total: 100,
        page: 1,
        per_page: 20,
        total_pages: 5,
      };

      const result = PaginationSchema.parse(validPagination);
      expect(result).toEqual(validPagination);
    });

    it('should fail validation for negative total', () => {
      const invalidPagination = {
        total: -1,
        page: 1,
        per_page: 20,
        total_pages: 5,
      };

      expect(() => PaginationSchema.parse(invalidPagination)).toThrow();
    });

    it('should fail validation for page less than 1', () => {
      const invalidPagination = {
        total: 100,
        page: 0,
        per_page: 20,
        total_pages: 5,
      };

      expect(() => PaginationSchema.parse(invalidPagination)).toThrow();
    });
  });

  describe('PaginationQuerySchema', () => {
    it('should transform string values to numbers', () => {
      const query = {
        page: '2',
        per_page: '50',
      };

      const result = PaginationQuerySchema.parse(query);
      expect(result).toEqual({ page: 2, per_page: 50 });
    });

    it('should use default values when not provided', () => {
      const query = {};

      const result = PaginationQuerySchema.parse(query);
      expect(result).toEqual({ page: 1, per_page: 20 });
    });

    it('should fail validation for per_page > 100', () => {
      const query = {
        per_page: '200',
      };

      expect(() => PaginationQuerySchema.parse(query)).toThrow();
    });
  });

  describe('DateStringSchema', () => {
    it('should validate correct date format', () => {
      const validDates = ['2025-01-01', '2025-12-31', '2025-07-15'];

      validDates.forEach((date) => {
        const result = DateStringSchema.parse(date);
        expect(result).toBe(date);
      });
    });

    it('should fail validation for incorrect date format', () => {
      const invalidDates = ['2025/01/01', '25-01-01', '2025-1-1', '2025-01-32'];

      invalidDates.forEach((date) => {
        expect(() => DateStringSchema.parse(date)).toThrow();
      });
    });
  });

  describe('TimeStringSchema', () => {
    it('should validate correct time format', () => {
      const validTimes = ['00:00', '12:30', '23:59', '09:15'];

      validTimes.forEach((time) => {
        const result = TimeStringSchema.parse(time);
        expect(result).toBe(time);
      });
    });

    it('should fail validation for incorrect time format', () => {
      const invalidTimes = ['24:00', '12:60', '1:30', '12:5'];

      invalidTimes.forEach((time) => {
        expect(() => TimeStringSchema.parse(time)).toThrow();
      });
    });
  });

  describe('IdParamSchema', () => {
    it('should transform string ID to number', () => {
      const param = { id: '123' };

      const result = IdParamSchema.parse(param);
      expect(result).toEqual({ id: 123 });
    });

    it('should fail validation for non-positive ID', () => {
      const invalidParams = [{ id: '0' }, { id: '-1' }];

      invalidParams.forEach((param) => {
        expect(() => IdParamSchema.parse(param)).toThrow();
      });
    });

    it('should fail validation for non-numeric ID', () => {
      const param = { id: 'abc' };

      expect(() => IdParamSchema.parse(param)).toThrow();
    });
  });
});
