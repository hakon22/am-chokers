import { Container, Singleton } from 'typescript-ioc';

import { GradeEntity } from '@server/db/entities/grade.entity';
import type { GradeQueryInterface } from '@server/types/rating/grade.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { BaseService } from '@server/services/app/base.service';
import { ImageService } from '@server/services/storage/image.service';
import { CommentService } from '@server/services/comment/comment.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { CommentEntity } from '@server/db/entities/comment.entity';

@Singleton
export class GradeService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly imageService = Container.get(ImageService);

  private readonly commentService = Container.get(CommentService);

  private createQueryBuilder = (query?: GradeQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(GradeEntity, 'grade')
      .select([
        'grade.id',
        'grade.created',
        'grade.updated',
        'grade.deleted',
        'grade.grade',
      ])
      .leftJoin('grade.comment', 'comment')
      .addSelect([
        'comment.id',
        'comment.created',
        'comment.updated',
        'comment.deleted',
        'comment.text',
      ])
      .leftJoin('comment.images', 'images')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
      ])
      .leftJoin('grade.user', 'user')
      .addSelect([
        'user.id',
        'user.name',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, query?: GradeQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('grade.id = :id', { id: params.id });

    const grade = await builder.getOne();

    if (!grade) {
      throw new Error(`Оценки с номером #${params.id} не существует.`);
    }

    return grade;
  };

  public findMany = async (query?: GradeQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const grades = await builder.getMany();

    return grades;
  };

  public createOne = async (body: Partial<GradeEntity>, userId: number, comment?: CommentEntity) => {
    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const gradeRepo = manager.getRepository(GradeEntity);
      const commentRepo = manager.getRepository(CommentEntity);

      if (comment) {
        const { images, ...rest } = comment;
        const createdComment = await commentRepo.save(rest);
        if (images?.length) {
          this.uploadPathService.checkFolder(UploadPathEnum.COMMENT, createdComment.id);
          await this.imageService.processingImages(images, UploadPathEnum.COMMENT, createdComment.id, manager);
        }
      }

      return gradeRepo.save({ ...body, user: { id: userId } });
    });

    return this.findOne({ id: created.id });
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const grade = await this.findOne(params);

    return this.databaseService.getManager().transaction(async () => {
      if (grade.comment) {
        await this.commentService.deleteOne({ id: grade.comment.id });
      }
      return grade.softRemove();
    });
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedGrade = await this.findOne(params, { withDeleted: true });

    const grade = await deletedGrade.recover();

    return grade;
  };
}
