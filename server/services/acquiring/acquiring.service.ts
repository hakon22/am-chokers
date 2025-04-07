import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { YooCheckout, Payment, type ICreateError, type ICreatePayment, type ICheckoutCustomer } from '@a2seven/yoo-checkout';
import { Container } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { DeliveryService } from '@server/services/delivery/delivery.service';
import { TransactionStatusEnum } from '@server/types/acquiring/enums/transaction.status.enum';
import { YookassaErrorTranslate } from '@server/types/acquiring/enums/yookassa.error.translate';
import { AcquiringTransactionEntity } from '@server/db/entities/acquiring.transaction.entity';
import { AcquiringCredentialsEntity } from '@server/db/entities/acquiring.credentials.entity';
import { TelegramService } from '@server/services/integration/telegram.service';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { routes } from '@/routes';
import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';
import { DeliveryTypeEnum, deliveryTypeTranslateEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { russianPostMailTypeTranslateEnum } from '@/types/delivery/russian.post.delivery.interface';

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

  private readonly telegramService = Container.get(TelegramService);

  private readonly deliveryService = Container.get(DeliveryService);

  private TAG = 'AcquiringService';

  public checkYookassaOrder = async (payment: Payment) => {
    try {
      this.loggerService.info(this.TAG, `Обработка уведомления от YooKassa со статусом ${payment.status} для платежа id: ${payment.id}`);

      const transaction = await AcquiringTransactionEntity.findOne({ where: { transactionId: payment.id }, relations: ['order', 'order.user', 'order.promotional', 'order.delivery'] });

      if (!transaction || transaction.status !== TransactionStatusEnum.CREATE) {
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

  public createOrder = async (order: OrderEntity, type: AcquiringTypeEnum) => {

    const credential = await AcquiringCredentialsEntity.findOne({ where: { issuer: type, isDevelopment: process.env.NODE_ENV === 'development' } });

    if (!credential || credential?.deleted) {
      throw new Error('Недоступна онлайн оплата для данного заказа');
    }

    const transactions = await AcquiringTransactionEntity.find({
      where: {
        status: In([TransactionStatusEnum.REJECTED, TransactionStatusEnum.PAID]),
        order: { id: order.id },
      },
    });

    const orderId = `${order.id}-1${transactions.length}`;
    const amount = getOrderPrice(order);

    const data: Data = {
      userName: credential.login,
      password: credential.password,
      orderNumber: orderId,
      amount: +amount,
      description: `Оплата по заказу №${order.id}`,
      returnUrl: `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}/payment/success`,
      failUrl: `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}/payment/error`,
    };

    const checkout = new YooCheckout({ shopId: data.userName, secretKey: data.password });

    const idempotenceKey = uuidv4();

    const { phone, name } = order.user;

    if (!phone && !name) {
      throw new Error('В профиле не указаны имя пользователя или номер телефона');
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
        items: [
          {
            description: 'Изготовление украшений ручной работы',
            amount: {
              value: amount.toString(),
              currency: 'RUB',
            },
            quantity: '1',
            vat_code: 1,
            payment_subject: 'service',
            payment_mode: 'full_payment',
          },
        ],
      },
    };

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
      this.loggerService.error(error.id);
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
    }
  };

  private successfulPayment = async (transaction: AcquiringTransactionEntity) => {
    try {
      const { order } = transaction;

      await AcquiringTransactionEntity.update(transaction.id, { status: TransactionStatusEnum.PAID });
      await OrderEntity.update(order.id, { status: OrderStatusEnum.NEW });

      if (order.user.telegramId) {
        await this.telegramService.sendMessage(`Заказ <b>№${order.id}</b> сменил статус с <b>${getOrderStatusTranslate(order.status)}</b> на <b>${getOrderStatusTranslate(OrderStatusEnum.NEW)}</b>.`, order.user.telegramId);
      }

      if (process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID2) {
        const adminText = [
          `‼️Оплачен заказ <b>№${order.id}</b>‼️`,
          '',
          `Сумма: <b>${getOrderPrice(order)} ₽</b>`,
          `Способ доставки: <b>${deliveryTypeTranslateEnum[order.delivery.type]}</b>`,
          `Адрес доставки: <b>${order.delivery.address}</b>`,
          ...(order.delivery.type === DeliveryTypeEnum.RUSSIAN_POST && order.delivery.mailType ? [`Тип доставки: <b>${russianPostMailTypeTranslateEnum[order.delivery.mailType]}</b>`] : []),
          ...(order.delivery.type === DeliveryTypeEnum.RUSSIAN_POST && order.delivery.index ? [`Индекс ПВЗ: <b>${order.delivery.index}</b>`] : []),
          `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.allOrders}/${order.id}`,
        ];

        await Promise.all([process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID2].filter(Boolean).map(tgId => this.telegramService.sendMessage(adminText, tgId as string)));
      }
    } catch (e) {
      this.loggerService.error(this.TAG, 'Ошибка во время занесения оплаты!', e);
    }
  };
}
