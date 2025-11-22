import { Container, Singleton } from 'typescript-ioc';
import _ from 'lodash';

import { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { BaseService } from '@server/services/app/base.service';
import { ImageService } from '@server/services/storage/image.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { CommentEntity } from '@server/db/entities/comment.entity';
import { GradeEntity } from '@server/db/entities/grade.entity';
import { routes } from '@/routes';
import { hasJoin } from '@server/utilities/has.join';
import type { GradeQueryInterface } from '@server/types/rating/grade.query.interface';
import type { GradeOptionsInterface } from '@server/types/rating/grade.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';

@Singleton
export class GradeService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly imageService = Container.get(ImageService);

  private readonly bullMQQueuesService = Container.get(BullMQQueuesService);

  private createQueryBuilder = (query?: GradeQueryInterface, options?: GradeOptionsInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemGradeEntity, 'grade');

    if (options?.onlyIds) {
      builder
        .select('grade.id')
        .orderBy('grade.id', 'DESC');

      if (!_.isNil(query?.limit) && !_.isNil(query?.offset)) {
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
          'item.translateName',
        ])
        .leftJoin('item.translations', 'translations')
        .addSelect([
          'translations.name',
          'translations.lang',
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
        .leftJoin('comment.images', 'images', 'images.deleted IS NULL')
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
    if (options?.itemNames?.length) {
      if (!hasJoin(builder, 'item')) {
        builder.leftJoin('grade.item', 'item');
      }
      if (!hasJoin(builder, 'translations')) {
        builder.leftJoin('item.translations', 'translations');
      }
      builder.andWhere('translations.name IN(:...names)', { names: options.itemNames });
    }
    if (options?.onlyChecked) {
      builder.andWhere('grade.checked = TRUE');
    }
    if (options?.onlyNotChecked) {
      builder.andWhere('grade.checked = FALSE');
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, options?: GradeOptionsInterface) => {
    const builder = this.createQueryBuilder(params, options);

    const grade = await builder.getOne();

    if (!grade) {
      throw new Error(lang === UserLangEnum.RU
        ? `Оценки с номером #${params.id} не существует.`
        : `There is no rating with number #${params.id}.`);
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

  public getMyGradesCount = async (query: FetchGradeInterface, userId: number) => {
    const builder = this.createQueryBuilder(query, { userId, withDeleted: true });

    return builder.getCount();
  };

  public createOne = async (body: Partial<GradeEntity>, user: PassportRequestInterface, comment?: CommentEntity) => {
    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const gradeRepo = manager.getRepository(GradeEntity);
      const commentRepo = manager.getRepository(CommentEntity);

      const grade = { ...body, user: { id: user.id } };

      if (comment?.text || comment?.images.length) {
        const { images, ...rest } = comment;
        const createdComment = await commentRepo.save(rest);
        if (images?.length) {
          this.uploadPathService.checkFolder(UploadPathEnum.COMMENT, createdComment.id);
          await this.imageService.processingImages(images, UploadPathEnum.COMMENT, createdComment.id, manager);
        }
        grade.comment = createdComment;
      }

      return gradeRepo.save(grade);
    });

    const messageRu = [
      `Вам оставлен новый отзыв с оценкой: <b>${body.grade}</b>`,
      '',
      `Подробнее: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.moderationOfReview}`,
    ];

    const messageEn = [
      `You have a new review with a rating of: <b>${body.grade}</b>`,
      '',
      `More details: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.page.admin.moderationOfReview}`,
    ];

    this.bullMQQueuesService.sendTelegramAdminMessage({ messageRu, messageEn });

    return this.findOne({ id: created.id }, user.lang);
  };

  public accept = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const grade = await this.findOne(params, lang);

    const gradeRepo = this.databaseService.getManager().getRepository(GradeEntity);

    await gradeRepo.save({ ...grade, checked: true });

    grade.checked = true;

    return grade;
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const grade = await this.findOne(params, lang);

    await GradeEntity.update(grade.id, { checked: false, deleted: new Date() });

    grade.deleted = new Date();
    grade.checked = false;

    return grade;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedGrade = await this.findOne(params, lang, { withDeleted: true });

    const gradeRepo = this.databaseService.getManager().getRepository(GradeEntity);

    await gradeRepo.recover(deletedGrade);

    return this.findOne(params, lang);
  };
}
