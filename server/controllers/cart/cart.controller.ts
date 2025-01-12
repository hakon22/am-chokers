import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { CartEntity } from '@server/db/entities/cart.entity';
import { BaseService } from '@server/services/app/base.service';
import { CartService } from '@server/services/cart/cart.service';
import { uuidArraySchema, uuidSchema, newCartItemValidation } from '@/validations/validations';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { NullableParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class CartController extends BaseService {
  private readonly cartService = Container.get(CartService);

  public findMany = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as NullableParamsIdInterface;
      const oldCart = req.body as CartItemInterface[];

      const cart = await this.cartService.findMany(id, oldCart);

      res.json({ code: 1, cart });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as NullableParamsIdInterface;
      const body = await newCartItemValidation.serverValidator(req.body) as CartEntity;

      const result = await this.cartService.createOne(id, body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public incrementOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as NullableParamsIdInterface;
      const params = await uuidSchema.validate(req.params);

      const cartItem = await this.cartService.updateOne(id, params, 'increment');

      res.json({ code: 1, cartItem });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public decrementOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as NullableParamsIdInterface;
      const params = await uuidSchema.validate(req.params);

      const cartItem = await this.cartService.updateOne(id, params, 'decrement');

      res.json({ code: 1, cartItem });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as NullableParamsIdInterface;
      const params = await uuidSchema.validate(req.params);

      const cartItem = await this.cartService.deleteOne(id, params);

      res.json({ code: 1, cartItem });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteMany = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as NullableParamsIdInterface;
      const body = await uuidArraySchema.validate(req.body);

      await this.cartService.deleteMany(id, body);

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
