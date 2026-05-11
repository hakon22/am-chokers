import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import _ from 'lodash';
import { Button, FloatButton, Modal, Typography } from 'antd';
import { QrcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import { QRCodeSVG } from '@rc-component/qrcode';
import cn from 'classnames';

import { useItemAdminYookassaInvoice } from '@/components/item-admin/useItemAdminYookassaInvoice';
import v2AdminStyles from '@/themes/v2/components/catalog/ProductPageAdmin.module.scss';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';

type YookassaInvoiceController = ReturnType<typeof useItemAdminYookassaInvoice>;

type ItemAdminYookassaQrControlsProps = {
  controller: YookassaInvoiceController;
  uiVariant: 'v1' | 'v2';
};

type ItemAdminYookassaQrFloatButtonsProps = {
  controller: YookassaInvoiceController;
  floatBtnStyle: CSSProperties;
};

/**
 * Модальное окно с QR по ссылке на счёт ЮKassa.
 */
export const ItemAdminYookassaInvoiceModal = ({ controller }: { controller: YookassaInvoiceController; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { invoiceUrl, invoiceExpiresAt, modalOpen, closeModal } = controller;
  const expiresLabel = !_.isNil(invoiceExpiresAt) && invoiceExpiresAt !== ''
    ? t('yookassaInvoiceExpiresAt', { date: moment(invoiceExpiresAt).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })
    : null;
  return (
    <Modal
      open={modalOpen}
      title={t('yookassaInvoiceModalTitle')}
      footer={null}
      onCancel={closeModal}
      destroyOnHidden
    >
      {invoiceUrl
        ? (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeSVG value={invoiceUrl} size={220} level="M" />
            </div>
            {expiresLabel
              ? (
                <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
                  {expiresLabel}
                </Typography.Text>
              )
              : null}
          </div>
        )
        : null}
    </Modal>
  );
};

/**
 * Кнопки «Создать / Показать» и обновления счёта ЮKassa (десктоп).
 */
export const ItemAdminYookassaQrControls = ({ controller, uiVariant }: ItemAdminYookassaQrControlsProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const {
    hasStoredInvoice,
    onCreateOrRefreshClick,
    onShowClick,
    onRefreshIconClick,
  } = controller;

  const primaryLabel = hasStoredInvoice ? t('yookassaShowInvoice') : t('yookassaCreateInvoice');
  const primaryAction = hasStoredInvoice ? onShowClick : onCreateOrRefreshClick;

  if (uiVariant === 'v2') {
    return (
      <>
        {hasStoredInvoice
          ? (
            <span className={v2AdminStyles.yookassaInvoiceActionWrap}>
              <button
                type="button"
                className={cn(v2AdminStyles.actionBtn, v2AdminStyles.yookassaInvoicePrimaryWithRefresh)}
                onClick={() => { primaryAction(); }}
              >
                {primaryLabel}
              </button>
              <button
                type="button"
                className={cn(v2AdminStyles.actionBtn, v2AdminStyles.yookassaInvoiceRefreshCorner)}
                onClick={() => { onRefreshIconClick(); }}
                title={t('yookassaRefreshInvoice')}
                aria-label={t('yookassaRefreshInvoice')}
              >
                <ReloadOutlined />
              </button>
            </span>
          )
          : (
            <button type="button" className={v2AdminStyles.actionBtn} onClick={() => { primaryAction(); }}>
              {primaryLabel}
            </button>
          )}
        <ItemAdminYookassaInvoiceModal controller={controller} />
      </>
    );
  }

  return (
    <>
      {hasStoredInvoice
        ? (
          <span className="position-relative d-inline-block">
            <Button type="text" className="action-button edit" style={{ paddingRight: 28 }} onClick={() => { primaryAction(); }}>
              {primaryLabel}
            </Button>
            <Button
              type="text"
              className="action-button edit"
              icon={<ReloadOutlined />}
              onClick={() => { onRefreshIconClick(); }}
              title={t('yookassaRefreshInvoice')}
              aria-label={t('yookassaRefreshInvoice')}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: 0,
                height: 'auto',
                minWidth: 'auto',
              }}
            />
          </span>
        )
        : (
          <Button type="text" className="action-button edit" onClick={() => { primaryAction(); }}>
            {primaryLabel}
          </Button>
        )}
      <ItemAdminYookassaInvoiceModal controller={controller} />
    </>
  );
};

/**
 * Кнопки FloatButton для мобильной карточки товара (внутри `FloatButton.Group`; модалку рендерить снаружи группы).
 */
export const ItemAdminYookassaQrFloatButtons = ({ controller, floatBtnStyle }: ItemAdminYookassaQrFloatButtonsProps) => {
  const {
    hasStoredInvoice,
    onCreateOrRefreshClick,
    onShowClick,
    onRefreshIconClick,
  } = controller;

  const onPrimaryFloat = () => {
    void (hasStoredInvoice ? onShowClick() : onCreateOrRefreshClick());
  };

  return [
    <FloatButton key="yookassa-invoice-primary" icon={<QrcodeOutlined />} onClick={onPrimaryFloat} style={floatBtnStyle} />,
    ...(hasStoredInvoice
      ? [<FloatButton key="yookassa-invoice-refresh" icon={<ReloadOutlined />} onClick={() => { onRefreshIconClick(); }} style={floatBtnStyle} />]
      : []),
  ];
};
