import { Singleton } from 'typescript-ioc';
import { Brackets, type EntityManager } from 'typeorm';

import { CartEntity } from '@server/db/entities/cart.entity';
import { BaseService } from '@server/services/app/base.service';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { NullableParamsIdInterface, ParamsIdStringInterface } from '@server/types/params.id.interface';
import type { CartQueryInterface } from '@server/types/cart/cart.query.interface';
import type { CartOptionsInterface } from '@server/types/cart/cart.options.interface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { UserEntity } from '@server/db/entities/user.entity';

@Singleton
export class CartService extends BaseService {

  private createQueryBuilder = (userId: number | null, query?: CartQueryInterface, options?: CartOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(CartEntity, 'cart')
      .select([
        'cart.id',
        'cart.created',
        'cart.count',
      ]);

    if (query?.limit || query?.offset) {
      builder
        .limit(query.limit)
        .offset(query.offset);
    }

    if (!options?.withoutJoin) {
      builder
        .leftJoin('cart.item', 'item')
        .addSelect([
          'item.id',
          'item.price',
          'item.discount',
          'item.discountPrice',
          'item.deleted',
          'item.translateName',
        ])
        .leftJoin('item.translations', 'translations')
        .addSelect([
          'translations.name',
          'translations.lang',
        ])
        .leftJoin('cart.user', 'user')
        .addSelect([
          'user.id',
          'user.name',
          'user.lang',
        ])
        .leftJoin('item.images', 'images', 'images.deleted IS NULL')
        .addSelect([
          'images.id',
          'images.name',
          'images.path',
          'images.order',
          'images.deleted',
        ])
        .leftJoin('item.group', 'group')
        .addSelect([
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

  public createOne = async (user: NullableParamsIdInterface | null, body: CartEntity, options?: { manager?: EntityManager; }) => {
    const manager = options?.manager || this.databaseService.getManager();

    const cartRepo = manager.getRepository(CartEntity);

    if (user?.id) {
      body.user = { id: user.id } as UserEntity;
    }

    const created = await cartRepo.save(body);
    const cartItem = await this.findOne(user, { id: created.id });

    return { code: 1, cartItem };
  };

  public createMany = async (user: NullableParamsIdInterface, body: CartEntity[], options?: { manager?: EntityManager; }) => {
    const entityManager = options?.manager || this.databaseService.getManager();

    return entityManager.transaction(async (manager) => {
      const cartRepo = manager.getRepository(CartEntity);

      body.forEach((cartItem) => {
        cartItem.user = { id: user.id } as UserEntity;
      });

      const oldCartItems = await this.findMany(user, undefined, undefined, { manager });

      const cart = await cartRepo.save(body);

      await this.saveCartItems(cart, oldCartItems, user, { manager });

      return this.findMany(user, undefined, undefined, { manager });
    });
  };

  private findOne = async (user: NullableParamsIdInterface | null, params: ParamsIdStringInterface, options?: { manager?: EntityManager; }) => {
    const builder = this.createQueryBuilder(user?.id || null, params, options);

    const cartItem = await builder.getOne();

    if (!cartItem) {
      throw new Error(user?.lang === UserLangEnum.RU
        ? `Позиции корзины с номером #${params.id} не существует.`
        : `Cart item with number #${params.id} does not exist.`);
    }

    return cartItem;
  };

  public findMany = async (user: NullableParamsIdInterface | null, oldCart?: CartItemInterface[], query?: CartQueryInterface, options?: CartOptionsInterface) => {
    const builder = this.createQueryBuilder(user?.id || null, query, options);

    const cart = await builder.getMany();

    if (!oldCart?.length || !user?.id) {
      return cart;
    }

    return this.saveCartItems(cart, oldCart, user, options);    
  };

  public updateOne = async (user: NullableParamsIdInterface | null, params: ParamsIdStringInterface, action: 'increment' | 'decrement') => {
    const item = await this.findOne(user, params);

    const newItem = { ...item, count: action === 'increment' ? item.count + 1 : item.count - 1 } as CartEntity;
      
    await CartEntity.save(newItem);

    return newItem;
  };

  public updateMany = async (user: NullableParamsIdInterface | null, body: CartEntity[], manager: EntityManager) => {
    if (user?.id) {
      body.forEach((item) => {
        item.user = { id: user.id } as UserEntity;
      });
    }

    const cartRepo = manager.getRepository(CartEntity);
    const created = await cartRepo.save(body);

    const builder = this.createQueryBuilder(user?.id || null, { ids: created.map(({ id }) => id) }, { manager });

    return created.length ? builder.getMany() : [];
  };

  public deleteOne = async (user: NullableParamsIdInterface | null, params: ParamsIdStringInterface) => {
    const cartItem = await this.findOne(user, params);
  
    await CartEntity.delete(cartItem.id);

    return cartItem;
  };

  public deleteMany = async (user: NullableParamsIdInterface | null, ids?: string[], options?: CartOptionsInterface) => {
    const cart = await this.findMany(user, undefined, { ids }, options);

    if (!cart.length) {
      return;
    }

    const manager = options?.manager || this.databaseService.getManager();
    const cartRepo = manager.getRepository(CartEntity);

    await cartRepo.delete(cart.map(({ id }) => id));
  };

  private saveCartItems = async (cart: CartEntity[], oldCart: CartItemInterface[], user: NullableParamsIdInterface, options?: { manager?: EntityManager; }) => {
    const matchCartItemIds = oldCart.reduce((acc, oldCartItem) => {
      const matchCartItem = cart.find(({ item }) => item.id === oldCartItem.item.id);
      if (matchCartItem) {
        acc.push(matchCartItem.id);
      }
      return acc;
    }, [] as string[]);

    const updatedCartItems = await (options?.manager || this.databaseService.getManager()).transaction(async (manager) => {
      const cartRepo = manager.getRepository(CartEntity);

      if (matchCartItemIds.length) {
        await cartRepo.delete(matchCartItemIds);
      }

      return this.updateMany(user, oldCart as CartEntity[], manager);
    });

    return [...cart.filter(({ id }) => !matchCartItemIds.includes(id)), ...updatedCartItems];
  };

  public cartReport = async (query: CartQueryInterface): Promise<[CartEntity[], number]> => {
    const builder = this.createQueryBuilder(query?.userId || null, query, { withoutJoin: true })
      .orderBy('cart.created', 'DESC');

    if (!query?.userId) {
      builder
        .setParameter('adminRole', UserRoleEnum.ADMIN)
        .leftJoin('cart.user', 'user')
        .andWhere(new Brackets(qb => {
          qb
            .where('user.role != :adminRole')
            .orWhere('user.role IS NULL');
        }));
    }

    const [cartItems, count] = await builder.getManyAndCount();

    if (!count) {
      return [[], 0];
    }

    return [
      await this.createQueryBuilder(null, { ids: cartItems.map(({ id }) => id) })
        .orderBy('cart.created', 'DESC')
        .getMany(),
      count,
    ];
  };
}
