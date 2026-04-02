import { ConfigProvider } from 'antd';
import type { JSX } from 'react';

import { App } from '@/components/App';
import { v1Theme } from '@/themes/v1/theme.config';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export const Layout = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  return (
    <ConfigProvider theme={v1Theme}>
      <App itemGroups={itemGroups}>
        {children}
      </App>
    </ConfigProvider>
  );
};
