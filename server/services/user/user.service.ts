import bcrypt from 'bcryptjs';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';
import type { EntityManager } from 'typeorm';

import { UserEntity } from '@server/db/entities/user.entity';
import { phoneTransform } from '@server/utilities/phone.transform';
import { confirmCodeValidation, phoneValidation, signupValidation, loginValidation } from '@/validations/validations';
import { upperCase } from '@server/utilities/text.transform';
import { TokenService } from '@server/services/user/token.service';
import { SmsService } from '@server/services/integration/sms.service';
import { BaseService } from '@server/services/app/base.service';
import { ItemService } from '@server/services/item/item.service';
import { GradeService } from '@server/services/rating/grade.service';
import { MessageService } from '@server/services/message/message.service';
import { CartService } from '@server/services/cart/cart.service';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { paramsIdSchema, queryPaginationSchema, queryPaginationWithParams } from '@server/utilities/convertation.params';
import type { UserQueryInterface } from '@server/types/user/user.query.interface';
import type { UserOptionsInterface } from '@server/types/user/user.options.interface';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import type { UserFormInterface, UserProfileType, UserCardInterface } from '@/types/user/User';
import type { OrderInterface } from '@/types/order/Order';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';

@Singleton
export class UserService extends BaseService {
  private readonly tokenService = Container.get(TokenService);

  private readonly smsService = Container.get(SmsService);

  private readonly itemService = Container.get(ItemService);

  private readonly gradeService = Container.get(GradeService);

  private readonly messageService = Container.get(MessageService);

  private readonly cartService = Container.get(CartService);

