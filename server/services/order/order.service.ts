import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';
import _ from 'lodash';

import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { DeliveryEntity } from '@server/db/entities/delivery.entity';
import { UserService } from '@server/services/user/user.service';
import { PromotionalService } from '@server/services/promotional/promotional.service';
import { AcquiringService } from '@server/services/acquiring/acquiring.service';
import { BaseService } from '@server/services/app/base.service';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';
import { CartService } from '@server/services/cart/cart.service';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { routes } from '@/routes';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
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
  private readonly cartService = Container.get(CartService);

  private readonly userService = Container.get(UserService);

  private readonly promotionalService = Container.get(PromotionalService);

  private readonly acquiringService = Container.get(AcquiringService);

  private readonly bullMQQueuesService = Container.get(BullMQQueuesService);

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

      if (!_.isNil(query?.limit) && !_.isNil(query?.offset)) {
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
          'user.lang',
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
          'item.translateName',
        ])
        .leftJoin('item.translations', 'translations')
        .addSelect([
          'translations.name',
          'translations.lang',
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
        .leftJoin('promotional.items', 'items')
        .addSelect('items.id')
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

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('order.id = :id', { id: params.id });

    const order = await builder.getOne();

    if (!order) {
      throw new Error(lang === UserLangEnum.RU
        ? `Заказа с номером #${params.id} не существует.`
        : `Order with number #${params.id} does not exist.`);
    }

    return order;
  };

  public getUserOrders = async (query?: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options);

    return builder.getMany();
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
      const promo = await this.promotionalService.findOne({ id: promotional.id }, user.lang);

      if (promo.name === process.env.NEXT_PUBLIC_PROMO && user?.phone) {
        const fetchedUser = await this.userService.findOne({ phone: user.phone }, { withOrders: true });
        if (fetchedUser?.orders.some((order) => order.isPayment)) {
          throw new Error(user.lang === UserLangEnum.RU
            ? `Промокод "${promotional.name}" не может быть использован`
            : `Promo code "${promotional.name}" cannot be used`);
        }
      }

      if (!moment().isBetween(moment(promo.start), moment(promo.end), 'day', '[]') || !promo.active) {
        throw new Error(user.lang === UserLangEnum.RU
          ? `Промокод "${promotional.name}" не активен или истёк`
          : `Promo code "${promotional.name}" is not active or has expired`);
      }
    }

    const [order, refreshToken]: [OrderEntity, string | undefined] = await this.databaseService.getManager().transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const orderPositionRepo = manager.getRepository(OrderPositionEntity);
      const deliveryRepo = manager.getRepository(DeliveryEntity);

      const createdUser = await this.userService.createOne(user?.name, user?.phone, user?.lang, manager);

      const cart = await this.cartService.findMany(null, undefined, { ids: cartIds }, { manager });

      if (!cart.length) {
        throw new Error(user.lang === UserLangEnum.RU
          ? 'Нет позиций для заказа. Обновите страницу'
          : 'There are no items to order. Refresh the page.',
        );
      }

      const deletedItem = cart.find(({ item }) => item.deleted);

      if (deletedItem) {
        const name = deletedItem.item.translations.find((translation) => translation.lang === user.lang)?.name;

        throw new Error(user.lang === UserLangEnum.RU
          ? `Заказ не может быть оформлен: Товар ${name} закончился`
          : `Order cannot be placed: Item ${name} is out of stock`);
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
        user: { id: user.id || createdUser.user?.id },
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

      const newOrder = await this.findOne({ id: created.id }, user.lang, {}, { manager });

      return [newOrder, createdUser.refreshToken];
    });

    if (user?.telegramId) {
      const message = user.lang === UserLangEnum.RU
        ? [
          `Создан заказ <b>№${order.id}</b>.`,
          `Следите за статусами в личном кабинете: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.profile.orderHistory}`,
        ]
        : [
          `Order <b>№${order.id}</b> created.`,
          `Follow the statuses in your personal account: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.profile.orderHistory}`,
        ];
      this.bullMQQueuesService.sendTelegramMessage({ message, telegramId: user.telegramId });
    }

    const messageRu = [
      `Создан заказ <b>№${order.id}</b>`,
      '',
      `Сумма: <b>${getOrderPrice({ ...order, promotional } as OrderInterface)} ₽</b>`,
      ...(comment ? [`Комментарий: <b>${comment}</b>`] : []),
      '',
      `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.allOrders}/${order.id}`,
    ];

    const messageEn = [
      `Order <b>№${order.id}</b> created.`,
      '',
      `Amount: <b>${getOrderPrice({ ...order, promotional } as OrderInterface)} ₽</b>`,
      ...(comment ? [`Comment: <b>${comment}</b>`] : []),
      '',
      `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.allOrders}/${order.id}`,
    ];

    this.bullMQQueuesService.sendTelegramAdminMessage({ messageRu, messageEn });

    const url = await this.acquiringService.createOrder({ ...order } as OrderInterface, AcquiringTypeEnum.YOOKASSA, user.lang) as string;

    await this.redisService.setEx(`checkOrderPayment_${order.id}`, {}, 60 * 60);

    return { order, url, refreshToken };
  };

  public updateStatus = async (params: ParamsIdInterface, { status }: OrderInterface, lang: UserLangEnum) => {
    const order = await this.findOne(params, lang);

    const { back, next } = getNextOrderStatuses(order.status);

    if (![back, next].includes(status)) {
      throw new Error(lang === UserLangEnum.RU
        ? `Статус заказа №${order.id} со статусом ${order.status} нельзя поменять на статус ${status}. Доступные статусы: ${back}, ${next}`
        : `Order status #${order.id} with status ${order.status} cannot be changed to status ${status}. Available statuses: ${back}, ${next}`);
    }

    await OrderEntity.update(order.id, { status });

    if (order.user.telegramId) {
      const message = lang === UserLangEnum.RU
        ? `Заказ <b>№${order.id}</b> сменил статус с <b>${getOrderStatusTranslate(order.status, lang)}</b> на <b>${getOrderStatusTranslate(status, lang)}</b>.`
        : `Order <b>№${order.id}</b> changed status from <b>${getOrderStatusTranslate(order.status, lang)}</b> to <b>${getOrderStatusTranslate(status, lang)}</b>.`;
      this.bullMQQueuesService.sendTelegramMessage({ message, telegramId: order.user.telegramId });
    }

    order.status = status;

    return order;
  };

  public cancel = async (params: ParamsIdInterface, user?: PassportRequestInterface) => {
    const manager = this.databaseService.getManager();

    const order = await this.findOne(params, UserLangEnum.RU, undefined, { manager });

    const status = OrderStatusEnum.CANCELED;

    if (!user || user.id !== order.user.id) {
      user = order.user as PassportRequestInterface;
    }

    const lang = user.lang;

    if (!user.isAdmin && order.isPayment) {
      throw new Error(lang === UserLangEnum.RU
        ? `Заказ №${order.id} и статусом ${order.status} нельзя поменять на статус ${status}`
        : `Order №${order.id} and status ${order.status} cannot be changed to status ${status}`);
    }

    const cart = await manager.transaction(async (entityManager) => {
      const orderRepo = manager.getRepository(OrderEntity);

      const newCart = await this.cartService.createMany(user, order.positions.map((position) => ({ ...position, id: undefined } as unknown as CartEntity)), { manager: entityManager });

      await orderRepo.update(order.id, { status });

      return newCart;
    });

    if (user.telegramId) {
      const message = lang === UserLangEnum.RU
        ? `Заказ <b>№${order.id}</b> был отменён.`
        : `Order <b>№${order.id}</b> has been cancelled.`;
      this.bullMQQueuesService.sendTelegramMessage({ message, telegramId: user.telegramId });
    }

    order.status = status;

    if (!user.isAdmin) {
      const messageRu = [
        `Отмена заказа <b>№${order.id}</b>`,
        '',
        `Сумма: <b>${getOrderPrice({ ...order } as OrderInterface)} ₽</b>`,
        '',
        `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.allOrders}/${order.id}`,
      ];

      const messageEn = [
        `Cancel order <b>№${order.id}</b>`,
        '',
        `Amount: <b>${getOrderPrice({ ...order } as OrderInterface)} ₽</b>`,
        '',
        `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.allOrders}/${order.id}`,
      ];

      this.bullMQQueuesService.sendTelegramAdminMessage({ messageRu, messageEn });
    }
  
    return { order, cart };
  };

  public pay = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const order = await this.findOne(params, lang);

    if (order.isPayment) {
      throw new Error(lang === UserLangEnum.RU ? 'Заказ уже оплачен' : 'The order has already been paid');
    }

    const url = await this.acquiringService.createOrder({ ...order } as OrderInterface, AcquiringTypeEnum.YOOKASSA, lang);
  
    return url;
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const order = await this.findOne(params, lang);

    return order.softRemove();
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedOrder = await this.findOne(params, lang, {}, { withDeleted: true });

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
