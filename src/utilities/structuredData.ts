import { getHref } from '@/utilities/getHref';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemInterface } from '@/types/item/Item';

const host = process.env.NEXT_PUBLIC_PRODUCTION_HOST ?? '';

export const buildProductJsonLd = (item: ItemInterface) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name ?? item.translateName,
  description: item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.description ?? '',
  sku: String(item.id),
  brand: {
    '@type': 'Brand',
    name: 'AM Chokers',
  },
  image: item.images.map((image) => `${host}${image.src}`),
  offers: {
    '@type': 'Offer',
    url: `${host}${getHref(item)}`,
    priceCurrency: 'RUB',
    price: item.price - item.discountPrice,
    availability: item.deleted || !!item.outStock
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'AM Chokers',
    },
  },
});

export const buildBreadcrumbJsonLd = (items: { name: string; url: string; }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${host}${item.url}`,
  })),
});

export const buildOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AM Chokers',
  url: host,
  sameAs: [
    process.env.NEXT_PUBLIC_URL_TG_ACCOUNT,
    process.env.NEXT_PUBLIC_URL_INST_ACCOUNT,
  ].filter(Boolean),
});
