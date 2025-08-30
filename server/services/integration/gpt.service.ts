import axios from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { ItemService } from '@server/services/item/item.service';
import { BaseService } from '@server/services/app/base.service';
import { paramsIdSchema } from '@server/utilities/convertation.params';
import { generateDescriptionWithoutItemSchema } from '@/validations/validations';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemEntity } from '@server/db/entities/item.entity';

@Singleton
export class GptService extends BaseService {
  private readonly TAG = 'GPT Service';

  private readonly itemService = Container.get(ItemService);

  public generateDescription = async (req: Request, res: Response) => {
    const user = this.getCurrentUser(req);
    const params = await paramsIdSchema.validate(req.params);

    const item = await this.itemService.findOne(params, user.lang);

    const description = await this.generate(item, user.lang);

    res.json({ code: 1, description });
  };

  public generateDescriptionWithoutItem = async (req: Request, res: Response) => {
    const user = this.getCurrentUser(req);
    const item = await generateDescriptionWithoutItemSchema.validate(req.body) as ItemEntity;

    const description = await this.generate(item, user.lang);

    res.json({ code: 1, description });
  };

  private generate = async (item: ItemEntity, lang: UserLangEnum) => {
    try {
      const compositionNames = item.compositions.map((composition) => composition.translations.filter((translation) => translation.lang === lang).map(({ name }) => name)).join(', ').trim();
      const image = `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${item.images[0].src}`;
      const template = {
        api_key: process.env.CHAD_AI_API_KEY,
        message: lang === UserLangEnum.RU
          ? `Напиши описание из 2-3 предложений для продажи этого украшения в интернет магазине, в состав которого входят ${compositionNames}. Не употребляй банальные слова и следующие слова и их производные: утонченность, индивидуальность, изысканный, оригинальный. Фото украшения: ${image}`
          : `Write a 2-3 sentence description for selling this jewelry in an online store that includes ${compositionNames}. Avoid using common words and the following words and their derivatives: sophistication, individuality, exquisite, original. Jewelry photo: ${image}`,
      };

      this.loggerService.info(this.TAG, template.message);

      const { data } = await axios.post<{ is_success: boolean; response: string; }>('https://ask.chadgpt.ru/api/public/gemini-2.5-pro', template);

      return data.response;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(lang === UserLangEnum.RU
        ? 'Произошла ошибка при запросе в Chat GPT'
        : 'An error occurred while requesting Chat GPT');
    }
  };
}
