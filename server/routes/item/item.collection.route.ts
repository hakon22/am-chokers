import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ItemCollectionController } from '@server/controllers/item/item.collection.controller';

@Singleton
export class ItemCollectionRoute extends BaseRouter {
  private readonly itemCollectionController = Container.get(ItemCollectionController);

  public set = (router: Router) => {
    router
      .put(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.updateOne)
      .patch(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.restoreOne)
      .delete(this.routes.crudItemCollection(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.deleteOne);
    router.get(this.routes.getItemCollections({ isServer: true }), this.itemCollectionController.findMany);
    router.post(this.routes.createItemCollection, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemCollectionController.createOne);
  };
}
