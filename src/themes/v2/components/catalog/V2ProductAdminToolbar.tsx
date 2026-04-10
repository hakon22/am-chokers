import { useTranslation } from 'react-i18next';
import { FloatButton, Popconfirm } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined, RubyOutlined, SignatureOutlined, UndoOutlined } from '@ant-design/icons';
import moment from 'moment';
import { Telegram } from 'react-bootstrap-icons';
import cn from 'classnames';

import telegramIcon from '@/images/icons/telegram.svg';
import { ItemAdminPublishModal } from '@/components/item-admin/ItemAdminPublishModal';
import { useItemAdminPanel } from '@/components/item-admin/useItemAdminPanel';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import styles from '@/themes/v2/components/catalog/ProductPageAdmin.module.scss';
import { V2Image } from '@/themes/v2/components/V2Image';
import type { ItemInterface } from '@/types/item/Item';

const floatBtnStyle = { backgroundColor: '#2B3C5F' };

export const V2ProductAdminToolbar = ({ item, setItem }: { item: ItemInterface; setItem: (value: ItemInterface) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const panel = useItemAdminPanel(item, setItem);

  if (!panel.isAdmin) {
    return null;
  }

  const {
    isMobile,
    modalProps,
    onEdit,
    restoreItemHandler,
    deleteItemHandler,
    onDeferredPublicationEdit,
    onPublicationDateEdit,
    onPublicationDateRemove,
    onPublicationRemove,
    onMessageRemove,
    setIsTgPublish,
  } = panel;

  if (isMobile) {
    return (
      <>
        <ItemAdminPublishModal {...modalProps} />
        <FloatButton.Group
          trigger="click"
          rootClassName={styles.floatRoot}
          style={{
            insetInlineEnd: 18,
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 12px)',
            top: 'auto',
            zIndex: 220,
            height: 'min-content',
          }}
          icon={<EllipsisOutlined />}
        >
          <FloatButton icon={<SignatureOutlined />} onClick={onEdit} style={floatBtnStyle} />
          {item.deleted
            ? <FloatButton icon={<UndoOutlined />} onClick={restoreItemHandler} style={floatBtnStyle} />
            : <FloatButton icon={<DeleteOutlined />} onClick={deleteItemHandler} style={floatBtnStyle} />}
          {item.publicationDate
            ? <FloatButton className="float-custom-icon" icon={<RubyOutlined style={{ fontSize: 22 }} />} onClick={onPublicationDateEdit} style={floatBtnStyle} />
            : null}
          {!item.message?.send && !item.deferredPublication?.date
            ? (
              <FloatButton
                className="float-custom-icon"
                icon={<V2Image src={telegramIcon} width={36} height={36} alt="Telegram" />}
                onClick={() => setIsTgPublish(true)}
                style={floatBtnStyle}
              />
            )
            : item.deferredPublication && !item.deferredPublication.isPublished
              ? <FloatButton className="float-custom-icon" icon={<Telegram width={36} height={36} color="#e8e0ff" />} onClick={onDeferredPublicationEdit} style={floatBtnStyle} />
              : <FloatButton className="float-custom-icon" icon={<Telegram width={36} height={36} color="#b8f5d0" />} style={floatBtnStyle} />}
        </FloatButton.Group>
      </>
    );
  }

  /**
   * «Опубликовано в TG» только если пост реально ушёл (`message.send`) или отложенная публикация уже
   * отработала (`isPublished`), и при этом нет активного черновика расписания в TG.
   * Не используем `deferredPublication.date` — иначе легко перепутать с отменённым планом.
   */
  const noUnpublishedTgSchedule = !item.deferredPublication || item.deferredPublication.isPublished;
  const tgPosted =
    Boolean(item.message?.send) || Boolean(item.deferredPublication?.isPublished);
  const showTgPublishedChip = tgPosted && noUnpublishedTgSchedule;

  return (
    <div className={styles.desktop}>
      <ItemAdminPublishModal {...modalProps} />
      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} onClick={onEdit}>{t('edit')}</button>
        {item.deleted
          ? <button type="button" className={styles.actionBtn} onClick={restoreItemHandler}>{t('restore')}</button>
          : (
            <Popconfirm rootClassName="ant-input-group-addon" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={deleteItemHandler}>
              <button type="button" className={cn(styles.actionBtn, styles.actionDanger)}>{t('remove')}</button>
            </Popconfirm>
          )}
        {!item.message?.send && !item.deferredPublication?.date
          ? (
            <button type="button" className={styles.actionBtn} onClick={() => setIsTgPublish(true)}>
              {t('publishToTelegram')}
            </button>
          )
          : null}
      </div>
      <div className={styles.chips}>
        {item.publicationDate
          ? (
            <span className={cn(styles.chip, styles.chipSite)}>
              <RubyOutlined />
              <span>{t('planned', { date: moment(item.publicationDate).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}</span>
              <button type="button" className={styles.chipIconBtn} onClick={onPublicationDateEdit} title={t('editDeferredPublication')}>
                <EditOutlined />
              </button>
              <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelDeferredPublicationTitle')} description={t('cancelDeferredPublicationDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onPublicationDateRemove}>
                <button type="button" className={styles.chipIconBtn} title={t('cancelDeferredPublicationTitle')}>
                  <CloseOutlined style={{ fontSize: 13 }} />
                </button>
              </Popconfirm>
            </span>
          )
          : null}
        {item.deferredPublication && !item.deferredPublication.isPublished
          ? (
            <span className={cn(styles.chip, styles.chipTgPending)}>
              <Telegram size={16} />
              <span>{t('planned', { date: moment(item.deferredPublication.date).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}</span>
              <button type="button" className={styles.chipIconBtn} onClick={onDeferredPublicationEdit} title={t('editDeferredPublication')}>
                <EditOutlined />
              </button>
              <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelDeferredPublicationTitle')} description={t('cancelDeferredPublicationDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onPublicationRemove}>
                <button type="button" className={styles.chipIconBtn} title={t('cancelDeferredPublicationTitle')}>
                  <CloseOutlined style={{ fontSize: 13 }} />
                </button>
              </Popconfirm>
            </span>
          )
          : null}
        {showTgPublishedChip
          ? (
            <span className={cn(styles.chip, styles.chipTgDone)}>
              <Telegram size={16} />
              <span>{t('publish', { date: moment(item.message?.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}</span>
              <Popconfirm rootClassName="ant-input-group-addon" title={t('removeMessageTitle')} description={t('removeMessageDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onMessageRemove}>
                <button type="button" className={styles.chipIconBtn} title={t('removeMessageTitle')}>
                  <CloseOutlined style={{ fontSize: 13 }} />
                </button>
              </Popconfirm>
            </span>
          )
          : null}
      </div>
    </div>
  );
};
