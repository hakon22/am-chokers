import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { PassportStatic } from 'passport';
import { Singleton } from 'typescript-ioc';

import { UserEntity } from '@server/db/entities/user.entity';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.KEY_TOKEN ?? '',
};

const optionsRefresh = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.KEY_REFRESH_TOKEN ?? '',
};

@Singleton
export class TokenService {
  public tokenChecker = (passport: PassportStatic) => passport.use(
    new JwtStrategy(options, async ({ id }, done) => {
      try {
        const user = await UserEntity.findOne({ where: { id } });
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      } catch (e) {
        console.log(e);
      }
    }),
  );

  public refreshTokenChecker = (passport: PassportStatic) => passport.use(
    'jwt-refresh',
    new JwtStrategy(optionsRefresh, async ({ id, phone }, done) => {
      try {
        const user = await UserEntity.findOne({ where: { id, phone } });
        if (user) {
          const token = this.generateAccessToken(id, phone);
          const refreshToken = this.generateRefreshToken(id, phone);
          done(null, { ...user, token, refreshToken });
        } else {
          done(null, false);
        }
      } catch (e) {
        console.log(e);
      }
    }),
  );

  public generateAccessToken = (id: number, phone: string) => jwt.sign({ id, phone }, process.env.KEY_TOKEN ?? '', { expiresIn: '10m' });

  public generateRefreshToken = (id: number, phone: string) => jwt.sign({ id, phone }, process.env.KEY_REFRESH_TOKEN ?? '', { expiresIn: '30d' });
}
