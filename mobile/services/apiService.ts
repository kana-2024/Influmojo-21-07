import { API_ENDPOINTS } from '../config/env';
import {
  getToken as getStoredToken,
  setToken as setStoredToken,
  clearToken as clearStoredToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken
} from './storage';

// Get stored token
const getToken = async (): Promise<string | null> => {
  return await getStoredToken();
};

// Set stored token
const setToken = async (token: string): Promise<void> => {
  await setStoredToken(token);
};

// Set refresh token
const setRefresh = async (token: string): Promise<void> => {
  await setRefreshToken(token);
};

// Clear both tokens
const clearTokens = async (): Promise<void> => {
  await clearStoredToken();
  await clearRefreshToken();
};

// Refresh access token using refresh token
const refreshAccessToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) throw new Error('Failed to refresh token');
  const data = await response.json();
  if (data.token && data.refreshToken) {
    await setToken(data.token);
    await setRefresh(data.refreshToken);
    return data.token;
  }
  throw new Error('Invalid refresh response');
};

// API request helper with refresh logic
const apiRequest = async (endpoint: string, options: RequestInit = {}, retry = true) => {
  let token = await getToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  try {
    const response = await fetch(endpoint, config);
    if (response.status === 401 && retry) {
      // Try to refresh token and retry request
      try {
        const newToken = await refreshAccessToken();
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newToken}`
          }
        };
        const retryResponse = await fetch(endpoint, retryConfig);
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(retryData.error || 'API request failed');
        return retryData;
      } catch (refreshError) {
        await clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  // Google OAuth
  googleAuth: async (idToken: string, isSignup: boolean = false, userType: string = 'creator') => {
    const response = await apiRequest(API_ENDPOINTS.GOOGLE_AUTH, {
      method: 'POST',
      body: JSON.stringify({ idToken, isSignup, userType }),
    });
    if (response.token) {
      await setToken(response.token);
    }
    if (response.refreshToken) {
      await setRefresh(response.refreshToken);
    }
    return response;
  },

  // Send OTP
  sendOTP: async (phone: string) => {
    return await apiRequest(API_ENDPOINTS.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // Verify OTP
  verifyOTP: async (phone: string, code: string, fullName?: string, userType: string = 'creator') => {
    const response = await apiRequest(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ phone, code, fullName, userType }),
    });
    if (response.token) {
      await setToken(response.token);
    }
    if (response.refreshToken) {
      await setRefresh(response.refreshToken);
    }
    return response;
  },

  // Logout
  logout: async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    await clearTokens();
  },

  // Update user name
  updateName: async (name: string) => {
    return await apiRequest(API_ENDPOINTS.UPDATE_NAME, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Get user profile
  getUserProfile: async () => {
    return await apiRequest(API_ENDPOINTS.USER_PROFILE, {
      method: 'GET',
    });
  },

  // Check if user exists
  checkUserExists: async (phone: string) => {
    return await apiRequest(API_ENDPOINTS.CHECK_USER_EXISTS, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
};

// Profile API calls
export const profileAPI = {
  // Update basic info
  updateBasicInfo: async (data: {
    gender: string;
    email?: string;
    phone?: string;
    dob: string;
    state: string;
    city: string;
    pincode: string;
  }) => {
    return await apiRequest(API_ENDPOINTS.UPDATE_BASIC_INFO, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update preferences
  updatePreferences: async (data: {
    categories: string[];
    about: string;
    languages: string[];
    role?: string;
    dateOfBirth?: Date;
  }) => {
    return await apiRequest(API_ENDPOINTS.UPDATE_PREFERENCES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create package
  createPackage: async (data: {
    platform: string;
    contentType: string;
    quantity: string;
    revisions: string;
    duration1: string;
    duration2: string;
    price: string;
    description?: string;
  }) => {
    return await apiRequest(API_ENDPOINTS.CREATE_PACKAGE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create portfolio item
  createPortfolio: async (data: {
    mediaUrl: string;
    mediaType: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
  }) => {
    return await apiRequest(API_ENDPOINTS.CREATE_PORTFOLIO, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create campaign
  createCampaign: async (data: {
    title: string;
    description: string;
    budget: string;
    duration: string;
    requirements: string;
    targetAudience: string;
  }) => {
    return await apiRequest(API_ENDPOINTS.CREATE_CAMPAIGN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create project
  createProject: async (data: {
    title: string;
    description: string;
    budget: string;
    timeline: string;
    requirements: string;
    deliverables: string;
  }) => {
    return await apiRequest(API_ENDPOINTS.CREATE_PROJECT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Submit KYC
  submitKYC: async (data: {
    documentType: string;
    frontImageUrl: string;
    backImageUrl: string;
  }) => {
    return await apiRequest(API_ENDPOINTS.SUBMIT_KYC, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get full profile
  getProfile: async () => {
    return await apiRequest(API_ENDPOINTS.GET_PROFILE, {
      method: 'GET',
    });
  },

  // Get creator profile
  getCreatorProfile: async () => {
    return await apiRequest(API_ENDPOINTS.GET_CREATOR_PROFILE, {
      method: 'GET',
    });
  },

  // Get brand profile
  getBrandProfile: async () => {
    return await apiRequest(API_ENDPOINTS.GET_BRAND_PROFILE, {
      method: 'GET',
    });
  },
};

// Utility functions
export const apiUtils = {
  getToken,
  setToken,
  clearToken: async () => {
    await clearStoredToken();
  },
}; 