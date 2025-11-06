// Unit tests for error handler middleware
const errorHandler = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should handle generic errors with default 500 status', () => {
    const error = new Error('Generic error');
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Generic error'
    });
  });

  test('should handle custom error with specific status code', () => {
    const error = new Error('Custom error');
    error.statusCode = 400;
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Custom error'
    });
  });

  test('should handle Mongoose CastError', () => {
    const error = new Error('Cast failed');
    error.name = 'CastError';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Resource not found'
    });
  });

  test('should handle Mongoose duplicate key error', () => {
    const error = new Error('Duplicate key');
    error.code = 11000;
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Duplicate field value entered'
    });
  });

  test('should handle Mongoose validation error', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = {
      email: { message: 'Email is required' },
      password: { message: 'Password is too short' }
    };
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Email is required, Password is too short'
    });
  });

  test('should handle JWT invalid token error', () => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid token'
    });
  });

  test('should handle JWT expired token error', () => {
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token expired'
    });
  });

  test('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Development error');
    error.stack = 'Error stack trace...';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Development error',
      stack: 'Error stack trace...'
    });
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should not include stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Production error');
    error.stack = 'Error stack trace...';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Production error'
    });
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should log error to console', () => {
    const error = new Error('Test error');
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(console.error).toHaveBeenCalledWith('🚨 Error:', error);
  });
});