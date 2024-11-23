import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import { BaseService } from '@server/services/app/base.service';
import { OrderService } from '@server/services/order/order.service';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class OrderController extends BaseService {
  private readonly orderService = Container.get(OrderService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const order = await this.orderService.findOne(params, query);

      res.json({ code: 1, order });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const { id: userId, role } = req.user as PassportRequestInterface;
      const query = await queryOptionalSchema.validate(req.query);

      const orders = await this.orderService.findMany(role === UserRoleEnum.MEMBER ? { ...query, userId } : query);

      res.json({ code: 1, orders });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.deleteOne(params);

      res.json({ code: 1, order });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.restoreOne(params);

      res.json({ code: 1, order });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };
}
