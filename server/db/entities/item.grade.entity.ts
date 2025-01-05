import { JoinColumn, ManyToOne, ViewEntity } from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';
import { GradeEntity } from '@server/db/entities/grade.entity';

const expression = `
  SELECT
    "grade".*,
	  "item"."id" AS "item_id"
  FROM "chokers"."grade"
    LEFT JOIN "chokers"."order_position" "orderPosition" ON "orderPosition"."id" = "grade"."position_id"
    LEFT JOIN "chokers"."item" "item" ON "orderPosition"."item_id" = "item"."id"
  GROUP BY "item"."id", "grade"."id"
  ORDER BY "grade"."id" DESC
`;

/** Оценки товаров (вьюха) */
@ViewEntity({
  name: 'item_grade',
  expression,
})
export class ItemGradeEntity extends GradeEntity {
  /** Товар */
  @ManyToOne(() => ItemEntity)
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;
}
