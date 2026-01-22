// src/hooks/useTokenRefresh.js
import { useEffect, useCallback } from "react";
import { refresh } from "@/api/auth.api";
import { setAccessToken, getAccessToken } from "@/utils/authStorage";

/**
 * Hook to proactively refresh access token before it expires
 * - Refreshes on app load/mount
 * - Refreshes when user returns to the page (visibility change)
 * - Refreshes every 6 days (for a 7-day token)
 */
export function useTokenRefresh() {
  const doRefresh = useCallback(async () => {
    try {
      const res = await refresh();
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
    } catch (error) {
      // Don't logout here - let the interceptor handle it on next API call
      console.warn("Token refresh failed, will retry on next API call");
    }
  }, []);

  useEffect(() => {
    // Only run if user is logged in
    if (!getAccessToken()) return;

    // Refresh immediately on mount (ensures token is fresh on app load)
    doRefresh();

    // Refresh every 6 days (for a 7-day token expiration)
    // 6 days = 6 * 24 * 60 * 60 * 1000 = 518400000 ms
    const REFRESH_INTERVAL = 6 * 24 * 60 * 60 * 1000;

    const interval = setInterval(doRefresh, REFRESH_INTERVAL);

    // Also refresh when user returns to the page after being away
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && getAccessToken()) {
        doRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [doRefresh]);
}