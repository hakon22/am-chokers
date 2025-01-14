const serverHost = process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_PRODUCTION_HOST : `${process.env.NEXT_PUBLIC_SERVER_HOST}${process.env.NEXT_PUBLIC_PORT ?? 3001}`;
const apiPath = process.env.NEXT_PUBLIC_API_PATH ?? '/api';

interface ServerClientInterface {
  isServer?: boolean;
}

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
  aboutBrandPage: '/about-brand',
  jewelryCarePage: '/jewelry-care',
  contactsPage: '/contacts',
  deliveryPage: '/delivery',
  cartPage: '/cart',
  notFoundPage: '*',
  catalog: catalogPath,

  // admin pages
  newItem: [adminPath, 'item'].join('/'),
  itemGroupsControl: [adminPath, 'groups'].join('/'),
  itemCollectionsControl: [adminPath, 'collections'].join('/'),
  allOrders: [adminPath, 'orders'].join('/'),
  moderationOfReview: [adminPath, 'reviews'].join('/'),
  promotionalCodes: [adminPath, 'promotional'].join('/'),

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
  getMyGrades: [apiPath, 'user', 'myGrades'].join('/'),

  // integration
  telegram: [apiPath, 'telegram'].join('/'),

  // order
  crudOrder: (id?: number) => [apiPath, 'order', id ?? ':id'].join('/'),
  cancelOrder: (id?: number) => [apiPath, 'order', id ?? ':id', 'cancel'].join('/'),
  createOrder: [apiPath, 'order', 'new'].join('/'),
  getAllOrders: [apiPath, 'order', 'getAll'].join('/'),
  getOrder:  ({ id, isServer }: ServerClientInterface & { id?: number }) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'order', id ?? ':id'].join('/'),

  // itemGroup
  getItemGroups: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'groups'].join('/'),
  crudItemGroup: (id?: number | React.Key) => [apiPath, 'item', 'group', id ?? ':id'].join('/'),
  createItemGroup: [apiPath, 'item', 'groups', 'new'].join('/'),

  // itemCollections
  getItemCollections: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'collections'].join('/'),
  crudItemCollection: (id?: number | React.Key) => [apiPath, 'item', 'collection', id ?? ':id'].join('/'),
  createItemCollection: [apiPath, 'item', 'collections', 'new'].join('/'),

  // storage
  imageUpload: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'image', 'upload'].join('/'),
  imageDelete: (id?: number) => [apiPath, 'image', id ?? ':id'].join('/'),

  // item
  getItems: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'items'].join('/'),
  createItem: [apiPath, 'item', 'new'].join('/'),
  crudItem: (id?: number) => [apiPath, 'item', id ?? ':id'].join('/'),
  restoreItem: (id?: number) => [apiPath, 'item', id ?? ':id', 'restore'].join('/'),
  addFavorites: (id?: number) => [apiPath, 'item', id ?? ':id', 'add'].join('/'),
  removeFavorites: (id?: number) => [apiPath, 'item', id ?? ':id', 'remove'].join('/'),
  getGrades: ({ id, isServer }: ServerClientInterface & { id?: number }) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', id ?? ':id', 'grades'].join('/'),

  // cart
  getCart: [apiPath, 'cart', 'getAll'].join('/'),
  createCartItem: [apiPath, 'cart', 'new'].join('/'),
  removeManyCartItems: [apiPath, 'cart', 'removeAll'].join('/'),
  incrementCartItem: (id?: string) => [apiPath, 'cart', id ?? ':id', 'increment'].join('/'),
  decrementCartItem: (id?: string) => [apiPath, 'cart', id ?? ':id', 'decrement'].join('/'),
  removeCartItem: (id?: string) => [apiPath, 'cart', id ?? ':id', 'remove'].join('/'),

  // comment
  createComment: [apiPath, 'comment', 'add'].join('/'),
  removeComment: (id?: number) => [apiPath, 'comment', id ?? ':id', 'remove'].join('/'),

  // promotional
  createPromotional: [apiPath, 'promotional', 'add'].join('/'),
  getPromotionalByName: [apiPath, 'promotional', 'get-by-name'].join('/'),
  getPromotional: (id?: number) => [apiPath, 'promotional', id ?? ':id'].join('/'),
  getPromotionals: [apiPath, 'promotional', 'getAll'].join('/'),
  updatePromotional: (id?: number) => [apiPath, 'promotional', id ?? ':id', 'update'].join('/'),
  restorePromotional: (id?: number) => [apiPath, 'promotional', id ?? ':id', 'restore'].join('/'),
  removePromotional: (id?: number) => [apiPath, 'promotional', id ?? ':id', 'remove'].join('/'),

  // grade
  createGrade: (id?: number) => [apiPath, 'order-position', id ?? ':id', 'grade', 'add'].join('/'),
  removeGrade: (id?: number) => [apiPath, 'grade', id ?? ':id', 'remove'].join('/'),
  restoreGrade: (id?: number) => [apiPath, 'grade', id ?? ':id', 'restore'].join('/'),
  acceptGrade: (id?: number) => [apiPath, 'grade', id ?? ':id', 'accept'].join('/'),
  getUnchekedGrades: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'grade', 'getAll'].join('/'),
} as const;
