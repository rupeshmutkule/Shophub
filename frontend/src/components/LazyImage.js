import { useState, useEffect, useRef } from 'react';

// Lazy loading image component with placeholder
function LazyImage({ src, alt, className = '', placeholder = 'https://via.placeholder.com/400x400?text=Loading...' }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const imgRef = useRef();

  useEffect(() => {
    let observer;
    
    if (imgRef.current) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imgRef.current);
            }
          });
        },
        {
          rootMargin: '50px' // Start loading 50px before image enters viewport
        }
      );
      
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

export default LazyImage;
