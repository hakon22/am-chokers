import { Singleton } from 'typescript-ioc';
import moment from 'moment';

import { PromotionalEntity } from '@server/db/entities/promotional.entity';
import { BaseService } from '@server/services/app/base.service';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import type { PromotionalQueryInterface } from '@server/types/promotional/promotional.query.interface';
import type { PromotionalOptionsInterface } from '@server/types/promotional/promotional.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class PromotionalService extends BaseService {

  private createQueryBuilder = (query?: PromotionalQueryInterface, options?: PromotionalOptionsInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(PromotionalEntity, 'promotional')
      .select([
        'promotional.id',
        'promotional.name',
        'promotional.description',
        'promotional.discount',
        'promotional.discountPercent',
        'promotional.start',
        'promotional.end',
        'promotional.active',
        'promotional.deleted',
      ])
      .orderBy('promotional.active', 'DESC')
      .addOrderBy('promotional.end', 'DESC');

    if (options?.withOrders) {
      builder
        .leftJoin('promotional.orders', 'orders')
        .addSelect([
          'orders.id',
        ]);
    }

    if (options?.considerWithExpired && !query?.withExpired) {
      builder.andWhere('promotional.end >= current_date');
    }
    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.name) {
      builder.andWhere('promotional.name = :name', { name: query.name });
    }

    return builder;
  };

  public exist = async (query: PromotionalQueryInterface) => {
    const builder = this.createQueryBuilder(query).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: PromotionalEntity) => {
    const isExist = await this.exist({ name: body.name });

    if (isExist) {
      return { code: 2 };
    }

    const promotional = await PromotionalEntity.save(body);

    return { code: 1, promotional };
  };

  public findOne = async (params: ParamsIdInterface, query?: PromotionalQueryInterface, options?: PromotionalOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('promotional.id = :id', { id: params.id });

    const promotional = await builder.getOne();

    if (!promotional) {
      throw new Error(`Промокода с номером #${params.id} не существует.`);
    }

    return promotional;
  };

  public findByName = async (query: PromotionalQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const promotional = await builder.getOne();

    return promotional;
  };

  public deactivated = async (params: ParamsIdInterface, query?: PromotionalQueryInterface) => {
    const promotional = await this.findOne(params, query);

    await PromotionalEntity.update(promotional.id, { active: false });

    promotional.active = false;

    return promotional;
  };

  public activated = async (params: ParamsIdInterface, query?: PromotionalQueryInterface) => {
    const promotional = await this.findOne(params, query);

    if (!moment().isBetween(moment(promotional.start), moment(promotional.end), 'day', '[]')) {
      throw new Error(`Промокод с №${promotional.id} нельзя активировать. Текущая дата: ${moment().format(DateFormatEnum.DD_MM_YYYY)}, дата завершения промокода: ${moment(promotional.end).format(DateFormatEnum.DD_MM_YYYY)}`);
    }

    await PromotionalEntity.update(promotional.id, { active: true });

    promotional.active = true;

    return promotional;
  };

  public findMany = async (query?: PromotionalQueryInterface) => {
    const builder = this.createQueryBuilder(query, { withOrders: true, considerWithExpired: true });

    const promotionals = await builder.getMany();

    return promotionals;
  };

  public updateOne = async (params: ParamsIdInterface, body: PromotionalEntity) => {
    const promotional = await this.findOne(params);

    const newPromotional = { ...promotional, ...body } as PromotionalEntity;
      
    await PromotionalEntity.save(newPromotional);

    return newPromotional;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const promotional = await this.findOne(params, {}, { withOrders: true });

    if (promotional.orders.length) {
      throw new Error(`Нельзя удалить промокод ${promotional.name}. Имеются заказы в количестве: ${promotional.orders.length}`);
    }

    promotional.deleted = new Date();
    promotional.active = false;

    return promotional.save();
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedPromotional = await this.findOne(params, { withDeleted: true }, { withOrders: true });

    await deletedPromotional.recover();

    return this.findOne(params);
  };
}
