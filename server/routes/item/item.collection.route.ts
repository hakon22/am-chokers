import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ItemCollectionController } from '@server/controllers/item/item.collection.controller';

@Singleton
export class ItemCollectionRoute extends BaseRouter {
  private readonly itemCollectionController = Container.get(ItemCollectionController);

  public set = (router: Router) => {
    router
      .put(this.routes.itemCollection.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.updateOne)
      .patch(this.routes.itemCollection.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.restoreOne)
      .delete(this.routes.itemCollection.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.deleteOne);
    router.get(this.routes.itemCollection.findMany({ isServer: true }), this.itemCollectionController.findMany);
    router.post(this.routes.itemCollection.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.createOne);
  };
}
