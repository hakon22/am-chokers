import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ItemGroupController } from '@server/controllers/item/item.group.controller';

@Singleton
export class ItemGroupRoute extends BaseRouter {
  private readonly itemGroupController = Container.get(ItemGroupController);

  public set = (router: Router) => {
    router
      .put(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.updateOne)
      .patch(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.restoreOne)
      .delete(this.routes.crudItemGroup(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.deleteOne);
    router.get(this.routes.getItemGroups({ isServer: true }), this.itemGroupController.findMany);
    router.get(this.routes.getItemGroupByCode({ isServer: true }), this.middlewareService.optionalJwtAuth, this.itemGroupController.getByCode);
    router.post(this.routes.createItemGroup, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.itemGroupController.createOne);
  };
}
