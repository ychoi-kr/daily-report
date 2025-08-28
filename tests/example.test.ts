import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with strings', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
  });

  it('should handle arrays', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
  });
});
