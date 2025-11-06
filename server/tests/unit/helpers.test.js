// Unit tests for helper utility functions
const helpers = require('../../src/utils/helpers');

describe('Helper Utility Functions', () => {
  describe('formatUserResponse', () => {
    test('should format user object correctly', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar.jpg',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const formatted = helpers.formatUserResponse(mockUser);

      expect(formatted).toEqual({
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        avatar: 'avatar.jpg',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      });
    });

    test('should return null for null input', () => {
      expect(helpers.formatUserResponse(null)).toBe(null);
      expect(helpers.formatUserResponse(undefined)).toBe(null);
    });
  });

  describe('formatPostResponse', () => {
    test('should format post object correctly', () => {
      const mockPost = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Post',
        content: 'This is a test post content',
        author: { username: 'testuser' },
        tags: ['test', 'jest'],
        likes: [{ user: 'user1' }, { user: 'user2' }],
        comments: [{ content: 'Nice post!' }],
        isPublished: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const formatted = helpers.formatPostResponse(mockPost);

      expect(formatted).toEqual({
        id: '507f1f77bcf86cd799439011',
        title: 'Test Post',
        content: 'This is a test post content',
        author: { username: 'testuser' },
        tags: ['test', 'jest'],
        likeCount: 2,
        commentCount: 1,
        isPublished: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      });
    });

    test('should handle posts without likes or comments', () => {
      const mockPost = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Post',
        content: 'Content',
        author: { username: 'testuser' },
        tags: [],
        isPublished: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const formatted = helpers.formatPostResponse(mockPost);

      expect(formatted.likeCount).toBe(0);
      expect(formatted.commentCount).toBe(0);
    });

    test('should return null for null input', () => {
      expect(helpers.formatPostResponse(null)).toBe(null);
      expect(helpers.formatPostResponse(undefined)).toBe(null);
    });
  });

  describe('paginate', () => {
    const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    test('should paginate array correctly', () => {
      const result = helpers.paginate(testArray, 1, 3);

      expect(result.data).toEqual([1, 2, 3]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 3,
        total: 10,
        pages: 4,
        hasNext: true,
        hasPrev: false
      });
    });

    test('should handle last page correctly', () => {
      const result = helpers.paginate(testArray, 4, 3);

      expect(result.data).toEqual([10]);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    test('should handle empty array', () => {
      const result = helpers.paginate([], 1, 5);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });
  });

  describe('generateRandomString', () => {
    test('should generate string of correct length', () => {
      expect(helpers.generateRandomString(5)).toHaveLength(5);
      expect(helpers.generateRandomString(10)).toHaveLength(10);
      expect(helpers.generateRandomString(20)).toHaveLength(20);
    });

    test('should generate default length of 10', () => {
      expect(helpers.generateRandomString()).toHaveLength(10);
    });

    test('should generate different strings', () => {
      const string1 = helpers.generateRandomString(10);
      const string2 = helpers.generateRandomString(10);
      expect(string1).not.toBe(string2);
    });

    test('should only contain valid characters', () => {
      const randomString = helpers.generateRandomString(50);
      const validPattern = /^[A-Za-z0-9]+$/;
      expect(validPattern.test(randomString)).toBe(true);
    });
  });

  describe('calculateReadingTime', () => {
    test('should calculate reading time correctly', () => {
      const shortText = 'This is a short text with about ten words here.';
      expect(helpers.calculateReadingTime(shortText)).toBe(1); // Minimum 1 minute

      // 200 words should take 1 minute
      const mediumText = Array(200).fill('word').join(' ');
      expect(helpers.calculateReadingTime(mediumText)).toBe(1);

      // 400 words should take 2 minutes
      const longText = Array(400).fill('word').join(' ');
      expect(helpers.calculateReadingTime(longText)).toBe(2);
    });

    test('should handle empty or null text', () => {
      expect(helpers.calculateReadingTime('')).toBe(0);
      expect(helpers.calculateReadingTime(null)).toBe(0);
      expect(helpers.calculateReadingTime(undefined)).toBe(0);
    });
  });

  describe('capitalize', () => {
    test('should capitalize first letter', () => {
      expect(helpers.capitalize('hello')).toBe('Hello');
      expect(helpers.capitalize('WORLD')).toBe('World');
      expect(helpers.capitalize('tEST')).toBe('Test');
    });

    test('should handle empty or null strings', () => {
      expect(helpers.capitalize('')).toBe('');
      expect(helpers.capitalize(null)).toBe('');
      expect(helpers.capitalize(undefined)).toBe('');
    });

    test('should handle single character', () => {
      expect(helpers.capitalize('a')).toBe('A');
      expect(helpers.capitalize('Z')).toBe('Z');
    });
  });

  describe('generateSlug', () => {
    test('should generate valid slugs', () => {
      expect(helpers.generateSlug('Hello World')).toBe('hello-world');
      expect(helpers.generateSlug('This is a Test Title!')).toBe('this-is-a-test-title');
      expect(helpers.generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
      expect(helpers.generateSlug('Special@#$%Characters')).toBe('specialcharacters');
    });

    test('should handle edge cases', () => {
      expect(helpers.generateSlug('')).toBe('');
      expect(helpers.generateSlug(null)).toBe('');
      expect(helpers.generateSlug(undefined)).toBe('');
      expect(helpers.generateSlug('---')).toBe('');
    });

    test('should remove leading and trailing hyphens', () => {
      expect(helpers.generateSlug('-test-')).toBe('test');
      expect(helpers.generateSlug('--multiple--hyphens--')).toBe('multiple-hyphens');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');

    test('should format dates correctly', () => {
      expect(helpers.formatDate(testDate, 'YYYY-MM-DD')).toBe('2023-12-25');
      expect(helpers.formatDate(testDate, 'DD/MM/YYYY')).toBe('25/12/2023');
      expect(helpers.formatDate(testDate, 'MM/DD/YYYY')).toBe('12/25/2023');
    });

    test('should use default format', () => {
      expect(helpers.formatDate(testDate)).toBe('2023-12-25');
    });

    test('should return ISO string for unknown format', () => {
      const result = helpers.formatDate(testDate, 'unknown');
      expect(result).toBe(testDate.toISOString());
    });

    test('should handle empty or null dates', () => {
      expect(helpers.formatDate('')).toBe('');
      expect(helpers.formatDate(null)).toBe('');
      expect(helpers.formatDate(undefined)).toBe('');
    });
  });
});