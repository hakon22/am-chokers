import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { ImageHover } from '@/components/ImageHover';
import { Helmet } from '@/components/Helmet';
import { getHref } from '@/utilities/getHref';
import type { ItemInterface } from '@/types/item/Item';

export const GroupItem = ({ items }: { items: ItemInterface[] }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tCatalog } = useTranslation('translation', { keyPrefix: 'pages.catalog' });

  const { name: title, description } = items?.[0]?.group ?? { name: tCatalog('title'), description: tCatalog('description') };

  return (
    <div className="d-grid col-12 gap-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <Helmet title={title} description={description} />
      {items.map(({
        id, name, price, images, group, className,
      }) => (
        <Link href={getHref({ name, group } as ItemInterface)} key={id}>
          <ImageHover
            className={className}
            height={300}
            images={images}
            name={name}
            description={t('price', { price })}
          />
        </Link>
      ))}
    </div>
  );
};
