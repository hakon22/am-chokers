import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { buildMetaDescription, resolveImageMimeType } from '@/utilities/helmetSeo';
import { getProductionHost } from '@/utilities/getProductionHost';
import { shouldPageNoindex } from '@/utilities/shouldPageNoindex';

type HelmetProps = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  keywords?: string;
  jsonLd?: object | object[];
  preloadImage?: string;
  relPrev?: string;
  relNext?: string;
  canonicalPath?: string;
};

/**
 * SEO-мета: title, description, canonical, OG, Twitter, JSON-LD
 */
export const Helmet = ({
  title,
  description,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  imageType,
  type = 'website',
  noindex = false,
  keywords,
  jsonLd,
  preloadImage,
  relPrev,
  relNext,
  canonicalPath,
}: HelmetProps) => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const productionHost = getProductionHost();
  const lang = i18n.language;

  const pathWithoutQuery = router.asPath.split('?')[0].split('#')[0];
  const canonicalRelativePath = canonicalPath ?? pathWithoutQuery;
  const canonical = `${productionHost}${canonicalRelativePath}`;
  const metaDescription = buildMetaDescription(description);
  const isNoindex = noindex || shouldPageNoindex(router.pathname);
  const ogLocale = lang === 'en' ? 'en_US' : 'ru_RU';
  const ogLocaleAlternate = lang === 'en' ? 'ru_RU' : 'en_US';
  const ogImage = image ? (image.startsWith('http') ? image : `${productionHost}${image}`) : undefined;
  const resolvedImageType = imageType ?? (ogImage ? resolveImageMimeType(ogImage) : undefined);
  const preloadImageUrl = preloadImage
    ? (preloadImage.startsWith('http') ? preloadImage : `${productionHost}${preloadImage}`)
    : undefined;

  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={isNoindex ? 'noindex, nofollow' : 'index, follow'} />

      <link rel="canonical" href={canonical} />
      {relPrev && <link rel="prev" href={relPrev} />}
      {relNext && <link rel="next" href={relNext} />}
      {preloadImageUrl && (
        <link rel="preload" as="image" href={preloadImageUrl} />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="AM Chokers" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlternate} />
      {ogImage && (
        <>
          <meta property="og:image" content={ogImage} />
          {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
          {imageWidth && <meta property="og:image:width" content={String(imageWidth)} />}
          {imageHeight && <meta property="og:image:height" content={String(imageHeight)} />}
          {resolvedImageType && <meta property="og:image:type" content={resolvedImageType} />}
        </>
      )}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {imageAlt && ogImage && <meta name="twitter:image:alt" content={imageAlt} />}

      {jsonLdItems.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </Head>
  );
};
