// src/hooks/usePerformanceMonitor.js
import { useRef, useCallback } from "react";

/**
 * Hook to monitor and log performance metrics
 * Helps identify slow components and API calls
 */
export function usePerformanceMonitor() {
  const metricsRef = useRef([]);

  const startTimer = useCallback((label) => {
    const startTime = performance.now();
    return {
      label,
      start: startTime,
      end: () => {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        
        const metric = {
          label,
          duration: parseFloat(duration),
          timestamp: new Date().toISOString(),
        };
        
        metricsRef.current.push(metric);
        
        // Log if slow
        if (duration > 1000) {
          console.warn(`⚠️ SLOW: ${label} took ${duration}ms`);
        } else if (duration > 500) {
          console.log(`⏱️ ${label} took ${duration}ms`);
        } else {
          console.log(`⚡ ${label} took ${duration}ms`);
        }
        
        return parseFloat(duration);
      },
    };
  }, []);

  const getMetrics = useCallback(() => {
    return {
      all: metricsRef.current,
      slow: metricsRef.current.filter(m => m.duration > 1000),
      average: metricsRef.current.length > 0
        ? metricsRef.current.reduce((sum, m) => sum + m.duration, 0) / metricsRef.current.length
        : 0,
    };
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return {
    startTimer,
    getMetrics,
    clearMetrics,
  };
}