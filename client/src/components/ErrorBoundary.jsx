import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Enhanced error logging with debugging context
    console.error('🚨 React Error Boundary Caught Error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    });
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Send error to backend for debugging in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo, errorId);
    }

    // Trigger custom error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  logErrorToService = async (error, errorInfo, errorId) => {
    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      };

      // Send to backend error tracking endpoint
      await fetch('/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReportError = () => {
    // Allow user to report the error with debugging info
    const errorDetails = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `;
    
    // Copy to clipboard for easy reporting
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails);
      alert('Error details copied to clipboard');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>Oops! Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-info">
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                  <pre className="error-stack">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="error-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary"
                data-testid="reset-error-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
                data-testid="reload-page-button"
              >
                Reload Page
              </button>
              {process.env.NODE_ENV === 'production' && (
                <button 
                  onClick={this.handleReportError}
                  className="btn btn-info"
                  data-testid="report-error-button"
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;