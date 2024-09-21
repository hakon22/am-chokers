import type { InferGetServerSidePropsType } from 'next';

export const getServerSideProps = async ({ params }: { params: { item: string[] } }) => {
  const { item } = params;
  console.log(item);

  return {
    props: {
      item: {},
    },
  };
};

const Item = ({ item }:
  InferGetServerSidePropsType<typeof getServerSideProps>) => null;

export default Item;
