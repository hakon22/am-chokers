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
        menu: 'Меню',
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
