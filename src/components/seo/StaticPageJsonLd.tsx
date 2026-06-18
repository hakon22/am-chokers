import { useTranslation } from 'react-i18next';

import { JsonLd } from '@/components/seo/JsonLd';
import { routes } from '@/routes';
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from '@/utilities/structuredData';

type StaticPageJsonLdProps = {
  title: string;
  description: string;
  path: string;
  homeLabel?: string;
};

/**
 * Подключает JSON-LD WebPage и Breadcrumb для статических страниц
 * @param title - заголовок страницы
 * @param description - meta-описание
 * @param path - канонический путь страницы
 * @param homeLabel - подпись ссылки на главную для breadcrumb (по умолчанию modules.navbar.menu.home)
 * @returns фрагмент JsonLd
 */
export const StaticPageJsonLd = ({ title, description, path, homeLabel }: StaticPageJsonLdProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const resolvedHomeLabel = homeLabel ?? t('menu.home');

  return (
    <JsonLd
      title={title}
      description={description}
      jsonLd={[
        buildWebPageJsonLd(title, description, path),
        buildBreadcrumbJsonLd([
          { name: resolvedHomeLabel, url: routes.page.base.homePage },
          { name: title, url: path },
        ]),
      ]}
    />
  );
};
