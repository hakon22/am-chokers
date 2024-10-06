const serverHost = `${process.env.NEXT_PUBLIC_SERVER_HOST}${process.env.NEXT_PUBLIC_PORT ?? 3001}`;
const apiPath = process.env.NEXT_PUBLIC_API_PATH ?? '/api';

export const catalogPath = '/catalog';

interface ApiUrl {
  [key: string]: string;
}

export const routes = {
  // pages
  homePage: '/',
  loginPage: '/login',
  signupPage: '/signup',
  profilePage: '/profile',
  recoveryPage: '/recovery',
  catalog: catalogPath,
  // navbar
  necklace: [catalogPath, 'necklace'].join('/'),
  bracelets: [catalogPath, 'bracelets'].join('/'),
  earrings: [catalogPath, 'earrings'].join('/'),
  accessories: [catalogPath, 'accessories'].join('/'),
  notFoundPage: '*',
  // auth
  login: [apiPath, 'auth', 'login'].join('/'),
  signup: [apiPath, 'auth', 'signup'].join('/'),
  logout: [apiPath, 'auth', 'logout'].join('/'),
  recoveryPassword: [apiPath, 'auth', 'recoveryPassword'].join('/'),
  updateTokens: [apiPath, 'auth', 'updateTokens'].join('/'),
} as ApiUrl;
