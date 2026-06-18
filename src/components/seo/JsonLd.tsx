import { Helmet } from '@/components/Helmet';

interface JsonLdPropsInterface {
  title: string;
  description: string;
  jsonLd: object | object[];
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  type?: 'website' | 'product' | 'article';
  keywords?: string;
  noindex?: boolean;
  preloadImage?: string;
  relPrev?: string;
  relNext?: string;
  canonicalPath?: string;
}

/**
 * SEO-обёртка: Helmet + JSON-LD
 */
export const JsonLd = ({
  title,
  description,
  jsonLd,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  imageType,
  type,
  keywords,
  noindex,
  preloadImage,
  relPrev,
  relNext,
  canonicalPath,
}: JsonLdPropsInterface) => (
  <Helmet
    title={title}
    description={description}
    image={image}
    imageAlt={imageAlt}
    imageWidth={imageWidth}
    imageHeight={imageHeight}
    imageType={imageType}
    type={type}
    keywords={keywords}
    noindex={noindex}
    jsonLd={jsonLd}
    preloadImage={preloadImage}
    relPrev={relPrev}
    relNext={relNext}
    canonicalPath={canonicalPath}
  />
);
