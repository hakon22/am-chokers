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

  // admin pages
  newItem: [adminPath, 'item', 'new'].join('/'),
  itemGroupsControl: [adminPath, 'group', 'groups'].join('/'),

  // profile
  personalData: [profilePath, 'personal'].join('/'),
  orderHistory: [profilePath, 'orders'].join('/'),
  favorites: [profilePath, 'favorites'].join('/'),
  myReviews: [profilePath, 'reviews'].join('/'),
  settings: [profilePath, 'settings'].join('/'),

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

  // itemGroup
  itemGroups: ({ isServer }: { isServer: boolean }) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'groups'].join('/'),
  crudItemGroup: (id?: number | React.Key ) => [apiPath, 'item', 'group', id ?? ':id'].join('/'),
  createItemGroup: [apiPath, 'item', 'groups', 'new'].join('/'),

  // storage
  imageUpload: ({ isServer }: { isServer: boolean }) => [...(isServer ? [apiPath] : [process.env.NEXT_PUBLIC_DEV_HOST, apiPath.slice(1)]), 'image', 'upload'].join('/'),

  // item
  items: ({ isServer }: { isServer: boolean }) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'items'].join('/'),
  createItem: [apiPath, 'item', 'new'].join('/'),
  crudItem: (id?: number ) => [apiPath, 'item', id ?? ':id'].join('/'),
} as const;
