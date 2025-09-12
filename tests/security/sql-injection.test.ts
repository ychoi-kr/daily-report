/**
 * SQL Injection Prevention Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hasSQLInjectionPattern, validateInput } from '@/lib/validation';

describe('SQL Injection Prevention', () => {
  describe('Pattern Detection', () => {
    it('should detect UNION SELECT attacks', () => {
      const maliciousInputs = [
        "' UNION SELECT * FROM users --",
        "1' UNION SELECT username, password FROM users--",
        "admin' UNION ALL SELECT NULL, NULL--",
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(true);
      });
    });
    
    it('should detect DROP TABLE attacks', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1'; DROP TABLE reports--",
        "admin'; DROP TABLE customers; SELECT * FROM orders WHERE '1'='1",
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(true);
      });
    });
    
    it('should detect OR/AND injection attacks', () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin' OR '1'='1'--",
        "' AND 1=0 UNION SELECT * FROM users--",
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(true);
      });
    });
    
    it('should detect comment-based attacks', () => {
      const maliciousInputs = [
        "admin'--",
        "admin'/*",
        "*/admin'/*",
        "admin'#",
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(true);
      });
    });
    
    it('should detect time-based blind SQL injection', () => {
      const maliciousInputs = [
        "'; WAITFOR DELAY '00:00:10'--",
        "1' AND SLEEP(10)--",
        "'; IF(1=1, SLEEP(10), FALSE)--",
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(true);
      });
    });
    
    it('should detect stored procedure attacks', () => {
      const maliciousInputs = [
        "'; EXEC xp_cmdshell('dir')--",
        "'; EXEC sp_configure 'show advanced options', 1--",
        "'; EXECUTE AS LOGIN = 'sa'--",
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(true);
      });
    });
    
    it('should allow legitimate input', () => {
      const legitimateInputs = [
        "John O'Brien",
        "user@example.com",
        "This is a normal comment.",
        "Product price is $99.99",
        "Meeting at 3:00 PM",
      ];
      
      legitimateInputs.forEach(input => {
        expect(hasSQLInjectionPattern(input)).toBe(false);
      });
    });
  });
  
  describe('Input Validation', () => {
    it('should reject SQL injection in text input', () => {
      const result = validateInput("'; DROP TABLE users; --", 'text');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input contains potentially dangerous SQL patterns');
    });
    
    it('should sanitize and accept clean input', () => {
      const result = validateInput('Normal user input', 'text');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('Normal user input');
    });
    
    it('should handle special characters safely', () => {
      const input = "It's a test & verification <script>alert('xss')</script>";
      const result = validateInput(input, 'text');
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('It&#x27;s a test &amp; verification');
    });
  });
  
  describe('Parameterized Query Protection', () => {
    it('should escape single quotes properly', () => {
      const input = "O'Reilly";
      const result = validateInput(input, 'text');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("O&#x27;Reilly");
    });
    
    it('should handle numeric injection attempts', () => {
      const maliciousInputs = [
        "1 OR 1=1",
        "1' OR '1'='1",
        "1 UNION SELECT NULL",
      ];
      
      maliciousInputs.forEach(input => {
        const result = validateInput(input, 'text');
        expect(result.isValid).toBe(false);
      });
    });
  });
  
  describe('NoSQL Injection Prevention', () => {
    it('should detect MongoDB injection patterns', () => {
      const maliciousInputs = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$regex": ".*"}',
      ];
      
      maliciousInputs.forEach(input => {
        const result = validateInput(input, 'text');
        // These should be escaped/sanitized - quotes should be escaped
        expect(result.sanitized).toContain('&quot;');
        expect(result.sanitized).not.toContain('"');  // No unescaped quotes
      });
    });
  });
  
  describe('Second-Order SQL Injection Prevention', () => {
    it('should sanitize data even when retrieved from database', () => {
      // Simulate data that might be stored and later used
      const storedMaliciousData = "admin'--";
      const result = validateInput(storedMaliciousData, 'text');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});