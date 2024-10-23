import { routes } from '@/routes';

export const getServerSideProps = () => ({
  redirect: {
    permanent: false,
    destination: routes.personalData,
  },
});

const Profile = () => null;

export default Profile;
