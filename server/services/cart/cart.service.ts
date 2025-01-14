import { Singleton } from 'typescript-ioc';
import type { EntityManager } from 'typeorm';

import { CartEntity } from '@server/db/entities/cart.entity';
import { BaseService } from '@server/services/app/base.service';
import type { ParamsIdStringInterface } from '@server/types/params.id.interface';
import type { CartQueryInterface } from '@server/types/cart/cart.query.interface';
import type { CartOptionsInterface } from '@server/types/cart/cart.options.interface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { UserEntity } from '@server/db/entities/user.entity';

@Singleton
export class CartService extends BaseService {

  private createQueryBuilder = (userId: number | null, query?: CartQueryInterface, options?: CartOptionsInterface, entityManager?: EntityManager) => {
    const manager = entityManager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(CartEntity, 'cart')
      .select([
        'cart.id',
        'cart.count',
      ]);

    if (!options?.withoutJoin) {
      builder
        .leftJoin('cart.item', 'item')
        .addSelect([
          'item.id',
          'item.name',
          'item.price',
          'item.discount',
          'item.discountPrice',
        ])
        .leftJoin('item.images', 'images')
        .addSelect([
          'images.id',
          'images.name',
          'images.path',
          'images.deleted',
        ])
        .leftJoin('item.group', 'group')
        .addSelect([
          'group.id',
          'group.name',
          'group.code',
        ]);
    }

    if (userId) {
      builder.andWhere('cart.user = :userId', { userId });
    }
    if (query?.id) {
      builder.andWhere('cart.id = :id', { id: query.id });
    }
    if (query?.ids) {
      builder.andWhere('cart.id IN(:...ids)', { ids: query.ids });
    }

    return builder;
  };

  public createOne = async (userId: number | null, body: CartEntity) => {
    if (userId) {
      body.user = { id: userId } as UserEntity;
    }
    const created = await CartEntity.save(body);
    const cartItem = await this.findOne(userId, { id: created.id });

    return { code: 1, cartItem };
  };

  private findOne = async (userId: number | null, params: ParamsIdStringInterface) => {
    const builder = this.createQueryBuilder(userId, params);

    const item = await builder.getOne();

    if (!item) {
      throw new Error(`Позиции корзины с номером #${params.id} не существует.`);
    }

    return item;
  };

  public findMany = async (userId: number | null, oldCart?: CartItemInterface[], query?: CartQueryInterface) => {
    const builder = this.createQueryBuilder(userId, query);

    const cart = await builder.getMany();

    if (!oldCart?.length || !userId) {
      return cart;
    }

    return this.saveCartItems(cart, oldCart, userId);    
  };

  public updateOne = async (userId: number | null, params: ParamsIdStringInterface, action: 'increment' | 'decrement') => {
    const item = await this.findOne(userId, params);

    const newItem = { ...item, count: action === 'increment' ? item.count + 1 : item.count - 1 } as CartEntity;
      
    await CartEntity.save(newItem);

    return newItem;
  };

  public updateMany = async (userId: number | null, body: CartEntity[], manager: EntityManager) => {
    if (userId) {
      body.forEach((item) => {
        item.user = { id: userId } as UserEntity;
      });
    }

    const cartRepo = manager.getRepository(CartEntity);
    const created = await cartRepo.save(body);

    const builder = this.createQueryBuilder(userId, { ids: created.map(({ id }) => id) }, {}, manager);

    const cartItems = await builder.getMany();

    return cartItems;
  };

  public deleteOne = async (userId: number | null, params: ParamsIdStringInterface) => {
    const item = await this.findOne(userId, params);
  
    await CartEntity.delete(item.id);

    return item;
  };

  public deleteMany = async (userId: number | null, ids?: string[]) => {
    const cart = await this.findMany(userId, undefined, { ids });

    await CartEntity.delete(cart.map(({ id }) => id));
  };

  private saveCartItems = async (cart: CartEntity[], oldCart: CartItemInterface[], userId: number) => {
    const matchCartItemIds = oldCart.reduce((acc, oldCartItem) => {
      const matchCartItem = cart.find(({ item }) => item.id === oldCartItem.item.id);
      if (matchCartItem) {
        acc.push(matchCartItem.id);
      }
      return acc;
    }, [] as string[]);

    const updatedCartItems = await this.databaseService.getManager().transaction(async (manager) => {
      const cartRepo = manager.getRepository(CartEntity);

      if (matchCartItemIds.length) {
        await cartRepo.delete(matchCartItemIds);
      }

      return this.updateMany(userId, oldCart as CartEntity[], manager);
    });

    return [...cart.filter(({ id }) => !matchCartItemIds.includes(id)), ...updatedCartItems];
  };
}
