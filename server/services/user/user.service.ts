import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Container, Inject, Singleton } from 'typescript-ioc';

import { UserEntity } from '@server/db/entities/user.entity';
import { phoneTransform } from '@server/utilities/phone.transform';
import { UserFormInterface } from '@/types/user/User';
import { confirmCodeValidation, phoneValidation, signupValidation } from '@/validations/validations';
import { upperCase } from '@server/utilities/text.transform';
import { PassportRequestInterface } from '@server/types/user/user.request.interface';
import { DatabaseService } from '@server/db/database.service';
import { TokenService } from '@server/services/user/token.service';
import { UserQueryInterface } from '@server/types/user/user.query.interface';
import { SmsService } from '@server/services/integration/sms.service';
import redis from '@server/db/redis';

@Singleton
export class UserService {
  @Inject
  private readonly databaseService: DatabaseService;

  @Inject
  private readonly tokenService: TokenService;

  @Inject
  private readonly smsService: SmsService;

  public findOne = async (query: UserQueryInterface) => {
    const manager = Container.get(DatabaseService).getManager();

    const builder = manager.createQueryBuilder(UserEntity, 'user')
      .select([
        'user.id',
        'user.name',
        'user.phone',
        'user.telegramId',
        'user.role',
      ]);

    if (query?.id) {
      builder.andWhere('user.id = :id', { id: query.id });
    }
    if (query?.phone) {
      builder.andWhere('user.phone = :phone', { phone: query.phone });
    }

    return builder.getOne();
  };

  public login = async (req: Request, res: Response) => {
    try {
      req.body.phone = phoneTransform(req.body.phone);
      const payload = req.body as { phone: string, password: string };

      const user = await UserEntity.findOne({ where: { phone: payload.phone } });
      if (!user) {
        return res.json({ code: 3 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshTokens, ...rest } = user;

      const isValidPassword = bcrypt.compareSync(payload.password, password);
      if (!isValidPassword) {
        return res.json({ code: 2 });
      }

      const token = this.tokenService.generateAccessToken(user.id, user.phone);
      const refreshToken = this.tokenService.generateRefreshToken(user.id, user.phone);

      if (!user.refreshTokens.length || user.refreshTokens.length > 4) {
        user.refreshTokens = [refreshToken];
      } else {
        user.refreshTokens.push(refreshToken);
      }

      await user.save();

      res.status(200).send({
        code: 1,
        user: { ...rest, token, refreshToken },
      });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };

  public signup = async (req: Request, res: Response) => {
    try {
      await signupValidation.serverValidator({ ...req.body });

      req.body.phone = phoneTransform(req.body.phone);
      req.body.name = upperCase(req.body.name);
      const payload = req.body as UserFormInterface;

      const candidate = await UserEntity.findOne({ where: { phone: payload.phone } });

      if (candidate) {
        return res.json({ code: 2 });
      }

      const user = await UserEntity.save({
        ...payload,
        password: bcrypt.hashSync(payload.password, 10),
      });

      const token = this.tokenService.generateAccessToken(user.id, user.phone);
      const refreshToken = this.tokenService.generateRefreshToken(user.id, user.phone);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshTokens, ...rest } = user;

      res.json({ code: 1, user: { ...rest, token, refreshToken } });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };

  public confirmPhone = async (req: Request, res: Response) => {
    try {
      req.body.phone = phoneTransform(req.body.phone);
      const { phone, key, code: userCode } = req.body as { phone: string, key?: string, code?: string };
      await phoneValidation.serverValidator({ phone });

      const candidate = await this.findOne({ phone });
      if (candidate) {
        return res.json({ code: 6 });
      }

      if (key) {
        const cacheData = await redis.get(key);
        const data: { phone: string, code: string, result?: 'done' } | null = cacheData ? JSON.parse(cacheData) : null;

        if (data && data.result === 'done' && data.phone === phone) {
          return res.json({ code: 5 });
        }
        if (key && userCode) {
          await confirmCodeValidation.serverValidator({ code: userCode });
          if (data && data.phone === phone && data.code === userCode) {
            await redis.setEx(key, 300, JSON.stringify({ phone, result: 'done' }));
            return res.json({ code: 2, key });
          }
          return res.json({ code: 3 }); // код подтверждения не совпадает
        }
      }
      if (await redis.exists(phone)) {
        return res.json({ code: 4 });
      }

      // eslint-disable-next-line camelcase
      const { request_id, code } = await this.smsService.sendCode(phone);
      await redis.setEx(request_id, 3600, JSON.stringify({ phone, code }));
      await redis.setEx(phone, 59, JSON.stringify({ phone }));

      // eslint-disable-next-line camelcase
      res.json({ code: 1, key: request_id, phone });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };

  public updateTokens = async (req: Request, res: Response) => {
    try {
      const { user, token, refreshToken } = req.user as PassportRequestInterface;
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
        throw new Error('Ошибка доступа');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { refreshTokens, ...rest } = user;
      res.status(200).send({
        code: 1,
        user: { ...rest, token, refreshToken },
      });
    } catch (e) {
      console.log(e);
      res.sendStatus(401);
    }
  };

  public logout = async (req: Request, res: Response) => {
    try {
      const { user } = req.user as PassportRequestInterface;
      const { refreshToken } = req.body as { refreshToken: string };

      const refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await UserEntity.update(user.id, { refreshTokens });
      res.status(200).json({ status: 'Tokens has been deleted' });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };

  public recoveryPassword = async (req: Request, res: Response) => {
    try {
      req.body.phone = phoneTransform(req.body.phone);
      const { phone } = req.body as { phone: string };
      await phoneValidation.serverValidator({ phone });

      const user = await this.findOne({ phone });
      if (!user) {
        return res.status(200).json({ code: 2 });
      }
      const password = await this.smsService.sendPass(phone);
      const hashPassword = bcrypt.hashSync(password, 10);
      await UserEntity.update(user.id, { password: hashPassword });
      res.status(200).json({ code: 1 });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };
}
