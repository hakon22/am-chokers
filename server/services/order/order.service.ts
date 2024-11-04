import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { OrderEntity } from '@server/db/entities/order.entity';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import type { OrderQueryInterface } from '@server/types/order/order.query.interface';
import type { OrderOptionsInterface } from '@server/types/order/order.options.interface';
import { SmsService } from '@server/services/integration/sms.service';
import { BaseService } from '@server/services/app/base.service';

@Singleton
export class OrderService extends BaseService {
  private readonly smsService = Container.get(SmsService);

  private createQueryBuilder = (query: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(OrderEntity, 'order')
      .select([
        'order.id',
        'order.created',
        'order.status',
      ]);

    if (options?.withPosition) {
      builder
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
          'item.images',
        ]);
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
    if (options?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.id) {
      builder.andWhere('order.id = :id', { id: query.id });
    }
    if (query?.userId) {
      builder.andWhere('user_id = :userId', { userId: query.userId });
    }

    return builder;
  };

  private find = async (query: OrderQueryInterface, options?: OrderOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options);

    const order = await builder.getOne();

    if (!order) {
      throw new Error(`Заказа с номером #${query.id} не существует.`);
    }

    return order;
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const order = await this.find(query);

      res.json({ code: 1, order });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const { id: userId } = req.user as PassportRequestInterface;

      const builder = this.createQueryBuilder({ userId }, { withPosition: true });

      const orders = await builder.getMany();

      res.json({ code: 1, orders });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const order = await this.find(query);

      await order.softRemove();

      res.json({ code: 1 });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const deletedOrder = await this.find(query);

      const order = await deletedOrder.recover();

      res.json({ code: 1, order });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };
}
