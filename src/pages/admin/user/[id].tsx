import { useContext } from 'react';
import type { InferGetServerSidePropsType } from 'next';

import { VersionContext } from '@/components/Context';
import { V1AdminUserCard } from '@/themes/v1/components/admin/V1AdminUserCard';
import { V2AdminUserCard } from '@/themes/v2/components/admin/V2AdminUserCard';

export const getServerSideProps = async ({ params }: { params: { id: string; } }) => {
  const { id } = params;
  return {
    props: { id: +id },
  };
};

const User = ({ id }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminUserCard id={id} />;
  return <V1AdminUserCard id={id} />;
};

export default User;
