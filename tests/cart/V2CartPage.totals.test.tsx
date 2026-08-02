// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';

import { getTotalPriceText, makeCartItem, renderV2CartPage } from '@tests/cart/cartPageTestUtils';
import { makeOrder, makePosition, makePromotional } from '@tests/order/getOrderPrice.fixtures';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { DEFAULT_SHIPPING_RATE_RUB } from '@shared/delivery-config';
import { routes } from '@/routes';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { V2CartPage } from '@/themes/v2/components/cart/V2CartPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useUserLang', () => ({
  useUserLang: () => 'ru',
}));

vi.mock('@/components/delivery/DeliveryWidgetScripts', () => ({
  useDeliveryWidgetScripts: () => ({ yandex: true, russianPost: true, cdek: true }),
  isDeliveryWidgetScriptReady: () => true,
}));

vi.mock('@/components/Helmet', () => ({
  Helmet: () => null,
}));

vi.mock('@/components/ImageHover', () => ({
  ImageHover: () => <div data-testid="image-hover" />,
}));

vi.mock('@/components/NotFoundContent', () => ({
  NotFoundContent: ({ text }: { text: string }) => <div>{text}</div>,
}));

vi.mock('@/components/ConfirmPhone', () => ({
  ConfirmPhone: () => null,
}));

vi.mock('@/hooks/useCartItem', () => ({
  useCartItem: (itemId: number) => ({
    inCart: { count: 1, item: { id: itemId } },
    handleIncrement: vi.fn(),
    handleDecrement: vi.fn(),
  }),
}));

vi.mock('axios', () => {
  const get = vi.fn();
  const post = vi.fn();

  return {
    default: {
      get,
      post,
    },
    get,
    post,
  };
});

vi.mock('@/utilities/toast', () => ({
  toast: vi.fn(),
}));

const mockedAxiosGet = vi.mocked(axios.get);

const deliveryListResponse = {
  code: 1,
  deliveryList: [
    {
      type: DeliveryTypeEnum.YANDEX_DELIVERY,
      translations: [{ lang: 'ru', name: 'Яндекс Доставка' }],
    },
    {
      type: DeliveryTypeEnum.PICKUP,
      translations: [{ lang: 'ru', name: 'Самовывоз' }],
    },
  ],
};

/**
 * Отмечает согласие на обработку данных и применяет промокод.
 * @param user - userEvent instance
 * @param promoCode - код промокода
 */
const applyPromoCode = async (user: ReturnType<typeof userEvent.setup>, promoCode: string) => {
  const consentCheckbox = screen.getByRole('checkbox', { name: /персональных данных/i });
  await user.click(consentCheckbox);

  const promoInput = await screen.findByPlaceholderText('Промокод');
  await user.clear(promoInput);
  await user.type(promoInput, promoCode);

  await waitFor(() => {
    expect(screen.getByText('Применить промокод')).toBeEnabled();
  });

  await user.click(screen.getByText('Применить промокод'));

  await waitFor(() => {
    expect(mockedAxiosGet).toHaveBeenCalledWith(
      routes.promotional.findOneByName,
      expect.objectContaining({ params: expect.objectContaining({ name: promoCode }) }),
    );
  });
};

/**
 * Выбирает способ доставки и задаёт адрес ПВЗ через событие виджета.
 * @param user - userEvent instance
 * @param deliveryLabel - подпись способа доставки в UI
 * @param container - корневой элемент render
 */
const selectDeliveryWithAddress = async (
  user: ReturnType<typeof userEvent.setup>,
  deliveryLabel: string,
  container: HTMLElement,
) => {
  await waitFor(() => {
    expect(screen.getAllByText(deliveryLabel).length).toBeGreaterThan(0);
  });

  await user.click(screen.getAllByText(deliveryLabel)[0]);

  if (deliveryLabel === 'Самовывоз') {
    await waitFor(() => {
      expect(getTotalPriceText(container)).toBe('4000 ₽');
    });
    return;
  }

  await waitFor(() => {
    expect(screen.getByText('Выбрать ПВЗ')).toBeInTheDocument();
  });

  document.dispatchEvent(new CustomEvent('YaNddWidgetPointSelected', {
    detail: {
      address: {
        locality: 'Москва',
        street: 'Тверская',
        house: '1',
      },
    },
  }));
};

