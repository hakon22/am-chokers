import { Container, Singleton } from 'typescript-ioc';

import { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { BaseService } from '@server/services/app/base.service';
import { ImageService } from '@server/services/storage/image.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { CommentEntity } from '@server/db/entities/comment.entity';
import { GradeEntity } from '@server/db/entities/grade.entity';
import type { GradeQueryInterface } from '@server/types/rating/grade.query.interface';
import type { GradeOptionsInterface } from '@server/types/rating/grade.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';

@Singleton
export class GradeService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly imageService = Container.get(ImageService);

  private createQueryBuilder = (query?: GradeQueryInterface, options?: GradeOptionsInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemGradeEntity, 'grade');

    if (options?.onlyIds) {
      builder
        .select('grade.id')
        .orderBy('grade.id', 'DESC');

      if (query?.limit || query?.offset) {
        builder
          .limit(query.limit)
          .offset(query.offset);
      }
    } else {
      builder
        .select([
          'grade.id',
          'grade.created',
          'grade.updated',
          'grade.deleted',
          'grade.grade',
          'grade.checked',
        ])
        .leftJoin('grade.item', 'item')
        .addSelect([
          'item.id',
          'item.name',
          'item.translateName',
        ])
        .leftJoin('item.group', 'group')
        .addSelect([
          'group.id',
          'group.code',
        ])
        .leftJoin('item.images', 'itemImages')
        .addSelect([
          'itemImages.id',
          'itemImages.name',
          'itemImages.path',
        ])
        .leftJoin('grade.comment', 'comment')
        .addSelect([
          'comment.id',
          'comment.created',
          'comment.updated',
          'comment.deleted',
          'comment.text',
        ])
        .leftJoin('grade.user', 'user')
        .addSelect([
          'user.id',
          'user.name',
        ])
        .leftJoin('grade.position', 'position')
        .addSelect('position.id')
        .leftJoin('position.order', 'order')
        .addSelect('order.id')
        .leftJoin('comment.images', 'images')
        .addSelect([
          'images.id',
          'images.name',
          'images.path',
        ])
        .leftJoin('comment.replies', 'replies')
        .addSelect([
          'replies.id',
          'replies.created',
          'replies.text',
        ])
        .leftJoin('replies.user', 'commentReplyUser')
        .addSelect([
          'commentReplyUser.id',
          'commentReplyUser.name',
        ])
        .leftJoin('replies.images', 'commentReplyImages')
        .addSelect([
          'commentReplyImages.id',
          'commentReplyImages.name',
          'commentReplyImages.path',
        ])
        .orderBy('grade.id', 'DESC')
        .addOrderBy('replies.id', 'ASC');
    }

    if (query?.id) {
      builder.andWhere('grade.id = :id', { id: query.id });
    }
    if (options?.withDeleted) {
      builder.withDeleted();
    }
    if (options?.itemId) {
      builder.andWhere('grade.item_id = :itemId', { itemId: options.itemId });
    }
    if (options?.ids?.length) {
      builder.andWhere('grade.id IN(:...ids)', { ids: options.ids });
    }
    if (options?.itemId) {
      builder.andWhere('grade.item_id = :itemId', { itemId: options.itemId });
    }
    if (options?.userId) {
      builder.andWhere('grade.user_id = :userId', { userId: options.userId });
    }
    if (options?.itemName) {
      builder
        .leftJoin('grade.item', 'item')
        .andWhere('item.name = :itemName', { itemName: options.itemName });
    }
    if (options?.onlyChecked) {
      builder.andWhere('grade.checked = TRUE');
    }
    if (options?.onlyNotChecked) {
      builder.andWhere('grade.checked = FALSE');
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, options?: GradeOptionsInterface) => {
    const builder = this.createQueryBuilder(params, options);

    const grade = await builder.getOne();

    if (!grade) {
      throw new Error(`Оценки с номером #${params.id} не существует.`);
    }

    return grade;
  };

  public findManyByItem = async (params: ParamsIdInterface, query?: PaginationQueryInterface): Promise<[ItemGradeEntity[], number]> => {
    const idsBuilder = this.createQueryBuilder(query, { itemId: params.id, onlyIds: true, onlyChecked: true });

    const [ids, count] = await idsBuilder.getManyAndCount();

    let grades: ItemGradeEntity[] = [];

    if (ids.length) {
      const builder = this.createQueryBuilder({}, { ids: ids.map(({ id }) => id) });

      grades = await builder.getMany();
    }

    return [grades, count];
  };

  public getUnchekedGrades = async (query: FetchGradeInterface): Promise<[ItemGradeEntity[], number]> => {
    const idsBuilder = this.createQueryBuilder(query, { ...query, ...(query?.showAccepted ? {} : { onlyNotChecked: true }), onlyIds: true });

    const [ids, count] = await idsBuilder.getManyAndCount();

    let grades: ItemGradeEntity[] = [];

    if (ids.length) {
      const builder = this.createQueryBuilder({}, { ...(query?.withDeleted ? { withDeleted: true } : {}), ids: ids.map(({ id }) => id) });

      grades = await builder.getMany();
    }

    return [grades, count];
  };

  public getMyGrades = async (query: FetchGradeInterface, userId: number): Promise<[ItemGradeEntity[], number]> => {
    const idsBuilder = this.createQueryBuilder(query, { userId, withDeleted: true, onlyIds: true });

    const [ids, count] = await idsBuilder.getManyAndCount();

    let grades: ItemGradeEntity[] = [];

    if (ids.length) {
      const builder = this.createQueryBuilder({}, { withDeleted: true, ids: ids.map(({ id }) => id) });

      grades = await builder.getMany();
    }

    return [grades, count];
  };

  public createOne = async (body: Partial<GradeEntity>, userId: number, comment?: CommentEntity) => {
    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const gradeRepo = manager.getRepository(GradeEntity);
      const commentRepo = manager.getRepository(CommentEntity);

      if (comment?.text || comment?.images.length) {
        const { images, ...rest } = comment;
        const createdComment = await commentRepo.save(rest);
        if (images?.length) {
          this.uploadPathService.checkFolder(UploadPathEnum.COMMENT, createdComment.id);
          await this.imageService.processingImages(images, UploadPathEnum.COMMENT, createdComment.id, manager);
        }
        return gradeRepo.save({ ...body, comment: createdComment, user: { id: userId } });
      }

      return gradeRepo.save({ ...body, user: { id: userId } });
    });

    return this.findOne({ id: created.id });
  };

  public accept = async (params: ParamsIdInterface) => {
    const grade = await this.findOne(params);

    const gradeRepo = this.databaseService.getManager().getRepository(GradeEntity);

    await gradeRepo.save({ ...grade, checked: true });

    grade.checked = true;

    return grade;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const grade = await this.findOne(params);

    const gradeRepo = this.databaseService.getManager().getRepository(GradeEntity);

    await gradeRepo.softDelete(grade.id);

    grade.deleted = new Date();

    return grade;
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedGrade = await this.findOne(params, { withDeleted: true });

    const gradeRepo = this.databaseService.getManager().getRepository(GradeEntity);

    await gradeRepo.recover(deletedGrade);

    return this.findOne(params);
  };
}
