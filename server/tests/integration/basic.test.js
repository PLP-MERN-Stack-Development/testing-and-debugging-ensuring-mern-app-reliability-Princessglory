// Basic integration test to validate our setup
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

// Set test environment before importing the app
process.env.NODE_ENV = 'test';

describe('Basic Integration Test', () => {
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
  }, 30000); // 30 second timeout

  afterAll(async () => {
    // Clean up
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000); // 30 second timeout

  it('should be able to make a basic request to the health endpoint', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('OK');
  });

  it('should return 404 for non-existent routes', async () => {
    const res = await request(app)
      .get('/api/non-existent-route')
      .expect(404);
      
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('error');
  });
});