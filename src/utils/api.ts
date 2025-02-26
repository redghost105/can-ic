/**
 * API utilities for making requests to the backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Base URL for API requests
 */
const API_BASE_URL = '/api';

/**
 * Make a GET request to the API
 * @param endpoint The API endpoint to call (without /api prefix)
 * @returns Response data or error
 */
export async function get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Something went wrong',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error('API GET Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch data',
    };
  }
}

/**
 * Make a POST request to the API
 * @param endpoint The API endpoint to call (without /api prefix)
 * @param body The request body to send
 * @returns Response data or error
 */
export async function post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Something went wrong',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error('API POST Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit data',
    };
  }
}

/**
 * Make a PUT request to the API
 * @param endpoint The API endpoint to call (without /api prefix)
 * @param body The request body to send
 * @returns Response data or error
 */
export async function put<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Something went wrong',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error('API PUT Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update data',
    };
  }
}

/**
 * Make a DELETE request to the API
 * @param endpoint The API endpoint to call (without /api prefix)
 * @returns Response data or error
 */
export async function del<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 204) {
      return {
        success: true,
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Something went wrong',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error('API DELETE Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete data',
    };
  }
} 