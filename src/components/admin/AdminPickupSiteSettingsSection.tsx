import { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button, Card, Form, Input, Space } from 'antd';
import { DatePicker } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import moment, { type Moment } from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';

import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { setAppData } from '@/slices/appSlice';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { locale } from '@/locales/pickers.locale.ru';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { PublicPickupSettingsInterface } from '@/types/site/PublicPickupSettings';
import v2AdminSettingsStyles from '@/themes/v2/components/profile/V2AdminSettings.module.scss';

const MomentPicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);
const MomentRangePicker = MomentPicker.RangePicker;

type BlockedRangeFormRow = {
  range: [Moment, Moment] | null;
};

export type AdminPickupSiteSettingsSectionProps = {
  variant: 'v1' | 'v2';
};

export const AdminPickupSiteSettingsSection = ({ variant }: AdminPickupSiteSettingsSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.adminSettings.pickup' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);
  const { axiosAuth } = useAppSelector((state) => state.app);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();

  /**
   * Подставляет в форму текущие значения самовывоза с сервера
   * @param pickup - объект pickup из GET /settings/site-version
   */
  const applyPickupToForm = (pickup: PublicPickupSettingsInterface) => {
    const blockedRanges: BlockedRangeFormRow[] = pickup.blockedDateRanges.map((range) => ({
      range: [
        moment(range.startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day'),
        moment(range.endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day'),
      ],
    }));
    form.setFieldsValue({
      locationLabel: pickup.locationLabel,
      blockedRanges,
    });
  };

  const loadPickupSettings = useCallback(async () => {
    try {
      const { data } = await axios.get<{ code: number; pickup?: PublicPickupSettingsInterface; }>(
        routes.settings.getSiteVersion,
      );
      if (data.code === 1 && data.pickup) {
        applyPickupToForm(data.pickup);
      }
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  }, [form, setIsSubmit, tToast]);

  useEffect(() => {
    if (axiosAuth) {
      loadPickupSettings();
    }
  }, [axiosAuth, loadPickupSettings]);

  /**
   * Сохраняет настройки самовывоза и обновляет Redux для корзины
   */
  const onSavePickupSettings = async () => {
    try {
      setIsSubmit(true);
      const values = await form.validateFields() as { locationLabel?: string; blockedRanges?: BlockedRangeFormRow[] };
      const blockedDateRanges = (values.blockedRanges ?? [])
        .map((row) => row?.range)
        .filter((range): range is [Moment, Moment] => !!range?.[0] && !!range?.[1])
        .map(([start, end]) => ({
          startDate: start.clone().startOf('day').format(DateFormatEnum.YYYY_MM_DD),
          endDate: end.clone().startOf('day').format(DateFormatEnum.YYYY_MM_DD),
        }));
      const { data } = await axios.patch<{ code: number; pickup: PublicPickupSettingsInterface; }>(
        routes.settings.updatePickupSiteSettings,
        {
          locationLabel: values.locationLabel ?? '',
          blockedDateRanges,
        },
      );
      if (data.code === 1) {
        dispatch(setAppData({ publicPickupSettings: data.pickup }));
        toast(tToast('pickupSiteSettingsSaved'), 'success');
      }
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    } finally {
      setIsSubmit(false);
    }
  };

  const formFields = (
    <>
      <Form.Item
        name="locationLabel"
        label={t('locationLabel')}
      >
        <Input placeholder={t('locationPlaceholder')} />
      </Form.Item>
      <Form.Item label={t('blockedRanges')}>
        <Form.List name="blockedRanges">
          {(fields, { add, remove }) => (
            <div className="d-flex flex-column gap-2">
              {fields.map((field) => (
                <Space key={field.key} align="baseline" wrap>
                  <Form.Item
                    name={[field.name, 'range']}
                    label={t('rangeItemLabel')}
                  >
                    <MomentRangePicker
                      format={DateFormatEnum.DD_MM_YYYY}
                      locale={lang === UserLangEnum.RU ? locale : undefined}
                      placeholder={[t('rangePlaceholderFrom'), t('rangePlaceholderTo')]}
                      placement="bottomRight"
                      getPopupContainer={() => document.body}
                    />
                  </Form.Item>
                  <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>
                    {t('removeRange')}
                  </Button>
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ range: null })} icon={<PlusOutlined />}>
                {t('addRange')}
              </Button>
            </div>
          )}
        </Form.List>
      </Form.Item>
      {variant === 'v1' ? (
        <Button type="primary" onClick={() => void onSavePickupSettings()}>
          {t('save')}
        </Button>
      ) : (
        <button type="button" className={v2AdminSettingsStyles.btnSubmit} onClick={() => void onSavePickupSettings()}>
          {t('save')}
        </button>
      )}
    </>
  );

  return (
    <Form form={form} layout="vertical" initialValues={{ locationLabel: '', blockedRanges: [] }}>
      {variant === 'v1' ? (
        <Card title={t('title')} className="col-12 col-xl-6 mb-5">
          {formFields}
        </Card>
      ) : (
        <div className={v2AdminSettingsStyles.card}>
          <p className={v2AdminSettingsStyles.cardTitle}>{t('title')}</p>
          {formFields}
        </div>
      )}
    </Form>
  );
};
