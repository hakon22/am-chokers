import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Card, Checkbox } from 'antd';

import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { setAppData } from '@/slices/appSlice';
import v2AdminSettingsStyles from '@/themes/v2/components/profile/V2AdminSettings.module.scss';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';

export type AdminBestsellersModeSectionProps = {
  variant: 'v1' | 'v2';
};

export const AdminBestsellersModeSection = ({ variant }: AdminBestsellersModeSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.adminSettings.bestsellers' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);
  const { axiosAuth, siteSettings } = useAppSelector((state) => state.app);
  const dispatch = useAppDispatch();

  const automaticSalesHits = siteSettings.automaticSalesHits;

  /**
   * Сохраняет режим бестселлеров сразу при переключении чекбокса
   * @param checked - новое значение автоматического режима
   */
  const onAutomaticSalesHitsChange = async (checked: boolean) => {
    const previousSiteSettings = siteSettings;
    dispatch(setAppData({ siteSettings: { ...siteSettings, automaticSalesHits: checked } }));

    try {
      setIsSubmit(true);
      const { data } = await axios.patch<{ code: number; siteSettings: SiteSettingsInterface; }>(
        routes.settings.updateBestsellersSiteSettings,
        { automaticSalesHits: checked },
      );
      if (data.code === 1) {
        dispatch(setAppData({ siteSettings: data.siteSettings }));
        toast(tToast('bestsellersSiteSettingsSaved'), 'success');
      }
      setIsSubmit(false);
    } catch (error) {
      dispatch(setAppData({ siteSettings: previousSiteSettings }));
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  if (!axiosAuth) {
    return null;
  }

  const content = (
    <>
      <p className={variant === 'v1' ? 'text-muted mb-3' : v2AdminSettingsStyles.cardDesc}>
        {t('description')}
      </p>
      <Checkbox
        checked={automaticSalesHits}
        onChange={(event) => {
          void onAutomaticSalesHitsChange(event.target.checked);
        }}
      >
        {t('automaticLabel')}
      </Checkbox>
      <p className={variant === 'v1' ? 'text-muted mt-3 mb-0' : `${v2AdminSettingsStyles.cardDesc} mt-3 mb-0`}>
        {automaticSalesHits ? t('automaticHint') : t('manualHint')}
      </p>
    </>
  );

  if (variant === 'v2') {
    return (
      <div className={v2AdminSettingsStyles.card}>
        <p className={v2AdminSettingsStyles.cardTitle}>{t('title')}</p>
        {content}
      </div>
    );
  }

  return (
    <Card title={t('title')} className="col-12 col-xl-6 mb-5">
      {content}
    </Card>
  );
};
