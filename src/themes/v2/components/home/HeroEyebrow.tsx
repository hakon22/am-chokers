import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Popover } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import cn from 'classnames';
import { isEmpty } from 'lodash';

import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { setAppData } from '@/slices/appSlice';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import styles from '@/themes/v2/components/home/HeroEyebrow.module.scss';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { PublicHomeHeroSettingsInterface } from '@/types/site/PublicHomeHeroSettings';

interface HeroEyebrowProps {
  className?: string;
  /** Значения с getServerSideProps главной — попадают в HTML при SSR */
  serverHomeHero?: PublicHomeHeroSettingsInterface;
}

/**
 * Собирает однострочный текст eyebrow
 * @param eyebrowTitle - левая часть строки
 * @param eyebrowSubtitle - правая часть строки
 * @returns строка с разделителем « · » или одна из частей
 */
const buildEyebrowDisplayText = (eyebrowTitle: string, eyebrowSubtitle: string): string => {
  const hasTitle = !isEmpty(eyebrowTitle);
  const hasSubtitle = !isEmpty(eyebrowSubtitle);

  if (hasTitle && hasSubtitle) {
    return `${eyebrowTitle} · ${eyebrowSubtitle}`;
  }

  if (hasTitle) {
    return eyebrowTitle;
  }

  if (hasSubtitle) {
    return eyebrowSubtitle;
  }

  return '';
};

/**
 * Выбирает hero eyebrow: из Redux после правок админа, иначе с SSR-пропсов
 * @param storeHomeHero - homeHero из Redux
 * @param serverHomeHero - homeHero с getServerSideProps
 * @returns актуальные поля eyebrow
 */
const pickHomeHeroSettings = (
  storeHomeHero: PublicHomeHeroSettingsInterface,
  serverHomeHero?: PublicHomeHeroSettingsInterface,
): PublicHomeHeroSettingsInterface => {
  if (!isEmpty(storeHomeHero.eyebrowTitle.trim()) || !isEmpty(storeHomeHero.eyebrowSubtitle.trim())) {
    return storeHomeHero;
  }
  return serverHomeHero ?? storeHomeHero;
};

/**
 * Возвращает значение eyebrow: из настроек или fallback из локали
 * @param storedValue - значение из Redux / site_settings
 * @param localeFallback - строка из i18n
 * @returns итоговая строка для отображения
 */
const resolveEyebrowPart = (storedValue: string, localeFallback: string): string => {
  const trimmedStored = storedValue.trim();
  if (!isEmpty(trimmedStored)) {
    return trimmedStored;
  }
  return localeFallback;
};

export const HeroEyebrow = ({ className, serverHomeHero }: HeroEyebrowProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.hero' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const { siteSettings } = useAppSelector((state) => state.app);
  const homeHeroSettings = useMemo(
    () => pickHomeHeroSettings(siteSettings.homeHero, serverHomeHero),
    [siteSettings.homeHero, serverHomeHero],
  );
  const { isAdmin } = useAppSelector((state) => state.user);
  const { setIsSubmit } = useContext(SubmitContext);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');

  const resolvedTitle = useMemo(
    () => resolveEyebrowPart(homeHeroSettings.eyebrowTitle, t('eyebrowTitle')),
    [homeHeroSettings.eyebrowTitle, t],
  );

  const resolvedSubtitle = useMemo(
    () => resolveEyebrowPart(homeHeroSettings.eyebrowSubtitle, t('eyebrowSubtitle')),
    [homeHeroSettings.eyebrowSubtitle, t],
  );

  const eyebrowDisplayText = useMemo(
    () => buildEyebrowDisplayText(resolvedTitle, resolvedSubtitle),
    [resolvedTitle, resolvedSubtitle],
  );

  /**
   * Синхронизирует состояние popover и черновик полей при открытии
   * @param open - открыт ли popover редактирования
   */
  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      setDraftTitle(resolvedTitle);
      setDraftSubtitle(resolvedSubtitle);
    }
    setPopoverOpen(open);
  };

  /**
   * Сохраняет eyebrow hero на сервере и обновляет Redux
   */
  const saveEyebrowSettings = async () => {
    try {
      setIsSubmit(true);
      const { data } = await axios.patch<{ code: number; siteSettings: SiteSettingsInterface; }>(
        routes.settings.updateHomeHeroSettings,
        {
          eyebrowTitle: draftTitle,
          eyebrowSubtitle: draftSubtitle,
        },
      );
      if (data.code === 1) {
        dispatch(setAppData({ siteSettings: data.siteSettings }));
        toast(tToast('homeHeroEyebrowSaved'), 'success');
        setPopoverOpen(false);
      }
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    } finally {
      setIsSubmit(false);
    }
  };

  const editPopoverContent = (
    <div className={styles.eyebrowPopover}>
      <div className={styles.eyebrowPopoverTitle}>{t('eyebrowEditTitle')}</div>
      <Input
        value={draftTitle}
        onChange={({ target }) => setDraftTitle(target.value)}
        placeholder={t('eyebrowEditTitleLabel')}
        aria-label={t('eyebrowEditTitleLabel')}
      />
      <Input
        value={draftSubtitle}
        onChange={({ target }) => setDraftSubtitle(target.value)}
        placeholder={t('eyebrowEditSubtitleLabel')}
        aria-label={t('eyebrowEditSubtitleLabel')}
        style={{ marginTop: 8 }}
      />
      <div className={styles.eyebrowPopoverActions}>
        <Button size="small" onClick={() => setPopoverOpen(false)}>
          {t('eyebrowEditCancel')}
        </Button>
        <Button type="primary" size="small" onClick={saveEyebrowSettings}>
          {t('eyebrowEditSave')}
        </Button>
      </div>
    </div>
  );

  const eyebrowContent = (
    <div
      className={cn(styles.eyebrowWrap, className, { [styles.eyebrowWrapAdmin]: isAdmin })}
    >
      <span className={styles.eyebrowText}>{eyebrowDisplayText}</span>
      {isAdmin ? <EditOutlined className={styles.eyebrowEditIcon} aria-hidden /> : null}
    </div>
  );

  if (!isAdmin) {
    return eyebrowContent;
  }

  return (
    <Popover
      content={editPopoverContent}
      title={null}
      trigger="click"
      open={popoverOpen}
      onOpenChange={handlePopoverOpenChange}
      placement="bottomLeft"
      getPopupContainer={() => document.body}
    >
      {eyebrowContent}
    </Popover>
  );
};
