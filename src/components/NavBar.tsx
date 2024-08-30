import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/utilities/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  SearchOutlined, HeartOutlined, ShoppingCartOutlined, UserOutlined,
} from '@ant-design/icons';
import { PersonCircle } from 'react-bootstrap-icons';
import routes from '@/routes';
import logo from '@/images/logo.svg';
import person from '@/images/icons/person.svg';
import { Menu, type MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const { id, role } = useAppSelector((state) => state.user);

  const items: MenuItem[] = [
    {
      label: 'Каталог',
      key: 'catalog',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: 'О бренде',
      key: 'aboutBrand',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: 'Доставка',
      key: 'delivery',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: 'Уход за украшениями',
      key: 'jewelryCaring',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: 'Контакты',
      key: 'contacts',
      onTitleClick: () => router.push(routes.homePage),
    },
  ];

  return (
    <nav className="nav d-flex justify-content-between align-items-center">
      <Image src={logo} alt={t('logo')} priority role="button" onClick={() => router.push(routes.homePage)} style={{ zIndex: 2 }} />
      <Menu items={items} mode="horizontal" className="nav-menu" />
      <div className="nav-icons">
        <SearchOutlined className="icon" />
        <HeartOutlined className="icon" />
        <ShoppingCartOutlined className="icon" />
        <Image src={person} alt={t('logo')} priority role="button" />
      </div>
    </nav>
  );
};
