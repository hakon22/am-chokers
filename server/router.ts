import express, { type Router as ExpressRouter } from 'express';
import passport from 'passport';
import { Singleton } from 'typescript-ioc';

import { UserService } from '@server/services/user/user.service';

@Singleton
export class Router {
  private readonly userService: UserService;

  private router: ExpressRouter;

  private apiPath: string;

  private jwtToken: any;

  constructor() {
    this.router = express.Router();
    this.apiPath = process.env.NEXT_PUBLIC_API_PATH ?? '/api';
    this.jwtToken = passport.authenticate('jwt', { session: false });
    this.userService = new UserService();
  }

  public set = () => {
    this.router.post(`${this.apiPath}/auth/login`, this.userService.login);
    this.router.post(`${this.apiPath}/auth/signup`, this.userService.signup);
    this.router.post(`${this.apiPath}/auth/recoveryPassword`, this.userService.recoveryPassword);
    this.router.post(`${this.apiPath}/auth/logout`, this.userService.logout);
    this.router.get(`${this.apiPath}/auth/updateTokens`, passport.authenticate('jwt-refresh', { session: false }), this.userService.updateTokens);
  };

  public get = () => this.router;
}
