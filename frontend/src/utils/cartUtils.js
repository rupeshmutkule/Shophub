// Utility functions for cart operations

export const getCartKey = (user) => {
  return user && user.email ? `cart_${user.email}` : 'cart_guest';
};

export const loadCartFromStorage = (user) => {
  const cartKey = getCartKey(user);
  const savedCart = localStorage.getItem(cartKey);
  return savedCart ? JSON.parse(savedCart) : [];
};

export const saveCartToStorage = (cart, user) => {
  const cartKey = getCartKey(user);
  localStorage.setItem(cartKey, JSON.stringify(cart));
};

export const clearCartFromStorage = (user) => {
  const cartKey = getCartKey(user);
  localStorage.removeItem(cartKey);
};

export const getUniqueProductsCount = (cart) => {
  const uniqueProducts = {};
  cart.forEach(item => {
    const key = `${item.name}-${item.price}-${item.photo || item.image}`;
    uniqueProducts[key] = true;
  });
  return Object.keys(uniqueProducts).length;
};

export const groupCartItems = (cart) => {
  const grouped = {};
  
  cart.forEach((item, index) => {
    const key = `${item.name}-${item.price}-${item.photo || item.image}-${item.size || ''}-${item.isCustomized || false}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        quantity: 1,
        indices: [index]
      };
    } else {
      grouped[key].quantity += 1;
      grouped[key].indices.push(index);
    }
  });
  
  return Object.values(grouped);
};
