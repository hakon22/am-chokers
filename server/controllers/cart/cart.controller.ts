import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { CartEntity } from '@server/db/entities/cart.entity';
import { BaseService } from '@server/services/app/base.service';
import { CartService } from '@server/services/cart/cart.service';
import { paramsIdSchema } from '@server/utilities/convertation.params';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';

@Singleton
export class CartController extends BaseService {
  private readonly cartService = Container.get(CartService);

  public findMany = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as PassportRequestInterface;

      const cart = await this.cartService.findMany(id);

      res.json({ code: 1, cart });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as PassportRequestInterface;
      const body = req.body as CartEntity;

      const result = await this.cartService.createOne(id, body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as PassportRequestInterface;
      const params = await paramsIdSchema.validate(req.params);
      const body = req.body as CartEntity;

      const item = await this.cartService.updateOne(id, params, body);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as PassportRequestInterface;
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.cartService.deleteOne(id, params);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteMany = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as PassportRequestInterface;

      await this.cartService.deleteMany(id);

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
