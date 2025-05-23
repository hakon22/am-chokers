import axios from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { LoggerService } from '@server/services/app/logger.service';
import { ItemService } from '@server/services/item/item.service';
import { paramsIdSchema } from '@server/utilities/convertation.params';

@Singleton
export class GptService {
  private TAG = 'GPT Service';

  private readonly loggerService = Container.get(LoggerService);

  private readonly itemService = Container.get(ItemService);

  public generateDescription = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.findOne(params);

      const template = {
        api_key: process.env.CHAD_AI_API_KEY,
        message: `У меня есть ${item.group.name} с названием ${item.name}. Коллекция: ${item.collection?.name}, состав: ${item.compositions.map((composition) => composition.name).join(', ')}, цвет: ${item.colors.map((color) => color.name).join(', ')}, длина: ${item.length}. Сделай описание для товара в интернет магазине по фотографии текстом без форматирования и абзацев: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${item.images[0].src}`,
      };

      const { data } = await axios.post<{ is_success: boolean; response: string; }>('https://ask.chadgpt.ru/api/public/gpt-4o-mini', template);

      res.status(200).json({ code: 1, description: data.response });
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error('Произошла ошибка при запросе в Chat GPT');
    }
  };
}
