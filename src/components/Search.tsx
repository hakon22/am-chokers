import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

import { routes } from '@/routes';
import { NotFoundContent } from '@/components/NotFoundContent';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { Spinner } from '@/components/Spinner';
import { onFocus } from '@/utilities/onFocus';
import type { ItemInterface } from '@/types/item/Item';

type List = { name: string, image: string; }[];

interface SearchPropsInterface {
  items?: ItemInterface[];
  search?: { value: string; onFetch: boolean; };
  withDeleted?: boolean;
  setSearch: React.Dispatch<React.SetStateAction<{ value: string; onFetch: boolean; } | undefined>>;
  fetch: () => Promise<void>;
}

export const Search = ({ search, setSearch, fetch, withDeleted = false }: SearchPropsInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.search' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const [list, setList] = useState<List>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>();

  const clearData = (hasFocus = true) => {
    setSearch(undefined);
    setList([]);
    if (hasFocus) {
      setTimeout(onFocus, 1);
    }
  };

  const onInput = async (value: string) => {
    try {
      setSearch({ value, onFetch: false });
      if (timer) {
        clearTimeout(timer);
      }
      if (!value) {
        clearData(false);
        return;
      }
      const timeout = setTimeout(async () => {
        setIsLoading(true);
        const { data } = await axios.get<{ code: number; search: { name: string; image: string; }[] }>(routes.searchItem, {
          params: {
            search: value,
            withDeleted,
          },
        });
        if (data.code === 1) {
          setList(data.search);
        }
        setTimer(undefined);
        setIsLoading(false);
      }, 500);
      setTimer(timeout);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const options = (d: List) => d.map(({ name }) => ({
    label: (
      <button
        className="icon-button text-start w-100"
        type="button"
        title={name}
        onClick={() => {
          setSearch({ value: name, onFetch: true });
          onFocus();
        }}
      >
        {name}
      </button>
    ),
  }));

  return (
    <AutoComplete
      value={search?.value}
      className="d-flex col-xl-4"
      placeholder={t('title')}
      notFoundContent={search && !isLoading ? <NotFoundContent /> : search && <Spinner isLoaded />}
      allowClear
      suffixIcon={<SearchOutlined />}
      onClear={clearData}
      options={options(list)}
      onChange={onInput}
      onInputKeyDown={({ key }) => {
        if (key === 'Enter') {
          fetch();
          onFocus();
        }
      }}
    />
  );
};
