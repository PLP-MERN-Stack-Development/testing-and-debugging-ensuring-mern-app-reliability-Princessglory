// Server test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Add any global setup here
});

afterAll(async () => {
  // Add any global cleanup here
});

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};