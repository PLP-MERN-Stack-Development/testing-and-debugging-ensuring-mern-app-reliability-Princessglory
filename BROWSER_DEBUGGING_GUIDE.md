# Browser Developer Tools Debugging Guide

## 🔧 Client-Side Debugging Techniques

This guide demonstrates how to effectively use browser developer tools for debugging the MERN application client-side code.

## Console Debugging

### Enhanced Console Logging
```javascript
// Basic console methods with different levels
console.log('Info message');
console.warn('Warning message');
console.error('Error message');
console.debug('Debug message');

// Grouped console output for better organization
console.group('User Registration Process');
console.log('1. Validating form data...');
console.log('2. Sending API request...');
console.log('3. Processing response...');
console.groupEnd();

// Table format for objects and arrays
const users = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
];
console.table(users);

// Timing operations
console.time('API Request');
// ... API call code
console.timeEnd('API Request');

// Conditional logging
const DEBUG = process.env.NODE_ENV === 'development';
DEBUG && console.log('Development only message');
```

### Custom Debug Logger
```javascript
// Enhanced debug utility for React components
const debugLogger = {
  component: (componentName, action, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔧 ${componentName} - ${action}`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data:', data);
      console.log('Component Stack:', new Error().stack);
      console.groupEnd();
    }
  },
  
  api: (method, url, data, response, duration) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🌐 API ${method.toUpperCase()} ${url}`);
      console.log('Request Data:', data);
      console.log('Response:', response);
      console.log('Duration:', `${duration}ms`);
      console.log('Status:', response?.status || 'Unknown');
      console.groupEnd();
    }
  },
  
  performance: (label, startTime) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Performance: ${label} took ${duration.toFixed(2)}ms`);
      
      if (duration > 100) {
        console.warn(`⚠️ Slow operation detected: ${label} (${duration.toFixed(2)}ms)`);
      }
    }
    
    return duration;
  }
};

// Usage example in React component
const UserComponent = () => {
  useEffect(() => {
    debugLogger.component('UserComponent', 'Component Mounted');
  }, []);
  
  const handleApiCall = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      debugLogger.api('GET', '/api/users', null, data, performance.now() - startTime);
    } catch (error) {
      console.error('API Error:', error);
    }
  };
};
```

## Network Debugging

### API Request Monitoring
```javascript
// Enhanced fetch wrapper with debugging
const debugFetch = async (url, options = {}) => {
  const startTime = performance.now();
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  
  console.group(`🌐 API Request [${requestId}]`);
  console.log('URL:', url);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:', options.headers);
  console.log('Body:', options.body);
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Duration:', `${duration.toFixed(2)}ms`);
    
    // Clone response to read it without consuming it
    const clonedResponse = response.clone();
    const responseData = await clonedResponse.json().catch(() => 'Non-JSON response');
    console.log('Response Data:', responseData);
    
    console.groupEnd();
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error('Request Failed:', error);
    console.log('Duration:', `${duration.toFixed(2)}ms`);
    console.groupEnd();
    
    throw error;
  }
};

// Usage
const apiService = {
  async getUsers() {
    return debugFetch('/api/users');
  },
  
  async createUser(userData) {
    return debugFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  }
};
```

## Component State Debugging

### React DevTools Integration
```javascript
// Custom hook for debugging component state
const useDebugState = (stateName, state) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 State Change [${stateName}]:`, {
        previous: useRef(state).current,
        current: state,
        timestamp: new Date().toISOString()
      });
    }
  }, [state, stateName]);
  
  // Store previous value
  const prevState = useRef();
  useEffect(() => {
    prevState.current = state;
  });
};

// Usage in components
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Debug state changes
  useDebugState('user', user);
  useDebugState('loading', loading);
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Props Debugging
```javascript
// Higher-order component for props debugging
const withPropsDebugger = (WrappedComponent, componentName) => {
  return (props) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🎯 Props Debug: ${componentName}`);
      console.log('Props received:', props);
      console.log('Props count:', Object.keys(props).length);
      console.log('Props types:', Object.entries(props).map(([key, value]) => ({
        key,
        type: typeof value,
        value: value
      })));
      console.groupEnd();
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Usage
const UserCard = withPropsDebugger(({ user, onEdit }) => {
  return <div>{user.name}</div>;
}, 'UserCard');
```

## Performance Debugging

### Component Render Tracking
```javascript
// Custom hook to track component renders
const useRenderTracker = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  renderCount.current++;
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    console.log(`🔄 Render #${renderCount.current} - ${componentName}`, {
      timeSinceLastRender: `${timeSinceLastRender}ms`,
      timestamp: new Date(now).toISOString()
    });
    
    lastRenderTime.current = now;
  });
  
  // Warn about excessive renders
  if (renderCount.current > 10) {
    console.warn(`⚠️ Excessive renders detected in ${componentName}: ${renderCount.current} renders`);
  }
};

