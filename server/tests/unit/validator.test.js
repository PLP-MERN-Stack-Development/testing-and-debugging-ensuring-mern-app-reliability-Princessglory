// Unit tests for validator utility functions
const validator = require('../../src/utils/validator');

describe('Validator Utility Functions', () => {
  describe('isValidEmail', () => {
    test('should return true for valid email addresses', () => {
      expect(validator.isValidEmail('test@example.com')).toBe(true);
      expect(validator.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(validator.isValidEmail('user+tag@example.org')).toBe(true);
      expect(validator.isValidEmail('123@example.com')).toBe(true);
    });

    test('should return false for invalid email addresses', () => {
      expect(validator.isValidEmail('invalid-email')).toBe(false);
      expect(validator.isValidEmail('user@')).toBe(false);
      expect(validator.isValidEmail('@domain.com')).toBe(false);
      expect(validator.isValidEmail('user..name@domain.com')).toBe(false);
      expect(validator.isValidEmail('')).toBe(false);
      expect(validator.isValidEmail(null)).toBe(false);
      expect(validator.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    test('should return true for strong passwords', () => {
      expect(validator.isStrongPassword('Password123!')).toBe(true);
      expect(validator.isStrongPassword('MySecure@Pass1')).toBe(true);
      expect(validator.isStrongPassword('Complex!2Password')).toBe(true);
    });

    test('should return false for weak passwords', () => {
      expect(validator.isStrongPassword('password')).toBe(false); // no uppercase, numbers, special chars
      expect(validator.isStrongPassword('PASSWORD')).toBe(false); // no lowercase, numbers, special chars
      expect(validator.isStrongPassword('Password')).toBe(false); // no numbers, special chars
      expect(validator.isStrongPassword('Password123')).toBe(false); // no special chars
      expect(validator.isStrongPassword('Pass!1')).toBe(false); // too short
      expect(validator.isStrongPassword('')).toBe(false); // empty
    });
  });

  describe('isValidUsername', () => {
    test('should return true for valid usernames', () => {
      expect(validator.isValidUsername('user123')).toBe(true);
      expect(validator.isValidUsername('test_user')).toBe(true);
      expect(validator.isValidUsername('MyUsername')).toBe(true);
      expect(validator.isValidUsername('u12')).toBe(true); // minimum length
      expect(validator.isValidUsername('a'.repeat(20))).toBe(true); // maximum length
    });

    test('should return false for invalid usernames', () => {
      expect(validator.isValidUsername('us')).toBe(false); // too short
      expect(validator.isValidUsername('a'.repeat(21))).toBe(false); // too long
      expect(validator.isValidUsername('user-name')).toBe(false); // contains hyphen
      expect(validator.isValidUsername('user name')).toBe(false); // contains space
      expect(validator.isValidUsername('user@name')).toBe(false); // contains @
      expect(validator.isValidUsername('')).toBe(false); // empty
      expect(validator.isValidUsername(null)).toBe(false); // null
      expect(validator.isValidUsername(undefined)).toBe(false); // undefined
    });
  });

  describe('sanitizeHtml', () => {
    test('should sanitize HTML characters', () => {
      expect(validator.sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(validator.sanitizeHtml('Hello & Goodbye')).toBe('Hello &amp; Goodbye');
      expect(validator.sanitizeHtml('Say "Hello"')).toBe('Say &quot;Hello&quot;');
      expect(validator.sanitizeHtml("It's a test")).toBe('It&#x27;s a test');
    });

    test('should handle empty or null input', () => {
      expect(validator.sanitizeHtml('')).toBe('');
      expect(validator.sanitizeHtml(null)).toBe('');
      expect(validator.sanitizeHtml(undefined)).toBe('');
    });

    test('should preserve normal text', () => {
      expect(validator.sanitizeHtml('Hello World')).toBe('Hello World');
      expect(validator.sanitizeHtml('12345')).toBe('12345');
    });
  });

  describe('isValidObjectId', () => {
    test('should return true for valid MongoDB ObjectIds', () => {
      expect(validator.isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(validator.isValidObjectId('5f8d04cb6b6c8a3b9c9d1f2e')).toBe(true);
      expect(validator.isValidObjectId('123456789012345678901234')).toBe(true);
    });

    test('should return false for invalid ObjectIds', () => {
      expect(validator.isValidObjectId('invalid-id')).toBe(false);
      expect(validator.isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // too short
      expect(validator.isValidObjectId('507f1f77bcf86cd799439011123')).toBe(false); // too long
      expect(validator.isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false); // invalid character
      expect(validator.isValidObjectId('')).toBe(false);
      expect(validator.isValidObjectId(null)).toBe(false);
      expect(validator.isValidObjectId(undefined)).toBe(false);
    });
  });
});