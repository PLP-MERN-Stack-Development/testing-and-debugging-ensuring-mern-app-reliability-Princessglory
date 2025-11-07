// Integration tests for authentication routes
const {
  setupIntegrationTest,
  teardownIntegrationTest,
  clearDatabase,
  createTestUser,
  getAuthToken,
  request
} = require('./setup');

const User = require('../../src/models/User');

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = await setupIntegrationTest();
  });

  afterAll(async () => {
    await teardownIntegrationTest();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('username', 'newuser');
      expect(response.body.data.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: 'newuser@example.com' });
      expect(savedUser).toBeTruthy();
      expect(savedUser.username).toBe('newuser');
    });

    test('should hash password before saving to database', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const savedUser = await User.findOne({ email: 'test@example.com' });
      expect(savedUser.password).not.toBe('plainpassword');
      expect(savedUser.password.length).toBeGreaterThan(20); // Hashed password is longer
    });

    test('should return 400 when registering with existing email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User already exists');
    });

    test('should return 400 when registering with existing username', async () => {
      await createTestUser({ username: 'existinguser' });

      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User already exists');
    });

    test('should return 400 for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    test('should return 400 for short password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid email and password', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });

      const loginData = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should login with valid username and password', async () => {
      const user = await createTestUser({
        username: 'loginuser',
        password: 'password123'
      });

      const loginData = {
        username: 'loginuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.username).toBe('loginuser');
    });

    test('should return 400 for invalid password', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'correctpassword'
      });

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return 400 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get current user profile with valid token', async () => {
      const { user, token } = await getAuthToken();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No token, authorization denied');
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token is not valid');
    });

    test('should return 401 for malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'invalidheader');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token is not valid');
    });
  });

  describe('Authentication Flow Integration', () => {
    test('should complete full registration and login flow', async () => {
      // Register new user
      const userData = {
        username: 'flowtest',
        email: 'flow@example.com',
        password: 'password123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      const registrationToken = registerResponse.body.data.token;

      // Use registration token to access protected route
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registrationToken}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.user.email).toBe('flow@example.com');

      // Login with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'flow@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.user.email).toBe('flow@example.com');

      // Verify both tokens work for protected routes
      const loginToken = loginResponse.body.data.token;
      const meWithLoginTokenResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`);

      expect(meWithLoginTokenResponse.status).toBe(200);
    });
  });
});