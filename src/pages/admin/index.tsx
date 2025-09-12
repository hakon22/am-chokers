import { routes } from '@/routes';

export const getServerSideProps = () => ({
  redirect: {
    permanent: false,
    destination: routes.page.base.homePage,
  },
});

const AdminPage = () => null;

export default AdminPage;
