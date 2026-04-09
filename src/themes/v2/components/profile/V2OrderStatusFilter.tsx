import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import cn from 'classnames';

import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import styles from '@/themes/v2/components/profile/V2OrderStatusFilter.module.scss';

interface Props {
  statuses: OrderStatusEnum[];
  lang: UserLangEnum;
  setStatuses: React.Dispatch<React.SetStateAction<OrderStatusEnum[]>>;
}

export const V2OrderStatusFilter = ({ statuses, setStatuses, lang }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const router = useRouter();

  useEffect(() => {
    router.push({ query: { ...router.query, statuses } }, undefined, { shallow: true });
  }, [statuses.length]);

  const toggle = (status: OrderStatusEnum) => {
    setStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{t('selectStatuses')}</span>

      <div className={styles.chips}>
        {Object.values(OrderStatusEnum).map((status) => {
          const color = getOrderStatusColor(status);
          const isActive = statuses.includes(status);

          return (
            <button
              key={status}
              type="button"
              className={cn(styles.chip, { [styles.active]: isActive })}
              style={{ '--status-color': color } as React.CSSProperties}
              onClick={() => toggle(status)}
            >
              <span className={styles.chipDot} />
              {getOrderStatusTranslate(status, lang)}
            </button>
          );
        })}
      </div>

      {statuses.length > 0 && (
        <button type="button" className={styles.clearBtn} onClick={() => setStatuses([])}>
          Сбросить
        </button>
      )}
    </div>
  );
};
