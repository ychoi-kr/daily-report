/**
 * Input Validation and Sanitization Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateInput,
  sanitizeText,
  sanitizeHtml,
  hasPathTraversalPattern,
  emailSchema,
  phoneSchema,
  urlSchema,
  dateSchema,
  dailyReportSchema,
  customerSchema,
  salesPersonSchema,
} from '@/lib/validation';

describe('Input Validation', () => {
  describe('Path Traversal Prevention', () => {
    it('should detect path traversal attempts', () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'file://../../etc/passwd',
        '%2e%2e%2f%2e%2e%2f',
        '..%252f..%252f',
        '..%c0%af..%c0%af',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasPathTraversalPattern(input)).toBe(true);
      });
    });
    
    it('should allow legitimate file paths', () => {
      const legitimatePaths = [
        'documents/report.pdf',
        'images/logo.png',
        'data/2024/january.csv',
        './current-directory',
      ];
      
      legitimatePaths.forEach(path => {
        expect(hasPathTraversalPattern(path)).toBe(false);
      });
    });
  });
  
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@domain.org',
        'user_123@test-domain.com',
      ];
      
      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });
    
    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-domain@',
        'spaces in@email.com',
        'double@@domain.com',
        '<script>@evil.com',
      ];
      
      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
    
    it('should normalize email case', () => {
      const email = 'User@EXAMPLE.COM';
      const normalized = emailSchema.parse(email);
      expect(normalized).toBe('user@example.com');
    });
  });
  
  describe('Phone Number Validation', () => {
    it('should validate correct phone formats', () => {
      const validPhones = [
        '+1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '123 456 7890',
        '+44 20 7123 4567',
      ];
      
      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow();
      });
    });
    
    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        'not-a-phone',
        'abc-def-ghij',
        '<script>alert(1)</script>',
        '123@456#7890',
      ];
      
      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow();
      });
    });
    
    it('should extract digits from phone number', () => {
      const phone = '(123) 456-7890';
      const cleaned = phoneSchema.parse(phone);
      expect(cleaned).toBe('1234567890');
    });
  });
  
  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path',
        'https://example.com?query=value',
        'https://example.com#anchor',
      ];
      
      validURLs.forEach(url => {
        expect(() => urlSchema.parse(url)).not.toThrow();
      });
    });
    
    it('should reject invalid URLs', () => {
      const invalidURLs = [
        'not-a-url',
        'ftp://file-server.com',  // Only http/https allowed
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '//missing-protocol.com',
      ];
      
      invalidURLs.forEach(url => {
        expect(() => urlSchema.parse(url)).toThrow();
      });
    });
    
    it('should require http or https protocol', () => {
      expect(() => urlSchema.parse('ftp://example.com')).toThrow();
      expect(() => urlSchema.parse('file:///etc/passwd')).toThrow();
      expect(() => urlSchema.parse('javascript:void(0)')).toThrow();
    });
  });
  
  describe('Date Validation', () => {
    it('should validate correct date formats', () => {
      const validDates = [
        '2024-01-01',
        '2024-12-31',
        '2023-02-28',
        '2024-02-29',  // Leap year
      ];
      
      validDates.forEach(date => {
        expect(() => dateSchema.parse(date)).not.toThrow();
      });
    });
    
    it('should reject invalid date formats', () => {
      const invalidDates = [
        '01-01-2024',  // Wrong format
        '2024/01/01',  // Wrong separator
        '2024-13-01',  // Invalid month
        '2024-01-32',  // Invalid day
        '2023-02-30',  // Invalid date
        'not-a-date',
      ];
      
      invalidDates.forEach(date => {
        expect(() => dateSchema.parse(date)).toThrow();
      });
    });
  });
  
  describe('Text Sanitization', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = sanitizeText(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });
    
    it('should handle special characters', () => {
      const input = 'Test & "quotes" <tags> \'apostrophe\'';
      const sanitized = sanitizeText(input);
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&lt;tags&gt;');
      expect(sanitized).toContain('&#x27;');
    });
    
    it('should preserve legitimate text', () => {
      const input = 'This is normal text with numbers 123 and punctuation!';
      const sanitized = sanitizeText(input);
      expect(sanitized).toBe(input);
    });
    
    it('should trim whitespace', () => {
      const input = '  text with spaces  ';
      const sanitized = sanitizeText(input);
      expect(sanitized).toBe('text with spaces');
    });
  });
  
  describe('Daily Report Validation', () => {
    it('should validate complete daily report', () => {
      const validReport = {
        report_date: '2024-01-15',
        problem: 'Issues encountered today',
        plan: 'Plans for tomorrow',
        visits: [
          {
            customer_id: 1,
            visit_time: '10:00',
            visit_content: 'Meeting discussion',
          },
        ],
      };
      
      expect(() => dailyReportSchema.parse(validReport)).not.toThrow();
    });
    
    it('should reject report with missing required fields', () => {
      const invalidReport = {
        report_date: '2024-01-15',
        // Missing problem and plan
        visits: [],
      };
      
      expect(() => dailyReportSchema.parse(invalidReport)).toThrow();
    });
    
    it('should sanitize text fields', () => {
      const report = {
        report_date: '2024-01-15',
        problem: '<script>alert("XSS")</script>Problem',
        plan: 'Plan<img src=x onerror=alert(1)>',
        visits: [],
      };
      
      const parsed = dailyReportSchema.parse(report);
      expect(parsed.problem).not.toContain('<script>');
      expect(parsed.plan).not.toContain('<img');
    });
    
    it('should enforce text length limits', () => {
      const longText = 'a'.repeat(1001);
      const report = {
        report_date: '2024-01-15',
        problem: longText,
        plan: 'Valid plan',
        visits: [],
      };
      
      expect(() => dailyReportSchema.parse(report)).toThrow();
    });
  });
  
  describe('Customer Data Validation', () => {
    it('should validate complete customer data', () => {
      const validCustomer = {
        company_name: 'ABC Company',
        contact_person: 'John Doe',
        phone: '123-456-7890',
        email: 'contact@abc.com',
        address: '123 Main St, City',
      };
      
      expect(() => customerSchema.parse(validCustomer)).not.toThrow();
    });
    
    it('should sanitize customer fields', () => {
      const customer = {
        company_name: '<script>Evil Corp</script>',
        contact_person: 'John<img src=x>',
        phone: '123-456-7890',
        email: 'test@example.com',
        address: 'Address<script>alert(1)</script>',
      };
      
      const parsed = customerSchema.parse(customer);
      expect(parsed.company_name).not.toContain('<script>');
      expect(parsed.contact_person).not.toContain('<img');
      expect(parsed.address).not.toContain('<script>');
    });
  });
  
  describe('Sales Person Validation', () => {
    it('should validate complete sales person data', () => {
      const validSalesPerson = {
        name: 'Jane Smith',
        email: 'jane@company.com',
        password: 'Secure@Pass123!',
        department: 'Sales',
        is_manager: false,
      };
      
      expect(() => salesPersonSchema.parse(validSalesPerson)).not.toThrow();
    });
    
    it('should enforce strong password requirements', () => {
      const weakPasswordPerson = {
        name: 'Jane Smith',
        email: 'jane@company.com',
        password: 'weak',
        department: 'Sales',
        is_manager: false,
      };
      
      expect(() => salesPersonSchema.parse(weakPasswordPerson)).toThrow();
    });
    
    it('should sanitize name and department', () => {
      const person = {
        name: '<script>Jane</script>',
        email: 'jane@company.com',
        password: 'Secure@Pass123!',
        department: 'Sales<img src=x>',
        is_manager: false,
      };
      
      const parsed = salesPersonSchema.parse(person);
      expect(parsed.name).not.toContain('<script>');
      expect(parsed.department).not.toContain('<img');
    });
  });
  
  describe('Comprehensive Input Validation', () => {
    it('should detect multiple attack vectors', () => {
      const maliciousInput = "'; DROP TABLE users; <script>alert('XSS')</script> ../../../etc/passwd";
      const result = validateInput(maliciousInput, 'text');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('SQL'))).toBe(true);
      expect(result.errors.some(e => e.includes('script'))).toBe(true);
      expect(result.errors.some(e => e.includes('path'))).toBe(true);
    });
    
    it('should properly sanitize mixed content', () => {
      const mixedContent = 'Normal text <b>with HTML</b> and special chars: & < > " \'';
      const result = validateInput(mixedContent, 'text');
      
      expect(result.sanitized).not.toContain('<b>');
      expect(result.sanitized).toContain('&amp;');
      expect(result.sanitized).toContain('&lt;b&gt;');
      expect(result.sanitized).toContain('&lt;&#x2F;b&gt;');
    });
    
    it('should handle Unicode and emoji properly', () => {
      const unicodeInput = 'Hello 世界 🌍 مرحبا';
      const result = validateInput(unicodeInput, 'text');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(unicodeInput);
    });
    
    it('should handle null byte injection', () => {
      const nullByteInput = 'file.txt\0.jpg';
      const result = validateInput(nullByteInput, 'text');
      
      // Null bytes should be removed
      expect(result.sanitized).toBe('file.txt.jpg');
    });
  });
});