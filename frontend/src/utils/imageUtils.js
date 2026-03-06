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

// Get order item image with fallback chain
export const getOrderItemImage = (item) => {
  // Priority: front design > customization preview > custom design > photo > image > images array > placeholder
  if (item.frontDesignUrl) return item.frontDesignUrl;
  if (item.customizationPreview) return item.customizationPreview;
  if (item.customDesignUrl) return item.customDesignUrl;
  if (item.photo) return item.photo;
  if (item.image) return item.image;
  if (item.images && item.images.length > 0) {
    return typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url;
  }
  return 'https://via.placeholder.com/100x100?text=Product';
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
