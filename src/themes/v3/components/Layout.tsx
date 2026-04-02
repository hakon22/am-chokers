import { ConfigProvider } from 'antd';
import type { JSX } from 'react';

import { App } from '@/components/App';
import { v3Theme } from '@/themes/v3/theme.config';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export const Layout = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => (
  <ConfigProvider theme={v3Theme}>
    <App itemGroups={itemGroups}>
      {children}
    </App>
  </ConfigProvider>
);
