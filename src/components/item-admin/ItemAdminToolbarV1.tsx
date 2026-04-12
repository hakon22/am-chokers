import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FloatButton, Popconfirm, Tag } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined, HistoryOutlined, RubyOutlined, SignatureOutlined, UndoOutlined } from '@ant-design/icons';
import Image from 'next/image';
import moment from 'moment';
import { Telegram } from 'react-bootstrap-icons';

import telegramIcon from '@/images/icons/telegram.svg';
import { ItemAdminPublishModal } from '@/components/item-admin/ItemAdminPublishModal';
import { useItemAdminPanel } from '@/components/item-admin/useItemAdminPanel';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { V1ItemHistoryModal } from '@/components/item-admin/V1ItemHistoryModal';
import type { ItemInterface } from '@/types/item/Item';

export const ItemAdminToolbarV1 = ({ item, setItem }: { item: ItemInterface; setItem: (value: ItemInterface) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const [historyOpen, setHistoryOpen] = useState(false);
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

  return isMobile
    ? (
      <>
        <V1ItemHistoryModal itemId={item.id} open={historyOpen} onClose={() => setHistoryOpen(false)} />
        <ItemAdminPublishModal {...modalProps} />
        <FloatButton.Group
          trigger="click"
          style={{ insetInlineEnd: 24, top: '70%', height: 'min-content' }}
          icon={<EllipsisOutlined />}
        >
          <FloatButton onClick={onEdit} icon={<SignatureOutlined />} />
          <FloatButton onClick={() => setHistoryOpen(true)} icon={<HistoryOutlined />} />
          {item.deleted ? <FloatButton onClick={restoreItemHandler} icon={<UndoOutlined />} /> : <FloatButton onClick={deleteItemHandler} icon={<DeleteOutlined />} />}
          {item.publicationDate
            ? <FloatButton onClick={onPublicationDateEdit} className="float-custom-icon" icon={<RubyOutlined width={40} height={40} />} />
            : null}
          {!item.message?.send && !item.deferredPublication?.date
            ? <FloatButton onClick={() => setIsTgPublish(true)} className="float-custom-icon" icon={<Image src={telegramIcon} width={40} height={40} alt="Telegram" />} />
            : item.deferredPublication && !item.deferredPublication.isPublished
              ? <FloatButton onClick={onDeferredPublicationEdit} className="float-custom-icon" icon={<Telegram width={40} height={40} color="purple" />} />
              : <FloatButton className="float-custom-icon" icon={<Telegram width={40} height={40} color="green" />} />}
        </FloatButton.Group>
      </>
    )
    : (
      <>
        <V1ItemHistoryModal itemId={item.id} open={historyOpen} onClose={() => setHistoryOpen(false)} />
        <ItemAdminPublishModal {...modalProps} />
        <Button type="text" className="action-button edit" onClick={onEdit}>{t('edit')}</Button>
        <Button type="text" className="action-button edit" onClick={() => setHistoryOpen(true)}>{t('history')}</Button>
        {item.deleted
          ? <Button type="text" className="action-button restore" onClick={restoreItemHandler}>{t('restore')}</Button>
          : (
            <Popconfirm rootClassName="ant-input-group-addon" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={deleteItemHandler}>
              <Button type="text" className="action-button remove">{t('remove')}</Button>
            </Popconfirm>
          )}
        <div className="position-relative">
          {item.publicationDate
            ? (
              <Tag
                color="cyan"
                variant="outlined"
                className="fs-6 d-flex align-items-center gap-2 position-absolute"
                style={{ top: -40, padding: '5px 10px', color: '#69788e', width: 'min-content' }}
              >
                <RubyOutlined />
                {t('planned', { date: moment(item.publicationDate).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}
                <button
                  className="icon-button text-muted d-flex align-items-center"
                  type="button"
                  onClick={onPublicationDateEdit}
                  title={t('editDeferredPublication')}
                >
                  <EditOutlined />
                </button>
                <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelDeferredPublicationTitle')} description={t('cancelDeferredPublicationDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onPublicationDateRemove}>
                  <button
                    className="icon-button text-muted d-flex align-items-center"
                    type="button"
                    title={t('cancelDeferredPublicationTitle')}
                  >
                    <CloseOutlined className="fs-6-5" />
                  </button>
                </Popconfirm>
              </Tag>
            )
            : null}
          {!item.message?.send && !item.deferredPublication?.date
            ? <Button type="text" className="action-button send-to-telegram" onClick={() => setIsTgPublish(true)}>{t('publishToTelegram')}</Button>
            : item.deferredPublication && !item.deferredPublication.isPublished
              ? (
                <Tag
                  color="purple"
                  variant="outlined"
                  className="fs-6 d-flex align-items-center gap-2"
                  style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}
                >
                  <Telegram />
                  {t('planned', { date: moment(item.deferredPublication.date).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}
                  <button
                    className="icon-button text-muted d-flex align-items-center"
                    type="button"
                    onClick={onDeferredPublicationEdit}
                    title={t('editDeferredPublication')}
                  >
                    <EditOutlined />
                  </button>
                  <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelDeferredPublicationTitle')} description={t('cancelDeferredPublicationDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onPublicationRemove}>
                    <button
                      className="icon-button text-muted d-flex align-items-center"
                      type="button"
                      title={t('cancelDeferredPublicationTitle')}
                    >
                      <CloseOutlined className="fs-6-5" />
                    </button>
                  </Popconfirm>
                </Tag>
              )
              : (
                <Tag
                  color="success"
                  variant="outlined"
                  className="fs-6 d-flex gap-2"
                  style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}
                >
                  {t('publish', { date: moment(item.message?.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}
                  <Popconfirm rootClassName="ant-input-group-addon" title={t('removeMessageTitle')} description={t('removeMessageDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onMessageRemove}>
                    <button
                      className="icon-button text-muted d-flex align-items-center"
                      type="button"
                      title={t('removeMessageTitle')}
                    >
                      <CloseOutlined className="fs-6-5" />
                    </button>
                  </Popconfirm>
                </Tag>
              )}
        </div>
      </>
    );
};
