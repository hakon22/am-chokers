import { useLayoutEffect, type JSX } from 'react';
import { ConfigProvider } from 'antd';

import { V2App } from '@/themes/v2/components/V2App';
import { v2Theme } from '@/themes/v2/theme.config';
import { cormorantFont, interFont } from '@/lib/fonts/v2-fonts';
import styles from '@/themes/v2/components/Layout.module.scss';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

const v2BodyClassNames = ['v2-theme', interFont.variable, cormorantFont.variable];

/**
 * Синхронизирует классы v2-theme и CSS-переменные шрифтов на document.body
 */
const syncV2BodyClassNames = (isEnabled: boolean): void => {
  v2BodyClassNames.forEach((className) => {
    if (isEnabled) {
      document.body.classList.add(className);
      return;
    }

    document.body.classList.remove(className);
  });
};

export const Layout = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  useLayoutEffect(() => {
    syncV2BodyClassNames(true);

    return () => {
      syncV2BodyClassNames(false);
    };
  }, []);

  return (
    <div className={`${interFont.variable} ${cormorantFont.variable}`}>
      <ConfigProvider theme={v2Theme}>
        <div className={styles.v2Root}>
          <V2App itemGroups={itemGroups}>
            {children}
          </V2App>
        </div>
      </ConfigProvider>
    </div>
  );
};
