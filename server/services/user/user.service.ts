import bcrypt from 'bcryptjs';
import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';
import type { Request, Response } from 'express';
import type { EntityManager } from 'typeorm';

import { UserEntity } from '@server/db/entities/user.entity';
import { UserRefreshTokenEntity } from '@server/db/entities/user.refresh.token.entity';
import { phoneTransform } from '@server/utilities/phone.transform';
import { confirmCodeValidation, phoneValidation, signupValidation, loginValidation, profileServerSchema } from '@/validations/validations';
import { upperCase } from '@server/utilities/text.transform';
import { SmsService } from '@server/services/integration/sms.service';
import { BaseService } from '@server/services/app/base.service';
import { ItemService } from '@server/services/item/item.service';
import { GradeService } from '@server/services/rating/grade.service';
import { MessageService } from '@server/services/message/message.service';
import { CartService } from '@server/services/cart/cart.service';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { paramsIdSchema, queryLanguageParams, queryPaginationSchema, queryPaginationWithParams } from '@server/utilities/convertation.params';
import type { UserQueryInterface } from '@server/types/user/user.query.interface';
import type { UserOptionsInterface } from '@server/types/user/user.options.interface';
import type { UserFormInterface, UserProfileType, UserCardInterface } from '@/types/user/User';
import type { OrderInterface } from '@/types/order/Order';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';

