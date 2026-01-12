// src/hooks/useTokenRefresh.js
import { useEffect } from "react";
import { refresh } from "@/api/auth.api";
import { setAccessToken, getAccessToken } from "@/utils/authStorage";

/**
 * Hook to proactively refresh access token before it expires
 * Refreshes every 25 minutes (for a 30-minute token)
 */
export function useTokenRefresh() {
  useEffect(() => {
    // Only run if user is logged in
    if (!getAccessToken()) return;

    // Refresh every 25 minutes (1500000 ms)
    // This is 5 minutes before the 30-minute expiration
    const REFRESH_INTERVAL = 25 * 60 * 1000;

    console.log("⏰ Starting proactive token refresh (every 25 minutes)");

    const interval = setInterval(async () => {
      try {
        console.log("🔄 Proactive token refresh...");
        const res = await refresh();
        
        if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);
          console.log("✅ Token proactively refreshed");
        }
      } catch (error) {
        console.error("❌ Proactive refresh failed:", error);
        // Don't logout here - let the interceptor handle it on next API call
      }
    }, REFRESH_INTERVAL);

    return () => {
      console.log("⏹️ Stopping proactive token refresh");
      clearInterval(interval);
    };
  }, []);
}