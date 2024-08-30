import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.KEY_TOKEN ?? '',
};

const tokenChecker = (passport: PassportStatic) => passport.use(
  new JwtStrategy(options, async ({ id }, done) => {
    try {
      const user = true;
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

export default tokenChecker;
