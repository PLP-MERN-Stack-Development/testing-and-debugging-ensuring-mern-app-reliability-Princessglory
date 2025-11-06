// Simple test to verify Jest setup
describe('Test Environment Setup', () => {
  test('Jest is working correctly', () => {
    expect(true).toBe(true);
  });

  test('Math operations work', () => {
    expect(2 + 2).toBe(4);
    expect(5 * 3).toBe(15);
  });

  test('String operations work', () => {
    expect('hello').toBe('hello');
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});