// Unit tests for ProtectedRoute component
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock react-router-dom Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }) => <div data-testid="navigate" data-to={to} data-replace={replace}>Redirecting to {to}</div>
}));

describe('ProtectedRoute Component', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render children when user is authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('should redirect to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to /login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    const navigateElement = screen.getByTestId('navigate');
    expect(navigateElement).toHaveAttribute('data-to', '/login');
    expect(navigateElement).toHaveAttribute('data-replace', 'true');
  });

  test('should show loading spinner when authentication is loading', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  test('should not render children during loading state', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: true
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('should handle multiple children', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });
});