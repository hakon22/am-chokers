import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';

const Catalog = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog' });

  const { itemGroups } = useAppSelector((state) => state.app);
  
  return (
    <div className="d-flex col-12 justify-content-between">
      <Helmet title={t('title')} description={t('description')} />
      {itemGroups?.map((group) => (
        <Link href={`${routes.catalog}/${group.code}`} style={{ width: '23%' }} className="text-center" key={group.code}>
          {group.name}
        </Link>
      ))}
    </div>
  );};

export default Catalog;
