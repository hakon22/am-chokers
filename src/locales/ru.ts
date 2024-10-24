export default {
  translation: {
    pages: {
      404: {
        title: 'Ошибка 404',
        description: 'Страница не найдена',
        text: 'Возможно, наши горе-разработчики что-то сломали :(',
        prev: 'Назад',
      },
      index: {
        title: 'Привет',
        description: 'Описание',
        newItems: 'Новинки',
        collections: 'Коллекции',
        seeAll: 'Смотреть все',
        bestsellers: 'Бестселлеры',
        necklacesAndChokers: 'Колье и чокеры',
        bracelets: 'Браслеты',
        glassesChains: 'Цепочки для очков',
        otherAccessories: 'Другие аксессуары',
        iEmphasizeYourIndividuality: 'Подчёркиваю Вашу индивидуальность',
        subscribe: 'Подпишитесь на канал в Telegram',
        getUpdates: 'чтобы первыми узнавать об акциях и новинках',
        slogan: {
          create: 'Создай своё',
          uniqueDecoration: 'Уникальное украшение',
        },
        text: {
          part1: 'Текст что надо',
          part2: 'сделать',
        },
      },
      profile: {
        title: 'Профиль',
        description: 'Профиль пользователя',
        entrace1: 'Для входа в личный кабинет',
        entrace2: 'или',
        entrace: 'войдите',
        signup: 'зарегистрируйтесь',
        menu: {
          personal: 'Личные данные',
          order: 'История заказов',
          favorites: 'Избранное',
          reviews: 'Мои отзывы',
          settings: 'Настройки',
          logout: 'Выйти',
        },
        personal: {
          title: 'Личные данные',
          description: 'Личные данные',
          phone: 'Телефон',
          name: 'Имя',
          password: 'Пароль',
          confirmPassword: 'Подтвердите пароль',
          oldPassword: 'Старый пароль',
          linkTelegram: 'Привязать Telegram аккаунт',
          unlinkTelegram: 'Отвязать Telegram аккаунт',
          submitButton: 'Сохранить',
        },
        order: {
          title: 'История заказов',
          description: 'История заказов',
        },
        favorites: {
          title: 'Избранное',
          description: 'Избранное',
        },
        reviews: {
          title: 'Мои отзывы',
          description: 'Мои отзывы',
        },
        settings: {
          title: 'Настройки',
          description: 'Настройки',
        },
      },
      login: {
        title: 'Войти',
        description: 'Войти в профиль пользователя',
        phone: 'Телефон',
        password: 'Пароль',
        noAccount: 'Нет аккаунта?',
        forgotPassword: 'Забыли пароль?',
        submitButton: 'Войти',
      },
      signup: {
        title: 'Регистрация',
        description: 'Зарегистрировать профиль пользователя',
        phone: 'Телефон',
        name: 'Имя',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        next: 'Подтвердить телефон',
        haveAccount: 'Есть аккаунт?',
      },
    },
    modules: {
      confirmPhone: {
        h1: 'Подтверждение телефона',
        enterTheCode: 'Введите код из СМС',
        didntReceive: 'Не получили код?',
        timerCode_zero: 'Отправка нового кода через {{ count }} секунд',
        timerCode_one: 'Отправка нового кода через {{ count }} секунду',
        timerCode_few: 'Отправка нового кода через {{ count }} секунды',
        timerCode_many: 'Отправка нового кода через {{ count }} секунд',
        sendAgain: 'Отправить код еще раз',
        loading: 'Проверка...',
      },
      navbar: {
        logo: 'AM-CHOKERS',
        search: 'Поиск',
        favorites: 'Избранное',
        cart: 'Корзина',
        profile: 'Профиль',
        menu: {
          home: 'Главная',
          catalog: {
            title: 'Каталог',
            necklace: 'Колье',
            bracelets: 'Браслеты',
            earrings: 'Серьги',
            accessories: 'Аксессуары',
          },
          aboutBrand: 'О бренде',
          delivery: 'Доставка',
          jewelryCaring: 'Уход за украшениями',
          contacts: 'Контакты',
        },
      },
      footer: {
        jewelryCatalog: 'Каталог украшений',
        bracelets: 'Браслеты',
        glassesChains: 'Цепочки для очков',
        otherAccessories: 'Другие аксессуары',
        allJewelry: 'Все украшения',
        contacts: 'Контакты',
        telegram: 'Телеграм',
        instagram: 'Инстаграм',
        privacyPolicy: 'Политика конфиденциальности',
        offerAgreement: 'Договор аферты',
      },
      cardItem: {
        addToCart: 'В корзину',
        favorites: 'Избранное',
        price: '{{ price }} ₽',
        composition: 'Состав:',
        length: 'Длина:',
        rating: 'Рейтинг',
        noRatings: 'пока нет оценок',
        warrantyAndCare: 'Гарантия и уход',
        deliveryAndPayment: 'Доставка и оплата',
      },
    },
    validation: {
      required: 'Обязательное поле',
      requirements: 'От 3 до 20 символов',
      passMin: 'Не менее 6 символов',
      phone: 'Введите корректный номер телефона',
      code: 'Введите 4 цифры',
      mastMatch: 'Пароли должны совпадать',
      userAlreadyExists: 'Такой пользователь уже существует',
      userNotExists: 'Такой пользователь не зарегистрирован',
      incorrectPassword: 'Неверный пароль',
      incorrectCode: 'Неверный код',
      timeNotOver: 'Время повторной отправки СМС не подошло',
    },
    toast: {
      sendSmsSuccess: 'СМС успешно отправлено',
      sendSmsError: 'Не удалось отправить СМС',
      timeNotOverForSms: 'Вы можете отправлять СМС только раз в минуту',
      unknownError: 'Ошибка: {{ error }}',
      networkError: 'Ошибка соединения',
      authError: 'Ошибка аутентификации',
      userAlreadyExists: 'Данный номер телефона уже зарегистрирован',
      changeProfileSuccess: 'Данные успешно изменены',
    },
    spinner: {
      loading: 'Загрузка...',
    },
  },
} as const;
