import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';
import { generateAccessToken, generateRefreshToken } from '@server/auth/tokens.gen';

const optionsRefresh = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.KEY_REFRESH_TOKEN ?? '',
};

export const refreshTokenChecker = (passport: PassportStatic) => passport.use(
  'jwt-refresh',
  new JwtStrategy(optionsRefresh, async ({ id, phone }, done) => {
    try {
      const user = {};
      if (user) {
        const token = generateAccessToken(id, phone);
        const refreshToken = generateRefreshToken(id, phone);
        done(null, { ...user, token, refreshToken });
      } else {
        done(null, false);
      }
    } catch (e) {
      console.log(e);
    }
  }),
);
