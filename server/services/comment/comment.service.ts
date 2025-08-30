import { Container, Singleton } from 'typescript-ioc';

import { CommentEntity } from '@server/db/entities/comment.entity';
import { BaseService } from '@server/services/app/base.service';
import { ImageService } from '@server/services/storage/image.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { ImageEntity } from '@server/db/entities/image.entity';
import type { CommentQueryInterface } from '@server/types/comment/comment.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { PassportRequestInterface } from '@server/types/user/user.request.interface';

@Singleton
export class CommentService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly imageService = Container.get(ImageService);

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
      .leftJoin('comment.replies', 'replies')
      .addSelect([
        'replies.id',
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
      .leftJoin('comment.parentComment', 'parentComment')
      .addSelect([
        'parentComment.id',
        'parentComment.text',
      ])
      .leftJoin('parentComment.grade', 'grade')
      .addSelect([
        'grade.id',
      ])
      .leftJoin('grade.position', 'position')
      .addSelect('position.id')
      .leftJoin('position.item', 'item')
      .addSelect('item.id')
      .leftJoin('parentComment.user', 'parentCommentUser')
      .addSelect([
        'parentCommentUser.id',
        'parentCommentUser.name',
      ])
      .leftJoin('comment.user', 'user')
      .addSelect([
        'user.id',
        'user.name',
      ])
      .leftJoin('comment.images', 'images', 'images.deleted IS NULL')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
      ])
      .orderBy('comment.id', 'DESC');

    if (query?.withDeleted) {
      builder.withDeleted();
    }

    return builder;
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: CommentQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('comment.id = :id', { id: params.id });

    const comment = await builder.getOne();

    if (!comment) {
      throw new Error(lang === UserLangEnum.RU
        ? `Комментария с номером #${params.id} не существует.`
        : `Comment with number #${params.id} does not exist.`);
    }

    return comment;
  };

  public findMany = async (query?: CommentQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const comments = await builder.getMany();

    return comments;
  };

  public createOne = async (body: Partial<CommentEntity>, images: ImageEntity[], user: PassportRequestInterface) => {
    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const commentRepo = manager.getRepository(CommentEntity);

      const comment = await commentRepo.save({ ...body, user: { id: user.id } });

      if (images?.length) {
        this.uploadPathService.checkFolder(UploadPathEnum.COMMENT, comment.id);
        await this.imageService.processingImages(images, UploadPathEnum.COMMENT, comment.id, manager);
      }

      return comment;
    });

    return this.findOne({ id: created.id }, user.lang);
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const comment = await this.findOne(params, lang);

    await comment.softRemove();

    comment.deleted = new Date();

    return comment;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedComment = await this.findOne(params, lang, { withDeleted: true });

    await deletedComment.recover();

    return this.findOne(params, lang);
  };
}
