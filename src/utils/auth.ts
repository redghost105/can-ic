/**
 * Utility functions for handling authentication in the client
 */

// Get the authentication token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('authToken');
};

// Save the authentication token to localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('authToken', token);
};

// Remove the authentication token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('authToken');
};

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Decode JWT token to get payload (without verification)
export const decodeToken = (token: string): any => {
  try {
    // Get the payload part of the JWT (the second part)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  // Convert expiration time to milliseconds and compare with current time
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
};

// Get user ID from token
export const getUserIdFromToken = (): string | null => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  
  const payload = decodeToken(token);
  return payload?.sub || null;
};

// Get user role from token (if stored in token)
export const getUserRoleFromToken = (): string | null => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  
  const payload = decodeToken(token);
  return payload?.role || null;
}; 