import { V1AdminSettings } from '@/themes/v1/components/admin/V1AdminSettings';

/**
 * Настройки администратора для legacy-профиля (v1, v3 и т.д.).
 * На v2 используется {@link V2AdminSettings} через {@link V2ProfilePage}.
 */
export const AdminSettings = () => <V1AdminSettings />;
