/* eslint-disable @typescript-eslint/no-unused-vars */
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { PassportStatic } from 'passport';
import { Container, Singleton } from 'typescript-ioc';
import type { Request } from 'express';

import { UserEntity } from '@server/db/entities/user.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { AuthCookieService } from '@server/services/user/auth-cookie.service';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';

@Singleton
export class TokenService {
  private readonly logger = Container.get(LoggerService);

  private readonly authCookieService = Container.get(AuthCookieService);

  public getCurrentUser = (req: Request): PassportRequestInterface => req.user as PassportRequestInterface;

  /**
   * То же, что getCurrentUser, но только если в req действительно загружен аккаунт (после optionalJwtAuth с валидным JWT)
   * @param req - HTTP-запрос с req.user от passport или заглушкой `{ id: null, lang }`
   * @returns пользователь для защищённых маршрутов или null для гостя / без токена
   */
  public getCurrentUserIfAuthenticated = (req: Request): PassportRequestInterface | null => {
    const user = req.user as PassportRequestInterface | { id: null; lang: UserLangEnum; } | undefined;

    if (!user || typeof user.id !== 'number') {
      return null;
    }

    return user as PassportRequestInterface;
  };

  public tokenChecker = (passport: PassportStatic) => passport.use(
    new JwtStrategy(this.options, async ({ id }, done) => {
      try {
        const user = await UserEntity.findOne({ where: { id }, relations: ['favorites', 'favorites.translations', 'favorites.images', 'favorites.group', 'favorites.group.translations'] });
        if (user) {
          const {
            password, updated, created, ...rest
          } = user;
          done(null, rest);
        } else {
          done(null, false);
        }
      } catch (e) {
        this.logger.error(e);
      }
    }),
  );

  public refreshTokenChecker = (passport: PassportStatic) => passport.use(
    'jwt-refresh',
    new JwtStrategy(this.optionsRefresh, async ({ id, phone }, done) => {
      try {
        const user = await UserEntity.findOne({ where: { id, phone }, relations: ['favorites', 'favorites.translations', 'favorites.images', 'favorites.group', 'favorites.group.translations', 'refreshTokens'] });
        if (user) {
          const {
            password, updated, created, ...rest
          } = user;
          const token = this.generateAccessToken(id, phone);
          const refreshToken = this.generateRefreshToken(id, phone);
          done(null, { ...rest, token, refreshToken });
        } else {
          done(null, false);
        }
      } catch (e) {
        this.logger.error(e);
      }
    }),
  );

  public generateAccessToken = (id: number, phone: string) => jwt.sign({ id, phone }, process.env.KEY_TOKEN ?? '', { expiresIn: '10m' });

  public generateRefreshToken = (id: number, phone: string) => jwt.sign({ id, phone }, process.env.KEY_REFRESH_TOKEN ?? '', { expiresIn: '30d' });

  /**
   * Проверяет подпись refresh-токена и возвращает payload
   * @param refreshToken - JWT refresh-токен из cookie или заголовка Authorization
   * @returns id и phone из токена или null при невалидном токене
   */
  public verifyRefreshToken = (refreshToken: string): { id: number; phone: string; } | null => {
    try {
      const payload = jwt.verify(refreshToken, process.env.KEY_REFRESH_TOKEN ?? '') as { id: number; phone: string; };
      return payload;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  };

  private options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.KEY_TOKEN ?? '',
  };

  private optionsRefresh = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      (req: Request) => this.authCookieService.getRefreshTokenFromRequest(req) ?? null,
    ]),
    secretOrKey: process.env.KEY_REFRESH_TOKEN ?? '',
  };
}
