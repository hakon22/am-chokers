import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import cn from 'classnames';
import type { CSSProperties } from 'react';

export const BackButton = ({ className, style = { position: 'absolute', top: '15%' }, propsFullReplace = false }: { className?: string; style?: CSSProperties; propsFullReplace?: boolean; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.backButton' });
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} className={cn(propsFullReplace ? null : 'back-button border-button', className)} style={propsFullReplace ? {} : style}>
      {t('back')}
    </Button>
  );
};
