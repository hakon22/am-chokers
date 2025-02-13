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
import { CommentController } from '@server/controllers/comment/comment.controller';
import { GradeController } from '@server/controllers/rating/grade.controller';
import { PromotionalController } from '@server/controllers/promotional/promotional.controller';
import { CompositionController } from '@server/controllers/composition/composition.controller';
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

  private readonly commentController = Container.get(CommentController);

  private readonly gradeController = Container.get(GradeController);

  private readonly promotionalController = Container.get(PromotionalController);

  private readonly compositionController = Container.get(CompositionController);

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
    this.router.get(this.routes.getMyGrades, this.middlewareService.jwtToken, this.userService.getMyGrades);

    // integration
    this.router.post(this.routes.telegram, this.middlewareService.accessTelegram, this.telegramService.webhooks);

    // order
    this.router.get(this.routes.getOrders, this.middlewareService.jwtToken, this.orderController.findMany);
    this.router.get(this.routes.cancelOrder(), this.middlewareService.jwtToken, this.orderController.cancel);
    this.router.patch(this.routes.crudOrder(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.updateStatus);
    this.router.get(this.routes.getAllOrders, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.getAllOrders);
    this.router.get(this.routes.crudOrder(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.findOne);
    this.router.post(this.routes.createOrder, this.middlewareService.optionalJwtAuth, this.orderController.createOne);

    // itemGroup
    this.router.get(this.routes.getItemGroups({ isServer: true }), this.itemGroupController.findMany);
    this.router.post(this.routes.createItemGroup, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.createOne);
    this.router.put(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.updateOne);
    this.router.delete(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.deleteOne);
    this.router.patch(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.restoreOne);

    // itemCollection
    this.router.get(this.routes.getItemCollections({ isServer: true }), this.itemCollectionController.findMany);
    this.router.post(this.routes.createItemCollection, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.createOne);
    this.router.put(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.updateOne);
    this.router.delete(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.deleteOne);
    this.router.patch(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.restoreOne);

    // storage
    this.router.post(this.routes.imageUpload({ isServer: true }), this.middlewareService.jwtToken, this.imageService.upload(), this.imageService.uploadHandler);
    this.router.delete(this.routes.imageDelete(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.deleteOne);
    this.router.post(this.routes.setCoverImage, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.setCoverImage);
    this.router.delete(this.routes.removeCoverImage(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.removeCoverImage);
    this.router.get(this.routes.getCoverImages({ isServer: true }), this.imageService.getCoverImages);

    // item
    this.router.get(this.routes.restoreItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.restoreOne);
    this.router.post(this.routes.createItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.createOne);
    this.router.put(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.updateOne);
    this.router.get(this.routes.searchItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.search);
    this.router.delete(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.deleteOne);
    this.router.patch(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.partialUpdateOne);
    this.router.get(this.routes.getItems({ isServer: true }), this.itemController.findMany);
    this.router.get(this.routes.getItemList, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.getList);
    this.router.get(this.routes.addFavorites(), this.middlewareService.jwtToken, this.userService.addFavorites);
    this.router.delete(this.routes.removeFavorites(), this.middlewareService.jwtToken, this.userService.removeFavorites);
    this.router.get(this.routes.getGrades({ isServer: true }), this.itemController.getGrades);
    this.router.get(this.routes.publishToTelegram(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.publishToTelegram);

    // cart
    this.router.post(this.routes.createCartItem, this.middlewareService.optionalJwtAuth, this.cartController.createOne);
    this.router.get(this.routes.incrementCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.incrementOne);
    this.router.get(this.routes.decrementCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.decrementOne);
    this.router.delete(this.routes.removeCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.deleteOne);
    this.router.post(this.routes.removeManyCartItems, this.middlewareService.optionalJwtAuth, this.cartController.deleteMany);
    this.router.post(this.routes.getCart, this.middlewareService.jwtToken, this.cartController.findMany);

    // comment
    this.router.post(this.routes.createComment, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.commentController.createOne);
    this.router.delete(this.routes.removeComment(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.commentController.deleteOne);

    // grade
    this.router.post(this.routes.createGrade(), this.middlewareService.jwtToken, this.gradeController.createOne);
    this.router.delete(this.routes.removeGrade(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.deleteOne);
    this.router.get(this.routes.restoreGrade(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.restoreOne);
    this.router.get(this.routes.acceptGrade(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.accept);
    this.router.get(this.routes.getUnchekedGrades, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.getUnchekedGrades);
  
    // promotional
    this.router.get(this.routes.getPromotionalByName, this.promotionalController.findByName);
    this.router.get(this.routes.getPromotionals, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.findMany);
    this.router.get(this.routes.getPromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.findOne);
    this.router.post(this.routes.createPromotional, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.createOne);
    this.router.put(this.routes.updatePromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.updateOne);
    this.router.delete(this.routes.removePromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.deleteOne);
    this.router.patch(this.routes.restorePromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.restoreOne);

    // composition
    this.router.get(this.routes.getCompositions, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.findMany);
    this.router.get(this.routes.getComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.findOne);
    this.router.post(this.routes.createComposition, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.createOne);
    this.router.put(this.routes.updateComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.updateOne);
    this.router.delete(this.routes.removeComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.deleteOne);
    this.router.patch(this.routes.restoreComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.restoreOne);
  };

  public get = () => this.router;
}
