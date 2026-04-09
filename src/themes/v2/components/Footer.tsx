import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Button, Col, Row } from 'antd';
import { InstagramOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';

import { catalogPath, routes } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import logoImage from '@/images/logo.svg';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import styles from '@/themes/v2/components/Footer.module.scss';

export const Footer = ({ itemGroups }: { itemGroups: ItemGroupEntity[]; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.footer' });
  const { t: tv2 } = useTranslation('translation', { keyPrefix: 'modules.v2Footer' });

  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const sortedGroups = [...itemGroups].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.footer}>
      <div className={styles.inner}>
        <Row gutter={[40, 32]}>
          {/* Brand */}
          <Col lg={8} xs={24}>
            <Image src={logoImage} alt="AM Chokers" unoptimized className={styles.footerLogo} />
            <div className={styles.brandSub}>{tv2('brandTagline')}</div>
            <p className={styles.brandDesc}>{tv2('brandDesc')}</p>
            <div className={styles.socialRow}>
              <Button
                className={styles.socialBtn}
                href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage}
                target="_blank"
                title={t('telegram')}
              >
                <Telegram />
              </Button>
              <Button
                className={styles.socialBtn}
                href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.page.base.homePage}
                target="_blank"
                title={tv2('instagram')}
              >
                <InstagramOutlined />
              </Button>
            </div>
          </Col>

          {/* Каталог */}
          <Col lg={4} sm={8} xs={12}>
            <div className={styles.colTitle}>{t('jewelryCatalog')}</div>
            <ul className={styles.linkList}>
              {sortedGroups.map((group) => (
                <li key={group.id}>
                  <Link href={`${catalogPath}/${group.code}`}>
                    {group.translations.find((translation) => translation.lang === lang)?.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Покупателям */}
          <Col lg={4} sm={8} xs={12}>
            <div className={styles.colTitle}>{tv2('buyersTitle')}</div>
            <ul className={styles.linkList}>
              <li><Link href={routes.page.base.deliveryPage}>{tv2('delivery')}</Link></li>
              <li><Link href={routes.page.base.deliveryPage}>{tv2('payment')}</Link></li>
              <li><Link href={routes.page.base.deliveryPage}>{tv2('returns')}</Link></li>
              <li><Link href={routes.page.base.jewelryCarePage}>{tv2('jewelryCare')}</Link></li>
              <li><Link href={routes.page.base.contactsPage}>{t('contacts')}</Link></li>
            </ul>
          </Col>
        </Row>

        <div className={styles.bottomBar}>
          <span className={styles.copy}>{tv2('copyright', { year: new Date().getFullYear() })}</span>
          <div className={styles.legalLinks}>
            <Link href={routes.page.base.privacyPolicy}>{t('privacyPolicy')}</Link>
            <Link href={routes.page.base.offerAgreement}>{t('offerAgreement')}</Link>
          </div>
        </div>
        <div className={styles.legalInfo}>
          <span>{lang === UserLangEnum.RU ? process.env.NEXT_PUBLIC_FIO : process.env.NEXT_PUBLIC_FIO_EN}</span>
          <span>{t('inn', { number: process.env.NEXT_PUBLIC_INN })}</span>
        </div>
        <div className={styles.instagramNote}>
          {tv2('instagramText1')} {tv2('instagramText2')}
        </div>
      </div>
    </div>
  );
};
