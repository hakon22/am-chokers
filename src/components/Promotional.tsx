import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { CopyOutlined } from '@ant-design/icons';
import { Modal, Button } from 'antd';
import cn from 'classnames';

import { useAppSelector } from '@/utilities/hooks';
import { selectors } from '@/slices/orderSlice';

const PROMOTIONAL_NAME = process.env.NEXT_PUBLIC_PROMO as string;

export const Promotional = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.promotional' });

  const orders = useAppSelector(selectors.selectAll);

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!orders.some(({ isPayment }) => isPayment)) {
        setIsOpen(true);
      }
    }, 35 * 1000);

    return () => clearTimeout(timer);
  }, [orders.length]);

  return (
    <Modal
      centered
      rootClassName="promotional"
      zIndex={10000}
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      footer={null}
    >
      <div className="d-flex flex-column font-oswald gap-3">
        <h3 className="text-center title">{t('title')}</h3>
        <div className="d-flex justify-content-center">
          <CopyToClipboard text={PROMOTIONAL_NAME}>
            <Button type="link" className={cn('promocode d-flex align-items-center fs-5 gap-5', { 'animate__animated animate__headShake': isAnimating })} onClick={handleCopy}>
              {PROMOTIONAL_NAME}
              <CopyOutlined className="fs-5" />
            </Button>
          </CopyToClipboard>
        </div>
        <div className="d-flex flex-column text-center fs-6 tutorial gap-2 mb-3">
          <span>{t('tutorial.span1')}</span>
          <span>{t('tutorial.span2')}</span>
        </div>
        <p className="text-center">{t('tutorial.p1')}</p>
      </div>
    </Modal>
  );
};
