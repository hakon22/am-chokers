import express from 'express';
import passport from 'passport';
import { Singleton, Container } from 'typescript-ioc';

import { UserService } from '@server/services/user/user.service';

@Singleton
export class RouterService {
  private readonly userService = Container.get(UserService);

  private router = express.Router();

  private apiPath = process.env.NEXT_PUBLIC_API_PATH ?? '/api';

  private jwtToken = passport.authenticate('jwt', { session: false });

  public set = () => {
    this.router.post(`${this.apiPath}/auth/login`, this.userService.login);
    this.router.post(`${this.apiPath}/auth/signup`, this.userService.signup);
    this.router.post(`${this.apiPath}/auth/recoveryPassword`, this.userService.recoveryPassword);
    this.router.post(`${this.apiPath}/auth/logout`, this.userService.logout);
    this.router.get(`${this.apiPath}/auth/updateTokens`, passport.authenticate('jwt-refresh', { session: false }), this.userService.updateTokens);
    this.router.post(`${this.apiPath}/auth/confirmPhone`, this.userService.confirmPhone);
  };

  public get = () => this.router;
}
