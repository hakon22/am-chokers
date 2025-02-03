import Head from 'next/head';
import { useRouter } from 'next/router';

type HelmetProps = {
  title: string;
  description: string;
  image?: string;
}

export const Helmet = ({ title, description, image }: HelmetProps) => {
  const router = useRouter();
  const productionHost = process.env.NEXT_PUBLIC_PRODUCTION_HOST;
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={`${productionHost}${router.asPath}`} />
      <meta property="og:url" content={`${productionHost}${router.asPath}`} />
      {image
        ? <>
          <meta name="image" content={`${productionHost}${image}`} />
          <meta property="og:image" content={`${productionHost}${image}`} />
        </>
        : null}
    </Head>
  );
};
