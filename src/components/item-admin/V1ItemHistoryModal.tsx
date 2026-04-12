import { useTranslation } from 'react-i18next';
import { Button, Modal, Spin, Timeline } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import moment from 'moment';
import { isEmpty } from 'lodash';

import { useItemHistory } from '@/hooks/useItemHistory';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { buildHistoryChangePresentation } from '@/utilities/itemHistoryDisplay';
import { HistoryFormattedValue } from '@/components/item-history/HistoryFormattedValue';
import styles from '@/components/item-admin/V1ItemHistoryModal.module.scss';

type Props = {
  itemId: number;
  open: boolean;
  onClose: () => void;
};

/**
 * Модальное окно истории изменений товара (тема V1)
 * @param itemId - идентификатор товара
 * @param open - видимость модалки
 * @param onClose - закрытие модалки
 */
export const V1ItemHistoryModal = ({ itemId, open, onClose }: Props) => {
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
          <div className="text-muted small mb-1">
            {moment(row.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
            {' · '}
            {row.user?.name ?? tHist('systemUser')}
          </div>
          {presentation.kind === 'created' ? (
            <div className="fw-semibold text-secondary">{presentation.title}</div>
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
      width={Math.min(640, typeof window !== 'undefined' ? window.innerWidth - 24 : 640)}
      title={(
        <span className="d-inline-flex align-items-center gap-2 font-oswald">
          <HistoryOutlined />
          {tHist('modalTitle')}
        </span>
      )}
      destroyOnClose
    >
      <div style={{ maxHeight: 'min(70vh, 560px)', overflowY: 'auto' }}>
        {loading && isEmpty(rows)
          ? <div className="text-center py-5"><Spin /></div>
          : (
            <Timeline items={timelineItems} mode="start" />
          )}
        {hasMore
          ? (
            <div className="text-center mt-3">
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
