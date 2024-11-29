import express from 'express';
import passport from 'passport';
import { Singleton, Container } from 'typescript-ioc';

import { UserService } from '@server/services/user/user.service';
import { OrderController } from '@server/controllers/order/order.controller';
import { MiddlewareService } from '@server/services/app/middleware.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { ItemGroupController } from '@server/controllers/item/item.group.controller';
import { ItemCollectionController } from '@server/controllers/item/item.collection.controller';
import { ItemController } from '@server/controllers/item/item.controller';
import { ImageService } from '@server/services/storage/image.service';
import { CartController } from '@server/controllers/cart/cart.controller';
import { routes } from '@/routes';

@Singleton
export class RouterService {
  private readonly userService = Container.get(UserService);

  private readonly orderController = Container.get(OrderController);

  private readonly itemController = Container.get(ItemController);

  private readonly imageService = Container.get(ImageService);

  private readonly itemGroupController = Container.get(ItemGroupController);

  private readonly itemCollectionController = Container.get(ItemCollectionController);

  private readonly cartController = Container.get(CartController);

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
    this.router.get(this.routes.getOrders, this.jwtToken, this.orderController.findMany);

    // itemGroup
    this.router.get(this.routes.itemGroups({ isServer: true }), this.itemGroupController.findMany);
    this.router.post(this.routes.createItemGroup, this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.createOne);
    this.router.put(this.routes.crudItemGroup(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.updateOne);
    this.router.delete(this.routes.crudItemGroup(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.deleteOne);
    this.router.patch(this.routes.crudItemGroup(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.restoreOne);

    // itemCollection
    this.router.get(this.routes.itemCollections({ isServer: true }), this.itemCollectionController.findMany);
    this.router.post(this.routes.createItemCollection, this.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.createOne);
    this.router.put(this.routes.crudItemCollection(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.updateOne);
    this.router.delete(this.routes.crudItemCollection(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.deleteOne);
    this.router.patch(this.routes.crudItemCollection(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.restoreOne);

    // storage
    this.router.post(this.routes.imageUpload({ isServer: true }), this.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.upload(), this.imageService.uploadHandler);

    // item
    this.router.post(this.routes.createItem, this.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.createOne);
    this.router.put(this.routes.crudItem(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.updateOne);
    this.router.delete(this.routes.crudItem(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.deleteOne);
    this.router.patch(this.routes.crudItem(), this.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.restoreOne);
    this.router.get(this.routes.items({ isServer: true }), this.itemController.findMany);

    // cart
    this.router.post(this.routes.createCartItem, this.jwtToken, this.cartController.createOne);
    this.router.put(this.routes.crudCart(), this.jwtToken, this.cartController.updateOne);
    this.router.delete(this.routes.crudCart(), this.jwtToken, this.cartController.deleteOne);
    this.router.delete(this.routes.removeManyCartItems, this.jwtToken, this.cartController.deleteMany);
    this.router.get(this.routes.getCart, this.jwtToken, this.cartController.findMany);
  };

  public get = () => this.router;
}
