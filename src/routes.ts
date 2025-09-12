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
  page: {
    base: {
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
      catalog: catalogPath,
    },
    profile: {
      personalData: [profilePath, 'personal'].join('/'),
      orderHistory: [profilePath, 'orders'].join('/'),
      favorites: [profilePath, 'favorites'].join('/'),
      myReviews: [profilePath, 'reviews'].join('/'),
      settings: [profilePath, 'settings'].join('/'),
    },
    admin: {
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
      messageReport: [adminPath, 'reports', 'message'].join('/'),
      userList: [adminPath, 'user', 'list'].join('/'),
      userCard: [adminPath, 'user'].join('/'),
    },
  },

  // user
  user: {
    login: [apiPath, 'user', 'login'].join('/'),
    signup: [apiPath, 'user', 'signup'].join('/'),
    logout: [apiPath, 'user', 'logout'].join('/'),
    recoveryPassword: [apiPath, 'user', 'recovery-password'].join('/'),
    updateTokens: [apiPath, 'user', 'update-tokens'].join('/'),
    confirmPhone: [apiPath, 'user', 'confirm-phone'].join('/'),
    changeUserProfile: [apiPath, 'user', 'change-user-profile'].join('/'),
    unlinkTelegram: [apiPath, 'user', 'unlink-telegram'].join('/'),
    getMyGrades: [apiPath, 'user', 'myGrades'].join('/'),
    getUserCard: (id?: number) => [apiPath, 'user', 'card', id ?? ':id'].join('/'),
    changeLang: [apiPath, 'user', 'change-lang'].join('/'),
    removeFavorites: (id?: number) => [apiPath, 'user', 'item', id ?? ':id', 'delete'].join('/'),
    addFavorites: (id?: number) => [apiPath, 'user', 'item', id ?? ':id', 'add'].join('/'),
  },

  // integration
  integration: {
    telegram: {
      webhook: [apiPath, 'telegram'].join('/'),
    },
    yookassa: {
      webhook: [apiPath, 'payment', 'check'].join('/'),
    },
    gpt: {
      generateDescription: (id?: number) => [apiPath, 'gpt', id ?? ':id', 'generate-description'].join('/'),
      generateDescriptionWithoutItem: [apiPath, 'gpt', 'generate-description'].join('/'),
    },
  },

  // order
  order: {
    updateStatus: (id?: number) => [apiPath, 'order', id ?? ':id', 'update-status'].join('/'),
    findOne: (id?: number) => [apiPath, 'order', id ?? ':id'].join('/'),
    cancel: (id?: number) => [apiPath, 'order', id ?? ':id', 'cancel'].join('/'),
    pay: (id?: number) => [apiPath, 'order', id ?? ':id', 'pay'].join('/'),
    createOne: [apiPath, 'order', 'add'].join('/'),
    getAllOrders: [apiPath, 'order', 'getAll'].join('/'),
    getUserOrders: [apiPath, 'order', 'get-by-user'].join('/'),
  },

  // itemGroup
  itemGroup: {
    findMany: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'group'].join('/'),
    getByCode: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'group', 'get-by-code'].join('/'),
    createOne: [apiPath, 'group', 'add'].join('/'),
    sort: [apiPath, 'group', 'sort'].join('/'),
    updateOne: (id?: number | React.Key) => [apiPath, 'group', id ?? ':id', 'update'].join('/'),
    restoreOne: (id?: number | React.Key) => [apiPath, 'group', id ?? ':id', 'restore'].join('/'),
    deleteOne: (id?: number | React.Key) => [apiPath, 'group', id ?? ':id', 'delete'].join('/'),
  },

  // itemCollections
  itemCollection: {
    findMany: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'collection'].join('/'),
    crudItemCollection: (id?: number | React.Key) => [apiPath, 'item', 'collection', id ?? ':id'].join('/'),
    createOne: [apiPath, 'item', 'collection', 'add'].join('/'),
    updateOne: (id?: number | React.Key) => [apiPath, 'collection', id ?? ':id', 'update'].join('/'),
    restoreOne: (id?: number | React.Key) => [apiPath, 'collection', id ?? ':id', 'restore'].join('/'),
    deleteOne: (id?: number | React.Key) => [apiPath, 'collection', id ?? ':id', 'delete'].join('/'),
  },

  // storage
  storage: {
    image: {
      upload: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'image', 'upload'].join('/'),
      deleteOne: (id?: number) => [apiPath, 'image', id ?? ':id'].join('/'),
      removeCoverImage: (id?: number) => [apiPath, 'image', id ?? ':id', 'remove-cover'].join('/'),
      setCoverImage: [apiPath, 'image', 'set-cover'].join('/'),
      getCoverImages: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'image', 'getAll'].join('/'),
    },
  },

  // item
  item: {
    getList: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'list'].join('/'),
    getLinks: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'links'].join('/'),
    getByName: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'get-by-name'].join('/'),
    getSpecials: ({ isServer }: ServerClientInterface) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', 'get-special'].join('/'),
    getListExcel: [apiPath, 'item', 'list', 'excel'].join('/'),
    search: [apiPath, 'item', 'search'].join('/'),
    createOne: [apiPath, 'item', 'add'].join('/'),
    partialUpdateOne: (id?: number) => [apiPath, 'item', id ?? ':id', 'partial-update'].join('/'),
    updateOne: (id?: number) => [apiPath, 'item', id ?? ':id', 'update'].join('/'),
    restoreOne: (id?: number) => [apiPath, 'item', id ?? ':id', 'restore'].join('/'),
    deleteOne: (id?: number) => [apiPath, 'item', id ?? ':id', 'delete'].join('/'),
    publishToTelegram: (id?: number) => [apiPath, 'item', id ?? ':id', 'publish'].join('/'),
    getGrades: ({ id, isServer }: ServerClientInterface & { id?: number }) => [...(isServer ? [apiPath] : [serverHost, apiPath.slice(1)]), 'item', id ?? ':id', 'grades'].join('/'),
  },

  // cart
  cart: {
    findMany: [apiPath, 'cart', 'getAll'].join('/'),
    createOne: [apiPath, 'cart', 'add'].join('/'),
    deleteMany: [apiPath, 'cart', 'delete-all'].join('/'),
    incrementOne: (id?: string) => [apiPath, 'cart', id ?? ':id', 'increment'].join('/'),
    decrementOne: (id?: string) => [apiPath, 'cart', id ?? ':id', 'decrement'].join('/'),
    deleteOne: (id?: string) => [apiPath, 'cart', id ?? ':id', 'delete'].join('/'),
  },

  // comment
  comment: {
    createOne: [apiPath, 'comment', 'add'].join('/'),
    deleteOne: (id?: number) => [apiPath, 'comment', id ?? ':id', 'delete'].join('/'),
  },

  // promotional
  promotional: {
    createOne: [apiPath, 'promotional', 'add'].join('/'),
    findOneByName: [apiPath, 'promotional', 'get-by-name'].join('/'),
    findOne: (id?: number) => [apiPath, 'promotional', id ?? ':id'].join('/'),
    findMany: [apiPath, 'promotional', 'getAll'].join('/'),
    updateOne: (id?: number) => [apiPath, 'promotional', id ?? ':id', 'update'].join('/'),
    restoreOne: (id?: number) => [apiPath, 'promotional', id ?? ':id', 'restore'].join('/'),
    deleteOne: (id?: number) => [apiPath, 'promotional', id ?? ':id', 'delete'].join('/'),
  },

  // composition
  composition: {
    createOne: [apiPath, 'composition', 'add'].join('/'),
    findMany: [apiPath, 'composition', 'getAll'].join('/'),
    findOne: (id?: number) => [apiPath, 'composition', id ?? ':id'].join('/'),
    updateOne: (id?: number) => [apiPath, 'composition', id ?? ':id', 'update'].join('/'),
    restoreOne: (id?: number) => [apiPath, 'composition', id ?? ':id', 'restore'].join('/'),
    deleteOne: (id?: number) => [apiPath, 'composition', id ?? ':id', 'delete'].join('/'),
  },

  // color
  color: {
    createOne: [apiPath, 'color', 'add'].join('/'),
    findOne: (id?: number) => [apiPath, 'color', id ?? ':id'].join('/'),
    findMany: [apiPath, 'color', 'getAll'].join('/'),
    updateOne: (id?: number) => [apiPath, 'color', id ?? ':id', 'update'].join('/'),
    restoreOne: (id?: number) => [apiPath, 'color', id ?? ':id', 'restore'].join('/'),
    deleteOne: (id?: number) => [apiPath, 'color', id ?? ':id', 'delete'].join('/'),
  },

  // deferred publications
  deferredPublication: {
    item: {
      createOne: [apiPath, 'deferred-publication', 'item', 'add'].join('/'),
      findOne: (id?: number) => [apiPath, 'deferred-publication', 'item', id ?? ':id'].join('/'),
      findMany: [apiPath, 'deferred-publication', 'item', 'getAll'].join('/'),
      updateOne: (id?: number) => [apiPath, 'deferred-publication', 'item', id ?? ':id', 'update'].join('/'),
      restoreOne: (id?: number) => [apiPath, 'deferred-publication', 'item', id ?? ':id', 'restore'].join('/'),
      deleteOne: (id?: number) => [apiPath, 'deferred-publication', 'item', id ?? ':id', 'delete'].join('/'),
    },
    telegram: {
      createOne: [apiPath, 'deferred-publication', 'telegram', 'add'].join('/'),
      findOne: (id?: number) => [apiPath, 'deferred-publication', 'telegram', id ?? ':id'].join('/'),
      findMany: [apiPath, 'deferred-publication', 'telegram', 'getAll'].join('/'),
      updateOne: (id?: number) => [apiPath, 'deferred-publication', 'telegram', id ?? ':id', 'update'].join('/'),
      restoreOne: (id?: number) => [apiPath, 'deferred-publication', 'telegram', id ?? ':id', 'restore'].join('/'),
      deleteOne: (id?: number) => [apiPath, 'deferred-publication', 'telegram', id ?? ':id', 'delete'].join('/'),
    },
  },

  // grade
  grade: {
    createOne: (id?: number) => [apiPath, 'order-position', id ?? ':id', 'grade', 'add'].join('/'),
    deleteOne: (id?: number) => [apiPath, 'grade', id ?? ':id', 'delete'].join('/'),
    restoreOne: (id?: number) => [apiPath, 'grade', id ?? ':id', 'restore'].join('/'),
    accept: (id?: number) => [apiPath, 'grade', id ?? ':id', 'accept'].join('/'),
    getUnchekedGrades: [apiPath, 'grade', 'getAll'].join('/'),
  },

  // delivery
  delivery: {
    findMany: [apiPath, 'delivery', 'findMany'].join('/'),
  },

  // reports
  reports: {
    cart: [apiPath, 'reports', 'cart'].join('/'),
    message: [apiPath, 'reports', 'message'].join('/'),
    users: [apiPath, 'reports', 'user', 'list'].join('/'),
  },
} as const;
