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
    {image && <meta name="image" content={image} />}
    {typeof window !== 'undefined' && <link rel="canonical" href={window.location.href} />}
  </Head>
);
