import express from 'express';
import passport from 'passport';
import { Singleton, Container } from 'typescript-ioc';

import { UserService } from '@server/services/user/user.service';
import { OrderService } from '@server/services/order/order.service';
import { MiddlewareService } from '@server/services/app/middleware.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { ItemGroupService } from '@server/services/item/item.group.service';
import { ItemService } from '@server/services/item/item.service';
import { ImageService } from '@server/services/storage/image.service';
import { routes } from '@/routes';

@Singleton
export class RouterService {
  private readonly userService = Container.get(UserService);

  private readonly orderService = Container.get(OrderService);

  private readonly itemService = Container.get(ItemService);

  private readonly imageService = Container.get(ImageService);

  private readonly itemGroupService = Container.get(ItemGroupService);

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
    // order
    this.router.get(this.routes.getOrders, this.jwtToken, this.orderService.findMany);
    // itemGroup
    this.router.get(this.routes.itemGroups({ isServer: true }), this.itemGroupService.findMany);
    this.router.post(this.routes.createItemGroup, this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupService.createOne);
    this.router.put(this.routes.crudItemGroup(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupService.updateOne);
    this.router.delete(this.routes.crudItemGroup(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupService.deleteOne);
    this.router.patch(this.routes.crudItemGroup(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupService.restoreOne);
    // storage
    this.router.post(this.routes.imageUpload({ isServer: true }), this.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.upload(), this.imageService.uploadHandler);
    // item
    this.router.post(this.routes.createItem, this.jwtToken, this.middlewareService.checkAdminAccess, this.itemService.createOne);
    this.router.put(this.routes.crudItem(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemService.updateOne);
    this.router.delete(this.routes.crudItem(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemService.deleteOne);
    this.router.patch(this.routes.crudItem(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemService.restoreOne);
    this.router.get(this.routes.items({ isServer: true }), this.itemService.findMany);
  };

  public get = () => this.router;
}
