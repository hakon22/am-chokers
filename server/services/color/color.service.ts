import { Singleton } from 'typescript-ioc';

import { ColorEntity } from '@server/db/entities/color.entity';
import { BaseService } from '@server/services/app/base.service';
import type { ColorQueryInterface } from '@server/types/color/color.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class ColorService extends BaseService {

  private createQueryBuilder = (query?: ColorQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ColorEntity, 'color')
      .select([
        'color.id',
        'color.name',
        'color.hex',
        'color.deleted',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.name) {
      builder.andWhere('color.name = :name', { name: query.name });
    }
    if (query?.hex) {
      builder.andWhere('color.hex = :hex', { hex: query.hex });
    }

    return builder;
  };

  public exist = async (query: ColorQueryInterface) => {
    const builder = this.createQueryBuilder(query).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: ColorEntity) => {
    const isExist = await this.exist({ name: body.name });

    if (isExist) {
      return { code: 2 };
    }

    const color = await ColorEntity.save(body);

    return { code: 1, color };
  };

  public findOne = async (params: ParamsIdInterface, query?: ColorQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('color.id = :id', { id: params.id });

    const color = await builder.getOne();

    if (!color) {
      throw new Error(`Цвета с номером #${params.id} не существует.`);
    }

    return color;
  };

  public findMany = async (query?: ColorQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const colors = await builder.getMany();

    return colors;
  };

  public updateOne = async (params: ParamsIdInterface, body: ColorEntity) => {
    const color = await this.findOne(params);

    const newColor = { ...color, ...body } as ColorEntity;
      
    await ColorEntity.save(newColor);

    return color;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const color = await this.findOne(params);

    await color.softRemove();

    color.deleted = new Date();

    return color;
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedColor = await this.findOne(params, { withDeleted: true });

    return deletedColor.recover();
  };
}
