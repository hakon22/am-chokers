import { MigrationInterface, QueryRunner } from 'typeorm';

export class TryOnArchitecture1784064624488 implements MigrationInterface {
  public name = 'TryOnArchitecture1784064624488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS "ai"');

    await queryRunner.query(`
      CREATE TYPE "ai"."provider_type_enum" AS ENUM (
        'ROUTER_AI',
        'CODING_MANTRA'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ai"."agent_purpose_enum" AS ENUM (
        'TRY_ON_VALIDATION',
        'TRY_ON_GENERATION'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ai"."try_on_vto_type_enum" AS ENUM (
        'NECKLACE',
        'EARRING'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ai"."prompt_template_type_enum" AS ENUM (
        'TRY_ON_VALIDATION_SYSTEM_NECKLACE',
        'TRY_ON_VALIDATION_SYSTEM_EARRING',
        'TRY_ON_VALIDATION_USER',
        'TRY_ON_GENERATION_NECKLACE',
        'TRY_ON_GENERATION_EARRING'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ai"."try_on_user_rating_enum" AS ENUM (
        'GOOD',
        'BAD'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ai"."try_on_log_status_enum" AS ENUM (
        'VALIDATION_REJECTED',
        'SUCCESS',
        'GENERATION_FAILED',
        'PROVIDER_ERROR'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ai"."agent" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Moscow'),
        "updated" TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Moscow'),
        "deleted" TIMESTAMP NULL,
        "name" CHARACTER VARYING NOT NULL,
        "provider" "ai"."provider_type_enum" NOT NULL,
        "purpose" "ai"."agent_purpose_enum" NOT NULL,
        "requires_proxy" BOOLEAN NOT NULL DEFAULT FALSE,
        "model" CHARACTER VARYING NOT NULL,
        "temperature" NUMERIC(2,1) NOT NULL,
        "base_url" CHARACTER VARYING NULL,
        "api_key" TEXT NULL,
        "max_tokens" INTEGER NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uidx_ai_agent__purpose_provider"
      ON "ai"."agent" ("purpose", "provider")
      WHERE "deleted" IS NULL AND "is_active" = TRUE
    `);
    await queryRunner.query('CREATE INDEX "ai_agent__purpose__idx" ON "ai"."agent" ("purpose")');
    await queryRunner.query('CREATE INDEX "ai_agent__provider__idx" ON "ai"."agent" ("provider")');

    await queryRunner.query(`
      CREATE TABLE "ai"."prompt_template" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Moscow'),
        "updated" TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Moscow'),
        "deleted" TIMESTAMP NULL,
        "type" "ai"."prompt_template_type_enum" NOT NULL,
        "title" CHARACTER VARYING NULL,
        "content" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uidx_ai_prompt_template_type"
      ON "ai"."prompt_template" ("type")
      WHERE "deleted" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "ai"."item_group_try_on" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated" TIMESTAMP NOT NULL DEFAULT NOW(),
        "deleted" TIMESTAMP NULL,
        "item_group_id" INTEGER NOT NULL,
        "vto_type" "ai"."try_on_vto_type_enum" NULL,
        "validation_prompt_type" "ai"."prompt_template_type_enum" NULL,
        "is_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT "item_group_try_on__item_group_fk"
          FOREIGN KEY ("item_group_id") REFERENCES "chokers"."item_group"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uidx_item_group_try_on__item_group_id"
      ON "ai"."item_group_try_on" ("item_group_id")
      WHERE "deleted" IS NULL
    `);
    await queryRunner.query('CREATE INDEX "item_group_try_on__item_group_id__idx" ON "ai"."item_group_try_on" ("item_group_id")');
    await queryRunner.query('CREATE INDEX "item_group_try_on__vto_type__idx" ON "ai"."item_group_try_on" ("vto_type")');

    await queryRunner.query(`
      CREATE TABLE "ai"."try_on_log" (
        "id" SERIAL PRIMARY KEY,
        "created" TIMESTAMP NOT NULL DEFAULT NOW(),
        "item_id" INTEGER NOT NULL,
        "vto_type" "ai"."try_on_vto_type_enum" NOT NULL,
        "user_id" INTEGER NULL,
        "status" "ai"."try_on_log_status_enum" NOT NULL,
        "suitable" BOOLEAN NOT NULL,
        "validation_reason" TEXT NULL,
        "validation_provider" "ai"."provider_type_enum" NULL,
        "generation_provider" "ai"."provider_type_enum" NULL,
        "validation_cost" NUMERIC(10,2) NULL,
        "generation_cost" NUMERIC(10,2) NULL,
        "total_cost" NUMERIC(10,2) NULL,
        "result_image_path" CHARACTER VARYING NULL,
        "result_image_name" CHARACTER VARYING NULL,
        "user_rating" "ai"."try_on_user_rating_enum" NULL,
        "user_rated_at" TIMESTAMP NULL,
        "validation_agent_id" INTEGER NULL,
        "generation_agent_id" INTEGER NULL,
        "duration_ms" INTEGER NULL,
        "ip_hash" CHARACTER VARYING(64) NOT NULL,
        "user_lang" "chokers"."user_lang_enum" NULL,
        "error_message" TEXT NULL,
        "try_on_image_id" INTEGER NULL,
        CONSTRAINT "try_on_log__item_fk"
          FOREIGN KEY ("item_id") REFERENCES "chokers"."item"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "try_on_log__user_fk"
          FOREIGN KEY ("user_id") REFERENCES "chokers"."user"("id")
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "try_on_log__validation_agent_fk"
          FOREIGN KEY ("validation_agent_id") REFERENCES "ai"."agent"("id")
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "try_on_log__generation_agent_fk"
          FOREIGN KEY ("generation_agent_id") REFERENCES "ai"."agent"("id")
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "try_on_log__try_on_image_fk"
          FOREIGN KEY ("try_on_image_id") REFERENCES "chokers"."image"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await queryRunner.query('CREATE INDEX "try_on_log__item_id__idx" ON "ai"."try_on_log" ("item_id")');
    await queryRunner.query('CREATE INDEX "try_on_log__user_id__idx" ON "ai"."try_on_log" ("user_id")');
    await queryRunner.query('CREATE INDEX "try_on_log__validation_provider__idx" ON "ai"."try_on_log" ("validation_provider")');
    await queryRunner.query('CREATE INDEX "try_on_log__generation_provider__idx" ON "ai"."try_on_log" ("generation_provider")');
    await queryRunner.query('CREATE INDEX "try_on_log__validation_agent_id__idx" ON "ai"."try_on_log" ("validation_agent_id")');
    await queryRunner.query('CREATE INDEX "try_on_log__generation_agent_id__idx" ON "ai"."try_on_log" ("generation_agent_id")');
    await queryRunner.query('CREATE INDEX "try_on_log__created__idx" ON "ai"."try_on_log" ("created")');
    await queryRunner.query('CREATE INDEX "try_on_log__vto_type__idx" ON "ai"."try_on_log" ("vto_type")');
    await queryRunner.query('CREATE INDEX "try_on_log__item_id_created__idx" ON "ai"."try_on_log" ("item_id", "created" DESC)');
    await queryRunner.query('CREATE INDEX "try_on_log__try_on_image_id__idx" ON "ai"."try_on_log" ("try_on_image_id")');
    await queryRunner.query(`
      CREATE INDEX "try_on_log__status_created__idx"
      ON "ai"."try_on_log" ("status", "created" DESC)
      WHERE "result_image_name" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "chokers"."image"
      ADD COLUMN "try_on" BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await queryRunner.query(`
      CREATE INDEX "image__try_on__idx" ON "chokers"."image" ("try_on")
      WHERE "try_on" = TRUE AND "deleted" IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO "ai"."agent" ("name", "provider", "purpose", "model", "temperature", "base_url", "requires_proxy", "is_active")
      VALUES (
        'Try-on validation',
        'ROUTER_AI',
        'TRY_ON_VALIDATION',
        'google/gemini-3.1-flash-lite-preview',
        0.1,
        'https://routerai.ru/api/v1',
        FALSE,
        TRUE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "ai"."agent" ("name", "provider", "purpose", "model", "temperature", "base_url", "requires_proxy", "is_active")
      VALUES (
        'Try-on generation (CodingMantra)',
        'CODING_MANTRA',
        'TRY_ON_GENERATION',
        'standard',
        0,
        'https://codingmantra.com',
        TRUE,
        TRUE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "ai"."item_group_try_on" ("item_group_id", "vto_type", "validation_prompt_type", "is_enabled")
      SELECT "item_group"."id", 'NECKLACE', 'TRY_ON_VALIDATION_SYSTEM_NECKLACE', TRUE
      FROM "chokers"."item_group" AS "item_group"
      WHERE "item_group"."code" IN ('necklaces', 'chokers') AND "item_group"."deleted" IS NULL
    `);
    await queryRunner.query(`
      INSERT INTO "ai"."item_group_try_on" ("item_group_id", "vto_type", "validation_prompt_type", "is_enabled")
      SELECT "item_group"."id", 'EARRING', 'TRY_ON_VALIDATION_SYSTEM_EARRING', TRUE
      FROM "chokers"."item_group" AS "item_group"
      WHERE "item_group"."code" = 'earrings' AND "item_group"."deleted" IS NULL
    `);
    await queryRunner.query(`
      INSERT INTO "ai"."item_group_try_on" ("item_group_id", "vto_type", "validation_prompt_type", "is_enabled")
      SELECT "item_group"."id", NULL, NULL, FALSE
      FROM "chokers"."item_group" AS "item_group"
      WHERE "item_group"."deleted" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "ai"."item_group_try_on" AS "existing"
          WHERE "existing"."item_group_id" = "item_group"."id" AND "existing"."deleted" IS NULL
        )
    `);

    await this.seedPromptTemplates(queryRunner);
  }

  /**
   * Сидит промпты validation и generation
   * @param queryRunner - TypeORM query runner
   * @returns void
   */
  private seedPromptTemplates = async (queryRunner: QueryRunner): Promise<void> => {
    const validationReasonRules = `
ПРАВИЛА ДЛЯ ПОЛЯ reason:
- Пиши для клиента магазина, который загрузил одно фото для примерки.
- Говори «на вашем фото», «на фото товара».
- Не используй «первое/второе изображение», «изображение 1/2», USER_PHOTO, PRODUCT_PHOTO.`;

    const lenientPolicy = `
ПОЛИТИКА ЛОЯЛЬНОСТИ:
- При сомнении — suitable: true. Отклоняй только при явных блокерах.
- Умеренная размытость, шум, неидеальный свет — не повод для отказа, если зона тела узнаваема.
- Лёгкий поворот головы, частично закрытые волосами уши, воротник/шарф — допустимо, если зона примерки в целом видна.
- Не требовать студийного качества и идеального кадра.
- Фото товара — только sanity-check типа украшения; не отклонять из-за фона каталога.
- Жёсткий отказ только: нет человека; явно несколько людей; NSFW/насилие; несовершеннолетний при явных признаках; зона тела полностью отсутствует.`;

    const prompts: { type: string; title: string; content: string; }[] = [
      {
        type: 'TRY_ON_VALIDATION_SYSTEM_NECKLACE',
        title: 'Validation system: necklace',
        content: `Ты — модуль проверки пригодности фотографии для виртуальной примерки украшения на шею (чокер, колье) в интернет-магазине.

Тебе переданы ДВА изображения:
1) фото клиента — то, что он загрузил для примерки.
2) фото товара — отдельное фото для AI-примерки (клиент его не загружал).
${lenientPolicy}

КРИТЕРИИ ОТКАЗА (suitable = false) только при явных блокерах:
- На фото клиента шея полностью не видна и не угадывается.
- Несколько людей в кадре.
- Несовершеннолетний только при явных признаках.
- NSFW, насилие.
- На фото клиента нет человека.
- На фото товара нет украшения для шеи или оно совсем неразличимо.

КРИТЕРИИ ПРИНЯТИЯ (suitable = true): достаточно частично видимой шеи/декольте, selfie, портрет по грудь; один человек; обычное качество с телефона.
${validationReasonRules}

ФОРМАТ ОТВЕТА — ТОЛЬКО JSON:
{"suitable": true|false, "reason": "на языке {{lang}}, 1–2 предложения"}`,
      },
      {
        type: 'TRY_ON_VALIDATION_SYSTEM_EARRING',
        title: 'Validation system: earring',
        content: `Ты — модуль проверки пригодности фотографии для виртуальной примерки серёг в интернет-магазине.

Тебе переданы ДВА изображения:
1) фото клиента — то, что он загрузил для примерки.
2) фото товара — отдельное фото для AI-примерки (клиент его не загружал).

ГЛАВНОЕ ТРЕБОВАНИЕ (жёстко):
- На фото клиента должно быть ЧЁТКО видно хотя бы одно ухо (мочка и контур уха различимы, без размытия «в ноль»).
- Если оба уха полностью скрыты волосами, шапкой, рукой, ракурсом или обрезаны кадром — suitable: false. Не смягчай это правило.
- «Ухо где-то за волосами» или «зона ушей угадывается» — НЕДОСТАТОЧНО. Нужно реально видимое ухо для примерки серёг.

ПОЛИТИКА ЛОЯЛЬНОСТИ (только после выполнения правила про ухо):
- Умеренная размытость/шум/неидеальный свет — не отказ, если хотя бы одно ухо чётко видно.
- Лёгкий поворот головы и профиль допустимы, если одно ухо видно чётко.
- Второе ухо может быть частично закрыто волосами — OK.
- Не требовать студийного качества.
- Фото товара — только sanity-check типа украшения; не отклонять из-за фона каталога.

КРИТЕРИИ ОТКАЗА (suitable = false):
- Ни одно ухо не видно чётко (главный блокер для серёг).
- Несколько людей в кадре.
- Несовершеннолетний только при явных признаках.
- NSFW, насилие.
- На фото клиента нет человека.
- На фото товара нет серёг или они совсем неразличимы.

КРИТЕРИИ ПРИНЯТИЯ (suitable = true): один человек; хотя бы одно ухо чётко видно; обычное качество с телефона; пара серёг на фото товара желательна, но не блокер.
${validationReasonRules}

ФОРМАТ ОТВЕТА — ТОЛЬКО JSON:
{"suitable": true|false, "reason": "на языке {{lang}}, 1–2 предложения"}`,
      },
      {
        type: 'TRY_ON_VALIDATION_USER',
        title: 'Validation user message',
        content: `Проверь, подходит ли фото клиента для примерки украшения.

Товар: {{itemName}}
Материалы/состав: {{compositionNames}}
Тип украшения (VTO): {{vtoType}}
Тип украшения (каталог): {{itemType}}

Фото клиента — то, что он загрузил для примерки.
Фото товара — отдельное фото для AI-примерки (только для проверки типа украшения).

Применяй критерии из system-промпта строго. Для серёг (EARRING) не ставь suitable: true, если ни одно ухо не видно чётко.
Для остальных типов склоняйся к suitable: true только если зона примерки видна.

Верни JSON с полями suitable и reason на языке {{lang}}.
В reason обращайся к клиенту: «на вашем фото», «на фото товара». Не пиши «первое/второе изображение», USER_PHOTO, PRODUCT_PHOTO.`,
      },
      {
        type: 'TRY_ON_GENERATION_NECKLACE',
        title: 'Generation: necklace',
        content: `Place the jewelry from the product photo naturally on the person's neck and décolleté.
Preserve the person's face, skin tone, pose and background.
Product: {{itemName}}. Materials: {{compositionNames}}.
Description: {{itemDescription}}. Length/size: {{itemLength}}.
Photorealistic metal reflections, correct scale, no extra jewelry.`,
      },
      {
        type: 'TRY_ON_GENERATION_EARRING',
        title: 'Generation: earring',
        content: `Place the earring pair from the product photo on both ears of the person.
Front-facing portrait, ears visible, preserve identity and background.
Product: {{itemName}}. Materials: {{compositionNames}}.
Description: {{itemDescription}}. Length/size: {{itemLength}}.
Photorealistic metal and stones, correct scale.`,
      },
    ];

    for (const prompt of prompts) {
      await queryRunner.query(
        `
          INSERT INTO "ai"."prompt_template" ("type", "title", "content", "is_active")
          VALUES ($1::"ai"."prompt_template_type_enum", $2, $3, TRUE)
        `,
        [prompt.type, prompt.title, prompt.content],
      );
    }
  };

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "chokers"."image__try_on__idx"');
    await queryRunner.query('ALTER TABLE "chokers"."image" DROP COLUMN IF EXISTS "try_on"');
    await queryRunner.query('DROP TABLE IF EXISTS "ai"."try_on_log"');
    await queryRunner.query('DROP TABLE IF EXISTS "ai"."item_group_try_on"');
    await queryRunner.query('DROP TABLE IF EXISTS "ai"."prompt_template"');
    await queryRunner.query('DROP TABLE IF EXISTS "ai"."agent"');
    await queryRunner.query('DROP TYPE IF EXISTS "ai"."try_on_log_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "ai"."try_on_user_rating_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "ai"."prompt_template_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "ai"."try_on_vto_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "ai"."agent_purpose_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "ai"."provider_type_enum"');
    await queryRunner.query('DROP SCHEMA IF EXISTS "ai"');
  }
}
