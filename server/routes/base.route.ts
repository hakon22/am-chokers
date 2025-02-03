import { Container, Singleton } from 'typescript-ioc';

import { MiddlewareService } from '@server/services/app/middleware.service';
import { routes } from '@/routes';

@Singleton
export abstract class BaseRouter {
  protected middlewareService = Container.get(MiddlewareService);
  
  protected routes = routes;
}
