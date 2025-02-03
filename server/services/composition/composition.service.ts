import { Singleton } from 'typescript-ioc';

import { CompositionEntity } from '@server/db/entities/composition.entity';
import { BaseService } from '@server/services/app/base.service';
import type { CompositionQueryInterface } from '@server/types/composition/composition.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class CompositionService extends BaseService {

  private createQueryBuilder = (query?: CompositionQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(CompositionEntity, 'composition')
      .select([
        'composition.id',
        'composition.name',
        'composition.deleted',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.name) {
      builder.andWhere('composition.name = :name', { name: query.name });
    }

    return builder;
  };

  public exist = async (query: CompositionQueryInterface) => {
    const builder = this.createQueryBuilder(query).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: CompositionEntity) => {
    const isExist = await this.exist({ name: body.name });

    if (isExist) {
      return { code: 2 };
    }

    const composition = await CompositionEntity.save(body);

    return { code: 1, composition };
  };

  public findOne = async (params: ParamsIdInterface, query?: CompositionQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('composition.id = :id', { id: params.id });

    const composition = await builder.getOne();

    if (!composition) {
      throw new Error(`Компонента с номером #${params.id} не существует.`);
    }

    return composition;
  };

  public findMany = async (query?: CompositionQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const compositions = await builder.getMany();

    return compositions;
  };

  public updateOne = async (params: ParamsIdInterface, body: CompositionEntity) => {
    const composition = await this.findOne(params);

    const newComposition = { ...composition, ...body } as CompositionEntity;
      
    await CompositionEntity.save(newComposition);

    return composition;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const composition = await this.findOne(params);

    await composition.softRemove();

    composition.deleted = new Date();

    return composition;
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedComposition = await this.findOne(params, { withDeleted: true });

    return deletedComposition.recover();
  };
}
