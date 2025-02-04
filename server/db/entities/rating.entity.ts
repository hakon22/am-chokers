import { AfterLoad, BaseEntity, JoinColumn, ManyToOne, ViewColumn, ViewEntity } from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';

const expression = `
  SELECT
    "item"."id" AS "item_id",
    ROUND(AVG("grade"."grade"), 1) AS "rating"
  FROM "chokers"."grade"
    LEFT JOIN "chokers"."order_position" "orderPosition" ON "orderPosition"."id" = "grade"."position_id"
    LEFT JOIN "chokers"."item" "item" ON "orderPosition"."item_id" = "item"."id"
    WHERE "grade"."checked" = TRUE
      AND "grade"."deleted" IS NULL
  GROUP BY "item"."id"
`;

/** Рейтинг (вьюха) */
@ViewEntity({
  name: 'rating',
  expression,
})
export class RatingEntity extends BaseEntity {
  /** Рейтинг товара */
  @ViewColumn()
  public rating: number;

  /** Товар */
  @ManyToOne(() => ItemEntity)
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;

  @AfterLoad()
  transform() {
    this.rating = +this.rating;
  }
}
