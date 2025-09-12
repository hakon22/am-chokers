import { routes } from '@/routes';

export const getServerSideProps = () => ({
  redirect: {
    permanent: false,
    destination: routes.page.profile.personalData,
  },
});

const Profile = () => null;

export default Profile;