// Usage
const MyComponent = () => {
  useRenderTracker('MyComponent');
  
  return <div>Component content</div>;
};
```

### Memory Usage Monitoring
```javascript
// Memory usage tracker for client-side
const memoryMonitor = {
  track: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      
      console.log('📊 Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
        percentage: `${Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%`
      });
    }
  },
  
  startMonitoring: (interval = 30000) => {
    return setInterval(() => {
      memoryMonitor.track();
    }, interval);
  }
};

// Start monitoring in development
if (process.env.NODE_ENV === 'development') {
  memoryMonitor.startMonitoring();
}
```

## Error Debugging

### Global Error Handler
```javascript
// Global error handling for unhandled errors
window.addEventListener('error', (event) => {
  console.group('🚨 Global JavaScript Error');
  console.error('Error:', event.error);
  console.log('Message:', event.message);
  console.log('Filename:', event.filename);
  console.log('Line:', event.lineno);
  console.log('Column:', event.colno);
  console.log('Stack:', event.error?.stack);
  console.groupEnd();
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.group('🚨 Unhandled Promise Rejection');
  console.error('Reason:', event.reason);
  console.log('Promise:', event.promise);
  console.log('Stack:', event.reason?.stack);
  console.groupEnd();
});
```

## Local Storage Debugging
```javascript
// Enhanced localStorage debugging
const storageDebugger = {
  set: (key, value) => {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    
    console.log('💾 LocalStorage Set:', {
      key,
      value,
      size: `${stringValue.length} bytes`,
      timestamp: new Date().toISOString()
    });
  },
  
  get: (key) => {
    const value = localStorage.getItem(key);
    const parsedValue = value ? JSON.parse(value) : null;
    
    console.log('📖 LocalStorage Get:', {
      key,
      value: parsedValue,
      exists: value !== null
    });
    
    return parsedValue;
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
    console.log('🗑️ LocalStorage Remove:', { key });
  },
  
  clear: () => {
    localStorage.clear();
    console.log('🧹 LocalStorage Cleared');
  },
  
  inspect: () => {
    console.group('🔍 LocalStorage Contents');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    }
    console.groupEnd();
  }
};

// Usage
storageDebugger.set('user', { id: 1, name: 'John' });
const user = storageDebugger.get('user');
storageDebugger.inspect();
```

## Browser DevTools Commands

### Useful Console Commands
```javascript
// Available in browser console during development

// Inspect React component props and state
$r // Access selected React component in Elements panel

// Performance measurement
console.time('operation');
// ... code to measure
console.timeEnd('operation');

// Monitor function calls
monitor(functionName); // Logs when function is called
unmonitor(functionName); // Stop monitoring

// Debug function calls
debug(functionName); // Breaks when function is called
undebug(functionName); // Remove breakpoint

// Inspect DOM elements
$0 // Last selected element in Elements panel
$1 // Second to last selected element
$('selector') // Query selector
$$('selector') // Query selector all

// Network monitoring
// Use Network tab to:
// - Monitor API requests and responses
// - Check request/response headers
// - Analyze request timing
// - Inspect payload data
```

## Integration with React Components

### Debug-enabled Component Example
```jsx
import React, { useState, useEffect } from 'react';

const DebugEnabledComponent = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔧 DebugEnabledComponent');
      console.log('Props:', { userId });
      console.log('State:', { user, loading });
      console.log('Mounted at:', new Date().toISOString());
      console.groupEnd();
    }
  }, [userId, user, loading]);
  
  const fetchUser = async () => {
    const startTime = performance.now();
    setLoading(true);
    
    try {
      console.log('🌐 Fetching user:', userId);
      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      
      console.log('📦 User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('❌ Error fetching user:', error);
    } finally {
      setLoading(false);
      const duration = performance.now() - startTime;
      console.log(`⏱️ Fetch completed in ${duration.toFixed(2)}ms`);
    }
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default DebugEnabledComponent;
```

This debugging guide provides comprehensive client-side debugging techniques using browser developer tools, enhanced console logging, performance monitoring, and error tracking specifically tailored for the MERN application.