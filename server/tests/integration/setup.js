// Integration test setup
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/server');

let mongoServer;

const setupIntegrationTest = async () => {
  // Disconnect from any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri);
  
  return app;
};

const teardownIntegrationTest = async () => {
  // Clean up database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  // Stop MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearDatabase = async (excludeCollections = [], excludeIds = []) => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    
    // Skip excluded collections
    if (excludeCollections.includes(collection.collectionName)) {
      // If we have specific IDs to exclude, remove all except those
      if (excludeIds.length > 0) {
        await collection.deleteMany({ _id: { $nin: excludeIds } });
      }
      continue;
    }
    
    // Clear all data from other collections
    await collection.deleteMany({});
  }
};

const createTestUser = async (userData = {}) => {
  const User = require('../../src/models/User');
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    ...userData
  };
  
  const user = new User(defaultUser);
  await user.save();
  return user;
};

const createTestPost = async (postData = {}) => {
  const Post = require('../../src/models/Post');
  const mongoose = require('mongoose');
  const defaultPost = {
    title: 'Test Post',
    content: 'This is a test post content',
    author: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId(),
    slug: 'test-post',
    ...postData
  };
  
  const post = new Post(defaultPost);
  await post.save();
  return post;
};

const getAuthToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
    { expiresIn: '7d' }
  );
};

// Helper function for token generation (alias for backward compatibility)
const generateToken = getAuthToken;

module.exports = {
  setupIntegrationTest,
  teardownIntegrationTest,
  clearDatabase,
  createTestUser,
  createTestPost,
  getAuthToken,
  generateToken,
  request
};