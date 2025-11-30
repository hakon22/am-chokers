import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ItemController } from '@server/controllers/item/item.controller';

@Singleton
export class ItemRoute extends BaseRouter {
  private readonly itemController = Container.get(ItemController);

  public set = (router: Router) => {
    router
      .patch(this.routes.item.partialUpdateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.partialUpdateOne)
      .put(this.routes.item.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.updateOne)
      .delete(this.routes.item.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.deleteOne);
    router.get(this.routes.item.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.restoreOne);
    router.post(this.routes.item.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.createOne);
    router.get(this.routes.item.search, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.search);
    router.get(this.routes.item.getLinks({ isServer: true }), this.itemController.getLinks);
    router.get(this.routes.item.getByName({ isServer: true }), this.middlewareService.optionalJwtAuth, this.itemController.getByName);
    router.get(this.routes.item.getList({ isServer: true }), this.itemController.getList);
    router.get(this.routes.item.getSpecials({ isServer: true }), this.middlewareService.optionalJwtAuth, this.itemController.getSpecials);
    router.get(this.routes.item.getGrades({ isServer: true }), this.itemController.getGrades);
    router.get(this.routes.item.getStatistics({ isServer: true }), this.itemController.getStatistics);
    router.get(this.routes.item.getListExcel, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.getListExcel);
    router.post(this.routes.item.publishToTelegram(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.publishToTelegram);
    router.get(this.routes.item.getCacheInfo, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.getCacheInfo);
    router.post(this.routes.item.synchronizationCache, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemController.synchronizationCache);
  };
}
