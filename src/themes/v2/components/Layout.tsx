import { useEffect, type JSX } from 'react';
import Head from 'next/head';
import { ConfigProvider } from 'antd';

import { V2App } from '@/themes/v2/components/V2App';
import { v2Theme } from '@/themes/v2/theme.config';
import styles from '@/themes/v2/components/Layout.module.scss';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export const Layout = ({ children, itemGroups }: { children: JSX.Element; itemGroups: ItemGroupEntity[]; }) => {
  useEffect(() => {
    document.body.classList.add('v2-theme');
    return () => {
      document.body.classList.remove('v2-theme');
    };
  }, []);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <ConfigProvider theme={v2Theme}>
        <div className={styles.v2Root}>
          <V2App itemGroups={itemGroups}>
            {children}
          </V2App>
        </div>
      </ConfigProvider>
    </>
  );
};
