import { isEmpty } from 'lodash';

import { buildMetaDescription } from '@/utilities/buildMetaDescription';
import { getProductionHost } from '@/utilities/getProductionHost';
import { getHref } from '@/utilities/getHref';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { LanguageCode } from '@shared/language-config';
import type { ItemInterface } from '@/types/item/Item';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';

const host = getProductionHost();

const PRODUCT_RATING_BEST = 5;
const PRODUCT_RATING_WORST = 1;
const DEFAULT_SHIPPING_RATE_RUB = 300;
const MERCHANT_RETURN_DAYS = 14;
const SHIPPING_HANDLING_MAX_DAYS = 4;
const SHIPPING_TRANSIT_MIN_DAYS = 2;
const SHIPPING_TRANSIT_MAX_DAYS = 10;

/**
 * Возвращает перевод товара для указанного языка
 * @param item - товар
 * @param languageCode - код языка
 * @returns перевод или undefined
 */
const getItemTranslation = (item: ItemInterface, languageCode: LanguageCode) => {
  const langEnum = languageCode === 'en' ? UserLangEnum.EN : UserLangEnum.RU;
  return item.translations.find((({ lang }) => lang === langEnum));
};

/**
 * Формирует SEO-описание товара для meta и JSON-LD
 * @param item - товар
 * @param languageCode - код языка
 * @param fallbackDescription - текст fallback из i18n
 * @returns excerpt описания
 */
export const buildProductSeoDescription = (item: ItemInterface, languageCode: LanguageCode, fallbackDescription: string): string => {
  const translation = getItemTranslation(item, languageCode);
  const rawDescription = translation?.description?.trim() || fallbackDescription;
  return buildMetaDescription(rawDescription);
};

/**
 * Собирает JSON-LD Review для списка опубликованных оценок товара
 * @param grades - проверенные оценки товара (как на странице)
 * @returns массив объектов Review schema
 */
const buildProductReviewsJsonLd = (grades: ItemGradeEntity[]) => grades.map((grade) => {
  const { grade: ratingValue, created, user, comment } = grade;
  const reviewBody = comment?.text?.trim();

  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: user.name,
    },
    datePublished: new Date(created).toISOString(),
    reviewRating: {
      '@type': 'Rating',
      ratingValue,
      bestRating: PRODUCT_RATING_BEST,
      worstRating: PRODUCT_RATING_WORST,
    },
    ...(reviewBody
      ? { reviewBody }
      : {}),
  };
});

/**
 * Собирает JSON-LD OfferShippingDetails по условиям доставки магазина
 * @returns объект OfferShippingDetails schema
 */
const buildOfferShippingDetailsJsonLd = () => ({
  '@type': 'OfferShippingDetails',
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: DEFAULT_SHIPPING_RATE_RUB,
    currency: 'RUB',
  },
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'RU',
  },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: SHIPPING_HANDLING_MAX_DAYS,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: SHIPPING_TRANSIT_MIN_DAYS,
      maxValue: SHIPPING_TRANSIT_MAX_DAYS,
      unitCode: 'DAY',
    },
  },
});

/**
 * Собирает JSON-LD MerchantReturnPolicy по публичной оферте
 * @returns объект MerchantReturnPolicy schema
 */
const buildOfferReturnPolicyJsonLd = () => ({
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'RU',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: MERCHANT_RETURN_DAYS,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
});

/**
 * Собирает JSON-LD Product для товара
 * @param item - товар
 * @param languageCode - код языка интерфейса
 * @param fallbackDescription - fallback описания
 * @param reviewCount - общее число отзывов (из paginationParams.count)
 * @param grades - опубликованные оценки товара для блока review
 * @returns объект Product schema
 */
export const buildProductJsonLd = (
  item: ItemInterface,
  languageCode: LanguageCode,
  fallbackDescription: string,
  reviewCount?: number,
  grades?: ItemGradeEntity[],
) => {
  const translation = getItemTranslation(item, languageCode);
  const name = translation?.name ?? item.translateName;
  const description = buildProductSeoDescription(item, languageCode, fallbackDescription);
  const gradeRating = item.rating?.rating ?? 0;
  const resolvedReviewCount = reviewCount ?? 0;
  const hasProductReviews = gradeRating > 0 && resolvedReviewCount > 0;
  const productReviews = grades && !isEmpty(grades) ? buildProductReviewsJsonLd(grades) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    sku: String(item.id),
    brand: {
      '@type': 'Brand',
      name: 'AM Chokers',
    },
    image: item.images
      .map(({ src }) => src)
      .filter((src) => /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(src))
      .map((src) => `${host}${src}`),
    offers: {
      '@type': 'Offer',
      url: `${host}${getHref(item)}`,
      priceCurrency: 'RUB',
      price: item.price - item.discountPrice,
      availability: item.deleted || item.outStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'AM Chokers',
      },
      shippingDetails: buildOfferShippingDetailsJsonLd(),
      hasMerchantReturnPolicy: buildOfferReturnPolicyJsonLd(),
    },
    ...(hasProductReviews
      ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: gradeRating,
          reviewCount: resolvedReviewCount,
          bestRating: PRODUCT_RATING_BEST,
          worstRating: PRODUCT_RATING_WORST,
        },
        ...(productReviews
          ? { review: productReviews }
          : {}),
      }
      : {}),
  };
};

/**
 * Собирает JSON-LD BreadcrumbList
 * @param items - цепочка крошек
 * @returns объект BreadcrumbList schema
 */
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

/**
 * Собирает JSON-LD Organization
 * @returns объект Organization schema
 */
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

/**
 * Собирает JSON-LD WebSite с SearchAction
 * @param searchPath - путь поиска по каталогу
 * @returns объект WebSite schema
 */
export const buildWebSiteJsonLd = (searchPath = '/catalog') => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AM Chokers',
  url: host,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${host}${searchPath}?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

/**
 * Собирает JSON-LD ItemList для страницы категории
 * @param items - товары на странице
 * @param languageCode - код языка
 * @returns объект ItemList schema
 */
export const buildItemListJsonLd = (items: ItemInterface[], languageCode: LanguageCode) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((item, index) => {
    const translation = getItemTranslation(item, languageCode);
    return {
      '@type': 'ListItem',
      position: index + 1,
      url: `${host}${getHref(item)}`,
      name: translation?.name ?? item.translateName,
    };
  }),
});

/**
 * Собирает JSON-LD WebPage для статических страниц
 * @param name - заголовок страницы
 * @param description - описание страницы
 * @param path - путь страницы
 * @returns объект WebPage schema
 */
export const buildWebPageJsonLd = (name: string, description: string, path: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name,
  description: buildMetaDescription(description),
  url: `${host}${path}`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'AM Chokers',
    url: host,
  },
});
