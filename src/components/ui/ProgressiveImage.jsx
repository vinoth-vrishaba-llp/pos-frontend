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

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
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