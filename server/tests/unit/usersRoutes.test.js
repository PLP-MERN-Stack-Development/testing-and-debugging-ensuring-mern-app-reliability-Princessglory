// Unit tests for users routes
const request = require('supertest');
const express = require('express');
const User = require('../../src/models/User');

// Mock express-validator
jest.mock('express-validator', () => {
  const mockChain = {
    isEmail: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis()
  };
  
  return {
    body: jest.fn().mockImplementation(() => Object.assign((req, res, next) => next(), mockChain)),
    validationResult: jest.fn().mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    })
  };
});

// Mock dependencies
jest.mock('../../src/models/User');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.user = { _id: 'user123', username: 'testuser' };
  next();
});

const usersRoutes = require('../../src/routes/users');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { 
    _id: 'user123', 
    username: 'testuser',
    email: 'test@example.com',
    role: 'user'
  };
  next();
};

app.use('/users', mockAuth, usersRoutes);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    test('should get all users successfully', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          username: 'user1',
          email: 'user1@example.com',
          role: 'user'
        },
        {
          _id: 'user2',
          username: 'user2', 
          email: 'user2@example.com',
          role: 'user'
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find = jest.fn().mockReturnValue(mockQuery);
      User.countDocuments = jest.fn().mockResolvedValue(2);

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.users).toEqual(mockUsers);
      expect(response.body.data.totalUsers).toBe(2);
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
    });

    test('should handle pagination parameters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      User.find = jest.fn().mockReturnValue(mockQuery);
      User.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/users?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(mockQuery.skip).toHaveBeenCalledWith(5);
    });

    test('should handle search query', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      User.find = jest.fn().mockReturnValue(mockQuery);
      User.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/users?search=john');

      expect(response.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { username: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } }
        ]
      });
    });
  });

  describe('GET /users/:id', () => {
    test('should get user by id successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser)
      };

      User.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app).get('/users/user123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toEqual(mockUser);
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
    });

    test('should return 404 for non-existent user', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(null)
      };

      User.findById = jest.fn().mockReturnValue(mockQuery);

      const response = await request(app).get('/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User not found');
    });

    test('should return 400 for invalid user id', async () => {
      const response = await request(app).get('/users/invalid_id');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /users/:id', () => {
    test('should allow user to update own profile', async () => {
      const updateData = {
        email: 'newemail@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          username: 'testuser',
          email: 'newemail@example.com'
        })
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/users/user123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(mockUser.email).toBe('newemail@example.com');
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should return 403 when user tries to update other user', async () => {
      const response = await request(app)
        .put('/users/otheruser456')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized to update this user');
    });

    test('should return 400 when trying to update username', async () => {
      const response = await request(app)
        .put('/users/user123')
        .send({ username: 'newusername' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Username cannot be changed');
    });

    test('should return 400 when trying to update password', async () => {
      const response = await request(app)
        .put('/users/user123')
        .send({ password: 'newpassword' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Use /users/change-password to update password');
    });
  });

  describe('DELETE /users/:id', () => {
    test('should allow user to delete own account', async () => {
      const mockUser = {
        _id: 'user123',
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app).delete('/users/user123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User deleted successfully');
      expect(mockUser.deleteOne).toHaveBeenCalled();
    });

    test('should return 403 when user tries to delete other user', async () => {
      const response = await request(app).delete('/users/otheruser456');

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized to delete this user');
    });
  });

  describe('POST /users/change-password', () => {
    test('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      const mockUser = {
        _id: 'user123',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/change-password')
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password changed successfully');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('oldpassword');
      expect(mockUser.password).toBe('newpassword123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should return 400 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const mockUser = {
        _id: 'user123',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/change-password')
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Current password is incorrect');
    });

    test('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/users/change-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
});