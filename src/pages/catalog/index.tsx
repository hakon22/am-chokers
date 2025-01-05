import Link from 'next/link';

import { routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';

const Catalog = () => {
  const { itemGroups } = useAppSelector((state) => state.app);
  
  return (
    <div className="d-flex col-12 justify-content-between">
      {itemGroups?.map((group) => (
        <Link href={`${routes.catalog}/${group.code}`} style={{ width: '23%' }} className="text-center" key={group.code}>
          {group.name}
        </Link>
      ))}
    </div>
  );};

export default Catalog;
