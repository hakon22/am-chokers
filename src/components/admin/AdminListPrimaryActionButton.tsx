import { useContext } from 'react';
import cn from 'classnames';
import { omit } from 'lodash';
import { Button, type ButtonProps } from 'antd';

import { VersionContext } from '@/components/Context';
import v2ListPrimaryStyles from '@/themes/v2/components/admin/V2AdminListPagePrimaryAction.module.scss';

/**
 * Основная действие в шапке admin-списков: в v1 — `button border-button`, в v2 — тот же primary, что у кнопки Excel в `V2AdminItemList`.
 * @param props - пропсы Ant Design `Button`; в v2 поле `type` игнорируется и всегда `primary`
 * @returns кнопка с оформлением по `VersionContext`
 */
export const AdminListPrimaryActionButton = ({ className, children, ...rest }: ButtonProps) => {
  const { version } = useContext(VersionContext);

  if (version === 'v2') {
    return (
      <Button {...omit(rest, 'type')} type="primary" className={cn(v2ListPrimaryStyles.addButton, className)}>
        {children}
      </Button>
    );
  }

  return (
    <Button {...rest} className={cn('button', 'border-button', className)}>
      {children}
    </Button>
  );
};
