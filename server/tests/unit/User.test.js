// Unit tests for User model
const mongoose = require('mongoose');

// Mock bcrypt before requiring the model
const mockBcrypt = {
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
};

jest.mock('bcryptjs', () => mockBcrypt);

const User = require('../../src/models/User');

describe('User Model', () => {
  describe('Schema Validation', () => {
    test('should be valid with all required fields', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeUndefined();
    });

    test('should require username', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.username).toBeDefined();
      expect(validationError.errors.username.message).toBe('Username is required');
    });

    test('should require email', () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toBe('Email is required');
    });

    test('should require password', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toBe('Password is required');
    });

    test('should require firstName', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.firstName).toBeDefined();
      expect(validationError.errors.firstName.message).toBe('First name is required');
    });

    test('should require lastName', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.lastName).toBeDefined();
      expect(validationError.errors.lastName.message).toBe('Last name is required');
    });

    test('should validate email format', () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toBe('Please enter a valid email');
    });

    test('should validate username length', () => {
      const shortUsernameData = {
        username: 'ab', // too short
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user1 = new User(shortUsernameData);
      const validationError1 = user1.validateSync();
      
      expect(validationError1.errors.username).toBeDefined();
      expect(validationError1.errors.username.message).toBe('Username must be at least 3 characters');

      const longUsernameData = {
        username: 'a'.repeat(21), // too long
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user2 = new User(longUsernameData);
      const validationError2 = user2.validateSync();
      
      expect(validationError2.errors.username).toBeDefined();
      expect(validationError2.errors.username.message).toBe('Username cannot exceed 20 characters');
    });

    test('should validate password length', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345', // too short
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toBe('Password must be at least 6 characters');
    });

    test('should set default values correctly', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      expect(user.avatar).toBeNull();
      expect(user.isActive).toBe(true);
    });

    test('should trim whitespace from string fields', () => {
      const userData = {
        username: '  testuser  ',
        email: '  test@example.com  ',
        password: 'password123',
        firstName: '  John  ',
        lastName: '  Doe  '
      };

      const user = new User(userData);
      
      expect(user.username).toBe('testuser');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
    });

    test('should convert email to lowercase', () => {
      const userData = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Virtual Properties', () => {
    test('should generate fullName virtual property', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('Instance Methods', () => {
    test('comparePassword should return true for correct password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });

      mockBcrypt.compare.mockResolvedValue(true);

      const result = await user.comparePassword('password123');
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', user.password);
      expect(result).toBe(true);
    });

    test('comparePassword should return false for incorrect password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });

      mockBcrypt.compare.mockResolvedValue(false);

      const result = await user.comparePassword('wrongpassword');
      
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', user.password);
      expect(result).toBe(false);
    });
  });

  describe('JSON Transformation', () => {
    test('should exclude password and __v from JSON output', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      user._id = 'mockid123';
      user.__v = 0;

      const jsonOutput = user.toJSON();
      
      expect(jsonOutput.password).toBeUndefined();
      expect(jsonOutput.__v).toBeUndefined();
      expect(jsonOutput.username).toBe('testuser');
      expect(jsonOutput.email).toBe('test@example.com');
      expect(jsonOutput.fullName).toBe('John Doe');
    });
  });

});