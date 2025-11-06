// Unit tests for auth middleware
const auth = require('../../src/middleware/auth');

// Mock dependencies
const mockJwt = {
  verify: jest.fn()
};
const mockUser = {
  findById: jest.fn()
};

jest.mock('jsonwebtoken', () => mockJwt);
jest.mock('../../src/models/User', () => mockUser);

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should call next() when valid token is provided and user exists', async () => {
    const mockUserData = {
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com'
    };

    // Mock header to return valid token
    mockReq.header.mockReturnValue('Bearer validtoken123');
    
    // Mock jwt.verify to return decoded token
    mockJwt.verify.mockReturnValue({ userId: 'user123' });
    
    // Mock User.findById to return user
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserData)
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockReq.header).toHaveBeenCalledWith('Authorization');
    expect(mockJwt.verify).toHaveBeenCalledWith('validtoken123', process.env.JWT_SECRET);
    expect(mockUser.findById).toHaveBeenCalledWith('user123');
    expect(mockReq.user).toBe(mockUserData);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('should return 401 when no token is provided', async () => {
    mockReq.header.mockReturnValue(null);

    await auth(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'No token, authorization denied'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 401 when token is malformed (no Bearer prefix)', async () => {
    mockReq.header.mockReturnValue('invalidtoken123');

    await auth(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token is not valid'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 401 when jwt.verify throws an error', async () => {
    mockReq.header.mockReturnValue('Bearer invalidtoken');
    mockJwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token is not valid'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 401 when user is not found', async () => {
    mockReq.header.mockReturnValue('Bearer validtoken123');
    mockJwt.verify.mockReturnValue({ userId: 'nonexistentuser' });
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token is not valid'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 401 when User.findById throws an error', async () => {
    mockReq.header.mockReturnValue('Bearer validtoken123');
    mockJwt.verify.mockReturnValue({ userId: 'user123' });
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Database error'))
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token is not valid'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should correctly extract token from Authorization header', async () => {
    const mockUserData = { _id: 'user123' };
    mockReq.header.mockReturnValue('Bearer token123xyz');
    mockJwt.verify.mockReturnValue({ userId: 'user123' });
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserData)
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockJwt.verify).toHaveBeenCalledWith('token123xyz', process.env.JWT_SECRET);
  });

  test('should exclude password from user selection', async () => {
    const mockUserData = { _id: 'user123' };
    mockReq.header.mockReturnValue('Bearer validtoken');
    mockJwt.verify.mockReturnValue({ userId: 'user123' });
    const mockSelect = jest.fn().mockResolvedValue(mockUserData);
    mockUser.findById.mockReturnValue({ select: mockSelect });

    await auth(mockReq, mockRes, mockNext);

    expect(mockSelect).toHaveBeenCalledWith('-password');
  });
});