import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button } from 'antd';
import cn from 'classnames';
import type { CSSProperties } from 'react';

import { routes } from '@/routes';

export const BackButton = ({ className, style = { position: 'absolute', top: '15%' }, propsFullReplace = false }: { className?: string; style?: CSSProperties; propsFullReplace?: boolean; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.backButton' });
  const router = useRouter();

  const getUrl = (asPath: string) => {
    let url = routes.personalData;

    if (asPath.includes(routes.catalog)) {
      url = routes.catalog;
    }

    return url;
  };

  return (
    <Button onClick={() => router.push(getUrl(router.asPath))} className={cn(propsFullReplace ? null : 'back-button border-button', className)} style={propsFullReplace ? {} : style}>
      {t('back')}
    </Button>
  );
};
