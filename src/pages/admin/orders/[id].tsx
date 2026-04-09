import { useContext } from 'react';
import type { InferGetServerSidePropsType } from 'next';

import { VersionContext } from '@/components/Context';
import { V1AdminOrder } from '@/themes/v1/components/admin/V1AdminOrder';
import { V2AdminOrder } from '@/themes/v2/components/admin/V2AdminOrder';

export const getServerSideProps = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  return {
    props: { id },
  };
};

const Order = ({ id }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminOrder id={id} />;
  return <V1AdminOrder id={id} />;
};

export default Order;
