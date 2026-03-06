// Utility functions for image handling

export const getProductImage = (product) => {
  if (product.photo) return product.photo;
  if (product.images && product.images.length > 0) {
    return typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
  }
  if (product.image) return product.image;
  return 'https://via.placeholder.com/400x400?text=No+Image';
};

export const getProductImages = (product) => {
  if (!product) return [];
  
  if (product.images && product.images.length > 0) {
    return product.images.map(img => typeof img === 'string' ? img : img.url);
  }
  
  const singleImage = product.photo || product.image;
  return singleImage ? [singleImage] : [];
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
