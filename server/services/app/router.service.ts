import express from 'express';
import passport from 'passport';
import { Singleton, Container } from 'typescript-ioc';

import { UserService } from '@server/services/user/user.service';
import { MiddlewareService } from '@server/services/app/middleware.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { routes } from '@/routes';

@Singleton
export class RouterService {
  private readonly userService = Container.get(UserService);

  private readonly telegramService = Container.get(TelegramService);

  private readonly middlewareService = Container.get(MiddlewareService);

  private router = express.Router();

  private routes = routes;

  private jwtToken = passport.authenticate('jwt', { session: false });

  public set = () => {
    // user
    this.router.post(this.routes.login, this.userService.login);
    this.router.post(this.routes.signup, this.userService.signup);
    this.router.post(this.routes.recoveryPassword, this.userService.recoveryPassword);
    this.router.post(this.routes.logout, this.jwtToken, this.userService.logout);
    this.router.get(this.routes.updateTokens, passport.authenticate('jwt-refresh', { session: false }), this.userService.updateTokens);
    this.router.post(this.routes.confirmPhone, this.userService.confirmPhone);
    this.router.post(this.routes.changeUserProfile, this.jwtToken, this.userService.changeUserProfile);
    this.router.get(this.routes.unlinkTelegram, this.jwtToken, this.userService.unlinkTelegram);
    // integration
    this.router.post(this.routes.telegram, this.middlewareService.accessTelegram, this.telegramService.webhooks);
  };

  public get = () => this.router;
}
