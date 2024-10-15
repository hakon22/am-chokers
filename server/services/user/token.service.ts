/* eslint-disable @typescript-eslint/no-unused-vars */
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { PassportStatic } from 'passport';
import { Container, Singleton } from 'typescript-ioc';

import { UserEntity } from '@server/db/entities/user.entity';
import { LoggerService } from '@server/services/app/logger.service';

@Singleton
export class TokenService {
  private logger = Container.get(LoggerService);

  public tokenChecker = (passport: PassportStatic) => passport.use(
    new JwtStrategy(this.options, async ({ id }, done) => {
      try {
        const user = await UserEntity.findOne({ where: { id } });
        if (user) {
          const { password, ...rest } = user;
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
        const user = await UserEntity.findOne({ where: { id, phone } });
        if (user) {
          const { password, ...rest } = user;
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

  private options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.KEY_TOKEN ?? '',
  };

  private optionsRefresh = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.KEY_REFRESH_TOKEN ?? '',
  };
}
