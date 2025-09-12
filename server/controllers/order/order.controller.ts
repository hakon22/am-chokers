import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { OrderService } from '@server/services/order/order.service';
import { paramsIdSchema, queryOrderParams } from '@server/utilities/convertation.params';
import { newOrderPositionValidation, orderChangeStatusValidation } from '@/validations/validations';
import type { CreateOrderInterface, OrderInterface } from '@/types/order/Order';

@Singleton
export class OrderController extends BaseService {
  private readonly orderService = Container.get(OrderService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.findOne(params, user.lang);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getUserOrders = async (req: Request, res: Response) => {
    try {
      const { id: userId } = this.getCurrentUser(req);

      const orders = await this.orderService.getUserOrders({}, { userId });

      res.json({ code: 1, orders });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getAllOrders = async (req: Request, res: Response) => {
    try {
      const query = await queryOrderParams.validate(req.query);
  
      const [items, count] = await this.orderService.getAllOrders(query);
  
      const paginationParams = {
        count,
        limit: query.limit,
        offset: query.offset,
      };
  
      res.json({ code: 1, items, paginationParams });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateStatus = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await orderChangeStatusValidation.serverValidator(req.body) as OrderInterface;

      const order = await this.orderService.updateStatus(params, body, user.lang);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public cancel = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const { order, cart } = await this.orderService.cancel(params, this.getCurrentUser(req));

      res.json({ code: 1, order, cart });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public pay = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const url = await this.orderService.pay(params, user.lang);

      res.json({ code: 1, url });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { cart, promotional, delivery, user, comment } = await newOrderPositionValidation.serverValidator(req.body) as CreateOrderInterface;

      const { order, url, refreshToken } = await this.orderService.createOne(cart, this.getCurrentUser(req) || user, delivery, comment, promotional);

      res.json({ code: 1, order, url, refreshToken });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.deleteOne(params, user.lang);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const order = await this.orderService.restoreOne(params, user.lang);

      res.json({ code: 1, order });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
