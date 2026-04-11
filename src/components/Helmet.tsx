import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

type HelmetProps = {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: object | object[];
}

export const Helmet = ({
  title, description, image, type = 'website', noindex = false, jsonLd,
}: HelmetProps) => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const productionHost = process.env.NEXT_PUBLIC_PRODUCTION_HOST ?? '';
  const lang = i18n.language;

  const canonical = `${productionHost}${router.asPath.split('?')[0].split('#')[0]}`;
  const ogUrl = `${productionHost}${router.asPath}`;
  const ogLocale = lang === 'en' ? 'en_US' : 'ru_RU';
  const ogLocaleAlternate = lang === 'en' ? 'ru_RU' : 'en_US';
  const ogImage = image ? `${productionHost}${image}` : undefined;

  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:site_name" content="AM Chokers" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlternate} />
      {ogImage && (
        <>
          <meta name="image" content={ogImage} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:type" content="image/jpeg" />
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* JSON-LD */}
      {jsonLdItems.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </Head>
  );
};
