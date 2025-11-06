// Client test setup file
// require('@testing-library/jest-dom');

// Simple test setup for now - will be enhanced in Task 2
// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};