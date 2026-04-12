import { useTranslation } from 'react-i18next';
import { Button, Modal, Spin, Timeline } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import moment from 'moment';
import { isEmpty } from 'lodash';

import { useItemHistory } from '@/hooks/useItemHistory';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { buildHistoryChangePresentation } from '@/utilities/itemHistoryDisplay';
import { HistoryFormattedValue } from '@/components/item-history/HistoryFormattedValue';
import styles from '@/themes/v2/components/catalog/V2ItemHistoryModal.module.scss';

type Props = {
  itemId: number;
  open: boolean;
  onClose: () => void;
};

/**
 * Модальное окно истории изменений товара (тема V2)
 * @param itemId - идентификатор товара
 * @param open - видимость модалки
 * @param onClose - закрытие модалки
 */
export const V2ItemHistoryModal = ({ itemId, open, onClose }: Props) => {
  const { t } = useTranslation('translation');
  const { t: tHist } = useTranslation('translation', { keyPrefix: 'entityTranslate.itemHistory' });
  const { rows, loading, hasMore, loadMore } = useItemHistory({ itemId, open });

  const fieldLabel = (field: string) => t(`entityTranslate.item.${field}`, { defaultValue: tHist('unknownField', { field }) });

  const timelineItems = rows.map((row) => {
    const presentation = buildHistoryChangePresentation(row, fieldLabel, tHist('arrow'), tHist('valueRemoved'));
    return {
      key: String(row.id),
      children: (
        <div>
          <div className={styles.meta}>
            {moment(row.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
            {' · '}
            {row.user?.name ?? tHist('systemUser')}
          </div>
          {presentation.kind === 'created' ? (
            <div className={styles.titleLine}>{presentation.title}</div>
          ) : (
            <div className={styles.changeBlock}>
              <div className={styles.fieldLabel}>{presentation.label}:</div>
              <div className={styles.valueRow}>
                <HistoryFormattedValue text={presentation.formattedOld} className={styles.valueOld} />
                <span className={styles.arrow}>{presentation.arrow}</span>
                <HistoryFormattedValue text={presentation.formattedNew} className={styles.valueNew} />
              </div>
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={Math.min(720, typeof window !== 'undefined' ? window.innerWidth - 24 : 720)}
      title={(
        <span className="d-inline-flex align-items-center gap-2">
          <HistoryOutlined />
          {tHist('modalTitle')}
        </span>
      )}
      rootClassName={styles.modal}
      destroyOnClose
    >
      <div className={styles.body}>
        {loading && isEmpty(rows)
          ? <div className="text-center py-5"><Spin /></div>
          : (
            <Timeline items={timelineItems} mode="start" />
          )}
        {hasMore
          ? (
            <div className={styles.loadMore}>
              <Button type="default" loading={loading} onClick={loadMore}>
                {tHist('loadMore')}
              </Button>
            </div>
          )
          : null}
      </div>
    </Modal>
  );
};
