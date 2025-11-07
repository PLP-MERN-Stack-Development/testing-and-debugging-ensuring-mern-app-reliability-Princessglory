// Error handling and edge case tests
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

// Set test environment before importing the app
process.env.NODE_ENV = 'test';

describe('Error Handling Integration Tests', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test database URI
    process.env.MONGODB_TEST_URI = mongoUri;
    
    // Now import and setup the app
    app = require('../../src/server');
    
    // Connect to test database
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    // Clean up
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000);

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Validation Error Handling', () => {
    describe('Auth Registration Validation', () => {
      it('should handle missing username', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
          // missing username
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'username',
              msg: expect.stringContaining('Username')
            })
          ])
        );
      });

      it('should handle invalid email format', async () => {
        const userData = {
          username: 'testuser',
          email: 'invalid-email-format',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'email',
              msg: 'Please enter a valid email'
            })
          ])
        );
      });

      it('should handle short password', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'password',
              msg: 'Password must be at least 6 characters'
            })
          ])
        );
      });

      it('should handle username too short', async () => {
        const userData = {
          username: 'ab',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'username',
              msg: 'Username must be 3-20 characters'
            })
          ])
        );
      });

      it('should handle username too long', async () => {
        const userData = {
          username: 'a'.repeat(25), // 25 characters, exceeds 20 limit
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'username',
              msg: 'Username must be 3-20 characters'
            })
          ])
        );
      });

      it('should handle duplicate user registration', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        };

        // Register user first time
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Try to register same user again
        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('User with this email or username already exists');
      });
    });

    describe('Auth Login Validation', () => {
      beforeEach(async () => {
        // Create a test user for login tests
        await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
          });
      });

      it('should handle missing email', async () => {
        const loginData = {
          password: 'password123'
          // missing email
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'email',
              msg: 'Please enter a valid email'
            })
          ])
        );
      });

      it('should handle missing password', async () => {
        const loginData = {
          email: 'test@example.com'
          // missing password
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'password',
              msg: 'Password is required'
            })
          ])
        );
      });

      it('should handle invalid email format in login', async () => {
        const loginData = {
          email: 'invalid-email',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(400);

        expect(res.body.status).toBe('error');
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'email',
              msg: 'Please enter a valid email'
            })
          ])
        );
      });
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle malformed JWT token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Token is not valid');
    });

    it('should handle expired JWT token', async () => {
      // Create a token with very short expiration (expired immediately)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'test' },
        process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
        { expiresIn: '-1s' } // Already expired
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Token is not valid');
    });

    it('should handle token with invalid signature', async () => {
      const jwt = require('jsonwebtoken');
      const invalidToken = jwt.sign(
        { userId: 'test' },
        'wrong_secret_key', // Different secret
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Token is not valid');
    });

    it('should handle missing Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token, authorization denied');
    });

    it('should handle malformed Authorization header format', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Token is not valid');
    });

    it('should handle token without Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'token123')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Token is not valid');
    });
  });

  describe('Database Error Simulation', () => {
    it('should handle database connection errors gracefully', async () => {
      // Temporarily close the connection to simulate database error
      await mongoose.disconnect();

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Server error during registration');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('Content-Type Error Handling', () => {
    it('should handle invalid JSON payload', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json}')
        .expect(400);

      // Express built-in error handler should catch this
      expect(res.body || res.text).toBeDefined();
    });

    it('should handle oversized payload', async () => {
      const largePayload = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        extraLargeField: 'x'.repeat(15 * 1024 * 1024) // 15MB (exceeds 10MB limit)
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(largePayload)
        .expect(413);

      // Express should reject oversized payloads
      expect(res.status).toBe(413);
    });
  });

  describe('HTTP Method Error Handling', () => {
    it('should handle unsupported HTTP methods', async () => {
      const res = await request(app)
        .patch('/api/auth/register') // PATCH not supported, only POST
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Resource Not Found Error Handling', () => {
    it('should handle non-existent API endpoints', async () => {
      const res = await request(app)
        .get('/api/nonexistent/endpoint')
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Route /api/nonexistent/endpoint not found');
    });

    it('should handle non-existent nested routes', async () => {
      const res = await request(app)
        .get('/api/auth/nonexistent')
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Rate Limiting and Security Error Scenarios', () => {
    it('should handle multiple validation errors simultaneously', async () => {
      const invalidData = {
        username: 'ab', // too short
        email: 'invalid-email', // invalid format
        password: '123', // too short
        // missing firstName and lastName
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.errors).toHaveLength(5); // username, email, password, firstName, lastName
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'username' }),
          expect.objectContaining({ path: 'email' }),
          expect.objectContaining({ path: 'password' }),
          expect.objectContaining({ path: 'firstName' }),
          expect.objectContaining({ path: 'lastName' })
        ])
      );
    });
  });

  describe('Edge Case Data Handling', () => {
    it('should handle special characters in input fields', async () => {
      const userData = {
        username: 'test@#$%',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should either succeed or fail gracefully with validation error
      expect([201, 400]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.status).toBe('error');
      }
    });

    it('should handle unicode characters in input fields', async () => {
      const userData = {
        username: 'тестuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Тест',
        lastName: 'Юзер'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should either succeed or fail gracefully
      expect([201, 400]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.status).toBe('error');
      }
    });

    it('should handle null values in required fields', async () => {
      const userData = {
        username: null,
        email: null,
        password: null,
        firstName: null,
        lastName: null
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty string values', async () => {
      const userData = {
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });
});