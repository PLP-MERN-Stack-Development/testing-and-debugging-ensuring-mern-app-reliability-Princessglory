// Integration tests for users routes
const mongoose = require('mongoose');
const {
  setupIntegrationTest,
  teardownIntegrationTest,
  clearDatabase,
  createTestUser,
  getAuthToken,
  request
} = require('./setup');

const User = require('../../src/models/User');
const app = require('../../src/server');

let token;
let userId;
let testUser;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  await setupIntegrationTest();
  
  // Create a test user
  testUser = await createTestUser({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });
  userId = testUser._id;
  token = getAuthToken(testUser);
});

// Clean up after all tests
afterAll(async () => {
  await teardownIntegrationTest();
});

// Clean up database between tests (except for main test user)
afterEach(async () => {
  await clearDatabase(['users'], [userId]);
});

describe('GET /api/users/profile', () => {
  it('should return user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId.toString());
    expect(res.body.username).toBe('testuser');
    expect(res.body.email).toBe('test@example.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .get('/api/users/profile');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/users/profile', () => {
  it('should update user profile when authenticated', async () => {
    const updates = {
      username: 'updateduser',
      email: 'updated@example.com'
    };

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(updates.username);
    expect(res.body.email).toBe(updates.email);
    expect(res.body).not.toHaveProperty('password');

    // Verify the update in database
    const updatedUser = await User.findById(userId);
    expect(updatedUser.username).toBe(updates.username);
    expect(updatedUser.email).toBe(updates.email);
  });

  it('should return 401 if not authenticated', async () => {
    const updates = {
      username: 'unauthorized'
    };

    const res = await request(app)
      .put('/api/users/profile')
      .send(updates);

    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid email format', async () => {
    const updates = {
      email: 'invalid-email'
    };

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for duplicate username', async () => {
    // Create another user
    await createTestUser({
      username: 'anotheruser',
      email: 'another@example.com',
      password: 'password123'
    });

    const updates = {
      username: 'anotheruser'
    };

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for duplicate email', async () => {
    // Create another user
    await createTestUser({
      username: 'anotheruser2',
      email: 'another2@example.com',
      password: 'password123'
    });

    const updates = {
      email: 'another2@example.com'
    };

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/users/change-password', () => {
  beforeEach(async () => {
    // Reset password for each test
    testUser = await User.findById(userId);
    testUser.password = 'password123';
    await testUser.save();
  });

  it('should change password when current password is correct', async () => {
    const passwordData = {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    };

    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('password');

    // Verify password was changed by trying to login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'newpassword123'
      });

    expect(loginRes.status).toBe(200);
  });

  it('should return 401 if not authenticated', async () => {
    const passwordData = {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    };

    const res = await request(app)
      .put('/api/users/change-password')
      .send(passwordData);

    expect(res.status).toBe(401);
  });

  it('should return 400 if current password is incorrect', async () => {
    const passwordData = {
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword123'
    };

    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if new password is too short', async () => {
    const passwordData = {
      currentPassword: 'password123',
      newPassword: '123'
    };

    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if passwords are missing', async () => {
    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('DELETE /api/users/profile', () => {
  it('should delete user account when authenticated', async () => {
    // Create a user specifically for deletion test
    const userToDelete = await createTestUser({
      username: 'deleteuser',
      email: 'delete@example.com',
      password: 'password123'
    });
    const deleteToken = getAuthToken(userToDelete);

    const res = await request(app)
      .delete('/api/users/profile')
      .set('Authorization', `Bearer ${deleteToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');

    // Verify user is deleted
    const deletedUser = await User.findById(userToDelete._id);
    expect(deletedUser).toBeNull();
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .delete('/api/users/profile');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/users', () => {
  beforeEach(async () => {
    // Create additional users for listing tests
    await createTestUser({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123'
    });
    await createTestUser({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123'
    });
  });

  it('should return list of users when authenticated', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    
    // Check that passwords are not included
    res.body.forEach(user => {
      expect(user).not.toHaveProperty('password');
    });
  });

  it('should paginate users list', async () => {
    // Create more users
    for (let i = 3; i <= 15; i++) {
      await createTestUser({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'password123'
      });
    }

    const page1 = await request(app)
      .get('/api/users?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    
    const page2 = await request(app)
      .get('/api/users?page=2&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.length).toBe(10);
    expect(page2.body.length).toBeGreaterThan(0);
  });

  it('should search users by username', async () => {
    const res = await request(app)
      .get('/api/users?search=user1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.some(user => user.username.includes('user1'))).toBeTruthy();
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .get('/api/users');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/:id', () => {
  it('should return user by ID when authenticated', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId.toString());
    expect(res.body.username).toBe('testuser');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 404 for non-existent user', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`);

    expect(res.status).toBe(401);
  });
});