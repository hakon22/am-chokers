import { routes } from '@/routes';

export const getServerSideProps = () => ({
  redirect: {
    permanent: false,
    destination: routes.homePage,
  },
});

const AdminPage = () => null;

export default AdminPage;
