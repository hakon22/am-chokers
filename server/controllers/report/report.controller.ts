import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { CartService } from '@server/services/cart/cart.service';
import { MessageService } from '@server/services/message/message.service';
import { MetricaReportService } from '@server/services/reports/metrica.report.service';
import { queryPaginationWithParams, queryMessageReportParams, queryDatePeriodParams } from '@server/utilities/convertation.params';

@Singleton
export class ReportController extends BaseService {
  private readonly cartService = Container.get(CartService);

  private readonly messageService = Container.get(MessageService);

  private readonly metricaReportService = Container.get(MetricaReportService);

  public cartReport = async (req: Request, res: Response) => {
    try {
      const query = await queryPaginationWithParams.validate(req.query);

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

      const [items, count] = await this.messageService.messageReport(query, { ...query });

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

  public metricaReport = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const query = await queryDatePeriodParams.validate(req.query);

      const result = await this.metricaReportService.metricaReport(user.lang, query);

      res.json({ code: 1, result });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
