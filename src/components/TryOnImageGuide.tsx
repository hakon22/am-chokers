import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import {
  getTryOnInstructionKeyFromVtoType,
  getTryOnVtoTypeForGroup,
  isTryOnEnabledForGroup,
} from '@/utilities/isTryOnEnabledForGroupCode';
import type { ItemGroupInterface } from '@/types/item/Item';

type TryOnImageGuideProps = {
  group?: ItemGroupInterface | null;
};

/**
 * Подсказка админу по идеальному фото для AI-примерки
 * @param group - группа товара с конфигом tryOn
 * @returns блок с текстом или null, если группа не поддерживает примерку
 */
export const TryOnImageGuide = ({ group }: TryOnImageGuideProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.sortableItem.tryOnGuide' });

  if (!isTryOnEnabledForGroup(group)) {
    return null;
  }

  const instructionKey = getTryOnInstructionKeyFromVtoType(getTryOnVtoTypeForGroup(group));
  const groupHint = instructionKey ? t(instructionKey) : '';

  return (
    <Typography.Text type="secondary" className="d-block mt-2">
      {t('common')}
      {groupHint ? ` ${groupHint}` : ''}
    </Typography.Text>
  );
};
