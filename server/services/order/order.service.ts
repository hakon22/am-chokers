import { Container, Singleton } from 'typescript-ioc';

import { OrderEntity } from '@server/db/entities/order.entity';
import type { OrderQueryInterface } from '@server/types/order/order.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { SmsService } from '@server/services/integration/sms.service';
import { BaseService } from '@server/services/app/base.service';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { CartService } from '@server/services/cart/cart.service';
import type { CartItemInterface } from '@/types/cart/Cart';

@Singleton
export class OrderService extends BaseService {
  private readonly smsService = Container.get(SmsService);

  private readonly cartService = Container.get(CartService);

  private createQueryBuilder = (query?: OrderQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(OrderEntity, 'order')
      .select([
        'order.id',
        'order.created',
        'order.status',
        'order.deleted',
      ])
      .leftJoin('order.positions', 'positions')
      .addSelect([
        'positions.id',
        'positions.price',
        'positions.discount',
        'positions.count',
      ])
      .leftJoin('positions.item', 'item')
      .addSelect([
        'item.id',
        'item.name',
      ])
      .leftJoin('item.images', 'images')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
        'images.deleted',
      ]);

    if (query?.withUser) {
      builder
        .leftJoin('order.user', 'user')
        .addSelect([
          'user.id',
          'user.name',
          'user.phone',
        ]);
    }
    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.userId) {
      builder.andWhere('user_id = :userId', { userId: query.userId });
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, query?: OrderQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('order.id = :id', { id: params.id });

    const order = await builder.getOne();

    if (!order) {
      throw new Error(`Заказа с номером #${params.id} не существует.`);
    }

    return order;
  };

  public findMany = async (query?: OrderQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const orders = await builder.getMany();

    return orders;
  };

  public createOne = async (body: CartItemInterface[], userId: number) => {
    const cartIds = body.map(({ id }) => id);
    const cart = await this.cartService.findMany(userId, undefined, { ids: cartIds });

    const order = await this.databaseService.getManager().transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const orderPositionRepo = manager.getRepository(OrderPositionEntity);

      const preparedPositions = cart.map((value) => ({
        count: value.count,
        price: value.item.price,
        discount: value.item.discount,
        discountPrice: value.item.discountPrice,
        item: { id: value.item.id },
      }));

      const positions = await orderPositionRepo.save(preparedPositions);
      await this.cartService.deleteMany(userId, cartIds);

      return orderRepo.save({ status: OrderStatusEnum.NEW, user: { id: userId }, positions });
    });

    return order;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const order = await this.findOne(params);

    return order.softRemove();
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedOrder = await this.findOne(params, { withDeleted: true });

    const order = await deletedOrder.recover();

    return order;
  };
}