@Singleton
export class UserService extends BaseService {
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
        'user.role',
        'user.deleted',
        'user.created',
        'user.updated',
        'user.lang',
      ])
      .leftJoin('user.favorites', 'favorites')
      .addSelect([
        'favorites.id',
        'favorites.price',
        'favorites.discountPrice',
        'favorites.deleted',
        'favorites.translateName',
      ])
      .leftJoin('favorites.translations', 'favoritesTranslations')
      .addSelect([
        'favoritesTranslations.name',
        'favoritesTranslations.lang',
      ])
      .leftJoin('favorites.images', 'images', 'images.deleted IS NULL')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
        'images.order',
        'images.deleted',
      ])
      .leftJoin('favorites.group', 'group')
      .addSelect([
        'group.code',
      ]);

    if (query?.id) {
      builder.andWhere('user.id = :id', { id: query.id });
    }
    if (query?.phone) {
      builder.andWhere('user.phone = :phone', { phone: query.phone });
    }
    if (options?.withPassword) {
      builder.addSelect('user.password');
    }
    if (options?.withTokens) {
      builder
        .leftJoin('user.refreshTokens', 'refreshTokens')
        .addSelect([
          'refreshTokens.created',
          'refreshTokens.refreshToken',
        ]);
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
          'item.translateName',
        ])
        .leftJoin('item.translations', 'itemTranslations')
        .addSelect([
          'itemTranslations.name',
          'itemTranslations.lang',
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

      const { password, ...rest } = user;

      const isValidPassword = bcrypt.compareSync(body.password, password);
      if (!isValidPassword) {
        res.json({ code: 2 });
        return;
      }

      const token = this.tokenService.generateAccessToken(user.id, user.phone);
      const refreshToken = this.tokenService.generateRefreshToken(user.id, user.phone);

      await UserRefreshTokenEntity.insert({ refreshToken, user });

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
        .transaction(async (manager) => this.createOne(body.name, body.phone, body.lang, manager, body.password));

      if (code === 2) {
        res.json({ code: 2 });
        return;
      } else if (code === 1 && user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = user;

        res.json({ code: 1, user: { ...rest, token, refreshToken } });
      }
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public confirmPhone = async (req: Request, res: Response) => {
    try {
      req.body.phone = phoneTransform(req.body.phone);
      const { phone, lang, key, code: userCode } = req.body as { phone: string, lang: UserLangEnum, key?: string, code?: string };
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

      const { request_id, code } = await this.smsService.sendCode(phone, lang);
      await this.redisService.setEx(request_id, { phone, code }, 3600);
      await this.redisService.setEx(phone, { phone }, 59);

      res.json({ code: 1, key: request_id, phone });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateTokens = async (req: Request, res: Response) => {
    try {
      const { token, refreshToken, ...user } = this.getCurrentUser(req);
      const oldRefreshToken = req.get('Authorization')?.split(' ')[1] || req.headers.authorization;

      if (!oldRefreshToken) {
        throw new Error(user.lang === UserLangEnum.RU
          ? 'Пожалуйста, авторизуйтесь!'
          : 'Please log in!');
      }

      const userRefreshTokens = user.refreshTokens.map(({ refreshToken: refresh }) => refresh);

      const hasRefresh = userRefreshTokens.includes(oldRefreshToken);

      if (hasRefresh) {
        await this.databaseService
          .getManager()
          .transaction(async (manager) => {
            const userRefreshTokenRepo = manager.getRepository(UserRefreshTokenEntity);

            await userRefreshTokenRepo.insert({ refreshToken, user });

            const userToken = await userRefreshTokenRepo.findOne({ where: { refreshToken: oldRefreshToken, user: { id: user.id } } });

            if (!userToken) {
              throw new Error(user.lang === UserLangEnum.RU
                ? 'Токена не существует!'
                : 'Token does not exist!');
            }

            await userRefreshTokenRepo.delete(userToken.id);
          });
      } else {
        this.loggerService.error(`Токен не найден: ${oldRefreshToken}, UserTokens: ${userRefreshTokens.join(', ')}`);
        throw new Error(user.lang === UserLangEnum.RU
          ? 'Ошибка аутентификации. Войдите заново!'
          : 'Authentication error. Please log in again!');
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
      const user = this.getCurrentUser(req);
      const { refreshToken } = req.body as { refreshToken: string; };

      const userToken = await UserRefreshTokenEntity.findOne({ where: { refreshToken, user: { id: user.id } } });

      if (!userToken) {
        throw new Error(user.lang === UserLangEnum.RU
          ? 'Токена не существует!'
          : 'Token does not exist!');
      }

      await UserRefreshTokenEntity.delete(userToken.id);

      res.json({ code: 1 });
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
      const password = await this.smsService.sendPass(phone, user.lang);
      const hashPassword = bcrypt.hashSync(password, 10);
      await UserEntity.update(user.id, { password: hashPassword });
      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public changeUserProfile = async (req: Request, res: Response) => {
    try {
      const { id, phone, lang } = this.getCurrentUser(req);
      const { confirmPassword, oldPassword, key, ...values } = await profileServerSchema.validate(req.body) as UserProfileType;

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
          throw new Error(lang === UserLangEnum.RU
            ? 'Пароль не совпадает или не введён старый пароль'
            : 'The password does not match or the old password is not entered');
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
          throw new Error(lang === UserLangEnum.RU
            ? 'Телефон не подтверждён'
            : 'Phone not verified');
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
      const { id, telegramId, lang } = this.getCurrentUser(req);

      if (!telegramId) {
        throw new Error(lang === UserLangEnum.RU
          ? 'Телеграм-аккаунт не найден'
          : 'Telegram account not found');
      }

      await UserEntity.update(id, { telegramId: null });

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getMyGrades = async (req: Request, res: Response) => {
    try {
      const { id: userId } = this.getCurrentUser(req);

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
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.findOne(params, user.lang, { withDeleted: true });

      await UserEntity.save({ ...user, favorites: [...user.favorites, item] });

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public removeFavorites = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const item = user.favorites.find((value) => value.id === params.id);

      if (!item) {
        throw new Error(user.lang === UserLangEnum.RU
          ? `Товар №${params.id} отсутствует в избранном`
          : `Item №${params.id} is not in favorites`);
      }

      await UserEntity.save({ ...user, favorites: user.favorites.filter((value) => value.id !== item.id) });

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (name: string, phone: string, lang: UserLangEnum, manager: EntityManager, password?: string) => {
    const user = {
      name: upperCase(name),
      phone: phoneTransform(phone),
      lang,
    };

    const candidate = await this.findOne({ phone: user.phone }, { withDeleted: true });

    if (candidate && password) {
      return { code: 2 };
    } else if (candidate && !password) {
      return { code: 1, user: candidate };
    }

    const userRepo = manager.getRepository(UserEntity);
    const userRefreshTokenRepo = manager.getRepository(UserRefreshTokenEntity);

    const userPassword = password || await this.smsService.sendPass(user.phone, user.lang);

    const createdUser = await userRepo.save({
      ...user,
      password: bcrypt.hashSync(userPassword, 10),
    });

    const createdToken = this.tokenService.generateAccessToken(createdUser.id, createdUser.phone);
    const createdRefreshToken = this.tokenService.generateRefreshToken(createdUser.id, createdUser.phone);

    await userRefreshTokenRepo.insert({ refreshToken: createdRefreshToken, user: createdUser });

    return { code: 1, user: createdUser, token: createdToken, refreshToken: createdRefreshToken };
  };

  public getUserCard = async (req: Request, res: Response) => {
    try {
      const currentUser = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const [user, [, gradeCount], [, messageCount], cart] = await Promise.all([
        this.findOne(params, { withDeleted: true, withOrders: true, withTokens: true }),
        this.gradeService.getMyGrades({} as FetchGradeInterface, params.id),
        this.messageService.messageReport({}, { userId: params.id }),
        this.cartService.findMany({ ...params, lang: currentUser.lang }, undefined, undefined, { withoutJoin: true }),
      ]);

      if (!user) {
        throw new Error(currentUser.lang === UserLangEnum.RU
          ? `Пользователь с номером #${params.id} не существует`
          : `User with number #${params.id} does not exist`);
      }

      user.updated = user.refreshTokens.length ? moment.max(user.refreshTokens.map(({ created }) => moment(created))).toDate() : user.created;
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
        .leftJoin('user.refreshTokens', 'refreshTokens')
        .addSelect([
          'refreshTokens.created',
        ])
        .orderBy('user.created', 'DESC');

      if (query?.limit && query?.offset) {
        builder
          .limit(query.limit)
          .offset(query.offset);
      }
    
      const [items, count] = await builder.getManyAndCount();

      items.forEach((user) => {
        user.updated = user.refreshTokens.length ? moment.max(user.refreshTokens.map(({ created }) => moment(created))).toDate() : user.created;
        user.refreshTokens = [];
      });

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

  public changeLang = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const query = await queryLanguageParams.validate(req.query);

      if (user.lang !== query.lang) {
        await UserEntity.update(user.id, { lang: query.lang });
      }

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
