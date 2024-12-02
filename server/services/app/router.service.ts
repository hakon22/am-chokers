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

  public set = () => {
    // user
    this.router.post(this.routes.login, this.userService.login);
    this.router.post(this.routes.signup, this.userService.signup);
    this.router.post(this.routes.recoveryPassword, this.userService.recoveryPassword);
    this.router.post(this.routes.logout, this.middlewareService.jwtToken, this.userService.logout);
    this.router.get(this.routes.updateTokens, passport.authenticate('jwt-refresh', { session: false }), this.userService.updateTokens);
    this.router.post(this.routes.confirmPhone, this.userService.confirmPhone);
    this.router.post(this.routes.changeUserProfile, this.middlewareService.jwtToken, this.userService.changeUserProfile);
    this.router.get(this.routes.unlinkTelegram, this.middlewareService.jwtToken, this.userService.unlinkTelegram);

    // integration
    this.router.post(this.routes.telegram, this.middlewareService.accessTelegram, this.telegramService.webhooks);

    // order
    this.router.get(this.routes.getOrders, this.middlewareService.jwtToken, this.orderController.findMany);
    this.router.post(this.routes.createOrder, this.middlewareService.optionalJwtAuth, this.orderController.createOne);

    // itemGroup
    this.router.get(this.routes.itemGroups({ isServer: true }), this.itemGroupController.findMany);
    this.router.post(this.routes.createItemGroup, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.createOne);
    this.router.put(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.updateOne);
    this.router.delete(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.deleteOne);
    this.router.patch(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.restoreOne);

    // itemCollection
    this.router.get(this.routes.itemCollections({ isServer: true }), this.itemCollectionController.findMany);
    this.router.post(this.routes.createItemCollection, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.createOne);
    this.router.put(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.updateOne);
    this.router.delete(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.deleteOne);
    this.router.patch(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.restoreOne);

    // storage
    this.router.post(this.routes.imageUpload({ isServer: true }), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.upload(), this.imageService.uploadHandler);

    // item
    this.router.post(this.routes.createItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.createOne);
    this.router.put(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.updateOne);
    this.router.delete(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.deleteOne);
    this.router.patch(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.restoreOne);
    this.router.get(this.routes.items({ isServer: true }), this.itemController.findMany);

    // cart
    this.router.post(this.routes.createCartItem, this.middlewareService.optionalJwtAuth, this.cartController.createOne);
    this.router.get(this.routes.incrementCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.incrementOne);
    this.router.get(this.routes.decrementCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.decrementOne);
    this.router.delete(this.routes.removeCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.deleteOne);
    this.router.delete(this.routes.removeManyCartItems, this.middlewareService.optionalJwtAuth, this.cartController.deleteMany);
    this.router.post(this.routes.getCart, this.middlewareService.jwtToken, this.cartController.findMany);
  };

  public get = () => this.router;
}
