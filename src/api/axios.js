// src/api/axios.js
import axios from "axios";
import { getAccessToken, setAccessToken, clearAuth } from "@/utils/authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // ✅ 10 second global timeout
});

// ✅ Track refresh state to prevent multiple concurrent refresh calls
let isRefreshing = false;
let failedQueue = [];

// ✅ Process queued requests after refresh completes
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/* ============================
   REQUEST INTERCEPTOR
   ✅ Adds access token
   ✅ Adds performance tracking timestamp
============================ */
api.interceptors.request.use(
  (config) => {
    // ✅ Add timestamp for performance tracking
    config.metadata = { startTime: performance.now() };
    
    // ✅ Add access token
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* ============================
   RESPONSE INTERCEPTOR
   ✅ Logs slow requests
   ✅ Handles 401 with automatic token refresh
   ✅ Better timeout error messages
============================ */
api.interceptors.response.use(
  (response) => {
    // ✅ Log slow requests (over 2 seconds)
    if (response.config.metadata?.startTime) {
      const duration = performance.now() - response.config.metadata.startTime;
      if (duration > 2000) {
        console.warn(`⚠️ Slow API call: ${response.config.url} took ${duration.toFixed(0)}ms`);
      }
    }
    
    return response;
  },
  async (err) => {
    const original = err.config;

    // ✅ Better timeout error messages
    if (err.code === 'ECONNABORTED') {
      console.error(`❌ Request timeout: ${err.config?.url || 'unknown'}`);
      err.message = 'Request timed out. Please check your connection.';
    }

    // ⛔ Handle 401 errors with automatic token refresh
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      // ✅ If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // ✅ Mark as refreshing and set retry flag
      original._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Access token expired, attempting refresh...");
        
        // Call refresh endpoint
        const res = await api.post("/auth/refresh");
        const newToken = res.data.accessToken;
        
        if (newToken) {
          console.log("✅ Token refreshed successfully");
          
          // Save new token
          setAccessToken(newToken);
          
          // Update original request with new token
          original.headers.Authorization = `Bearer ${newToken}`;
          
          // Process any queued requests
          processQueue(null, newToken);
          
          // Retry original request
          return api(original);
        } else {
          throw new Error("No access token in refresh response");
        }
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError.response?.data || refreshError.message);
        
        // Process queue with error
        processQueue(refreshError, null);
        
        // Clear auth and redirect to login
        clearAuth();
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, just reject
    return Promise.reject(err);
  }
);

export default api;