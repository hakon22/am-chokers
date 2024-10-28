import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Container, Singleton } from 'typescript-ioc';

import { UserEntity } from '@server/db/entities/user.entity';
import { phoneTransform } from '@server/utilities/phone.transform';
import type { UserFormInterface, UserProfileType } from '@/types/user/User';
import { confirmCodeValidation, phoneValidation, signupValidation } from '@/validations/validations';
import { upperCase } from '@server/utilities/text.transform';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import { TokenService } from '@server/services/user/token.service';
import { UserQueryInterface } from '@server/types/user/user.query.interface';
import { UserOptionsInterface } from '@server/types/user/user.options.interface';
import { SmsService } from '@server/services/integration/sms.service';
import { BaseService } from '@server/services/app/base.service';

@Singleton
export class UserService extends BaseService {
  private readonly tokenService = Container.get(TokenService);

  private readonly smsService = Container.get(SmsService);

  public findOne = async (query: UserQueryInterface, options?: UserOptionsInterface) => {
    const manager = await this.databaseService.getManager();

    const builder = manager.createQueryBuilder(UserEntity, 'user')
      .select([
        'user.id',
        'user.name',
        'user.phone',
        'user.telegramId',
        'user.refreshTokens',
        'user.role',
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

    return builder.getOne();
  };

  public login = async (req: Request, res: Response) => {
    try {
      req.body.phone = phoneTransform(req.body.phone);
      const payload = req.body as { phone: string, password: string };

      const user = await this.findOne({ phone: payload.phone }, { withPassword: true });
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

      if (!refreshTokens.length || refreshTokens.length > 4) {
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
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public signup = async (req: Request, res: Response) => {
    try {
      await signupValidation.serverValidator({ ...req.body });

      req.body.phone = phoneTransform(req.body.phone);
      req.body.name = upperCase(req.body.name);
      const payload = req.body as UserFormInterface;

      const candidate = await this.findOne({ phone: payload.phone });

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
      this.loggerService.error(e);
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
        return res.json({ code: 5 });
      }

      if (key) {
        const data = await this.redisService.get<{ phone: string, code: string }>(key);

        if (key && userCode) {
          await confirmCodeValidation.serverValidator({ code: userCode });
          if (data && data.phone === phone && data.code === userCode) {
            return res.json({ code: 2, key });
          }
          return res.json({ code: 3 }); // код подтверждения не совпадает
        }
      }
      if (await this.redisService.exists(phone)) {
        return res.json({ code: 4 });
      }

      // eslint-disable-next-line camelcase
      const { request_id, code } = await this.smsService.sendCode(phone);
      await this.redisService.setEx(request_id, { phone, code }, 3600);
      await this.redisService.setEx(phone, { phone }, 59);

      // eslint-disable-next-line camelcase
      res.json({ code: 1, key: request_id, phone });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
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
        throw new Error(`Ошибка доступа. Токен не найден: ${oldRefreshToken}, UserTokens: ${user.refreshTokens.join(', ')}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { refreshTokens, ...rest } = user;
      res.status(200).send({
        code: 1,
        user: { ...rest, token, refreshToken },
      });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(401);
    }
  };

  public logout = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;
      const { refreshToken } = req.body as { refreshToken: string };

      const refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await UserEntity.update(user.id, { refreshTokens });
      res.status(200).json({ status: 'Tokens has been deleted' });
    } catch (e) {
      this.loggerService.error(e);
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
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public changeUserProfile = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;
      const {
        confirmPassword, oldPassword, key, ...values
      } = req.body as UserProfileType;

      if (values.password) {
        const fetchUser = await this.findOne({ phone: user.phone }, { withPassword: true });
        if (oldPassword && fetchUser && confirmPassword === values.password) {
          const isValidPassword = bcrypt.compareSync(oldPassword, fetchUser.password);
          if (!isValidPassword) {
            return res.json({ code: 2 });
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
      await UserEntity.update(user.id, values);

      res.json({ code: 1 });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public unlinkTelegram = async (req: Request, res: Response) => {
    try {
      const { ...user } = req.user as PassportRequestInterface;

      if (!user.telegramId) {
        throw new Error('Телеграм-аккаунт не найден');
      }

      await UserEntity.update(user.id, { telegramId: undefined });

      res.status(200).json({ code: 1 });
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  };
}
