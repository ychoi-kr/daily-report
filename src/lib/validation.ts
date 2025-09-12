/**
 * Input validation and sanitization utilities
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Custom validation messages
const validationMessages = {
  required: 'This field is required',
  email: 'Invalid email address',
  min: (min: number) => `Must be at least ${min} characters`,
  max: (max: number) => `Must be no more than ${max} characters`,
  pattern: 'Invalid format',
  url: 'Invalid URL',
  number: 'Must be a number',
  date: 'Invalid date',
};

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(input: string): string {
  // First, encode special characters
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove any remaining HTML tags (shouldn't be any after encoding)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize email
 */
export const emailSchema = z
  .string()
  .min(1, validationMessages.required)
  .trim()
  .email(validationMessages.email)
  .toLowerCase();

/**
 * Validate and sanitize password
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, validationMessages.min(8))
  .max(100, validationMessages.max(100))
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

/**
 * Validate and sanitize username
 */
export const usernameSchema = z
  .string()
  .min(3, validationMessages.min(3))
  .max(30, validationMessages.max(30))
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(sanitizeText);

/**
 * Validate and sanitize phone number
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .transform((phone) => phone.replace(/[^\d\+]/g, ''));

/**
 * Validate and sanitize URL
 */
export const urlSchema = z
  .string()
  .url(validationMessages.url)
  .regex(/^https?:\/\//, 'URL must start with http:// or https://')
  .transform((url) => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      return '';
    }
  });

/**
 * Validate and sanitize date
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return !isNaN(parsed.getTime()) && 
           parsed.getFullYear() === year && 
           parsed.getMonth() === month - 1 && 
           parsed.getDate() === day;
  }, 'Invalid date');

/**
 * Validate and sanitize text area content
 */
export const textAreaSchema = (maxLength: number = 1000) =>
  z
    .string()
    .min(1, validationMessages.required)
    .max(maxLength, validationMessages.max(maxLength))
    .transform(sanitizeText);

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, validationMessages.required),
});

/**
 * Daily report schema
 */
export const dailyReportSchema = z.object({
  report_date: dateSchema,
  problem: textAreaSchema(1000),
  plan: textAreaSchema(1000),
  visits: z.array(
    z.object({
      customer_id: z.number().positive(),
      visit_time: z.string().optional(),
      visit_content: textAreaSchema(500),
    })
  ),
});

/**
 * Customer schema
 */
export const customerSchema = z.object({
  company_name: z.string().min(1).max(100).transform(sanitizeText),
  contact_person: z.string().min(1).max(100).transform(sanitizeText),
  phone: phoneSchema,
  email: emailSchema,
  address: textAreaSchema(500),
});

/**
 * Sales person schema
 */
export const salesPersonSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeText),
  email: emailSchema,
  password: passwordSchema,
  department: z.string().min(1).max(100).transform(sanitizeText),
  is_manager: z.boolean(),
});

/**
 * Comment schema
 */
export const commentSchema = z.object({
  comment: textAreaSchema(500),
});

/**
 * Check for SQL injection patterns
 */
export function hasSQLInjectionPattern(input: string): boolean {
  // Allow simple names with apostrophes like O'Brien, O'Reilly
  if (/^[A-Za-z]+('[A-Za-z]+)?$/.test(input)) {
    return false;
  }
  
  const sqlPatterns = [
    /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\binsert\b.*\binto\b|\bdelete\b.*\bfrom\b|\bdrop\b.*\btable\b|\bupdate\b.*\bset\b)/i,
    /(';|";|--|\/\*|\*\/|xp_|sp_|0x)/i,  // SQL comment indicators
    /'#/,  // MySQL comment
    /(exec|execute|cast|declare|nvarchar|varchar)/i,
    /(\bor\b|\band\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/i,  // Include quoted versions
    /\bwaitfor\b\s+\bdelay\b/i,
    /'.*--/,  // Quote followed by comment
    /'\s*(or|and)\s+/i,  // Quote followed by OR/AND
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function hasXSSPattern(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /document\.(cookie|write|location)/gi,
    /window\.(location|open)/gi,
    /eval\s*\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for path traversal patterns
 */
export function hasPathTraversalPattern(input: string): boolean {
  const pathPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    /\.\.%c0%af/gi,
    /\.\.%c1%9c/gi,
    /\.\.%252f/gi,
    /%2e%2e%2f/gi,  // URL encoded ../
    /%2e%2e/gi,     // URL encoded ..
    /file:\/\//gi,
  ];
  
  return pathPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(input: string, type: 'text' | 'email' | 'url' | 'phone' = 'text'): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for SQL injection
  if (hasSQLInjectionPattern(input)) {
    errors.push('Input contains potentially dangerous SQL patterns');
  }
  
  // Check for XSS
  if (hasXSSPattern(input)) {
    errors.push('Input contains potentially dangerous script patterns');
  }
  
  // Check for path traversal
  if (hasPathTraversalPattern(input)) {
    errors.push('Input contains potentially dangerous path patterns');
  }
  
  // Type-specific validation
  let sanitized = input;
  
  switch (type) {
    case 'email':
      try {
        sanitized = emailSchema.parse(input);
      } catch (e) {
        errors.push('Invalid email format');
      }
      break;
      
    case 'url':
      try {
        sanitized = urlSchema.parse(input);
      } catch (e) {
        errors.push('Invalid URL format');
      }
      break;
      
    case 'phone':
      try {
        sanitized = phoneSchema.parse(input);
      } catch (e) {
        errors.push('Invalid phone number format');
      }
      break;
      
    default:
      sanitized = sanitizeText(input);
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety (Pass123 has 3 of these)
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  
  // Common patterns to avoid
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score -= 1;
  }
  
  if (/^(password|123456|qwerty)/i.test(password)) {
    feedback.push('Avoid common passwords');
    score = 0;
  }
  
  if (/\d{4,}/.test(password)) {
    feedback.push('Avoid sequences of numbers');
    score -= 1;
  }
  
  // Normalize score
  score = Math.max(0, Math.min(5, score));
  
  // Provide feedback based on score
  if (score === 0) {
    feedback.push('Very weak password');
  } else if (score < 2) {
    feedback.push('Very weak password');
  } else if (score < 3) {
    feedback.push('Weak password');
  } else if (score < 4) {
    feedback.push('Moderate password');
  } else {
    feedback.push('Strong password');
  }
  
  return { score, feedback };
}