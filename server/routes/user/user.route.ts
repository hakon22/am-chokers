import { Container, Singleton } from 'typescript-ioc';
import passport from 'passport';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { UserService } from '@server/services/user/user.service';

@Singleton
export class UserRoute extends BaseRouter {
  private readonly userService = Container.get(UserService);

  public set = (router: Router) => {
    router.post(this.routes.login, this.userService.login);
    router.post(this.routes.signup, this.userService.signup);
    router.post(this.routes.recoveryPassword, this.userService.recoveryPassword);
    router.post(this.routes.logout, this.middlewareService.jwtToken, this.userService.logout);
    router.get(this.routes.updateTokens, passport.authenticate('jwt-refresh', { session: false }), this.userService.updateTokens);
    router.post(this.routes.confirmPhone, this.userService.confirmPhone);
    router.post(this.routes.changeUserProfile, this.middlewareService.jwtToken, this.userService.changeUserProfile);
    router.get(this.routes.unlinkTelegram, this.middlewareService.jwtToken, this.userService.unlinkTelegram);
    router.get(this.routes.getMyGrades, this.middlewareService.jwtToken, this.userService.getMyGrades);
    router.get(this.routes.addFavorites(), this.middlewareService.jwtToken, this.userService.addFavorites);
    router.delete(this.routes.removeFavorites(), this.middlewareService.jwtToken, this.userService.removeFavorites);
  };
}
