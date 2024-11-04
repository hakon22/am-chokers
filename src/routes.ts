const serverHost = `${process.env.NEXT_PUBLIC_SERVER_HOST}${process.env.NEXT_PUBLIC_PORT ?? 3001}`;
const apiPath = process.env.NEXT_PUBLIC_API_PATH ?? '/api';

export const catalogPath = '/catalog';
const profilePath = '/profile';
const adminPath = '/admin';

export const routes = {
  // pages
  homePage: '/',
  loginPage: '/login',
  signupPage: '/signup',
  profilePage: profilePath,
  recoveryPage: '/recovery',
  notFoundPage: '*',
  catalog: catalogPath,
  // navbar
  necklace: [catalogPath, 'necklace'].join('/'),
  bracelets: [catalogPath, 'bracelets'].join('/'),
  earrings: [catalogPath, 'earrings'].join('/'),
  accessories: [catalogPath, 'accessories'].join('/'),
  // profile
  personalData: [profilePath, 'personal'].join('/'),
  orderHistory: [profilePath, 'orders'].join('/'),
  favorites: [profilePath, 'favorites'].join('/'),
  myReviews: [profilePath, 'reviews'].join('/'),
  settings: [profilePath, 'settings'].join('/'),
  // admin
  newItem: [adminPath, 'item', 'new'].join('/'),
  // user
  login: [apiPath, 'user', 'login'].join('/'),
  signup: [apiPath, 'user', 'signup'].join('/'),
  logout: [apiPath, 'user', 'logout'].join('/'),
  recoveryPassword: [apiPath, 'user', 'recovery-password'].join('/'),
  updateTokens: [apiPath, 'user', 'update-tokens'].join('/'),
  confirmPhone: [apiPath, 'user', 'confirm-phone'].join('/'),
  changeUserProfile: [apiPath, 'user', 'change-user-profile'].join('/'),
  unlinkTelegram: [apiPath, 'user', 'unlink-telegram'].join('/'),
  getOrders: [apiPath, 'user', 'orders'].join('/'),
  // integration
  telegram: [apiPath, 'telegram'].join('/'),
  // order
  order: [apiPath, 'order', ':id'].join('/'),
};
