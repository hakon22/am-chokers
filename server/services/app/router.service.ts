import { Singleton, Container } from 'typescript-ioc';
import express from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { UserRoute } from '@server/routes/user/user.route';
import { CartRoute } from '@server/routes/cart/cart.route';
import { CommentRoute } from '@server/routes/comment/comment.route';
import { IntegrationRoute } from '@server/routes/integration/integration.route';
import { ItemRoute } from '@server/routes/item/item.route';
import { ItemGroupRoute } from '@server/routes/item/item.group.route';
import { ItemCollectionRoute } from '@server/routes/item/item.collection.route';
import { OrderRoute } from '@server/routes/order/order.route';
import { PromotionalRoute } from '@server/routes/promotional/promotional.controller';
import { GradeRoute } from '@server/routes/rating/grade.controller';
import { StorageRoute } from '@server/routes/storage/storage.route';
import { CompositionRoute } from '@server/routes/composition/composition.route';
import { DeliveryRoute } from '@server/routes/delivery/delivery.route';

@Singleton
export class RouterService extends BaseRouter {
  private readonly userRoute = Container.get(UserRoute);
  private readonly cartRoute = Container.get(CartRoute);
  private readonly commentRoute = Container.get(CommentRoute);
  private readonly integrationRoute = Container.get(IntegrationRoute);
  private readonly itemRoute = Container.get(ItemRoute);
  private readonly itemGroupRoute = Container.get(ItemGroupRoute);
  private readonly itemCollectionRoute = Container.get(ItemCollectionRoute);
  private readonly orderRoute = Container.get(OrderRoute);
  private readonly promotionalRoute = Container.get(PromotionalRoute);
  private readonly gradeRoute = Container.get(GradeRoute);
  private readonly storageRoute = Container.get(StorageRoute);
  private readonly compositionRoute = Container.get(CompositionRoute);
  private readonly deliveryRoute = Container.get(DeliveryRoute);

  private router = express.Router();

  private routesArray = [
    this.userRoute,
    this.cartRoute,
    this.commentRoute,
    this.integrationRoute,
    this.itemRoute,
    this.itemGroupRoute,
    this.itemCollectionRoute,
    this.orderRoute,
    this.promotionalRoute,
    this.gradeRoute,
    this.storageRoute,
    this.compositionRoute,
    this.deliveryRoute,
  ];

  public set = () => this.routesArray.forEach((route) => route.set(this.router));

  public get = () => this.router;
}
