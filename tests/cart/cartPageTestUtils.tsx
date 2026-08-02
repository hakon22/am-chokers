import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

import { MobileContext, SubmitContext } from '@/components/Context';
import { getSeoI18n } from '@/locales';
import appReducer from '@/slices/appSlice';
import cartReducer from '@/slices/cartSlice';
import orderReducer, { orderAdapter } from '@/slices/orderSlice';
import userReducer from '@/slices/userSlice';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { emptySiteSettings } from '@/types/site/SiteSettings';
import type { RootState } from '@/slices/index';
import type { LoadingStatus } from '@/types/InitialState';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

type MakeCartItemParams = {
  id?: string;
  itemId: number;
  price: number;
  count?: number;
  discountPrice?: number;
  name?: string;
};

type RenderCartPageOptions = {
  cartItems: CartItemInterface[];
  promotionalResponse?: PromotionalInterface;
};

/**
 * Создаёт тестовую позицию корзины.
 * @param params - параметры товара в корзине
 * @returns позиция корзины
 */
export const makeCartItem = ({
  id = 'cart-item-1',
  itemId,
  price,
  count = 1,
  discountPrice = 0,
  name = 'Чокер',
}: MakeCartItemParams): CartItemInterface => ({
  id,
  count,
  created: new Date(),
  updated: new Date(),
  item: {
    id: itemId,
    price,
    discountPrice,
    deleted: false,
    outStock: false,
    translations: [
      { lang: UserLangEnum.RU, name },
      { lang: UserLangEnum.EN, name },
    ],
    images: [],
  },
} as unknown as CartItemInterface);

/**
 * Рендерит V2CartPage с предзаполненным Redux и контекстами.
 * @param ui - компонент страницы корзины
 * @param options - данные корзины и промокода
 * @returns результат render из Testing Library
 */
export const renderV2CartPage = (ui: ReactElement, { cartItems }: RenderCartPageOptions): RenderResult => {
  const idleLoadingStatus: LoadingStatus = 'idle';

  const store = configureStore({
    reducer: {
      app: appReducer,
      user: userReducer,
      order: orderReducer,
      cart: cartReducer,
    },
    preloadedState: {
      app: {
        loadingStatus: idleLoadingStatus,
        error: null,
        axiosAuth: false,
        itemGroups: [],
        specialItems: [],
        coverImages: [],
        siteSettings: emptySiteSettings,
        pagination: { count: 0, limit: 0, offset: 0 },
      },
      user: {
        loadingStatus: idleLoadingStatus,
        error: null,
        lang: UserLangEnum.RU,
        favorites: [],
        name: 'Тест',
        phone: '+79999999999',
        key: 'test-key',
      },
      cart: {
        loadingStatus: idleLoadingStatus,
        error: null,
        cart: cartItems,
      },
      order: orderAdapter.getInitialState({
        loadingStatus: idleLoadingStatus,
        error: null,
      }),
    } satisfies Partial<RootState>,
  });

  const i18n = getSeoI18n('ru');

  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SubmitContext.Provider value={{ isSubmit: false, setIsSubmit: () => undefined }}>
          <MobileContext.Provider value={{ isMobile: false, setIsMobile: () => undefined }}>
            {ui}
          </MobileContext.Provider>
        </SubmitContext.Provider>
      </I18nextProvider>
    </Provider>,
  );
};

/**
 * Возвращает текст итоговой суммы из блока «Итого».
 * @param container - корневой элемент render
 * @returns строка с ценой, например «4300 ₽»
 */
export const getTotalPriceText = (container: HTMLElement): string => {
  const totalLabel = Array.from(container.querySelectorAll('span')).find((element) => element.textContent?.includes('Итого'));
  const totalRow = totalLabel?.parentElement;
  const priceElement = totalRow?.querySelector('span:last-child');
  return priceElement?.textContent?.trim() ?? '';
};
