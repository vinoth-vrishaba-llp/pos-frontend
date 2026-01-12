// src/components/ui/ProgressiveImage.jsx
import { useState, useEffect } from "react";

/**
 * Progressive image loading with blur-up effect
 * Shows low-res placeholder while loading full image
 */
export default function ProgressiveImage({ 
  src, 
  alt, 
  className = "",
  placeholderSrc = null 
}) {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Create image element to preload
    const img = new Image();
    
    // Start loading timer
    const startTime = performance.now();
    
    img.onload = () => {
      const loadTime = (performance.now() - startTime).toFixed(0);
      console.log(`🖼️ Image loaded in ${loadTime}ms`);
      
      if (loadTime > 2000) {
        console.warn(`⚠️ Slow image load: ${loadTime}ms for ${src}`);
      }
      
      setImgSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      const loadTime = (performance.now() - startTime).toFixed(0);
      console.error(`❌ Image failed to load after ${loadTime}ms: ${src}`);
      setHasError(true);
      setIsLoading(false);
    };
    
    // Start loading
    img.src = src;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} transition-all duration-300 ${
        isLoading ? 'blur-sm' : 'blur-0'
      }`}
      loading="lazy"
    />
  );
}