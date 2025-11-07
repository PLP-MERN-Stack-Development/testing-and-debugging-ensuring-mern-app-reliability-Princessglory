const { errorHandler } = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware - Comprehensive Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      url: '/api/test',
      ip: '127.0.0.1',
      body: {},
      params: {},
      query: {},
      headers: {},
      get: jest.fn().mockReturnValue('Test-Agent/1.0')
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    console.error = jest.fn();
  });

  describe('Mongoose Validation Errors', () => {
    it('should handle validation error with multiple fields', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' },
          username: { message: 'Username must be unique' }
        }
      };

      errorHandler(validationError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email is required, Username must be unique'
      });
    });

    it('should handle validation error with single field', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          password: { message: 'Password must be at least 6 characters' }
        }
      };

      errorHandler(validationError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    });
  });

  describe('Mongoose Cast Errors', () => {
    it('should handle CastError', () => {
      const castError = {
        name: 'CastError',
        kind: 'ObjectId',
        value: 'invalid_id',
        path: '_id'
      };

      errorHandler(castError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource not found'
      });
    });
  });

  describe('Mongoose Duplicate Key Errors', () => {
    it('should handle duplicate key error', () => {
      const duplicateError = {
        name: 'MongoServerError',
        code: 11000,
        message: 'E11000 duplicate key error'
      };

      errorHandler(duplicateError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Duplicate field value entered'
      });
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', () => {
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'invalid signature'
      };

      errorHandler(jwtError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid token'
      });
    });

    it('should handle TokenExpiredError', () => {
      const expiredError = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
        expiredAt: new Date()
      };

      errorHandler(expiredError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token expired'
      });
    });
  });

  describe('HTTP Status Errors', () => {
    it('should handle error with statusCode property', () => {
      const statusCodeError = {
        statusCode: 404,
        message: 'Resource not found'
      };

      errorHandler(statusCodeError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource not found'
      });
    });
  });

  describe('Generic Errors', () => {
    it('should handle generic error with message', () => {
      const genericError = {
        message: 'Something went wrong'
      };

      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong'
      });
    });

    it('should handle error without message', () => {
      const errorWithoutMessage = {};

      errorHandler(errorWithoutMessage, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Server Error'
      });
    });
  });

  describe('Error Logging', () => {
    it('should log error to console', () => {
      const error = new Error('Test error for logging');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(console.error).toHaveBeenCalledWith('🚨 Error:', error);
    });
  });
});