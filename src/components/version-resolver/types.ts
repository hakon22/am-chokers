import type { JSX } from 'react';

import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export interface VersionedComponents {
  Layout: (props: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => JSX.Element;
}
