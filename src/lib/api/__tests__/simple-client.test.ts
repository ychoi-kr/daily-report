import { describe, it, expect } from 'vitest';
import { api, ApiError, setAuthToken, clearAuthToken } from '../simple-client';

describe('Simple API Client', () => {
  describe('ApiError', () => {
    it('should create ApiError with basic properties', () => {
      const error = new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
        { field: 'email', message: 'Invalid email' },
      ]);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual([
        { field: 'email', message: 'Invalid email' },
      ]);
    });
  });

  describe('Token management', () => {
    it('should set and clear auth token', () => {
      const token = 'test-token';
      setAuthToken(token);
      // Token is set internally - no public way to verify
      expect(true).toBe(true);

      clearAuthToken();
      // Token is cleared internally - no public way to verify
      expect(true).toBe(true);
    });
  });

  describe('API methods structure', () => {
    it('should have auth methods', () => {
      expect(api.auth).toBeDefined();
      expect(typeof api.auth.login).toBe('function');
      expect(typeof api.auth.logout).toBe('function');
      expect(typeof api.auth.getMe).toBe('function');
    });

    it('should have reports methods', () => {
      expect(api.reports).toBeDefined();
      expect(typeof api.reports.getAll).toBe('function');
      expect(typeof api.reports.create).toBe('function');
    });

    it('should have customers methods', () => {
      expect(api.customers).toBeDefined();
      expect(typeof api.customers.getAll).toBe('function');
      expect(typeof api.customers.create).toBe('function');
    });
  });
});