describe('V2CartPage totals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).YaDelivery = { createWidget: vi.fn() };
    mockedAxiosGet.mockImplementation((url: string) => {
      if (url === routes.delivery.findMany) {
        return Promise.resolve({ data: deliveryListResponse });
      }
      if (url === routes.promotional.findOneByName) {
        return Promise.resolve({
          data: {
            code: 1,
            promotional: makePromotional({ discount: 1000, items: [{ id: 10 }], name: 'MINUS1000' }),
          },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('K1: shows total for goods and delivery', async () => {
    const { container } = renderV2CartPage(<V2CartPage />, {
      cartItems: [makeCartItem({ itemId: 10, price: 4000 })],
    });
    const user = userEvent.setup();

    await selectDeliveryWithAddress(user, 'Яндекс Доставка', container);

    await waitFor(() => {
      expect(getTotalPriceText(container)).toBe(`${4000 + DEFAULT_SHIPPING_RATE_RUB} ₽`);
    });
  });

  it('K2: applies fixed item promo to total', async () => {
    const { container } = renderV2CartPage(<V2CartPage />, {
      cartItems: [makeCartItem({ itemId: 10, price: 4000 })],
    });
    const user = userEvent.setup();

    await selectDeliveryWithAddress(user, 'Яндекс Доставка', container);

    await applyPromoCode(user, 'MINUS1000');

    await waitFor(() => {
      expect(getTotalPriceText(container)).toBe('3300 ₽');
    });

    expect(screen.getByText(/MINUS1000/)).toBeInTheDocument();
  });

  it('K3: free delivery promo shows free delivery line and goods-only total', async () => {
    mockedAxiosGet.mockImplementation((url: string) => {
      if (url === routes.delivery.findMany) {
        return Promise.resolve({ data: deliveryListResponse });
      }
      if (url === routes.promotional.findOneByName) {
        return Promise.resolve({
          data: {
            code: 1,
            promotional: makePromotional({ freeDelivery: true, name: 'FREEDEL' }),
          },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    const { container } = renderV2CartPage(<V2CartPage />, {
      cartItems: [makeCartItem({ itemId: 10, price: 4000 })],
    });
    const user = userEvent.setup();

    await selectDeliveryWithAddress(user, 'Яндекс Доставка', container);

    await applyPromoCode(user, 'FREEDEL');

    await waitFor(() => {
      expect(getTotalPriceText(container)).toBe('4000 ₽');
    });

    const deliveryRow = screen.getByText('Доставка').closest('div');
    expect(deliveryRow).not.toBeNull();
    expect(within(deliveryRow as HTMLElement).getByText('Бесплатно')).toBeInTheDocument();
  });

  it('K4: free delivery when goods total reaches threshold', async () => {
    const { container } = renderV2CartPage(<V2CartPage />, {
      cartItems: [makeCartItem({ itemId: 10, price: 12000 })],
    });
    const user = userEvent.setup();

    await selectDeliveryWithAddress(user, 'Яндекс Доставка', container);

    await waitFor(() => {
      expect(getTotalPriceText(container)).toBe('12000 ₽');
    });

    const deliveryRow = screen.getByText('Доставка').closest('div');
    expect(within(deliveryRow as HTMLElement).getByText('Бесплатно')).toBeInTheDocument();
  });

  it('K5: pickup delivery is free', async () => {
    const { container } = renderV2CartPage(<V2CartPage />, {
      cartItems: [makeCartItem({ itemId: 10, price: 4000 })],
    });
    const user = userEvent.setup();

    await selectDeliveryWithAddress(user, 'Самовывоз', container);

    const deliveryRow = screen.getByText('Доставка').closest('div');
    expect(within(deliveryRow as HTMLElement).getByText('0 ₽')).toBeInTheDocument();
  });

  it('K6: buy two get one promo matches getOrderPrice', async () => {
    mockedAxiosGet.mockImplementation((url: string) => {
      if (url === routes.delivery.findMany) {
        return Promise.resolve({ data: deliveryListResponse });
      }
      if (url === routes.promotional.findOneByName) {
        return Promise.resolve({
          data: {
            code: 1,
            promotional: makePromotional({ buyTwoGetOne: true, name: 'B21' }),
          },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    const { container } = renderV2CartPage(<V2CartPage />, {
      cartItems: [
        makeCartItem({ id: 'cart-1', itemId: 10, price: 1000, count: 1 }),
        makeCartItem({ id: 'cart-2', itemId: 10, price: 1000, count: 1 }),
        makeCartItem({ id: 'cart-3', itemId: 10, price: 1000, count: 1 }),
      ],
    });
    const user = userEvent.setup();

    await selectDeliveryWithAddress(user, 'Яндекс Доставка', container);

    await applyPromoCode(user, 'B21');

    const expectedTotal = getOrderPrice(makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
      deliveryPrice: DEFAULT_SHIPPING_RATE_RUB,
      promotional: makePromotional({ buyTwoGetOne: true }),
    }));

    await waitFor(() => {
      expect(getTotalPriceText(container)).toBe(`${expectedTotal} ₽`);
    });
  });
});
