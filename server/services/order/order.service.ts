import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';

import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { SmsService } from '@server/services/integration/sms.service';
import { UserService } from '@server/services/user/user.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { PromotionalService } from '@server/services/promotional/promotional.service';
import { BaseService } from '@server/services/app/base.service';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { CartService } from '@server/services/cart/cart.service';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { routes } from '@/routes';
import type { PromotionalEntity } from '@server/db/entities/promotional.entity';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { OrderQueryInterface } from '@server/types/order/order.query.interface';
import type { OrderOptionsInterface } from '@server/types/order/order.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import type { FetchOrdersInterface, OrderInterface } from '@/types/order/Order';

@Singleton
export class OrderService extends BaseService {
  private readonly smsService = Container.get(SmsService);

  private readonly telegramService = Container.get(TelegramService);

  private readonly cartService = Container.get(CartService);

  private readonly userService = Container.get(UserService);

  private readonly promotionalService = Container.get(PromotionalService);

  private createQueryBuilder = (query?: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const manager = this.databaseService.getManager();

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
        ])
        .leftJoin('item.images', 'images')
        .addSelect([
          'images.id',
          'images.name',
          'images.path',
          'images.order',
        ])
        .orderBy('order.id', 'DESC');
    }

    if (options?.withUser) {
      builder
        .leftJoin('order.user', 'user')
        .addSelect([
          'user.id',
          'user.name',
          'user.phone',
        ]);
    }
    if (options?.userId) {
      builder.andWhere('order.user_id = :userId', { userId: options.userId });
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

  public createOne = async (body: CartItemInterface[], deliveryPrice: number, user: PassportRequestInterface, promotional?: PromotionalEntity) => {
    const cartIds = body.map(({ id }) => id);

    if (promotional) {
      const promo = await this.promotionalService.findOne({ id: promotional.id });

      if (!moment().isBetween(moment(promo.start), moment(promo.end), 'day', '[]') || !promo.active) {
        throw new Error(`Промокод "${promotional.name}" не активен или истёк`);
      }
    }

    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const orderPositionRepo = manager.getRepository(OrderPositionEntity);

      const { user: createdUser } = await this.userService.createOne('Пользователь', '79151003951', manager);

      const cart = await this.cartService.findMany(null, undefined, { ids: cartIds });

      const preparedPositions = cart.map((value) => ({
        count: value.count,
        price: value.item.price,
        discount: value.item.discount,
        discountPrice: value.item.discountPrice,
        item: { id: value.item.id },
      }));

      const positions = await orderPositionRepo.save(preparedPositions);
      await this.cartService.deleteMany(null, cartIds);

      return orderRepo.save({ status: OrderStatusEnum.NEW, user: { id: user.id || createdUser?.id }, deliveryPrice, positions, promotional });
    });

    if (user?.telegramId) {
      const text = [
        `Создан заказ <b>№${created.id}</b>.`,
        `Следите за статусами в личном кабинете: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.orderHistory}`,
      ];
      await this.telegramService.sendMessage(text, user.telegramId);
    }

    return this.findOne({ id: created.id });
  };

  public updateStatus = async (params: ParamsIdInterface, { status }: OrderInterface, user: PassportRequestInterface) => {
    const order = await this.findOne(params);

    const { back, next } = getNextOrderStatuses(order.status);

    if (![back, next].includes(status)) {
      throw new Error(`Статус заказа №${order.id} со статусом ${order.status} нельзя поменять на статус ${status}. Доступные статусы: ${back}, ${next}`);
    }

    await OrderEntity.update(order.id, { status });

    if (user.telegramId) {
      await this.telegramService.sendMessage(`Заказ <b>№${order.id}</b> сменил статус с <b>${getOrderStatusTranslate(order.status)}</b> на <b>${getOrderStatusTranslate(status)}</b>.`, user.telegramId);
    }

    order.status = status;

    return order;
  };

  public cancel = async (params: ParamsIdInterface, user: PassportRequestInterface) => {
    const order = await this.findOne(params);

    const status = OrderStatusEnum.CANCELED;

    if (user.role !== UserRoleEnum.ADMIN && order.status !== OrderStatusEnum.NEW) {
      throw new Error(`Заказ с №${order.id} и статусом ${order.status} нельзя поменять на статус ${status}`);
    }

    await OrderEntity.update(order.id, { status });

    if (user.telegramId) {
      await this.telegramService.sendMessage(`Заказ <b>№${order.id}</b> был отменён.`, user.telegramId);
    }

    order.status = status;
  
    return order;
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
}
