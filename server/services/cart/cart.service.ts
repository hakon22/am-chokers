import { Singleton } from 'typescript-ioc';

import { CartEntity } from '@server/db/entities/cart.entity';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { BaseService } from '@server/services/app/base.service';
import type { UserEntity } from '@server/db/entities/user.entity';

@Singleton
export class CartService extends BaseService {

  private createQueryBuilder = (userId: number, query?: ParamsIdInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(CartEntity, 'cart')
      .setParameter('userId', userId)
      .select([
        'cart.id',
        'cart.name',
        'cart.price',
        'cart.discount',
        'cart.count',
      ])
      .leftJoin('cart.item', 'item')
      .addSelect([
        'item.id',
        'item.name',
        'item.price',
        'item.discount',
        'item.discountPrice',
      ])
      .leftJoinAndSelect('item.images', 'images')
      .where('cart.user = :userId');

    if (query?.id) {
      builder.andWhere('cart.id = :id', { id: query.id });
    }

    return builder;
  };

  public createOne = async (userId: number, body: CartEntity) => {
    body.user = { id: userId } as UserEntity;
    const created = await CartEntity.save(body);
    const item = await this.findOne(userId, { id: created.id });

    return { code: 1, item };
  };

  private findOne = async (userId: number, params: ParamsIdInterface) => {
    const builder = this.createQueryBuilder(userId, params);

    const item = await builder.getOne();

    if (!item) {
      throw new Error(`Позиции корзины с номером #${params.id} не существует.`);
    }

    return item;
  };

  public findMany = async (userId: number) => {
    const builder = this.createQueryBuilder(userId);

    const cart = await builder.getMany();

    return cart;
  };

  public updateOne = async (userId: number, params: ParamsIdInterface, body: CartEntity) => {
    const item = await this.findOne(userId, params);

    const newItem = { ...item, ...body } as CartEntity;
      
    await CartEntity.save(newItem);

    return newItem;
  };

  public deleteOne = async (userId: number, params: ParamsIdInterface) => {
    const item = await this.findOne(userId, params);
  
    await CartEntity.delete(item.id);

    return item;
  };

  public deleteMany = async (userId: number) => {
    const cart = await this.findMany(userId);

    await CartEntity.delete(cart.map(({ id }) => id));
  };
}
