import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';

import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { DeliveryEntity } from '@server/db/entities/delivery.entity';
import { SmsService } from '@server/services/integration/sms.service';
import { UserService } from '@server/services/user/user.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { PromotionalService } from '@server/services/promotional/promotional.service';
import { AcquiringService } from '@server/services/acquiring/acquiring.service';
import { BaseService } from '@server/services/app/base.service';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';
import { CartService } from '@server/services/cart/cart.service';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { routes } from '@/routes';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { OrderQueryInterface } from '@server/types/order/order.query.interface';
import type { OrderOptionsInterface } from '@server/types/order/order.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import type { FetchOrdersInterface, OrderInterface, CreateDeliveryInterface } from '@/types/order/Order';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';
import type { CartEntity } from '@server/db/entities/cart.entity';

@Singleton
export class OrderService extends BaseService {
  private readonly smsService = Container.get(SmsService);

  private readonly telegramService = Container.get(TelegramService);

  private readonly cartService = Container.get(CartService);

  private readonly userService = Container.get(UserService);

  private readonly promotionalService = Container.get(PromotionalService);

  private readonly acquiringService = Container.get(AcquiringService);

  private createQueryBuilder = (query?: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(OrderEntity, 'order');

    if (options?.onlyIds) {
      builder
        .select('order.id')
        .orderBy('order.id', 'DESC');

      if (query?.statuses?.length) {
        builder.andWhere('order.status IN(:...statuses)', { statuses: query.statuses });
      }

      if (query?.limit || query?.offset) {
        builder
          .limit(query.limit)
          .offset(query.offset);
      }
    } else {
      builder
        .select([
          'order.id',
          'order.created',
          'order.status',
          'order.deliveryPrice',
          'order.deleted',
          'order.comment',
        ])
        .leftJoin('order.user', 'user')
        .addSelect([
          'user.id',
          'user.name',
          'user.phone',
          'user.telegramId',
        ])
        .leftJoin('order.positions', 'positions')
        .addSelect([
          'positions.id',
          'positions.price',
          'positions.discount',
          'positions.discountPrice',
          'positions.count',
        ])
        .leftJoin('positions.grade', 'grade')
        .addSelect('grade.id')
        .leftJoin('positions.item', 'item')
        .addSelect([
          'item.id',
          'item.name',
          'item.translateName',
        ])
        .leftJoin('item.group', 'group')
        .addSelect([
          'group.code',
        ])
        .leftJoin('order.promotional', 'promotional')
        .addSelect([
          'promotional.id',
          'promotional.name',
          'promotional.discount',
          'promotional.discountPercent',
          'promotional.freeDelivery',
        ])
        .leftJoin('order.transactions', 'transactions')
        .addSelect([
          'transactions.id',
          'transactions.status',
        ])
        .leftJoinAndSelect('order.delivery', 'delivery')
        .leftJoin('item.images', 'images', 'images.deleted IS NULL')
        .addSelect([
          'images.id',
          'images.name',
          'images.path',
          'images.order',
        ])
        .orderBy('order.id', 'DESC');
    }

    if (options?.userId) {
      builder.andWhere('order.user = :userId', { userId: options.userId });
    }
    if (options?.ids?.length) {
      builder.andWhere('order.id IN(:...ids)', { ids: options.ids });
    }
    if (options?.withDeleted) {
      builder.withDeleted();
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, query?: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('order.id = :id', { id: params.id });

    const order = await builder.getOne();

    if (!order) {
      throw new Error(`Заказа с номером #${params.id} не существует.`);
    }

    return order;
  };

  public findMany = async (query?: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options);

    const orders = await builder.getMany();

    return orders;
  };

  public getAllOrders = async (query: FetchOrdersInterface): Promise<[OrderEntity[], number]> => {
    const idsBuilder = this.createQueryBuilder(query, { ...query, onlyIds: true });
  
    const [ids, count] = await idsBuilder.getManyAndCount();
  
    let orders: OrderEntity[] = [];
  
    if (ids.length) {
      const builder = this.createQueryBuilder({}, { ...(query?.withDeleted ? { withDeleted: true } : {}), ids: ids.map(({ id }) => id) });
  
      orders = await builder.getMany();
    }
  
    return [orders, count];
  };

