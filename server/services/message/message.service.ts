import { Singleton } from 'typescript-ioc';
import type { FindOptionsWhere } from 'typeorm';

import { MessageEntity } from '@server/db/entities/message.entity';
import { UserEntity } from '@server/db/entities/user.entity';
import { BaseService } from '@server/services/app/base.service';
import type { MessageQueryInterface } from '@server/types/message/message.query.interface';
import type { MessageOptionsInterface } from '@server/types/message/message.options.interface';

@Singleton
export class MessageService extends BaseService {

  private createQueryBuilder = (query?: MessageQueryInterface, options?: MessageOptionsInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(MessageEntity, 'message')
      .select([
        'message.id',
        'message.created',
        'message.text',
        'message.send',
        'message.type',
        'message.phone',
        'message.telegramId',
      ])
      .leftJoin('message.user', 'user')
      .addSelect([
        'user.id',
        'user.name',
      ]);

    if (query?.limit || query?.offset) {
      builder
        .limit(query.limit)
        .offset(query.offset);
    }

    if (options?.userId) {
      builder.andWhere('message.user = :userId', { userId: options.userId });
    }
    if (query?.types?.length) {
      builder.andWhere('message.type IN(:...types)', { types: query.types });
    }
    if (query?.phone) {
      builder.andWhere('message.phone ILIKE :phone', { phone: `%${query.phone}%` });
    }
    if (query?.onlySent) {
      builder.andWhere('NOT message.send');
    }

    return builder;
  };

  public createOne = async (body: Partial<MessageEntity>) => {
    const message: MessageEntity = await this.databaseService.getManager().transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const messageRepo = manager.getRepository(MessageEntity);

      const where: FindOptionsWhere<UserEntity> = {};

      if (body.phone) {
        where.phone = body.phone;
      }
      if (body.telegramId) {
        where.telegramId = body.telegramId;
      }

      const user = await userRepo.findOne({ select: ['id'], where });

      body.user = user;

      return messageRepo.create(body).save();
    });

    return { code: 1, message };
  };

  public messageReport = async (query?: MessageQueryInterface, options?: MessageOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .orderBy('message.created', 'DESC');

    return builder.getManyAndCount();
  };
}
