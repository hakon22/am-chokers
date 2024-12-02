import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import { BaseService } from '@server/services/app/base.service';
import { OrderService } from '@server/services/order/order.service';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';
import type { OrderEntity } from '@server/db/entities/order.entity';
import { newOrderPositionValidation } from '@/validations/validations';
import type { OrderPositionEntity } from '@server/db/entities/order.position.entity';

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
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const { id: userId, role } = req.user as PassportRequestInterface;
      const query = await queryOptionalSchema.validate(req.query);

      const orders = await this.orderService.findMany(role === UserRoleEnum.MEMBER ? { ...query, userId } : query);

      res.json({ code: 1, orders });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;
      const body = req.body as OrderPositionEntity[];
      await newOrderPositionValidation.serverValidator(body);

      const order = await this.orderService.createOne(body, user.id);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.deleteOne(params);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.restoreOne(params);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
