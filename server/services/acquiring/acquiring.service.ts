import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { YooCheckout, Payment, type ICreateError, type ICreatePayment, type ICheckoutCustomer, type IItemWithoutData } from '@a2seven/yoo-checkout';
import { Container } from 'typescript-ioc';
import moment from 'moment';

import { BaseService } from '@server/services/app/base.service';
import { TransactionStatusEnum } from '@server/types/acquiring/enums/transaction.status.enum';
import { YookassaErrorTranslate } from '@server/types/acquiring/enums/yookassa.error.translate';
import { AcquiringTransactionEntity } from '@server/db/entities/acquiring.transaction.entity';
import { AcquiringCredentialsEntity } from '@server/db/entities/acquiring.credentials.entity';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { getDiscountPercent, getOrderPrice, getPositionAmount, getPositionPriceWithDiscount } from '@/utilities/order/getOrderPrice';
import { routes } from '@/routes';
import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { getDeliveryTypeTranslate } from '@/utilities/order/getDeliveryTypeTranslate';
import { getRussianPostRussianPostTranslate } from '@/utilities/order/getRussianPostTypeTranslate';
import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionEntity } from '@server/db/entities/order.position.entity';

type Data = {
  userName: string;
  password: string;
  orderNumber: string;
  amount: number;
  description: string;
  returnUrl: string;
  failUrl: string;
  email?: string;
};

export class AcquiringService extends BaseService {
  private readonly bullMQQueuesService = Container.get(BullMQQueuesService);

  private readonly TAG = 'AcquiringService';

  public checkYookassaOrder = async (payment: Payment) => {
    try {
      this.loggerService.info(this.TAG, `Обработка уведомления от YooKassa со статусом ${payment.status} для платежа id: ${payment.id}`);

      const transaction = await AcquiringTransactionEntity.findOne({ where: { transactionId: payment.id }, relations: ['order', 'order.user', 'order.promotional', 'order.promotional.items', 'order.delivery', 'order.positions', 'order.positions.item'] });

      if (!transaction) {
        if (payment.status === 'succeeded') {
          this.bullMQQueuesService.sendTelegramAdminMessage({
            messageRu: `‼️Поступила оплата на сумму: <b>${payment.amount.value} ₽</b>‼️`,
            messageEn: `‼️Payment received in the amount of: <b>${payment.amount.value} ₽</b>‼️`,
          });
        }

        return;
      }

      if (transaction.status !== TransactionStatusEnum.CREATE) {
        return;
      }

      if (payment.status === 'succeeded') {
        await this.successfulPayment(transaction);
      } else if (payment.status === 'canceled') {
        const { reason, party } = payment.cancellation_details;

        await AcquiringTransactionEntity.update(transaction.id, {
          status: TransactionStatusEnum.REJECTED,
          reason: `[${party}]: ${YookassaErrorTranslate[reason]}`,
        });
      }
    } catch (error) {
      this.loggerService.error(this.TAG, error);
    }
  };

