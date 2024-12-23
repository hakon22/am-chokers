import { Container, Singleton } from 'typescript-ioc';

import { CommentEntity } from '@server/db/entities/comment.entity';
import type { CommentQueryInterface } from '@server/types/comment/comment.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { BaseService } from '@server/services/app/base.service';
import { ImageService } from '@server/services/storage/image.service';
import { GradeService } from '@server/services/rating/grade.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { ImageEntity } from '@server/db/entities/image.entity';

@Singleton
export class CommentService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly imageService = Container.get(ImageService);

  private readonly gradeService = Container.get(GradeService);

  private createQueryBuilder = (query?: CommentQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(CommentEntity, 'comment')
      .select([
        'comment.id',
        'comment.created',
        'comment.updated',
        'comment.deleted',
        'comment.text',
      ])
      .leftJoin('comment.reply', 'reply')
      .addSelect([
        'reply.id',
        'reply.created',
        'reply.updated',
        'reply.deleted',
        'reply.text',
      ])
      .leftJoin('comment.user', 'user')
      .addSelect([
        'user.id',
        'user.name',
      ])
      .leftJoin('comment.images', 'images')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, query?: CommentQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('comment.id = :id', { id: params.id });

    const comment = await builder.getOne();

    if (!comment) {
      throw new Error(`Комментария с номером #${params.id} не существует.`);
    }

    return comment;
  };

  public findMany = async (query?: CommentQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const comments = await builder.getMany();

    return comments;
  };

  public createOne = async (body: Partial<CommentEntity>, images: ImageEntity[], userId: number) => {
    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const commentRepo = manager.getRepository(CommentEntity);

      this.uploadPathService.checkFolder(UploadPathEnum.COMMENT, created.id);

      await this.imageService.processingImages(images, UploadPathEnum.COMMENT, created.id, manager);

      return commentRepo.save({ ...body, user: { id: userId } });
    });

    return this.findOne({ id: created.id });
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const comment = await this.findOne(params);

    return comment.softRemove();
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedComment = await this.findOne(params, { withDeleted: true });

    const comment = await deletedComment.recover();

    return comment;
  };
}
