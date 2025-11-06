// Setup script for test database
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function setupTestDb() {
  try {
    // Create an in-memory MongoDB instance
    const mongod = new MongoMemoryServer();
    await mongod.start();
    const mongoUri = mongod.getUri();
    
    console.log('🚀 Test database setup completed!');
    console.log('📍 In-memory MongoDB URI:', mongoUri);
    console.log('💡 This database will be used for integration tests');
    console.log('📝 Add this to your .env.test file:');
    console.log(`MONGODB_TEST_URI=${mongoUri}`);
    
    // Create .env.test file
    const fs = require('fs');
    const envTestContent = `# Test environment variables
NODE_ENV=test
PORT=5001
MONGODB_TEST_URI=${mongoUri}
JWT_SECRET=test_jwt_secret_key_for_testing_only
`;
    
    fs.writeFileSync('.env.test', envTestContent);
    console.log('✅ Created .env.test file');
    
    // Close the connection
    await mongod.stop();
    
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupTestDb();
}

module.exports = setupTestDb;