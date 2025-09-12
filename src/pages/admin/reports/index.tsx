import { routes } from '@/routes';

export const getServerSideProps = () => ({
  redirect: {
    permanent: false,
    destination: routes.page.base.homePage,
  },
});

const ReportPage = () => null;

export default ReportPage;