  public createOne = async (body: CartItemInterface[], user: PassportRequestInterface, delivery: CreateDeliveryInterface, comment?: string, promotional?: PromotionalInterface) => {
    const cartIds = body.map(({ id }) => id);

    if (promotional) {
      const promo = await this.promotionalService.findOne({ id: promotional.id });

      if (!moment().isBetween(moment(promo.start), moment(promo.end), 'day', '[]') || !promo.active) {
        throw new Error(`Промокод "${promotional.name}" не активен или истёк`);
      }
    }

    const order: OrderEntity = await this.databaseService.getManager().transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const orderPositionRepo = manager.getRepository(OrderPositionEntity);
      const deliveryRepo = manager.getRepository(DeliveryEntity);

      const { user: createdUser } = await this.userService.createOne(user?.name, user?.phone, manager);

      const cart = await this.cartService.findMany(null, undefined, { ids: cartIds }, { manager });

      const deletedItem = cart.find(({ item }) => item.deleted);

      if (deletedItem) {
        throw new Error(`Заказ не может быть оформлен: Товар ${deletedItem.item.name} закончился`);
      }

      const preparedPositions = cart.map((value) => ({
        count: value.count,
        price: value.item.price,
        discount: value.item.discount,
        discountPrice: value.item.discountPrice,
        item: { id: value.item.id },
      })) as OrderInterface['positions'];

      const positions = await orderPositionRepo.save(preparedPositions);
      await this.cartService.deleteMany(null, cartIds, { manager });

      const created = await orderRepo.save({
        status: OrderStatusEnum.NOT_PAID,
        user: { id: user.id || createdUser?.id },
        deliveryPrice: delivery.price,
        positions,
        promotional,
        comment,
        delivery: await deliveryRepo.create({
          address: delivery.address,
          type: delivery.type,
          index: delivery.indexTo,
          mailType: delivery.mailType,
        }).save(),
      } as OrderEntity);

      return this.findOne({ id: created.id }, {}, { manager });
    });

    if (user?.telegramId) {
      const text = [
        `Создан заказ <b>№${order.id}</b>.`,
        `Следите за статусами в личном кабинете: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.orderHistory}`,
      ];
      await this.telegramService.sendMessage(text, user.telegramId);
    }

    if (process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID2) {
      const adminText = [
        `Создан заказ <b>№${order.id}</b>`,
        '',
        `Сумма: <b>${getOrderPrice({ ...order, promotional } as OrderInterface)} ₽</b>`,
        ...(comment ? [`Комментарий: <b>${comment}</b>`] : []),
        '',
        `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.allOrders}/${order.id}`,
      ];
      await Promise.all([process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID2].filter(Boolean).map(tgId => this.telegramService.sendMessage(adminText, tgId as string)));
    }

    let url = '';

    if (process.env.NODE_ENV === 'production') {
      url = await this.acquiringService.createOrder({ ...order } as OrderInterface, AcquiringTypeEnum.YOOKASSA) as string;
    }

    await this.redisService.setEx(`checkOrderPayment_${order.id}`, {}, 60 * 60);

    return { order, url };
  };

  public updateStatus = async (params: ParamsIdInterface, { status }: OrderInterface) => {
    const order = await this.findOne(params);

    const { back, next } = getNextOrderStatuses(order.status);

    if (![back, next].includes(status)) {
      throw new Error(`Статус заказа №${order.id} со статусом ${order.status} нельзя поменять на статус ${status}. Доступные статусы: ${back}, ${next}`);
    }

    await OrderEntity.update(order.id, { status });

    if (order.user.telegramId) {
      await this.telegramService.sendMessage(`Заказ <b>№${order.id}</b> сменил статус с <b>${getOrderStatusTranslate(order.status)}</b> на <b>${getOrderStatusTranslate(status)}</b>.`, order.user.telegramId);
    }

    order.status = status;

    return order;
  };

  public cancel = async (params: ParamsIdInterface, user?: PassportRequestInterface) => {
    const manager = this.databaseService.getManager();

    const order = await this.findOne(params, undefined, { manager });

    const status = OrderStatusEnum.CANCELED;

    if (!user || user.id !== order.user.id) {
      user = order.user as PassportRequestInterface;
    }

    if (!user.isAdmin && order.isPayment) {
      throw new Error(`Заказ №${order.id} и статусом ${order.status} нельзя поменять на статус ${status}`);
    }

    const cart = await manager.transaction(async (entityManager) => {
      const orderRepo = manager.getRepository(OrderEntity);

      const newCart = await this.cartService.createMany(user.id, order.positions.map((position) => ({ ...position, id: undefined } as unknown as CartEntity)), { manager: entityManager });

      await orderRepo.update(order.id, { status });

      return newCart;
    });

    if (user.telegramId) {
      await this.telegramService.sendMessage(`Заказ <b>№${order.id}</b> был отменён.`, user.telegramId);
    }

    order.status = status;

    if ((process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID2) && !user.isAdmin) {
      const adminText = [
        `Отмена заказа <b>№${order.id}</b>`,
        '',
        `Сумма: <b>${getOrderPrice({ ...order } as OrderInterface)} ₽</b>`,
        '',
        `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.allOrders}/${order.id}`,
      ];
      await Promise.all([process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID2].filter(Boolean).map(tgId => this.telegramService.sendMessage(adminText, tgId as string)));
    }
  
    return { order, cart };
  };

  public pay = async (params: ParamsIdInterface) => {
    const order = await this.findOne(params);

    if (order.isPayment) {
      throw new Error('Заказ уже оплачен');
    }

    const url = await this.acquiringService.createOrder({ ...order } as OrderInterface, AcquiringTypeEnum.YOOKASSA);
  
    return url;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const order = await this.findOne(params);

    return order.softRemove();
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedOrder = await this.findOne(params, {}, { withDeleted: true });

    const order = await deletedOrder.recover();

    return order;
  };

  public subscribe = async () => {
    await this.redisService.subscribeRedis.subscribe('__keyevent@0__:expired', async (message) => {
      if (message.includes('checkOrderPayment')) {
        const orderId = message.replace('checkOrderPayment_', '') as string;

        console.log(`Обработка истёкшей оплаты для заказа ${orderId}`);
  
        await this.cancel({ id: +orderId });
      }
    });
    console.log('Подписка на события Redis выполнена успешно');
  };
}