  public findOne = async (query: UserQueryInterface, options?: UserOptionsInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(UserEntity, 'user')
      .select([
        'user.id',
        'user.name',
        'user.phone',
        'user.telegramId',
        'user.refreshTokens',
        'user.role',
        'user.deleted',
        'user.created',
        'user.updated',
      ])
      .leftJoin('user.favorites', 'favorites')
      .addSelect([
        'favorites.id',
        'favorites.name',
        'favorites.price',
        'favorites.discountPrice',
        'favorites.deleted',
        'favorites.translateName',
      ])
      .leftJoin('favorites.images', 'images', 'images.deleted IS NULL')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
        'images.order',
        'images.deleted',
      ])
      .leftJoinAndSelect('favorites.group', 'group')
      .leftJoinAndSelect('favorites.collection', 'collection');

    if (query?.id) {
      builder.andWhere('user.id = :id', { id: query.id });
    }
    if (query?.phone) {
      builder.andWhere('user.phone = :phone', { phone: query.phone });
    }
    if (options?.withPassword) {
      builder.addSelect('user.password');
    }
    if (options?.withOrders) {
      builder
        .leftJoin('user.orders', 'orders')
        .addSelect([
          'orders.id',
          'orders.created',
          'orders.status',
          'orders.deliveryPrice',
        ])
        .leftJoin('orders.transactions', 'transactions')
        .addSelect([
          'transactions.id',
          'transactions.status',
        ])
        .leftJoin('orders.promotional', 'promotional')
        .addSelect([
          'promotional.id',
          'promotional.name',
          'promotional.discount',
          'promotional.discountPercent',
          'promotional.freeDelivery',
        ])
        .leftJoinAndSelect('orders.delivery', 'delivery')
        .leftJoin('orders.positions', 'positions')
        .addSelect([
          'positions.id',
          'positions.price',
          'positions.discount',
          'positions.discountPrice',
          'positions.count',
        ])
        .leftJoin('positions.item', 'item')
        .addSelect([
          'item.id',
          'item.name',
          'item.translateName',
        ])
        .leftJoin('item.group', 'orderItemGroup')
        .addSelect([
          'orderItemGroup.code',
        ])
        .leftJoin('item.images', 'orderItemImages', 'orderItemImages.deleted IS NULL')
        .addSelect([
          'orderItemImages.id',
          'orderItemImages.name',
          'orderItemImages.path',
          'orderItemImages.order',
        ]);
    }
    if (options?.withDeleted) {
      builder.withDeleted();
    }

    return builder.getOne();
  };

  public login = async (req: Request, res: Response) => {
    try {
      const body = await loginValidation.serverValidator(req.body) as { phone: string, password: string };
      body.phone = phoneTransform(body.phone);

      const user = await this.findOne({ phone: body.phone }, { withPassword: true });
      if (!user) {
        res.json({ code: 3 });
        return;
      }

      const { password, refreshTokens, ...rest } = user;

      const isValidPassword = bcrypt.compareSync(body.password, password);
      if (!isValidPassword) {
        res.json({ code: 2 });
        return;
      }

      const token = this.tokenService.generateAccessToken(user.id, user.phone);
      const refreshToken = this.tokenService.generateRefreshToken(user.id, user.phone);

      if (!refreshTokens.length || refreshTokens.length > 4) {
        user.refreshTokens = [refreshToken];
      } else {
        user.refreshTokens.push(refreshToken);
      }

      await UserEntity.update(user.id, { refreshTokens: user.refreshTokens });

      res.json({
        code: 1,
        user: { ...rest, token, refreshToken },
      });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public signup = async (req: Request, res: Response) => {
    try {
      const body = await signupValidation.serverValidator(req.body) as UserFormInterface;

      const candidate = await this.findOne({ phone: body.phone }, { withDeleted: true });

      if (candidate) {
        res.json({ code: 2 });
        return;
      }

      const { code, user, token, refreshToken } = await this.databaseService
        .getManager()
        .transaction(async (manager) => this.createOne(body.name, body.phone, manager, body.password));

      if (code === 2) {
        res.json({ code: 2 });
        return;
      } else if (code === 1 && user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, refreshTokens, ...rest } = user;

        res.json({ code: 1, user: { ...rest, token, refreshToken } });
      }
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public confirmPhone = async (req: Request, res: Response) => {
    try {
      req.body.phone = phoneTransform(req.body.phone);
      const { phone, key, code: userCode } = req.body as { phone: string, key?: string, code?: string };
      await phoneValidation.serverValidator({ phone });

      const candidate = await this.findOne({ phone }, { withDeleted: true });
      if (candidate) {
        res.json({ code: 5 });
        return;
      }

      if (key) {
        const data = await this.redisService.get<{ phone: string, code: string }>(key);

        if (key && userCode) {
          await confirmCodeValidation.serverValidator({ code: userCode });
          if (data && data.phone === phone && data.code === userCode) {
            res.json({ code: 2, key });
            return;
          }
          res.json({ code: 3 }); // код подтверждения не совпадает
          return;
        }
      }
      if (await this.redisService.exists(phone)) {
        res.json({ code: 4 });
        return;
      }

      const { request_id, code } = await this.smsService.sendCode(phone);
      await this.redisService.setEx(request_id, { phone, code }, 3600);
      await this.redisService.setEx(phone, { phone }, 59);

      res.json({ code: 1, key: request_id, phone });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateTokens = async (req: Request, res: Response) => {
    try {
      const { token, refreshToken, ...user } = req.user as PassportRequestInterface;
      const oldRefreshToken = req.get('Authorization')?.split(' ')[1] || req.headers.authorization;
      if (!oldRefreshToken) {
        throw new Error('Пожалуйста, авторизуйтесь!');
      }
      const isRefresh = user.refreshTokens.includes(oldRefreshToken);
      if (isRefresh) {
        const newRefreshTokens = user.refreshTokens.filter((key) => key !== oldRefreshToken);
        newRefreshTokens.push(refreshToken);

        await UserEntity.update(user.id, { refreshTokens: newRefreshTokens });
      } else {
        this.loggerService.error(`Токен не найден: ${oldRefreshToken}, UserTokens: ${user.refreshTokens.join(', ')}`);
        throw new Error('Ошибка аутентификации. Войдите заново!');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { refreshTokens, ...rest } = user;
      res.json({
        code: 1,
        user: { ...rest, token, refreshToken },
      });
    } catch (e) {
      this.errorHandler(e, res, 401);
    }
  };

  public logout = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;
      const { refreshToken } = req.body as { refreshToken: string };

      const refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await UserEntity.update(user.id, { refreshTokens });
      res.json({ status: 'Tokens has been deleted' });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public recoveryPassword = async (req: Request, res: Response) => {
    try {
      const body = await phoneValidation.serverValidator(req.body) as { phone: string };
      const phone = phoneTransform(body.phone);

      const user = await this.findOne({ phone });
      if (!user) {
        res.json({ code: 2 });
        return;
      }
      const password = await this.smsService.sendPass(phone);
      const hashPassword = bcrypt.hashSync(password, 10);
      await UserEntity.update(user.id, { password: hashPassword });
      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public changeUserProfile = async (req: Request, res: Response) => {
    try {
      const { id, phone } = req.user as PassportRequestInterface;
      const {
        confirmPassword, oldPassword, key, ...values
      } = req.body as UserProfileType;

      if (values.password) {
        const fetchUser = await this.findOne({ phone }, { withPassword: true });
        if (oldPassword && fetchUser && confirmPassword === values.password) {
          const isValidPassword = bcrypt.compareSync(oldPassword, fetchUser.password);
          if (!isValidPassword) {
            res.json({ code: 2 });
            return;
          }
          const hashPassword = bcrypt.hashSync(values.password, 10);
          values.password = hashPassword;
        } else {
          throw new Error('Пароль не совпадает или не введён старый пароль');
        }
      }
      if (values?.name) {
        values.name = upperCase(values.name);
      }
      if (values.phone) {
        values.phone = phoneTransform(values.phone);
        if (key) {
          const data = await this.redisService.get<{ phone: string, code: string, result?: 'done' }>(key);
          if (data && data.result === 'done' && data.phone === values.phone) {
            await this.redisService.delete(data.phone);
          }
        } else {
          throw new Error('Телефон не подтверждён');
        }
      }
      await UserEntity.update(id, values);

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public unlinkTelegram = async (req: Request, res: Response) => {
    try {
      const { id, telegramId } = req.user as PassportRequestInterface;

      if (!telegramId) {
        throw new Error('Телеграм-аккаунт не найден');
      }

      await UserEntity.update(id, { telegramId: null });

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getMyGrades = async (req: Request, res: Response) => {
    try {
      const { id: userId } = req.user as PassportRequestInterface;

      const query = await queryPaginationWithParams.validate(req.query);
      
      const [items, count] = await this.gradeService.getMyGrades(query, userId);
      
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

  public addFavorites = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.findOne(params, { withDeleted: true });

      await UserEntity.save({ ...user, favorites: [...user.favorites, item] });

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public removeFavorites = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;
      const params = await paramsIdSchema.validate(req.params);

      const item = user.favorites.find((value) => value.id === params.id);

      if (!item) {
        throw new Error(`Товар №${params.id} отсутствует в избранном`);
      }

      await UserEntity.save({ ...user, favorites: user.favorites.filter((value) => value.id !== item.id) });

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (name: string, phone: string, manager: EntityManager, password?: string) => {
    const user = {
      name: upperCase(name),
      phone: phoneTransform(phone),
    };

    const candidate = await this.findOne({ phone: user.phone }, { withDeleted: true });

    if (candidate && password) {
      return { code: 2 };
    } else if (candidate && !password) {
      return { code: 1, user: candidate };
    }

    const userRepo = manager.getRepository(UserEntity);

    const userPassword = password || await this.smsService.sendPass(user.phone);

    const createdUser = await userRepo.save({
      ...user,
      password: bcrypt.hashSync(userPassword, 10),
    });

    const createdToken = this.tokenService.generateAccessToken(createdUser.id, createdUser.phone);
    const createdRefreshToken = this.tokenService.generateRefreshToken(createdUser.id, createdUser.phone);

    await userRepo.update(createdUser.id, { refreshTokens: [createdRefreshToken] });

    return { code: 1, user: createdUser, token: createdToken, refreshToken: createdRefreshToken };
  };

  public getUserCard = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const [user, [, gradeCount], [, messageCount], cart] = await Promise.all([
        this.findOne(params, { withDeleted: true, withOrders: true }),
        this.gradeService.getMyGrades({} as FetchGradeInterface, params.id),
        this.messageService.messageReport({}, { userId: params.id }),
        this.cartService.findMany(params.id, undefined, undefined, { withoutJoin: true }),
      ]);

      if (!user) {
        throw new Error(`Пользователь с ID #${params.id} не существует`);
      }

      user.refreshTokens = [];

      const result: UserCardInterface = {
        ...user,
        amount: user.orders.filter(({ isPayment }) => isPayment).reduce((acc, order) => acc + getOrderPrice(order as unknown as OrderInterface), 0),
        gradeCount,
        messageCount,
        cartCount: cart.length,
      };

      res.json({ code: 1, user: result });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getList = async (req: Request, res: Response) => {
    try {
      const query = await queryPaginationSchema.validate(req.query);
      const manager = this.databaseService.getManager();

      const builder = manager.createQueryBuilder(UserEntity, 'user')
        .select([
          'user.id',
          'user.name',
          'user.phone',
          'user.created',
          'user.updated',
        ])
        .orderBy('user.created', 'DESC');

      if (query?.limit && query?.offset) {
        builder
          .limit(query.limit)
          .offset(query.offset);
      }
    
      const [items, count] = await builder.getManyAndCount();

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
}
