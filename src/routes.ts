const serverHost = process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_PRODUCTION_HOST : `${process.env.NEXT_PUBLIC_SERVER_HOST ?? 'http://localhost:'}${process.env.NEXT_PUBLIC_PORT ?? 3001}`;
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
  privacyPolicy: '/privacy-policy',
  offerAgreement: '/offer-agreement',
  notFoundPage: '*',
  catalog: catalogPath,

  // admin pages
  newItem: [adminPath, 'item'].join('/'),
  itemList: [adminPath, 'item', 'list'].join('/'),
  itemGroupsControl: [adminPath, 'groups'].join('/'),
  itemCollectionsControl: [adminPath, 'collections'].join('/'),
  allOrders: [adminPath, 'orders'].join('/'),
  moderationOfReview: [adminPath, 'reviews'].join('/'),
  promotionalCodes: [adminPath, 'promotionals'].join('/'),
  compositionsControl: [adminPath, 'compositions'].join('/'),
  colorsControl: [adminPath, 'colors'].join('/'),
  cartReport: [adminPath, 'reports', 'cart'].join('/'),

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
  yookassa: [apiPath, 'payment', 'check'].join('/'),
  generateDescription: (id?: number) => [apiPath, 'gpt', id ?? ':id', 'generate-description'].join('/'),
  generateDescriptionWithoutItem: [apiPath, 'gpt', 'generate-description'].join('/'),

  // order
  crudOrder: (id?: number) => [apiPath, 'order', id ?? ':id'].join('/'),
  cancelOrder: (id?: number) => [apiPath, 'order', id ?? ':id', 'cancel'].join('/'),
  payOrder: (id?: number) => [apiPath, 'order', id ?? ':id', 'pay'].join('/'),
  createOrder: [apiPath, 'order', 'new'].join('/'),
  getAllOrders: [apiPath, 'order', 'getAll'].join('/'),
  getOrder:  ({ id, isServer }: ServerClientInterface & { id?: number }) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'order', id ?? ':id'].join('/'),

  // itemGroup
  getItemGroups: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'groups'].join('/'),
  getItemGroupByCode: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'get-by-code'].join('/'),
  crudItemGroup: (id?: number | React.Key) => [apiPath, 'item', 'group', id ?? ':id'].join('/'),
  createItemGroup: [apiPath, 'item', 'groups', 'new'].join('/'),

  // itemCollections
  getItemCollections: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'collections'].join('/'),
  crudItemCollection: (id?: number | React.Key) => [apiPath, 'item', 'collection', id ?? ':id'].join('/'),
  createItemCollection: [apiPath, 'item', 'collections', 'new'].join('/'),

  // storage
  imageUpload: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'image', 'upload'].join('/'),
  imageDelete: (id?: number) => [apiPath, 'image', id ?? ':id'].join('/'),
  removeCoverImage: (id?: number) => [apiPath, 'image', id ?? ':id', 'remove-cover'].join('/'),
  setCoverImage: [apiPath, 'image', 'set-cover'].join('/'),
  getCoverImages: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'image', 'getAll'].join('/'),

  // item
  getItemList: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'list'].join('/'),
  getItemLinks: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'links'].join('/'),
  getItemByName: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'get-by-name'].join('/'),
  getItemSpecials: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'get-special'].join('/'),
  createItem: [apiPath, 'item', 'new'].join('/'),
  searchItem: [apiPath, 'item', 'search'].join('/'),
  crudItem: (id?: number) => [apiPath, 'item', id ?? ':id'].join('/'),
  restoreItem: (id?: number) => [apiPath, 'item', id ?? ':id', 'restore'].join('/'),
  addFavorites: (id?: number) => [apiPath, 'item', id ?? ':id', 'add'].join('/'),
  removeFavorites: (id?: number) => [apiPath, 'item', id ?? ':id', 'remove'].join('/'),
  publishToTelegram: (id?: number) => [apiPath, 'item', id ?? ':id', 'publish'].join('/'),
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

  // composition
  createComposition: [apiPath, 'composition', 'add'].join('/'),
  getComposition: (id?: number) => [apiPath, 'composition', id ?? ':id'].join('/'),
  getCompositions: [apiPath, 'composition', 'getAll'].join('/'),
  updateComposition: (id?: number) => [apiPath, 'composition', id ?? ':id', 'update'].join('/'),
  restoreComposition: (id?: number) => [apiPath, 'composition', id ?? ':id', 'restore'].join('/'),
  removeComposition: (id?: number) => [apiPath, 'composition', id ?? ':id', 'remove'].join('/'),

  // color
  createColor: [apiPath, 'color', 'add'].join('/'),
  getColor: (id?: number) => [apiPath, 'color', id ?? ':id'].join('/'),
  getColors: [apiPath, 'color', 'getAll'].join('/'),
  updateColor: (id?: number) => [apiPath, 'color', id ?? ':id', 'update'].join('/'),
  restoreColor: (id?: number) => [apiPath, 'color', id ?? ':id', 'restore'].join('/'),
  removeColor: (id?: number) => [apiPath, 'color', id ?? ':id', 'remove'].join('/'),

  // grade
  createGrade: (id?: number) => [apiPath, 'order-position', id ?? ':id', 'grade', 'add'].join('/'),
  removeGrade: (id?: number) => [apiPath, 'grade', id ?? ':id', 'remove'].join('/'),
  restoreGrade: (id?: number) => [apiPath, 'grade', id ?? ':id', 'restore'].join('/'),
  acceptGrade: (id?: number) => [apiPath, 'grade', id ?? ':id', 'accept'].join('/'),
  getUnchekedGrades: [apiPath, 'grade', 'getAll'].join('/'),

  // delivery
  delivery: {
    findMany: [apiPath, 'delivery', 'findMany'].join('/'),
  },

  // reports
  reports: {
    cart: [apiPath, 'reports', 'cart'].join('/'),
  },
} as const;
