import Head from 'next/head';

type HelmetProps = {
  title: string;
  description: string;
  image?: string;
}

export const Helmet = ({ title, description, image }: HelmetProps) => (
  <Head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {image
      ? <>
        <meta name="image" content={`${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${image}`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${image}`} />
      </>
      : null}
    {typeof window !== 'undefined'
      ?
      <>
        <link rel="canonical" href={window.location.href} />
        <meta property="og:url" content={window.location.href} />
      </>
      : null}
  </Head>
);
