// Application constants

export const FAKESTORE_URL = "https://fakestoreapi.com/products";

export const CATEGORIES = {
  ALL: 'all',
  T_SHIRTS: 't-shirts',
  TUMBLERS: 'tumblers',
  GLASSWARE: 'glassware',
  CROCKERY: 'crockery',
  CUPS: 'cups',
  OTHERS: 'others'
};

export const CATEGORY_LABELS = {
  [CATEGORIES.T_SHIRTS]: 'T-Shirts',
  [CATEGORIES.TUMBLERS]: 'Tumblers',
  [CATEGORIES.GLASSWARE]: 'Glassware',
  [CATEGORIES.CROCKERY]: 'Crockery',
  [CATEGORIES.CUPS]: 'Cups',
  [CATEGORIES.OTHERS]: 'Others'
};

export const CLOTHING_CATEGORIES = [
  "men's clothing",
  "women's clothing",
  "t-shirts"
];

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const DEFAULT_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF'  // Cyan
];

export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Tahoma',
  'Lucida Console'
];

export const CANVAS_CONFIG = {
  WIDTH: 520,
  HEIGHT: 620,
  DEFAULT_FONT_SIZE: 28,
  DEFAULT_TEXT_COLOR: '#000000',
  DEFAULT_FONT_FAMILY: 'Arial',
  MIN_FONT_SIZE: 12,
  MAX_FONT_SIZE: 100
};

export const USER_TYPES = {
  ADMIN: 'admin',
  HOST: 'host',
  AGENT: 'agent',
  USER: 'user'
};
