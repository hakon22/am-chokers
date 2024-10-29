const serverHost = `${process.env.NEXT_PUBLIC_SERVER_HOST}${process.env.NEXT_PUBLIC_PORT ?? 3001}`;
const apiPath = process.env.NEXT_PUBLIC_API_PATH ?? '/api';

export const catalogPath = '/catalog';
const profilePath = '/profile';

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
  orderHistory: [profilePath, 'order'].join('/'),
  favorites: [profilePath, 'favorites'].join('/'),
  myReviews: [profilePath, 'reviews'].join('/'),
  settings: [profilePath, 'settings'].join('/'),
  // auth
  login: [apiPath, 'auth', 'login'].join('/'),
  signup: [apiPath, 'auth', 'signup'].join('/'),
  logout: [apiPath, 'auth', 'logout'].join('/'),
  recoveryPassword: [apiPath, 'auth', 'recovery-password'].join('/'),
  updateTokens: [apiPath, 'auth', 'update-tokens'].join('/'),
  confirmPhone: [apiPath, 'auth', 'confirm-phone'].join('/'),
  changeUserProfile: [apiPath, 'auth', 'change-user-profile'].join('/'),
  unlinkTelegram: [apiPath, 'auth', 'unlink-telegram'].join('/'),
  // integration
  telegram: [apiPath, 'telegram'].join('/'),
  // order
  order: [apiPath, 'order', 'history'].join('/'),
};
