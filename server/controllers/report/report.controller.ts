import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { queryPaginationSchema, queryMessageReportParams } from '@server/utilities/convertation.params';
import { BaseService } from '@server/services/app/base.service';
import { CartService } from '@server/services/cart/cart.service';
import { MessageService } from '@server/services/message/message.service';

@Singleton
export class ReportController extends BaseService {
  private readonly cartService = Container.get(CartService);

  private readonly messageService = Container.get(MessageService);

  public cartReport = async (req: Request, res: Response) => {
    try {
      const query = await queryPaginationSchema.validate(req.query);

      const [items, count] = await this.cartService.cartReport(query);

      const paginationParams = {
        count,
        limit: query.limit,
        offset: query.offset,
      };

      res.json({ code: 1, items, paginationParams });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public messageReport = async (req: Request, res: Response) => {
    try {
      const query = await queryMessageReportParams.validate(req.query);

      const [items, count] = await this.messageService.messageReport(query);

      const paginationParams = {
        count,
        limit: query.limit,
        offset: query.offset,
      };

      res.json({ code: 1, items, paginationParams });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