  public createOrder = async (order: OrderInterface | OrderEntity, type: AcquiringTypeEnum, lang: UserLangEnum) => {
    const credential = await AcquiringCredentialsEntity.findOne({ where: { issuer: type, isDevelopment: process.env.NODE_ENV === 'development' } });

    if (!credential || credential?.deleted) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Недоступна онлайн оплата для данного заказа'
        : 'Online payment is not available for this order');
    }

    const transactions = await AcquiringTransactionEntity.find({
      where: {
        status: In([TransactionStatusEnum.REJECTED, TransactionStatusEnum.PAID]),
        order: { id: order.id },
      },
    });

    const orderId = `${order.id}-1${transactions.length}`;

    const amount = getOrderPrice(order);
    const discountPercent = getDiscountPercent(order.positions, order.deliveryPrice, order.promotional);

    const orderPositions = [...order.positions];

    if (order.deliveryPrice) {
      const deliveryPosition = {
        count: 1,
        price: order.deliveryPrice,
        discountPrice: 0,
        discount: 0,
        grade: { id: 0, grade: 0 },
        item: {
          translations: [
            { lang: UserLangEnum.RU, name: 'Доставка' },
            { lang: UserLangEnum.EN, name: 'Delivery' },
          ],
        },
      } as OrderPositionEntity;

      orderPositions.push(deliveryPosition);
    }

    const items = orderPositions.filter((position) => position.price).map((position) => {
      let positionDiscountPercent = discountPercent;
      if (order.promotional && order.promotional.items.length) {
        if (!order.promotional.items.map(({ id }) => id).includes(position.item.id)) {
          positionDiscountPercent = 0;
        }
      }
      return {
        description: position.item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name,
        amount: {
          value: getPositionPriceWithDiscount(position, positionDiscountPercent).toString(),
          currency: 'RUB',
        },
        quantity: position.count.toString(),
        vat_code: 1,
        payment_subject: 'commodity',
        payment_mode: 'full_payment',
      };
    }) as IItemWithoutData[];

    if (items.length > 6) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Максимум 6 позиций в одном заказе (включая доставку)'
        : 'Maximum 6 items per order (including delivery)');
    }

    const positionsAmount = items.reduce((acc, item) => acc + (+item.amount.value * 100), 0);
    const centAmount = amount * 100;

    if (centAmount !== positionsAmount) {
      this.loggerService.info(this.TAG, `Сумма заказа расходится с суммой позиций в чеке: сумма заказа ${centAmount / 100}, сумма позиций ${positionsAmount / 100}`);

      const max = Math.max(centAmount, positionsAmount);
      const min = Math.min(centAmount, positionsAmount);
      const difference = max - min;

      if (centAmount > positionsAmount) {
        items[0].amount.value = (((+items[0].amount.value * 100) + difference) / 100).toFixed(2);
        this.loggerService.info(this.TAG, `Добавляю разницу в ${difference / 100} в первую позицию`);
      } else {
        items[0].amount.value = (((+items[0].amount.value * 100) - difference) / 100).toFixed(2);
        this.loggerService.info(this.TAG, `Отнимаю разницу в ${difference / 100} из первой позиции`);
      }
    }

    const data: Data = {
      userName: credential.login,
      password: credential.password,
      orderNumber: orderId,
      amount,
      description: `Оплата по заказу №${order.id}`,
      returnUrl: `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}/payment/success`,
      failUrl: `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}/payment/error`,
    };

    const checkout = new YooCheckout({ shopId: data.userName, secretKey: data.password });

    const idempotenceKey = uuidv4();

    const { phone, name } = order.user;

    if (!phone && !name) {
      throw new Error(lang === UserLangEnum.RU
        ? 'В профиле не указаны имя пользователя или номер телефона'
        : 'The profile does not contain a username or phone number');
    }

    const keys: (keyof ICheckoutCustomer)[] = ['phone', 'full_name'];
    const values = [phone, name];

    const customer: ICheckoutCustomer = keys.reduce((acc, key, index) => {
      if (values[index]) { // Проверяем, что значение не ложное
        acc[key] = values[index];
      }
      return acc;
    }, {} as ICheckoutCustomer);

    const createPayload: ICreatePayment = {
      amount: {
        value: amount.toString(),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: data.returnUrl,
      },
      description: data.description,
      capture: true,
      receipt: {
        customer,
        items,
      },
    };

    this.loggerService.info(this.TAG, JSON.stringify(createPayload));

    try {
      this.loggerService.info(this.TAG, `Создание заявки на платёж в ${credential.issuer} для заказа №${order.id}. Параметры: ${JSON.stringify(data)}`);
      const payment = await checkout.createPayment(createPayload, idempotenceKey);
      this.loggerService.info(this.TAG, `Заявка на платёж ${payment.id} зарегистрирована.`);

      await AcquiringTransactionEntity.save({
        order: { id: order.id },
        amount: +amount,
        transactionId: payment.id,
        url: payment.confirmation.confirmation_url,
        type: credential.issuer,
      } as AcquiringTransactionEntity);
  
      return payment.confirmation.confirmation_url;

    } catch (e: unknown) {
      const error = e as ICreateError;
      this.loggerService.error(error.description);
      if (error.description === 'Idempotence key duplicated') {
        this.loggerService.info(this.TAG, `Заявка на платёж ${orderId} уже зарегистрирована в ${credential.issuer}. Поиск в базе.`);

        const transaction = await AcquiringTransactionEntity.findOne({
          where: {
            order: { id: order.id },
            status: TransactionStatusEnum.CREATE,
            type,
          },
        });

        if (!transaction) {
          throw error;
        }

        return transaction.url;
      }
      throw new Error(error.description);
    }
  };

  private successfulPayment = async (transaction: AcquiringTransactionEntity) => {
    try {
      const { order } = transaction;

      await this.redisService.delete(`checkOrderPayment_${order.id}`);

      await AcquiringTransactionEntity.update(transaction.id, { status: TransactionStatusEnum.PAID });
      await OrderEntity.update(order.id, { status: OrderStatusEnum.NEW });

      if (order.user.telegramId) {
        const message = order.user.lang === UserLangEnum.RU
          ? `Заказ <b>№${order.id}</b> сменил статус с <b>${getOrderStatusTranslate(order.status, order.user.lang)}</b> на <b>${getOrderStatusTranslate(OrderStatusEnum.NEW, order.user.lang)}</b>.`
          : `Order <b>№${order.id}</b> changed status from <b>${getOrderStatusTranslate(order.status, order.user.lang)}</b> to <b>${getOrderStatusTranslate(OrderStatusEnum.NEW, order.user.lang)}</b>.`;

        this.bullMQQueuesService.sendTelegramMessage({ message, telegramId: order.user.telegramId });
      }

      const deliveryRu = getDeliveryTypeTranslate(order.delivery.type, UserLangEnum.RU);
      const deliveryEn = getDeliveryTypeTranslate(order.delivery.type, UserLangEnum.EN);

      const messageRu = [
        `‼️Оплачен заказ <b>№${order.id}</b>‼️`,
        '',
        `Сумма: <b>${getOrderPrice(order)} ₽</b>`,
        `Способ доставки: <b>${deliveryRu}</b>`,
        `Адрес доставки: <b>${order.delivery.address}</b>`,
        ...(order.delivery.type === DeliveryTypeEnum.RUSSIAN_POST && order.delivery.mailType ? [`Тип доставки: <b>${getRussianPostRussianPostTranslate(order.delivery.mailType, UserLangEnum.RU)}</b>`] : []),
        ...([DeliveryTypeEnum.RUSSIAN_POST, DeliveryTypeEnum.CDEK].includes(order.delivery.type) && order.delivery.index ? [`Индекс ПВЗ: <b>${order.delivery.index}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.platformStationTo ? [`Код ПВЗ клиента: <b>${order.delivery.platformStationTo}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.tariffName ? [`Тариф: <b>${order.delivery.tariffName}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.tariffDescription ? [`Описание тарифа: <b>${order.delivery.tariffDescription}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.deliveryFrom && order.delivery.deliveryTo ? [`Срок доставки: с <b>${moment(order.delivery.deliveryFrom).format(DateFormatEnum.DD_MM_YYYY)}</b> по <b>${moment(order.delivery.deliveryTo).format(DateFormatEnum.DD_MM_YYYY)}</b>`] : []),
        '',
        `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.allOrders}/${order.id}`,
      ];

      const messageEn = [
        `‼️Paid order <b>№${order.id}</b>‼️`,
        '',
        `Amount: <b>${getOrderPrice(order)} ₽</b>`,
        `Delivery method: <b>${deliveryEn}</b>`,
        `Delivery address: <b>${order.delivery.address}</b>`,
        ...(order.delivery.type === DeliveryTypeEnum.RUSSIAN_POST && order.delivery.mailType ? [`Delivery type: <b>${getRussianPostRussianPostTranslate(order.delivery.mailType, UserLangEnum.RU)}</b>`] : []),
        ...([DeliveryTypeEnum.RUSSIAN_POST, DeliveryTypeEnum.CDEK].includes(order.delivery.type) && order.delivery.index ? [`Pickup point index: <b>${order.delivery.index}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.platformStationTo ? [`Pickup point code: <b>${order.delivery.platformStationTo}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.tariffName ? [`Tariff: <b>${order.delivery.tariffName}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.tariffDescription ? [`Tariff description: <b>${order.delivery.tariffDescription}</b>`] : []),
        ...(order.delivery.type === DeliveryTypeEnum.CDEK && order.delivery.deliveryFrom && order.delivery.deliveryTo ? [`Delivery time: from <b>${moment(order.delivery.deliveryFrom).format(DateFormatEnum.DD_MM_YYYY)}</b> to <b>${moment(order.delivery.deliveryTo).format(DateFormatEnum.DD_MM_YYYY)}</b>`] : []),
        '',
        `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.allOrders}/${order.id}`,
      ];

      const positions = [...order.positions];

      if (order.deliveryPrice) {
        const deliveryPosition = {
          id: 0,
          count: 1,
          price: order.deliveryPrice,
          discountPrice: 0,
          discount: 0,
          grade: { id: 0, grade: 0 },
          item: {
            translations: [
              { lang: UserLangEnum.RU, name: 'Доставка' },
              { lang: UserLangEnum.EN, name: 'Delivery' },
            ],
          },
        } as OrderPositionEntity;

        positions.push(deliveryPosition);
      }

      const positionsAmount = getPositionAmount({ ...order, positions } as OrderInterface);
      const items = positions.map(({ id, count, item }) => ({
        name: item.translations.find(({ lang }) => lang === UserLangEnum.RU)?.name as string,
        quantity: count,
        amount: positionsAmount[id],
      }));

      this.bullMQQueuesService.sendTelegramAdminMessage({ messageRu, messageEn });
      this.bullMQQueuesService.NPDNalogCreateOrder({ order: transaction.order, items });
    } catch (e) {
      this.loggerService.error(this.TAG, 'Ошибка во время занесения оплаты!', e);
    }
  };
}
