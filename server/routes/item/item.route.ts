import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ItemController } from '@server/controllers/item/item.controller';

@Singleton
export class ItemRoute extends BaseRouter {
  private readonly itemController = Container.get(ItemController);

  public set = (router: Router) => {
    router
      .patch(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.partialUpdateOne)
      .put(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.updateOne)
      .delete(this.routes.crudItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.deleteOne);
    router.get(this.routes.restoreItem(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.restoreOne);
    router.post(this.routes.createItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.createOne);
    router.get(this.routes.searchItem, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.search);
    router.get(this.routes.getItemLinks({ isServer: true }), this.itemController.getLinks);
    router.get(this.routes.getItemByName({ isServer: true }), this.middlewareService.optionalJwtAuth, this.itemController.getByName);
    router.get(this.routes.getItemList({ isServer: true }), this.itemController.getList);
    router.get(this.routes.getItemSpecials({ isServer: true }), this.middlewareService.optionalJwtAuth, this.itemController.getSpecials);
    router.get(this.routes.getGrades({ isServer: true }), this.itemController.getGrades);
    router.get(this.routes.getItemListExcel, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.getListExcel);
    router.post(this.routes.publishToTelegram(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.publishToTelegram);
  };
}
